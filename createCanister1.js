const { HttpAgent } = require("@dfinity/agent");
const { Ed25519KeyIdentity } = require("@dfinity/identity");
const { ICManagementCanister } = require("@dfinity/ic-management");
const { IDL } = require("@dfinity/candid");
const { Principal } = require("@dfinity/principal");
require("dotenv").config();

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

async function createCanister1() {
  try {
    const agent = await createAgent();

    const managementCanister = ICManagementCanister.create({ agent });
    console.log("management caniste 31", managementCanister);
    const canisterId = Principal.fromText("6nxqb-aaaae-bqibi-ga4ea-scq");
    process.env["CANISTER_ID"] = canisterId.toText();

    await managementCanister.createCanister({
      canisterId,
    });

    console.log("Management Canister Actor:", managementCanister);
  } catch (error) {
    console.error("Error creating canister:", error);
  }
}

createCanister1();

// const { Actor, HttpAgent } = require("@dfinity/agent");
// const { Ed25519KeyIdentity } = require("@dfinity/identity");
// const { ICManagementCanister } = require("@dfinity/ic-management");
// const { Principal } = require("@dfinity/principal");
// require("dotenv").config();

// // Create the agent
// async function createAgent() {
//   const identity = Ed25519KeyIdentity.generate();
//   const agent = new HttpAgent({
//     identity,
//     host: "http://127.0.0.1:4943",
//   });

//   // Fetch the root key if not in production
//   if (process.env.NODE_ENV !== "production") {
//     await agent.fetchRootKey();
//   }

//   console.log("Agent created:", agent);
//   return agent;
// }

// // Create a canister
// async function createCanister1() {
//   try {
//     const agent = await createAgent();

//     // Create an actor for the management canister
//     const managementCanister = ICManagementCanister.create({ agent });
//     console.log("Management Canister Actor:", managementCanister);

//     // Create a new canister dynamically (don't specify canisterId beforehand)
//     const result = await managementCanister.createCanister();
//     const canisterId = result.canister_id;

//     console.log("Newly created canister ID:", canisterId.toText());

//     // Store the canister ID in environment variables or elsewhere
//     process.env["CANISTER_ID"] = canisterId.toText();

//     // You can now proceed with further operations using the new canister ID
//     console.log("Canister created successfully with ID:", canisterId.toText());
//   } catch (error) {
//     console.error("Error creating canister:", error);
//   }
// }

// createCanister1();
