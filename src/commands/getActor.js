import { idlFactory as frontendIdlFactory } from "./npmpackage_frontend.did.js";
import { Actor } from "@dfinity/agent";


export default function getActor(agent, canister) {
    const FrontendCanisterActor = Actor.createActor(frontendIdlFactory, {
        agent,
        canisterId: canister,
      });

      return FrontendCanisterActor;
}