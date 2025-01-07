import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { HttpAgent, ManagementCanisterRecord } from "@dfinity/agent";
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
    Object.keys(canisters).forEach((name) => {
      console.log("canisters", name);
      execSync(`dfx canister create ${name}`);
      console.log(`Building canister: ${name}`);
      execSync(`dfx build ${name}`, { stdio: "inherit" });
      execSync(`dfx deploy ${name}`);

    });

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
  const host =
    process.env.IC_ENV === "local"
      ? "http://127.0.0.1:4943"
      : "https://ic0.app";
  const agent = await HttpAgent.create({
    identity,
    host: host,
  });
  if (process.env.IC_ENV == "local") {
    await agent.fetchRootKey();
  }
  return agent;
}

export async function createAndInstallCanisters() {
  try {
    const agent = await createAgent();
    const managementCanister = ICManagementCanister.create({ agent });
    const canisterDetails = getCanisterDetails();

    for (const canister of canisterDetails) {
      const newCanisterId = await managementCanister.provisionalCreateCanisterWithCycles({
        amount: BigInt(1000000000000),
      });
      process.env["CANISTER_ID"] = newCanisterId.toText();
      
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
    const wasmBuffer = await readFile(wasmPath);
    const wasmModule = new Uint8Array(wasmBuffer);
    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg: new Uint8Array(),
    });
    console.log(`Code installed successfully for canister: ${canisterId}`);
  } catch (error) {
    console.error(`Error during code installation for canister ${canisterId}:`,error);
  }
}
