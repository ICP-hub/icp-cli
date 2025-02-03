import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { redeemFaucetCoupon } from "./RedeemCoupon";
import { Principal } from "@dfinity/principal";


export const faucerCoupon = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const couponCode = '9EC33-9FFBF-9A4CA';
    const toSubaccount : any = identity?.getPrincipal();
    const faucetPrincipal: Principal = Principal.fromUint8Array(new Uint8Array([0, 0, 0, 0, 1, 112, 0, 196, 1, 1]));


    try {
        const result = await redeemFaucetCoupon(couponCode, toSubaccount, faucetPrincipal, identity);
        console.log('Redeem Result:', result);
    } catch (error) {
        console.error('Failed to redeem coupon : ', error);
    }
}