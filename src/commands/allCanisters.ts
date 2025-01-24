import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { ICManagementCanister, InstallMode } from "@dfinity/ic-management";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import getActor from "./getActor.js";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { createCanisterActor } from "../canisterActor/authClient.js";
const { execSync } = require("child_process");


dotenv.config();

interface CanisterDetail {
  name: string;
  category: string;
  wasmPath: string;
  type: String;
  frontendIdlFactoryPath?: any;
}


export const getCanisterDetails = async (): Promise<CanisterDetail[]> => {
  const dfxFilePath = path.resolve("dfx.json");

  try {
    if (!fs.existsSync(dfxFilePath)) {
      throw new Error(`dfx.json file not found at ${dfxFilePath}`);
    }

    const data = await fs.promises.readFile(dfxFilePath, "utf-8");
    const dfxConfig = JSON.parse(data);
    const canisters = dfxConfig.canisters || {};

    const assetstorageDid = path.resolve(
      "/home/anish/Icp-hub/dfx-node/src/commands/assetstorage.did"
    );

    if (!fs.existsSync(assetstorageDid)) {
      throw new Error(`assetstorage.did file not found: ${assetstorageDid}`);
    }

    const copyAssetStorageDid = async (name: string) => {
      const targetPaths = [
        path.resolve(".dfx", "local", "canisters", name, "assetstorage.did"),
        path.resolve("src", "declarations", name, "assetstorage.did"),
      ];

      targetPaths.forEach((targetPath) => {
        if (!fs.existsSync(targetPath)) {
          try {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(assetstorageDid, targetPath);
          } catch (err) {
            console.error(`Failed to copy assetstorage.did to ${targetPath}: ${err}`);
          }
        }
      });
    };

    const copyMotokoWasmFile = async (name: string) => {
      try {
        const targetDir = path.resolve(".dfx", "local", "canisters", name);
        const wasmPath = path.resolve("src", name, `${name}.wasm`);
        const targetPath = path.join(targetDir, `${name}.wasm`);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        if (fs.existsSync(wasmPath)) {
          fs.renameSync(wasmPath, targetPath);
        } else {
          console.error(`WASM file does not exist at ${wasmPath}`);
        }
      } catch (error) {
        console.log(error);
      }
    }

    const canisterDetails = await Promise.all(Object.keys(canisters).map(async (name) => {
      const type = canisters[name]?.type || "unknown";
      const category = (type === "rust" || type === "motoko") ? "backend" : "frontend";
      if (type == "rust") {
        console.log("Building Rust project...");
        execSync("cargo build --release --target wasm32-unknown-unknown", { stdio: "inherit" });
        await copyAssetStorageDid(name);
      } else if (type == "motoko") {
        let command = `$(dfx cache show)/moc --package base "$(dfx cache show)/base" -o ${name}.wasm main.mo`;

        const projectPath = `${process.cwd()}/src/${name}`;
        await execSync(command, {
          cwd: projectPath,
          stdio: "inherit",
          shell: true,
        });
        await copyMotokoWasmFile(name);
      }
      if (category === "frontend") {
        const frontendIdlFactoryPath = path.resolve(
          "src",
          "declarations",
          name,
          `${name}.did.js`
        );
        await copyAssetStorageDid(name);
        const wasmFilePath = "/home/anish/Icp-hub/dfx-node/assetstorage.wasm";
        return {
          name,
          type,
          category,
          wasmPath: wasmFilePath,
          frontendIdlFactoryPath,
        };
      } else if (type == "motoko") {
        const didFileName = `${name}.did`;
        const didFilePath = path.resolve("src", "declarations", didFileName);

        if (!fs.existsSync(didFilePath)) {
          throw new Error(`DID file not found: ${didFilePath}`);
        }

        const newDidFilePath2 = path.resolve(
          ".dfx",
          "local",
          "canisters",
          name,
          didFileName
        );

        const destinationDir = path.dirname(newDidFilePath2);
        if (!fs.existsSync(destinationDir)) {
          fs.mkdirSync(destinationDir, { recursive: true });
        }

        fs.copyFileSync(didFilePath, newDidFilePath2);
        const wasmPath = path.resolve(".dfx", "local", "canisters", name, `${name}.wasm`);
        const newasmPaths = path.resolve(".dfx", "local", "canisters", name, `output.wasm`);

        execSync(
          `ic-wasm "${wasmPath}" -o "${newasmPaths}" metadata candid:service -f "${newDidFilePath2}" -v public`, { stdio: "inherit" });

        return { name, type, category, wasmPath: newasmPaths };
      } else {
        const didFileName = `${name}.did`;
        const didFilePath = path.resolve("src", name, didFileName);

        if (!fs.existsSync(didFilePath)) {
          throw new Error(`DIDd file not found: ${didFilePath}`);
        }

        const newDidFilePath = path.resolve(
          "target",
          "wasm32-unknown-unknown",
          "release",
          didFileName
        );

        const newDidFilePath2 = path.resolve(
          ".dfx",
          "local",
          "canisters",
          name,
          "service.did"
        );

        fs.copyFileSync(didFilePath, newDidFilePath);
        fs.copyFileSync(didFilePath, newDidFilePath2);

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

        const newWasmPath = path.resolve(
          ".dfx",
          "local",
          "canisters",
          name,
          `${name}.wasm`
        );

        if (!fs.existsSync(wasmFilePath)) {
          throw new Error(`WASM file not found: ${wasmFilePath}`);
        }

        execSync(
          `ic-wasm "${wasmFilePath}" -o "${outputWasmPath}" metadata candid:service -f "${newDidFilePath}" -v public`, { stdio: "inherit" });

        execSync(
          `ic-wasm "${wasmFilePath}" -o "${newWasmPath}" metadata candid:service -f "${newDidFilePath2}" -v public`, { stdio: "inherit" });

        if (!fs.existsSync(outputWasmPath)) {
          throw new Error(`Output WASM file not created: ${outputWasmPath}`);
        }

        return { name, type, category, wasmPath: outputWasmPath };
      }
    }));

    return canisterDetails;

  } catch (error) {
    console.error(`Error occurred: ${error}`);
    process.exit(1);
  }
};

async function createAgent(): Promise<HttpAgent> {
  const Pharsekey = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");

  // const principal : any = Pharsekey?.getPrincipal();
  // console.log("principal",principal.toText());

  const host = "http://127.0.0.1:4943";
  // const host = "https://ic0.app";
  // const host = "https://ic0.app";
  // process.env.DFX_NETWORK === "local"
  // ? "http://127.0.0.1:4943"
  // : "https://ic0.app";

  const agent = new HttpAgent({ identity: Pharsekey, host });
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

      // const actor = await createCanisterActor();
      // console.log("actor : ",actor);
      // const newCanisterId : any = await actor?.get_canister_id();

      console.log("phase 1");
      console.log("New Canister ID:", newCanisterId);

      if (canister.category === "backend") {
        console.log(`Created backend canister: ${newCanisterId}`);
        if (canister.type == "rust") {
          await install(managementCanister, newCanisterId, canister.wasmPath);
        } else if (canister.type == "motoko") {
          await install(managementCanister, newCanisterId, canister.wasmPath);
        }
      } else {
        console.log(`Created frontend canister: ${newCanisterId}`);
        await install(managementCanister, newCanisterId, canister.wasmPath);
        const rootPath = path.join(process.cwd());
        const buildCommand = "npm run build"
        
        await execSync(buildCommand, {
          cwd: `${rootPath}`,
          stdio: "inherit",
          shell: true,
        });
        
        console.log("phase 2");
        const feActor = await getActor(agent, newCanisterId);
        await uploadFrontEndAssets(feActor, newCanisterId, canister.name);
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

    const arg: any = IDL.encode([candidType], [initArgs]);

    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg: arg,
    });

    console.log(`Code installed successfully for canister: ${canisterId}`);
  } catch (error) {
    console.error(
      `Error during code installation for canister ${canisterId?.toText()}:`,
      error
    );
  }
}

async function uploadFrontEndAssets(
  FrontendCanisterActor: any,
  canisterId: Principal,
  canisterName: any
): Promise<void> {
  try {
    const distPath = path.join(process.cwd(), "src", canisterName, "dist");
    const files = await getFiles(distPath);

    for (const file of files) {
      const filePath = path.join(distPath, file);
      const fileContent = await fs.promises.readFile(filePath);
      const fileKey = `/${file.replace(/\\/g, "/")}`;

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

    console.log(`Frontend assets uploaded to canister: ${canisterId}`);
  } catch (error) {
    console.error("Error uploading frontend assets:", error);
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
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}


