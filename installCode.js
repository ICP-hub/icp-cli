import { InstallMode } from "@dfinity/ic-management";
import { readFile } from "fs/promises";
import { join } from "path";

const INDEX_WASM_PATH = join(process.cwd(), "test_backend.wasm");

export default async function install(managementCanister, canisterId) {
  console.log("installing code");

  const buffer = await readFile(INDEX_WASM_PATH);
  const arr = Uint8Array.from(buffer);

  try {
    await managementCanister.installCode({
      mode: InstallMode.Install,
      canisterId,
      wasmModule: arr,
      arg: new Uint8Array(),
    });
    console.log("Code installed successfully.");
  } catch (err) {
    console.error("Error during installation:", err);
  }
}
