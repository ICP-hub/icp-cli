
import { Actor, HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import {
  ICManagementCanister,
  InstallMode,
} from "@dfinity/ic-management";
import { Principal } from "@dfinity/principal";
import { nonNullish } from "@dfinity/utils";
import { copyFile, readFile } from "fs/promises";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

const INDEX_WASM_PATH = join(process.cwd(), "test_backend.wasm");

console.log("path ", INDEX_WASM_PATH);

async function createAgent() {
  const identity = Ed25519KeyIdentity.generate();
  const host =
    process.env.IC_ENV === "local"
      ? "http://127.0.0.1:4943"
      : "https://ic0.app";
  const agent = new HttpAgent({
    identity,
    host: host,
  });

  if (process.env.NODE_ENV !== "production") {
    await agent.fetchRootKey();
  }

  console.log("Agent created:", agent);
  return agent;
}

async function createCanister2() {
  try {
    const agent = await createAgent();

    const managementCanister = ICManagementCanister.create({ agent });
    console.log("Management Canister Actor:", managementCanister);
    const newCanisterId =
      await managementCanister.provisionalCreateCanisterWithCycles({
        cycles: 1000000000000,
      });

    console.log("New Canister created with ID:", newCanisterId.toText());
    const CanisterId = newCanisterId.toText();
    process.env["CANISTER_ID"] = newCanisterId.toText();
    canisterStatus(managementCanister, CanisterId);
    fetchCanisterLogs(managementCanister, CanisterId);
    await install(managementCanister, newCanisterId)
    // InstallCanister(managementCanister, CanisterId);
    //  getCanisterInfo(managementCanister, CanisterId);
    //    getBitcoinBalance(managementCanister, CanisterId);
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

async function installCanisterCode(canisterId, wasmPath, arg) {
  const { installCode } = ICManagementCanister.create({
    agent,
  });

  await installCode({
    mode: InstallMode.Install,
    canisterId: Principal.from(canisterId),
    wasmModule: await readFile(wasmPath),
    arg: new Uint8Array(arg),
  });

  try {
  } catch (err) {
    console.error("error: ", err);
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

async function InstallCanister(managementCanister, CanisterId) {
  try {
    if (!CanisterId) {
      throw new Error("Cannot fetch installCode: canisterId is not provided.");
    }

    const canisterPrincipal = Principal.fromText(CanisterId);
    const arg = [];
    console.log(`Fetching logs for canister: ${canisterPrincipal.toText()}`);
    const wasm = await readFile(INDEX_WASM_PATH);
    const logs = await managementCanister.installCode({
        mode: InstallMode.Install,
      canisterId: canisterPrincipal,
      wasmModule: wasm,
      arg: new Uint8Array(arg),
    });
    console.log(
      `installCode for canister ${canisterPrincipal.toText()}:`,
      logs
    );
  } catch (error) {
    console.error(
      `Error fetching installCode for canister ${CanisterId || "unknown"}:`,
      error.message || error
    );
  }
}

async function getCanisterInfo(managementCanister, CanisterId) {
  try {
    if (!CanisterId) {
      throw new Error(
        "Cannot fetch canister info: canisterId is not provided."
      );
    }

    const canisterPrincipal = Principal.fromText(CanisterId);

    console.log(`Fetching info for canister: ${canisterPrincipal.toText()}`);

    const request = { canister_id: canisterPrincipal };

    const info = await managementCanister.service.canister_info(request);

    console.log(
      "Full response from canister_info:",
      JSON.stringify(info, null, 2)
    );

    if (info.num_requested_changes === undefined) {
      console.warn("'num_requested_changes' is missing in the response.");
    } else {
      console.log("Number of requested changes:", info.num_requested_changes);
    }

    if (info.network === undefined) {
      console.warn("'network' is missing in the response.");
    } else {
      console.log("Network:", info.network);
    }
  } catch (error) {
    console.error(
      `Error fetching info for canister ${CanisterId || "unknown"}:`,
      error.message || error
    );
  }
}

async function getBitcoinBalance(managementCanister, CanisterId) {
  try {
    if (!CanisterId) {
      throw new Error(
        "Cannot fetch Bitcoin balance: canisterId is not provided."
      );
    }

    const canisterPrincipal = Principal.fromText(CanisterId);

    console.log(
      `Fetching Bitcoin balance for canister: ${canisterPrincipal.toText()}`
    );
    console.log(
      "Available methods on service:",
      Object.keys(managementCanister.service)
    );
    console.log("managementCanister service:", managementCanister.service);

    // Ensure the method exists before calling it
    if (typeof managementCanister.service.bitcoin_get_balance !== "function") {
      throw new Error(
        "bitcoin_get_balance method is not available on managementCanister service."
      );
    }

    const balance = await managementCanister.service.bitcoin_get_balance(
      canisterPrincipal
    );
    console.log(
      `Bitcoin balance for canister ${canisterPrincipal.toText()}:`,
      balance
    );
  } catch (error) {
    console.error(
      `Error fetching Bitcoin balance for canister ${CanisterId || "unknown"}:`,
      error.message || error
    );
  }
}


async function install(managementCanister, canisterId) {
  console.log("Installing code...");

  const wasmBuffer = await readFile(INDEX_WASM_PATH);
  const wasmModule = new Uint8Array(wasmBuffer);

  try {
    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg: new Uint8Array(),
    });
    console.log("Code installed successfully.");
  } catch (error) {
    console.error("Error during code installation:", error.message || error);
  }
}

// createCanister2();
export {
  createAgent,
  createCanister2,
  canisterStatus,
  fetchCanisterLogs,
  install,
};