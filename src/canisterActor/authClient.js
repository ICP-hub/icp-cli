import { Principal } from '@dfinity/principal';
const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require("./idlFactory.js");
const { Secp256k1KeyIdentity } = require('@dfinity/identity-secp256k1');



export const createCanisterActor = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const canisterId= Principal.fromText("br5f7-7uaaa-aaaaa-qaaca-cai");
    const host =  "http://127.0.0.1:4943";
    // const host = "https://ic0.app";
    try {
        let agent = new HttpAgent({ identity, host});
        await agent.fetchRootKey();

        return Actor.createActor(idlFactory, { agent, canisterId });
    } catch (err) {
        console.error("Error creating actor:", err);
    }
};