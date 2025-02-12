import { generateKeyPairSync } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const createUserIdentity = async (identityName: string) => {
    try {
      console.log(`Creating identity: ${identityName}`);
  
      const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
      const privateKeyPEM = privateKey.export({ format: 'pem', type: 'sec1' });
      const dfxIdentityPath = path.join(os.homedir(), '.config', 'dfx', 'identity', identityName);
      await fs.mkdir(dfxIdentityPath, { recursive: true });
      const pemPath = path.join(dfxIdentityPath, 'identity.pem');
      const jsonPath = path.join(dfxIdentityPath, 'identity.json');
      await fs.writeFile(pemPath, privateKeyPEM, { mode: 0o600 });
      const identityJsonContent = JSON.stringify(
        {
          hsm: null,
          encryption: null,
          keyring_identity_suffix: identityName,
        },
        null,
        2
      );
      await fs.writeFile(jsonPath, identityJsonContent, { mode: 0o600 });
    } catch (error) {
      console.error('❌ Error creating identity:', error);
    }
  };
