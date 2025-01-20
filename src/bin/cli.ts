#!/usr/bin/env node
// Do not delete above line


import { program } from "commander";
import init from "../commands/init";
import build from "../commands/build";
import help from "../commands/help";
import { appDescription, appName, appVersion } from "../config";
import { createAndInstallCanisters, getCanisterDetails } from "../commands/allCanisters";
import { createIcpProject } from "../commands/installProject";

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
  .command('new <projectName>')
  .description('create new icp project')
  .action((projectName) => {
    createIcpProject(projectName); 
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
  .action(createAndInstallCanisters);

program.parse(process.argv);
