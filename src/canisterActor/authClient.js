const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require("./idlFactory.js");
const { Secp256k1KeyIdentity } = require('@dfinity/identity-secp256k1');



export const createCanisterActor = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const canisterId = "lpa4d-iqaaa-aaaah-aq7ja-cai";
    try {
        const agent = new HttpAgent({ identity, host : "https://icp0.io"});
        return Actor.createActor(idlFactory, { agent, canisterId });
    } catch (err) {
        console.error("Error creating DAO actor:", err);
    }
};