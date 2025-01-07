import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { ICManagementCanister, InstallMode } from "@dfinity/ic-management";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { Principal } from "@dfinity/principal";

dotenv.config();

interface CanisterDetail {
  name: string;
  category: string;
  wasmPath: string;
  canisterId: Principal;
}

export const getCanisterDetails = (): CanisterDetail[] => {
  const dfxFilePath = path.resolve("dfx.json");
  try {
    const data = fs.readFileSync(dfxFilePath, "utf-8");
    const dfxConfig = JSON.parse(data);
    const canisters = dfxConfig.canisters || {};

    const canisterDetails: CanisterDetail[] = Object.keys(canisters).map(
      (name) => {
        const type = canisters[name]?.type || "unknown";
        const category = type === "rust" ? "backend" : "frontend";

        const wasmFileName =
          category === "frontend" ? `${name}.wasm.gz` : `${name}.wasm`;

        const wasmPath = path.resolve(
          "target",
          "wasm32-unknown-unknown",
          "release",
          wasmFileName
        );
        if (!fs.existsSync(wasmPath)) {
          throw new Error(`WASM file not found for canister: ${name}`);
        }
        const canisterId = Principal.fromText(
          execSync(`dfx canister id ${name}`, {
            encoding: "utf-8",
          }).trim()
        );

        return { name, category, wasmPath, canisterId };
      }
    );

    return canisterDetails;
  } catch (error) {
    console.error(`Error processing canisters: ${(error as Error).message}`);
    process.exit(1);
  }
};

async function createAgent() {
  const identity = Ed25519KeyIdentity.generate();
  console.log(process.env.DFX_NETWORK)
  const host =
    process.env.DFX_NETWORK == "local"
      ? "http://127.0.0.1:4943"
      : "https://ic0.app";
      console.log(process.env.DFX_NETWORK)
  const agent = await HttpAgent.create({
    identity,
    host: host,
  });
  if (process.env.DFX_NETWORK == "local") {
    await agent.fetchRootKey();
  }
  return agent;
}

export async function createAndInstallCanisters() {
  try {
    const canisterDetails = getCanisterDetails();
    const agent = await createAgent();
    console.log(process.env.DFX_NETWORK)

    console.log("agent",agent)
    const managementCanister = ICManagementCanister.create({ agent });

    for (const canister of canisterDetails) {
      await install(managementCanister, canister.canisterId, canister.wasmPath);
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
    const wasmBuffer = await readFile(wasmPath);
    const wasmModule = new Uint8Array(wasmBuffer);
    await managementCanister.installCode({
      mode: InstallMode.Upgrade,
      canisterId,
      wasmModule,
      arg: new Uint8Array(),
    });
    console.log(`Code installed successfully for canister: ${canisterId}`);
  } catch (error) {
    console.error(`Error during code installation for canister ${canisterId}:`,error);
  }
}
