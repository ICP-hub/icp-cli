#!/usr/bin/env node
// Do not delete above line


import { Command, program } from "commander";
import init from "../commands/init";
import build from "../commands/build";
import help from "../commands/help";
import { appDescription, appName, appVersion } from "../config";
import path from "path";
import fs from "fs";

interface CanisterDetail {
  name: string;
  category: string; // "backend" or "frontend"
}

function getCanisterDetails(): CanisterDetail[] {
  const dfxFilePath = path.resolve("dfx.json");

  try {
    // Read the file
    const data = fs.readFileSync(dfxFilePath, "utf-8");

    // Parse the JSON
    const dfxConfig = JSON.parse(data);

    // Extract canisters
    const canisters = dfxConfig.canisters || {};
    const canisterDetails: CanisterDetail[] = Object.keys(canisters).map((name) => {
      const type = canisters[name]?.type || "unknown";
      const category = type === "rust" ? "backend" : "frontend";
      return { name, category };
    });

    return canisterDetails;
  } catch (error) {
    console.error(`Error reading dfx.json: ${(error as Error).message}`);
    process.exit(1);
  }
}


program
  .name(appName)
  .description(appDescription)
  .version(appVersion);


program
  .command('init')
  .description('Initialize the project')
  .action(init);

program
  .command('build')
  .description('Build the project')
  .action(build);

program
  .command('help')
  .description('Show help information')
  .action(help);

  program
  .command("cwd")
  .description("Display the current working directory")
  .action(() => {
    console.log(`Current working directory: ${process.cwd()}`);
  });

  program
  .command("canisters")
  .description("List canisters and their categories (backend/frontend)")
  .action(() => {
    const canisterDetails = getCanisterDetails();
    console.log("Canister Details:");
    canisterDetails.forEach(({ name, category }) => {
      console.log(`- ${name}: ${category}`);
    });
  });

program.parse(process.argv);
