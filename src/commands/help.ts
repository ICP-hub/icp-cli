import { appName } from "../config";

export default function help() {
  console.log(`
Usage: ${appName} <command>

Commands:
  init      Initialize the project
  build     Build the project
  help      Show help information

For more information, use '${appName} <command> --help'.
  `);
};
