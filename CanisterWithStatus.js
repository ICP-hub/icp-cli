require("dotenv").config();
const { HttpAgent, Ed25519KeyIdentity } = require("@dfinity/agent");
const { ICManagementCanister } = require("@dfinity/ic-management");

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

    //  dccg7 - xmaaa - aaaaa - qaamq - cai;
    // dlbnd - beaaa - aaaaa - qaana - cai;
    // dmalx - m4aaa - aaaaa - qaanq - cai;
    await agent.fetchRootKey();

    console.log(`Agent created using ${host}`);
    return agent;
}

async function CanisterWithStatus() {
    try {
        const agent = await createAgent();

        const managementCanister = ICManagementCanister.create({ agent });
        console.log("Management Canister Actor:", managementCanister);

        // Create a new canister
        const newCanisterId =
            await managementCanister.provisionalCreateCanisterWithCycles({
                cycles: 1000000000000,
            });
        if (!newCanisterId) {
            throw new Error("Failed to create canister: canister_id is undefined.");
        }

        console.log("Newly created canister ID:", newCanisterId.toText());

        // await canisterStatus(managementCanister, newCanisterId);
        // await stopCanister(managementCanister, canisterId);
    } catch (error) {
        console.error(
            "Error creating or managing canister:",
            error.message || error
        );
    }
}

// Function to stop the canister
async function stopCanister(managementCanister, newCanisterId) {
    try {
        if (!newCanisterId) {
            throw new Error("Cannot stop: canisterId is not provided.");
        }
        console.log(`Stopping canister: ${newCanisterId.toText()}`);
        await managementCanister.stopCanister(newCanisterId);
        console.log(`Canister ${newCanisterId.toText()} stopped successfully.`);
    } catch (error) {
        console.error(
            `Error stopping canister ${newCanisterId ? newCanisterId.toText() : "unknown"
            }:`,
            error.message || error
        );
    }
}

// Function to get the status of a canister
async function canisterStatus(managementCanister, newCanisterId) {
    try {
        if (!newCanisterId) {
            throw new Error("Cannot fetch status: canisterId is not provided.");
        }
        console.log(`Fetching status for canister: ${newCanisterId.toText()}`);
        const status = await managementCanister.canisterStatus(newCanisterId);
        console.log(`Canister status:`, status);
    } catch (error) {
        console.error(
            `Error fetching status for canister ${newCanisterId ? newCanisterId.toText() : "unknown"
            }:`,
            error.message || error
        );
    }
}

CanisterWithStatus();
