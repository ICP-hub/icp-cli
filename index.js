#!/usr/bin/env node

// import { createCanister2 } from "./createcanistermain.js";
// (async () => {
//   try {
//     console.log("Starting the canister creation process...");
//     await createCanister2();
//     console.log("Canister creation process completed successfully.");
//   } catch (error) {
//     console.error(
//       "An error occurred during the canister creation process:",
//       error.message || error
//     );
//   }
// })();

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createCanister2 } from "./createcanistermain.js";

const argv = yargs(hideBin(process.argv))
  .command("create", "Create a new canister", {}, async () => {
    try {
      console.log("Starting the canister creation process...");
      await createCanister2();
      console.log("Canister creation process completed successfully.");
    } catch (error) {
      console.error(
        "An error occurred during the canister creation process:",
        error.message || error
      );
    }
  })
  .help().argv;
