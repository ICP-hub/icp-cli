
import {  HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import {
  ICManagementCanister,
  InstallMode,
} from "@dfinity/ic-management";
import { Principal } from "@dfinity/principal";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { join } from "path";
import { IDL } from '@dfinity/candid';


dotenv.config();

const FRONTEND_WASM_PATH = join(process.cwd(), "assetstorage.wasm");

console.log("Frontend path is : ", FRONTEND_WASM_PATH);

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
  if (process.env.NODE_ENV !== "production") {
    await agent.fetchRootKey();
  }

  console.log("Agent created:", agent);
  return agent;
}

async function createFrontendCanister() {
  try {
    const agent = await createAgent();

    const managementCanister = ICManagementCanister.create({ agent });
    console.log("Management Canister Actor:", managementCanister);
    const newCanisterId =
      await managementCanister.provisionalCreateCanisterWithCycles(
        { cycles: 1000000000000,}
      );

    console.log("New Canister created with ID:", newCanisterId.toText());
    const CanisterId = newCanisterId.toText();
    process.env["CANISTER_ID"] = newCanisterId.toText();
    canisterStatus(managementCanister, CanisterId);
    fetchCanisterLogs(managementCanister, CanisterId);
    await install(managementCanister, newCanisterId)
  } catch (error) {
    console.error("Error creating canister:", error);
  }
}

async function canisterStatus(managementCanister, CanisterId) {
  try {
    if (!CanisterId) {
      throw new Error("Cannot fetch status: canisterId is not provided.");
    }

    const canisterPrincipal = Principal.fromText(CanisterId);

    console.log(`Fetching status for canister: ${canisterPrincipal.toText()}`);
    const status = await managementCanister.canisterStatus(canisterPrincipal);
    console.log(`Canister status for ${canisterPrincipal.toText()}:`, status);
  } catch (error) {
    console.error(
      `Error fetching status for canister ${CanisterId || "unknown"}:`,
      error.message || error
    );
  }
}

async function fetchCanisterLogs(managementCanister, CanisterId) {
  try {
    if (!CanisterId) {
      throw new Error("Cannot fetch logs: canisterId is not provided.");
    }

    const canisterPrincipal = Principal.fromText(CanisterId);

    console.log(`Fetching logs for canister: ${canisterPrincipal.toText()}`);
    const logs = await managementCanister.fetchCanisterLogs(canisterPrincipal);
    console.log(`Logs for canister ${canisterPrincipal.toText()}:`, logs);
  } catch (error) {
    console.error(
      `Error fetching logs for canister ${CanisterId || "unknown"}:`,
      error.message || error
    );
  }
}

async function install(managementCanister, canisterId) {
  try {
    console.log("Installing code...");
    const wasmBuffer = await readFile(FRONTEND_WASM_PATH);
    if (!wasmBuffer || wasmBuffer.length === 0) {
      throw new Error("WASM file is empty or could not be read.");
    }
    const initArgs = {
      owner: Principal.fromText("6ydm4-srext-xsaic-y3v2x-cticp-5n6pf-2meh7-j43r6-rghg7-pt5nd-bqe"),
      name: "assetstorage.wasm",
    };

    const candidType = IDL.Record({
      owner: IDL.Principal,
      name: IDL.Text,
    });

    const arg = IDL.encode([candidType], [initArgs]);
    
    const wasmModule = new Uint8Array(wasmBuffer);
    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg,
    });
    console.log("Code installed successfully.");
  } catch (error) {
    console.error("Error during code installation:", error?.message || error);
  }
}

export {
  createAgent,
  createFrontendCanister,
  canisterStatus,
  fetchCanisterLogs,
  install,
};