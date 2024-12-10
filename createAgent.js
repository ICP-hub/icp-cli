import { HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";

async function createAgent() {
    const identity = Ed25519KeyIdentity.generate();

    const agent = new HttpAgent({
        identity,
        host: "https://ic0.app",
    });

    if (process.env.NODE_ENV !== "production") {
        await agent.fetchRootKey();
    }
console.log(agent);

    return agent;
    
}
createAgent();
// module.exports = { createAgent };
