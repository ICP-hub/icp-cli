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
import { checkAndCutUserCycles, checkDependencies, isAlreadyDeployed } from "../validators/validators";


program
  .command("deploy")
  .description("List canisters and their categories (backend/frontend)")
  .action(async () => {
    await checkDependencies();
    const isDeployed = await isAlreadyDeployed();
    if(isDeployed === true){
      await createAndInstallCanisters();
    }else{
      await checkAndCutUserCycles();
    }
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
