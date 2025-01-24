import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { redeemFaucetCoupon } from "./RedeemCoupon";


export const faucerCoupon = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase("earth input twelve fog improve voyage life ill atom turkey inside one loop digital valley miracle torch hedgehog oak time glove liberty fabric orange");
    const couponCode = '9EC33-9FFBF-9A4CA';
    const toSubaccount = identity?.getPrincipal();
    const faucetPrincipal: any = identity?.getPrincipal();

    try {
        const result = await redeemFaucetCoupon(couponCode, toSubaccount, faucetPrincipal, identity);
        console.log('Redeem Result:', result);
    } catch (error) {
        console.error('Failed to redeem coupon : ', error);
    }
}