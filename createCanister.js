const { Actor, HttpAgent } = require("@dfinity/agent");
const { Ed25519KeyIdentity } = require("@dfinity/identity");
const { IDL } = require("@dfinity/candid");

const { Principal } = require("@dfinity/principal");
require("dotenv").config();
const {
    idlFactory,
} = require("@dfinity/ic-management/dist/candid/ic-management.idl");

console.log("IDL Factory:", idlFactory);

async function createAgent() {
    const identity = Ed25519KeyIdentity.generate();
    const agent = new HttpAgent({
        identity,
        host: "https://ic0.app",
    });

    if (process.env.NODE_ENV !== "production") {
        await agent.fetchRootKey();
    }

    console.log("Agent created:", agent);
    return agent;
}

async function createCanister() {
    const agent = await createAgent();

    if (typeof idlFactory === "function") {
        console.log("idlFactory is a function, calling with { IDL }...");
    } else {
        console.log("idlFactory is NOT a function. It's:", idlFactory);
    }

    let managementCanisterInterface;
    if (typeof idlFactory === "function") {
        managementCanisterInterface = idlFactory({ IDL });
    } else {
        console.error("idlFactory is not a function, cannot proceed.");
        return;
    }
    console.log(
        "Management Canister Interface Structure:",
        Object.keys(managementCanisterInterface)
    );

    // Log the generated interface
    console.log("Management Canister Interface:", managementCanisterInterface);
    const functions = managementCanisterInterface._fields;
    console.log("Available Functions:", functions);
    const managementCanisterId = process.env.MANAGEMENT_CANISTER_ID;
    console.log("managementCanisterId:", managementCanisterId);

    try {
        const managementCanister = Actor.createActor(managementCanisterInterface, {
            agent,
            canisterId: managementCanisterId,
        });
        console.log("Management Canister Actor:", managementCanister);


        const settings = {
            controllers: [],
            freezingThreshold: BigInt(100),
            memoryAllocation: BigInt(10000000),
            logVisibility: 1,
            wasmMemoryLimit: BigInt(1000000),
        };
        //  create a new canister
        const result = await managementCanister.create_canister({
            settings: settings,
            sender_canister_version: BigInt(1),
        });

        console.log("Canister created successfully!");
        console.log("New Canister ID:", result.canister_id.toText());
    } catch (error) {
        console.error("Error creating canister:", error);
    }
}

createCanister();
