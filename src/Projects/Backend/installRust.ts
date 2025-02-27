const fs = require("fs");
const path = require("path");


export const installRustBakend = async (projectName: String, projectPath : String, dfxJson : any) => {
    const parentCargoFile = `
    [workspace]
    members = [
      "src/${projectName}_backend"
    ]
    resolver = "2"
   `;

    fs.writeFileSync(
        path.join(projectPath, "dfx.json"),
        JSON.stringify(dfxJson, null, 2)
    );

    fs.writeFileSync(path.join(projectPath, "Cargo.toml"), parentCargoFile.trim());
    const rustPath = path.join(projectPath, `src/${projectName}_backend`);
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
    name = "${projectName}_backend"
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
    try {
  fs.writeFileSync(path.join(rustPath, "Cargo.toml"), rustCargoToml.trim());
  fs.writeFileSync(path.join(rustSrcPath, "lib.rs"), rustMain.trim());
  fs.writeFileSync(path.join(rustPath, `${projectName}_backend.did`), rustDid.trim());
    } catch (error) {
        console.log(error);
    }
}