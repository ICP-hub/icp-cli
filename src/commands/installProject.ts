const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

export async function createIcpProject(projectName: String) {
  if (!projectName) {
    console.error("Please provide a project name.");
    return;
  }

  const projectPath = path.join(process.cwd(), projectName);

  fs.mkdirSync(projectPath, { recursive: true });

  const dfxJson = {
    "canisters": {
      [`${projectName}_backend`]: {
        "candid": `src/${projectName}_backend/${projectName}_backend.did`,
        "package": `${projectName}_backend`,
        "type" : "rust",
      },

      [`${projectName}_frontend`] : {
      "dependencies": [
        `${projectName}_frontend`
      ],
      "source": [
        `src/${projectName}_frontend/dist`
      ],
      "type": "assets",
      "workspace": `${projectName}_frontend`
      }
    },
    "defaults": {
      "build": {
        "args": "",
        "packtool": "",
      },
    },
    "output_env_file": ".env",
    "version": 1,
  };

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
  
  const packageJson = `
  {
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=7.0.0"
  },
  "name": "${projectName}",
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "prebuild": "npm run prebuild --workspaces --if-present",
    "pretest": "npm run prebuild --workspaces --if-present",
    "start": "npm start --workspaces --if-present",
    "test": "npm test --workspaces --if-present"
  },
  "type": "module",
  "workspaces": [
    "src/${projectName}_frontend"
  ]
  }
  `;
  
  fs.writeFileSync(path.join(projectPath, "package.json"), packageJson.trim());
  fs.writeFileSync(path.join(rustPath, "Cargo.toml"), rustCargoToml.trim());
  fs.writeFileSync(path.join(rustSrcPath, "lib.rs"), rustMain.trim());
  fs.writeFileSync(path.join(rustPath, `${projectName}_backend.did`), rustDid.trim());

  const command = `npm create vite@latest ${projectName}_frontend -- --template react `;
  const installNodeModule = `npm install`;
  try {
    await execSync(command, {
      cwd: `${projectPath}/src`,
      stdio: "inherit",
      shell: true,
    });
    
    await execSync(installNodeModule, {
      cwd: `${projectPath}`,
      stdio: "inherit",
      shell: true,
    });

    await execSync(installNodeModule, {
      cwd: `${projectPath}/src/${projectName}_frontend`,
      stdio: "inherit",
      shell: true,
    });
  } catch (err) {
    console.error("Error initializing npm:", err);
  }

  console.log("ICP project created successfully");
}
