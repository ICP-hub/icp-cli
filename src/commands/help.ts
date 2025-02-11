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

const CYCLES_LEDGER_CANISTER_ID = Principal.fromUint8Array(
    new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x02, 0x10, 0x00, 0x02, 0x01, 0x01])
);

console.log(CYCLES_LEDGER_CANISTER_ID.toText()); // Prints the Principal as a string


};
