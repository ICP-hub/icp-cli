import { Principal } from "@dfinity/principal";
import { Actor, HttpAgent, toHex } from "@dfinity/agent";
import { idlFactory } from "./idlFactory";

export async function redeemFaucetCoupon(
  couponId: string,
  toSubaccount: Principal,
  canisterId: Principal,
  identity: any
) {
  try {
    const agent = new HttpAgent({ identity });
    const CouponActor = Actor.createActor(idlFactory, { agent, canisterId });
    const result = await CouponActor?.redeem_to_cycles_ledger(couponId,
      {
        owner: toSubaccount,
        subaccount: []
      });
      return result; 
  } catch (error) {
    console.error("Error redeeming coupon:", error);
    throw error;
  }
}
