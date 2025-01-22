const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

export const installReactFrontend = async (projectName: String, projectPath: String) => {
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
    const command =
        `npm create vite@latest ${projectName}_frontend -- --template react `;
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
}