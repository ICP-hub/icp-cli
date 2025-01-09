import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { ICManagementCanister, InstallMode } from "@dfinity/ic-management";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { Actor } from "@dfinity/agent";
import { tmpdir } from "os";
import { promises as fsp } from "fs";
import { createRequire } from "module";
import getActor from "./getActor.js";
// @ts-ignore
// import { idlFactory as frontendIdlFactory } from "./npmpackage_frontend.did.js";

// import { idlFactory } from "./fe_frontend.did.js";
// import {idlFactory as frontendIdlFactory} from "./fe_frontend.did.d"
// import { idlFactory as frontendIdlFactory } from "./fe_frontend.did.js";


dotenv.config();

interface CanisterDetail {
  name: string;
  category: string;
  wasmPath: string;
  frontendIdlFactoryPath?: any;
}

export const getCanisterDetails = async (): Promise<CanisterDetail[]> => {
  const dfxFilePath = path.resolve("dfx.json");
  try {
    const data = await fs.promises.readFile(dfxFilePath, "utf-8");
    const dfxConfig = JSON.parse(data);
    const canisters = dfxConfig.canisters || {};

    execSync("cargo build --release --target wasm32-unknown-unknown");

    const canisterDetails = Object.keys(canisters).map((name) => {
      const type = canisters[name]?.type || "unknown";
      const category = type === "rust" ? "backend" : "frontend";

      if (category === "frontend") {
        const frontendIdlFactoryPath = path.resolve(
          "src",
          "declarations",
          name,
          `${name}.did.js`
        );
        const wasmFilePath =
          "/Users/pratap/code/kai/dfx-node/src/commands/assetstorage.wasm";

        return {
          name,
          category,
          wasmPath: wasmFilePath,
          frontendIdlFactoryPath,
        };
      } else {
        const didFileName = `${name}.did`;
        const didFilePath = path.resolve("src", name, didFileName);

        if (!fs.existsSync(didFilePath)) {
          throw new Error(`DID file not found: ${didFilePath}`);
        }

        const newDidFilePath = path.resolve(
          "target",
          "wasm32-unknown-unknown",
          "release",
          didFileName
        );

        fs.copyFileSync(didFilePath, newDidFilePath);

        const wasmFilePath = path.resolve(
          "target",
          "wasm32-unknown-unknown",
          "release",
          `${name}.wasm`
        );
        const outputWasmPath = path.resolve(
          "target",
          "wasm32-unknown-unknown",
          "release",
          "output.wasm"
        );

        if (!fs.existsSync(wasmFilePath)) {
          throw new Error(`WASM file not found: ${wasmFilePath}`);
        }

        execSync(
          `ic-wasm "${wasmFilePath}" -o "${outputWasmPath}" metadata candid:service -f "${newDidFilePath}" -v public`
        );

        if (!fs.existsSync(outputWasmPath)) {
          throw new Error(`Output WASM file not created: ${outputWasmPath}`);
        }

        return { name, category, wasmPath: outputWasmPath };
      }
    });

    return canisterDetails;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

async function createAgent(): Promise<HttpAgent> {
  const identity = Ed25519KeyIdentity.generate();
  const host = "http://127.0.0.1:4943";
    // process.env.DFX_NETWORK === "local"
      // ? "http://127.0.0.1:4943"
      // : "https://ic0.app";

  const agent = new HttpAgent({ identity, host });
  // if (process.env.DFX_NETWORK === "local") {
    await agent.fetchRootKey();
  // }
  return agent;
}

export async function createAndInstallCanisters() {
  try {
    const canisterDetails = await getCanisterDetails();
    const agent = await createAgent();

    for (const canister of canisterDetails) {
      const managementCanister = ICManagementCanister.create({ agent });
      const newCanisterId =
        await managementCanister.provisionalCreateCanisterWithCycles({
          amount: BigInt(1000000000000),
        });

      if (canister.category === "backend") {
        console.log(`Created backend canister: ${newCanisterId}`);
        await install(managementCanister, newCanisterId, canister.wasmPath);
      } else if (canister.category === "frontend") {
        console.log(`Created frontend canister: ${newCanisterId}`);
        console.log("canister.wasmPath", canister.wasmPath);

        await install(managementCanister, newCanisterId, canister.wasmPath);

                execSync("npm run build");
        // const frontendIdlFactoryPath = path.resolve(canister.frontendIdlFactoryPath);
        // console.log("fidl: ", frontendIdlFactoryPath);
        // @ts-ignore
        // const idlFactory = require(idlFactory).default;


        // console.log("idlFactory : ", idlFactory);

        // @ts-ignore
        const feActor = getActor(agent, newCanisterId.toText());
        console.log("acttt", feActor);
        // const FrontendCanisterActor = Actor.createActor(frontendIdlFactory, {
        //   agent,
        //   canisterId: newCanisterId.toText(),
        // });

        // console.log("idl factory is: ", FrontendCanisterActor);

        await uploadFrontEndAssets(feActor, newCanisterId);
      }
    }
  } catch (error) {
    console.error("Error creating and installing canisters:", error);
  }
}


async function install(
  managementCanister: ICManagementCanister,
  canisterId: Principal,
  wasmPath: string
): Promise<void> {
  try {
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`);
    }

    const wasmBuffer = await fs.promises.readFile(wasmPath);
    const wasmModule = new Uint8Array(wasmBuffer);

    const initArgs = {
      owner: Principal.fromText(
        "6ydm4-srext-xsaic-y3v2x-cticp-5n6pf-2meh7-j43r6-rghg7-pt5nd-bqe"
      ),
      name: "assetstorage.wasm",
    };

    const candidType = IDL.Record({
      owner: IDL.Principal,
      name: IDL.Text,
    });

    const arg = IDL.encode([candidType], [initArgs]);

    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg: new Uint8Array(arg),
    });

    console.log(`Code installed successfully for canister: ${canisterId}`);
  } catch (error) {
    console.error(
      `Error during code installation for canister ${canisterId.toText()}:`,
      error
    );
  }
}

async function uploadFrontEndAssets(
  FrontendCanisterActor: any,
  canisterId: Principal
): Promise<void> {
  try {
    // const pattt = path.resolve("src");
    // console.log("sfsd; ", pattt);
    const distPath = "/Users/pratap/code/kai/fe/src/fe_frontend/dist";

    const files = await getFiles(distPath);
    console.log("files ", files);
    console.log("Please wait, code is installing...");

    for (const file of files) {
      const filePath = path.join(distPath, file);
      const fileContent = await fs.promises.readFile(filePath);
      const fileKey = `${file.replace(/\\/g, "/")}`;

      const args = {
        key: fileKey,
        content: new Uint8Array(fileContent),
        content_type: getMimeType(file),
        content_encoding: "identity",
        sha256: [],
        aliased: [],
      };

      await FrontendCanisterActor.store(args);
    }

    console.log(`CanisterId: ${canisterId}`);
  } catch (error) {
    console.error("Error uploading assets:", error);
  }
}

async function getFiles(
  dir: fs.PathLike,
  fileList: string[] = [],
  baseDir = dir
): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir.toString(), entry.name);
    if (entry.isDirectory()) {
      await getFiles(fullPath, fileList, baseDir);
    } else {
      const relativePath = path.relative(baseDir.toString(), fullPath);
      fileList.push(relativePath);
    }
  }
  return fileList;
}

function getMimeType(fileName: string): string {
  if (fileName.endsWith(".html")) return "text/html";
  if (fileName.endsWith(".css")) return "text/css";
  if (fileName.endsWith(".js")) return "application/javascript";
  if (fileName.endsWith(".svg")) return "image/svg+xml";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))
    return "image/jpeg";
  return "application/octet-stream";
}


