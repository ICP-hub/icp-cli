import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { redeemFaucetCoupon } from "./RedeemCoupon";
import { Principal } from "@dfinity/principal";


export const faucerCoupon = async (toPrincipalId: string, couponId: string) => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const faucetPrincipal: Principal = Principal.fromUint8Array(new Uint8Array([0, 0, 0, 0, 1, 112, 0, 196, 1, 1]));
    try {
        const toSubaccount = Principal.fromText(toPrincipalId);
        const result = await redeemFaucetCoupon(couponId,toSubaccount,faucetPrincipal, identity);
        console.log("result : ",result);
    } catch (error: any) {
        if (error?.props) {
            console.log("Error redeem coupon : ",error?.props);
        }else{
            console.log(error);
        }
    }
}