import { appName } from "../config";
const { Principal } = require('@dfinity/principal');

export default function help() {
  console.log(`
Usage: ${appName} <command>

Commands:
  init      Initialize the project
  build     Build the project
  help      Show help information
  cwd       to show the path of current location
  deploy to check canisters exist or not

For more information, use '${appName} <command> --help'.
  `);
};
