import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { Principal } from "@dfinity/principal";
import { checkCyclesBalance } from "./checkCycleBalance";


export const checkUserCycleBalance = async (PrincipalId: string) => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const faucetPrincipal: Principal =
        Principal.fromUint8Array(
            new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x02, 0x10, 0x00, 0x02, 0x01, 0x01]));
    try {
        const userPrincipalId: Principal = Principal.fromText(PrincipalId);
        const result = await checkCyclesBalance(userPrincipalId, faucetPrincipal, identity);
        
        const trillion = 1_000_000_000_000n;

        const formattedResult = `${(Number(result) / Number(trillion)).toFixed(3)} TC`;
        console.log(formattedResult, "TC (trillion cycles).");

    } catch (error) {
        console.error('Failed to redeem coupon : ', error);
    }
}