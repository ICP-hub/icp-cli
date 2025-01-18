const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

export function createIcpProject() {
    const projectName = "myfirstproject";
    if (!projectName) {
        console.error("Please provide a project name.");
        return;
    }

    const projectPath = path.join(process.cwd(), projectName);

    fs.mkdirSync(projectPath, { recursive: true });

    console.log(`Project folder created at ${projectPath}`);

    const dfxJson = {
        "canisters": {
          "myfirstproject_backend": {
            "candid": "src/myfirstproject_backend/myfirstproject_backend.did",
            "package": "myfirstproject_backend",
            "type": "rust"
          },
        },
        "defaults": {
          "build": {
            "args": "",
            "packtool": ""
          }
        },
        "output_env_file": ".env",
        "version": 1
      }
    const parentCargoFile = `
    [workspace]
    members = [
    "src/myfirstproject_backend"
    ]
    resolver = "2" `;

    fs.writeFileSync(
        path.join(projectPath, "dfx.json"),
        JSON.stringify(dfxJson, null, 2)
    );

    fs.writeFileSync(path.join(projectPath, "Cargo.toml"), parentCargoFile.trim());

    console.log("dfx.json created");

    const rustPath = path.join(projectPath, "src/myfirstproject_backend");
    const rustSrcPath = path.join(rustPath, "src");
    fs.mkdirSync(rustSrcPath, { recursive: true });

    const rustMain = `
use ic_cdk::query;
#[query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
    `;

    const rustCargoToml = `
    [package]
    name = "myfirstproject_backend"
    version = "0.1.0"
    edition = "2021"

    [lib]
    crate-type = ["cdylib"]

    [dependencies]
    candid = "0.10"
    ic-cdk = "0.16"
    ic-cdk-timers = "0.10" # Feel free to remove this dependency if you don't need timers
    `;

    const rustDid = ` service : {
    "greet": (text) -> (text) query;
    }; `;

    fs.writeFileSync(path.join(rustPath, "Cargo.toml"), rustCargoToml.trim());
    fs.writeFileSync(path.join(rustSrcPath, "lib.rs"), rustMain.trim());
    fs.writeFileSync(path.join(rustPath, "myfirstproject_backend.did"), rustDid.trim());

    console.log("Rust backend canister created");

    console.log(`ICP project "${projectName}" created successfully!`);
}