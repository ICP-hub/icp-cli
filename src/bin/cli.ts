#!/usr/bin/env node
// Do not delete above line


import { program } from "commander";
import init from "../commands/init";
import build from "../commands/build";
import help from "../commands/help";
import { appDescription, appName, appVersion } from "../config";
import { createAndInstallCanisters } from "../commands/allCanisters";
import { createIcpProject } from "../commands/installProject";
import inquirer from 'inquirer';
import { faucerCoupon } from "../redeem-coupon/faucetCycles";
const { execSync } = require("child_process");

const isInstalled = (cmd : string) => {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
};

const checkDependencies = () => {
  const missing = [];
  if (!isInstalled("ic-wasm")) missing.push("ic-wasm");
  if (!isInstalled("rustc")) missing.push("rustc");

  if (missing.length > 0) {
    console.log(`\n❌ Missing dependencies: ${missing.join(", ")}\n`);
    console.log("🔧 Please install the missing dependencies using:\n");

    if (missing.includes("ic-wasm")) {
      console.log("  👉 Install ic-wasm: `cargo install ic-wasm`");
    }
    if (missing.includes("rustc")) {
      console.log("  👉 Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`");
    }

    console.log("\nAfter installation, restart your terminal and try again.\n");
    process.exit(1);
  }
};

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
  .command('redeem')
  .description('create new icp project')
  .action(faucerCoupon);

program
  .command('new <projectName>')
  .description('create new ICP project')
  .action(async (projectName) => {
    const { backendLanguage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'backendLanguage',
        message: 'Select a backend language:',
        choices: ['Rust',],
        default: 'Rust',
      },
    ]);

    const { frontendLanguage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'frontendLanguage',
        message: 'Select a Frontend language:',
        choices: ['React', 'Vue', 'None'],
        default: 'React',
      },
    ]);

    await createIcpProject(projectName, backendLanguage, frontendLanguage);
    console.log(`cd ${projectName}/`);
    console.log("icp deploy");
    console.log("ICP project created successfully");
  });

program
  .command("cwd")
  .description("Display the current working directory")
  .action(() => {
    console.log(`Current working directory: ${process.cwd()}`);
});

program
  .command("deploy")
  .description("List canisters and their categories (backend/frontend)")
  .action(async () => {
    checkDependencies();
    createAndInstallCanisters();
  });

program.parse(process.argv);
