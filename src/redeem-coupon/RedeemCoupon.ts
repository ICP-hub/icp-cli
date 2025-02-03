import { Principal } from "@dfinity/principal";
import { HttpAgent, toHex } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";

export async function redeemFaucetCoupon(
  couponCode: string,
  toSubaccount: Uint8Array | null,
  canisterId: Principal,
  identity: any
) {
  try {
    const agent = new HttpAgent({ identity });

    const args = IDL.encode(
      [
        IDL.Text,
        IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        }),
      ],
      [
        couponCode,
        {
          owner: identity.getPrincipal(),
          subaccount: toSubaccount ? [Array.from(toSubaccount)] : [],
        },
      ]
    );

    const response : any = await agent.call(canisterId, {
      methodName: "redeem_to_cycles_ledger",
      arg: new Uint8Array(args),
    });

    console.log("Faucet Actor Response:", response);
    return response;
  } catch (error) {
    console.error("Error redeeming coupon:", error);
    throw error;
  }
}
