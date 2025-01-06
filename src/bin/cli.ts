#!/usr/bin/env node
// Do not delete above line


import { Command, program } from "commander";
import init from "../commands/init";
import build from "../commands/build";
import help from "../commands/help";
import { appDescription, appName, appVersion } from "../config";


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


program.parse(process.argv);
