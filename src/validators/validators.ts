import { createAndInstallCanisters } from "../commands/allCanisters";
import { checkUserCycleBalance } from "../icp-balance/checkBalance";
import { Principal } from "@dfinity/principal";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { idlFactory } from "../res/cyclesIdlFactory";
const { execSync } = require("child_process");

export const isInstalled = async (cmd: string) => {
    try {
        execSync(`${cmd} --version`, { stdio: "ignore" });
        return true;
    } catch (error) {
        return false;
    }
};

export const checkDependencies = async () => {
    try {
        const dfxFilePath = path.resolve("dfx.json");
        try {
            await fs.access(dfxFilePath, fs.constants.F_OK);
        } catch (error) {
            throw new Error(`dfx.json file not found at ${dfxFilePath}`);
        }
        let backendType = "";
        const data = await fs.readFile(dfxFilePath, "utf-8");
        const dfxConfig = JSON.parse(data);
        const canisters = dfxConfig.canisters || {};

        for (const canisterName in canisters) {
            const canister = canisters[canisterName];

            if (canister.type === "rust") {
                backendType = "rust";
            } else if (canister.type === "motoko") {
                backendType = "motoko";
            }
        }
        if (backendType == "rust") {
            const missing = [];
            if (!(await isInstalled("ic-wasm"))) missing.push("ic-wasm");
            if (!(await isInstalled("rustc"))) missing.push("rustc");

            if (missing.length > 0) {
                console.error(`\n❌ Missing dependencies: ${missing.join(", ")}\n`);
                console.error("🔧 Please install the missing dependencies using:\n");

                if (missing.includes("ic-wasm")) {
                    console.error("👉 Install ic-wasm: `cargo install ic-wasm`");
                }
                if (missing.includes("rustc")) {
                    console.error("👉 Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`");
                }

                console.error("\nAfter installation, restart your terminal and try again.\n");
                process.exit(1);
            }
        } else if (backendType == "motoko") {
            const missing = [];
            if (!(await isInstalled("moc"))) missing.push("moc");
            if (missing.length > 0) {
                console.error(`\n❌ Missing dependencies: ${missing.join(", ")}\n`);
                console.error("🔧 Please install the missing dependencies using:\n");

                if (missing.includes("moc")) {
                    console.error("👉 Install moc: `nix-env -i -f https://github.com/dfinity/motoko/archive/master.tar.gz -A moc`");
                }

                console.error("\nAfter installation, restart your terminal and try again.\n");
                process.exit(1);
            }
        }
    } catch (error) {
        console.error("❌ Error checking dependencies:", error);
        process.exit(1);
    }
};

export const numberOfCanisters = async (): Promise<number> => {
    const dfxFilePath = path.resolve("dfx.json");
    try {
        await fs.access(dfxFilePath);
    } catch (err) {
        throw new Error(`dfx.json file not found at ${dfxFilePath}`);
    }
    try {
        const data = await fs.readFile(dfxFilePath, "utf-8");
        const dfxConfig = JSON.parse(data);
        const canisters = dfxConfig.canisters;
        const canisterCount = Object.keys(canisters).length;
        return canisterCount;
    } catch (error) {
        console.log("error ", error);
        throw new Error(`error : ${error}`);
    }
};

export const transferCyclesToCanister = async () => {
    try {
        const targetPrincipal = Principal.fromText("lpa4d-iqaaa-aaaah-aq7ja-cai");
        const canisterNumber = await numberOfCanisters();
        const NeededCycles = 2_000_000_000_000n * BigInt(canisterNumber);
        const TransferPrincipal: Principal = Principal.fromUint8Array(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x02, 0x10, 0x00, 0x02, 0x01, 0x01]));
        const identityConfigPath: string = path.join(os.homedir(), '.config', 'dfx', 'identity.json');
        const identityConfig = JSON.parse(await fs.readFile(identityConfigPath, 'utf8'));
        const identityName: string = identityConfig.default;
        const pemPath: string = path.join(os.homedir(), '.config', 'dfx', 'identity', identityName, 'identity.pem');
        const privateKeyPem: string = await fs.readFile(pemPath, 'utf8');
        const identity: Secp256k1KeyIdentity = Secp256k1KeyIdentity.fromPem(privateKeyPem);
        const host = "https://ic0.app";
        let agent = new HttpAgent({ identity, host });
        const transferCyclesActor = Actor.createActor(idlFactory, { agent, canisterId: TransferPrincipal });

        try {
            const result: any = await transferCyclesActor.withdraw({
                to: targetPrincipal,
                from_subaccount: [],
                created_at_time: [],
                amount: NeededCycles,
            });
            if (result.Ok) {
                console.log("Transfer result:", result);
            }
        } catch (error) {
            console.log(error)
        }

    } catch (err) {
        console.error("Error creating actor:", err);
    }
}

export const isAlreadyDeployed = async (): Promise<boolean> => {
    const dfxFilePath = path.resolve(process.cwd(), "canisterid.json");
    try {
        await fs.access(dfxFilePath);
    } catch {
        return false;
    }
    try {
        const data = await fs.readFile(dfxFilePath, "utf-8");
        const dfxConfig = JSON.parse(data);
        if (Object.keys(dfxConfig).length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error reading or parsing canisterid.json:", error);
        return false;
    }
};

export const checkAndCutUserCycles = async () => {
    try {
        const userCycleBalance = await checkUserCycleBalance();
        const canisterNumber = await numberOfCanisters();
        const NeededCycles = 2_000_000_000_000n * BigInt(canisterNumber);
        if (!userCycleBalance || userCycleBalance < NeededCycles) {
            const trillion = 1_000_000_000_000n;
            const formattedResult = (Number(NeededCycles) / Number(trillion)).toFixed(3);
            console.error("❌ You don't have", formattedResult, "trillion cycles");
            return;
        } else {
            await createAndInstallCanisters();
        }
    } catch (error) {
        console.error("❌ Error in checkAndCutUserCycles:", error);
    }
};

export const setCanisterId = async (
    newCanisterIdValue: Principal,
    projectName: string
) => {
    const indexFilePath = path.resolve(process.cwd(), `src/declarations/${projectName}/index.js`);
    await fs.mkdir(path.dirname(indexFilePath), { recursive: true });
    let fileContent = "";
    try {
        fileContent = await fs.readFile(indexFilePath, "utf8");
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
    if (fileContent && fileContent.match(/const\s+canisterId\s*=\s*["'`].*?["'`];/)) {
        fileContent = fileContent.replace(
            /const\s+canisterId\s*=\s*["'`].*?["'`];/,
            `const canisterId = "${newCanisterIdValue}";`
        );
    } else {
        try {
            const indexFilePath = path.resolve(__dirname, "../../src/res/index.js");
            const projectAgentFilePath =
                path.resolve(__dirname, "../../src/res/agent_backend.did.js");
            const projectAgentFileContent = await fs.readFile(projectAgentFilePath, 'utf-8');

            const indexFileContent = await fs.readFile(indexFilePath, 'utf8');
            const declarationsDir = path.resolve(process.cwd(), `src/declarations/${projectName}`);
            await fs.mkdir(declarationsDir, { recursive: true });
            const destFilePath = path.join(declarationsDir, 'index.js');
            await fs.writeFile(destFilePath, indexFileContent, 'utf8');
            await fs.writeFile(path.join(declarationsDir, `${projectName}.did.js`), projectAgentFileContent);
            fileContent = await fs.readFile(destFilePath, 'utf8');
            const replacementText = `${projectName}`;
            fileContent = fileContent
                .replace(/project_backend/g, replacementText)
                .replace(/PROJECT_BACKEND/g, replacementText.toUpperCase())
                .replace(/agent_backend/g, replacementText);
            fileContent = fileContent.replace(
                /const\s+canisterId\s*=\s*["'`].*?["'`];/,
                `const canisterId = "${newCanisterIdValue}";`
            );
            await fs.writeFile(destFilePath, fileContent, 'utf8');
            const packageProjectName = projectName.replace(/backend/gi, 'frontend');
            const packageFilePath = path.resolve("src", packageProjectName, "package.json");
            const packageFileContent = await fs.readFile(packageFilePath, 'utf8');
            const packageJson = JSON.parse(packageFileContent);
            if (packageJson.scripts && packageJson.scripts.prebuild) {
                delete packageJson.scripts.prebuild;
            }
            const updatedContent = JSON.stringify(packageJson, null, 2);
            await fs.writeFile(packageFilePath, updatedContent, 'utf8');
        } catch (error) {
            console.error("Error updating declarations file:", error);
        }
    }

    await fs.writeFile(indexFilePath, fileContent, "utf8");
};
