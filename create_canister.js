const { ICManagementCanister, InstallMode } = require("@dfinity/ic-management");
const { Principal } = require("@dfinity/principal");
const {
  clearBuckets,
  createAgent,
  defaultIdentity,
  exec,
  loadWasm,
} = require("./support");

async function setup() {
  console.debug("Running global setup.");

  // Getting the replica port from dfx
  const replicaPort = exec("dfx info replica-port");
  process.env["REPLICA_URL"] = `http://localhost:${replicaPort}`;

  // Creating the agent and management canister
  const agent = await createAgent(defaultIdentity);
  const managementCanister = ICManagementCanister.create({ agent });

  const canisterId = Principal.fromText("6nxqb-aaaae-bqibi-ga4ea-scq");
  process.env["CANISTER_ID"] = canisterId.toText();

  // Creating the canister if it doesn't exist
  console.debug("Creating canister.");
  try {
    await managementCanister.provisionalCreateCanisterWithCycles({
      canisterId,
    });
  } catch (error) {
    console.debug("Canister already created, continuing.");
  }

  // Loading the WASM module and installing it on the canister
  const wasmModule = loadWasm();
  try {
    console.debug("Installing wasm.");
    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule,
      arg: new Uint8Array(),
    });
  } catch (error) {
    console.debug("Wasm already installed, reinstalling.");
    await managementCanister.installCode({
      mode: InstallMode.Reinstall,
      canisterId,
      wasmModule,
      arg: new Uint8Array(),
    });

    console.debug("Clearing storage buckets.");
    await clearBuckets();
  }

  // Setting up the base URL for the canister
  const webServerPort = exec("dfx info webserver-port");
  const baseURL = `http://${canisterId}.localhost:${webServerPort}`;
  process.env["BASE_URL"] = baseURL;
}

// Export the function for use in other files
module.exports = setup;
