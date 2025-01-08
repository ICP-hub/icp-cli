import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { ICManagementCanister, InstallMode } from "@dfinity/ic-management";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

dotenv.config();

interface CanisterDetail {
  name: string;
  category: string;
  wasmPath: string;
}


export const getCanisterDetails = (): CanisterDetail[] => {
  const dfxFilePath = path.resolve("dfx.json");
  try {
    const data = fs.readFileSync(dfxFilePath, "utf-8");
    const dfxConfig = JSON.parse(data);
    const canisters = dfxConfig.canisters || {};
    execSync(`cargo build --release --target wasm32-unknown-unknown`);

    const canisterDetails = Object.keys(canisters).map((name) => {
      const type = canisters[name]?.type || "unknown";
      const category = type === "rust" ? "backend" : "frontend";

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
    });

    return canisterDetails;
  } catch (error) {
    console.error(`Error processing canisters: ${(error as Error).message}`);
    process.exit(1);
  }
};

async function createAgent() {
  const identity = Ed25519KeyIdentity.generate();
  const host =
    process.env.DFX_NETWORK === "local"
      ? "http://127.0.0.1:4943"
      : "https://ic0.app";

  const agent = new HttpAgent({ identity, host });
  if (process.env.DFX_NETWORK === "local") {
    await agent.fetchRootKey();
  }
  return agent;
}

export async function createAndInstallCanisters() {
  try {
    const canisterDetails = getCanisterDetails();
    const agent = await createAgent();

    for (const canister of canisterDetails) {
      const managementCanister = ICManagementCanister.create({ agent });
      const newCanisterId = await managementCanister.provisionalCreateCanisterWithCycles({
        amount: BigInt(1000000000000),
      });

      console.log(`Created new canister: ${newCanisterId}`);
      await install(managementCanister, newCanisterId, canister.wasmPath);
    }
  } catch (error) {
    console.error("Error creating and installing canisters:", error);
  }
}

async function install(
  managementCanister: ICManagementCanister,
  canisterId: Principal,
  wasmPath: string
) {
  try {
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file does not exist at path: ${wasmPath}`);
    }

    const wasmBuffer = await readFile(wasmPath);
    const wasmModule = new Uint8Array(wasmBuffer);

    const initArgs = {
      owner: Principal.fromText("6ydm4-srext-xsaic-y3v2x-cticp-5n6pf-2meh7-j43r6-rghg7-pt5nd-bqe"),
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
