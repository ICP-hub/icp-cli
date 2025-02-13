const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

export const installVueFrontend = async (projectName: String, projectPath: String) => {
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
  const command = `npm create vite@latest ${projectName}_frontend -- --template vue`;
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

    await execSync("npm install -D sass-embedded", {
      cwd: `${projectPath}`,
      stdio: "inherit",
      shell: true,
    })

    await execSync("npm install pinia", {
      cwd: `${projectPath}`,
      stdio: "inherit",
      shell: true,
    })

    const IcpLogo = path.resolve("/home/anish/Icp-hub/dfx-node/src/viewJsFrontendDetails/logo2.svg");
    const ICPAppfile = path.resolve("/home/anish/Icp-hub/dfx-node/src/viewJsFrontendDetails/App.vue");
    const indexhtmlFile = path.resolve("/home/anish/Icp-hub/dfx-node/src/viewJsFrontendDetails/index.html");
    const mainFile = path.resolve("/home/anish/Icp-hub/dfx-node/src/viewJsFrontendDetails/main.js");
    const scssFile = path.resolve("/home/anish/Icp-hub/dfx-node/src/viewJsFrontendDetails/index.scss");

    const frontendPath = path.resolve(projectPath, `src/${projectName}_frontend`);
    const srcPath = path.join(frontendPath, "src");
    const publicPath = path.join(frontendPath, "public");

    if (!fs.existsSync(srcPath)) fs.mkdirSync(srcPath, { recursive: true });
    if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });

    await fs.copyFileSync(scssFile, path.join(srcPath, "index.scss"));
    await fs.copyFileSync(indexhtmlFile, path.join(frontendPath, "index.html"));
    await fs.copyFileSync(ICPAppfile, path.join(srcPath, "App.vue"));
    await fs.copyFileSync(IcpLogo, path.join(publicPath, "logo2.svg"));
    await fs.copyFileSync(mainFile, path.join(srcPath, "main.js"));

    console.log("Files replaced successfully.");
  } catch (err) {
    console.error("Error initializing npm:", err);
  }
}