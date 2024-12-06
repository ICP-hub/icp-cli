const { HttpAgent } = require("@dfinity/agent");
const { Ed25519KeyIdentity } = require("@dfinity/identity");

async function createAgent() {
    const identity = Ed25519KeyIdentity.generate();

    const agent = new HttpAgent({
        identity,
        host: "https://ic0.app",
    });

    if (process.env.NODE_ENV !== "production") {
        await agent.fetchRootKey();
    }

    return agent;
}

module.exports = { createAgent };
