const { createAgent } = require("./createAgent");
const { createCanister } = require("./createCanister");
createAgent()
  .then((agent) => {
    console.log("Agent created successfully:");
    console.log(agent);
    console.log("Starting the canister creation process...");
    createCanister(agent);
  })
  .catch((err) => {
    console.error("Error creating agent:", err);
  });
