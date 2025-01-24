import { idlFactory } from "./idlFactory";
const { Actor, HttpAgent } = require('@dfinity/agent');


export async function redeemFaucetCoupon(couponCode: any, toSubaccount: any, faucetPrincipal: any, identity : any) {
  try {
    const agent = new HttpAgent({ identity });

    const faucetActor = Actor.createActor(idlFactory, {
      agent,
      canisterId: faucetPrincipal,
    });
    console.log("faucetActor : ",faucetActor);

    const response = await faucetActor.redeem_to_cycles_ledger(
      couponCode,
    { owner: identity.getPrincipal(), subaccount : toSubaccount });

    console.log(`Coupon redeemed successfully!`);
    console.log(`Cycles: ${response.cycles}`);

    return response;
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    throw error;
  }
}