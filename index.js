#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createCanister } from "./createcanistermain.js";
import { createAgent } from "./createAgent.js";
import shell from "shelljs";
yargs(hideBin(process.argv))
  // Command for creating a new canister
  .command("deploy", "Create new canister", {}, async () => {
    try {
      console.log("Starting the canister creation process...");
      await createCanister();
      console.log("Canister creation process completed successfully.");
    
    } catch (error) {
      console.error(
        "An error occurred during the canister creation process:",
        error.message || error
      );
    }
  })

  // Command for creating a new agent
  .command("create-agent", "Create a new agent", {}, async () => {
    try {
      console.log("Starting the agent creation process...");
      await createAgent();
      console.log("Agent creation process completed successfully.");
    } catch (error) {
      console.error(
        "An error occurred during the agent creation process:",
        error.message || error
      );
    }
  })
  .command("install", "Create a new agent", {}, async () => {
    try {
      console.log("Starting the agent creation process...");
      await createCanister();
      console.log("Agent creation process completed successfully.");
     
    } catch (error) {
      console.error(
        "An error occurred during the agent creation process:",
        error.message || error
      );
    }
  })

  .help().argv;
