const { Principal } = require("@dfinity/principal");
const { createServices } = require("@dfinity/ic-management"); // Assuming you have access to this package
const {
  idlFactory,
  certifiedIdlFactory,
} = require("@dfinity/ic-management/dist/candid/ic-management.idl"); // Adjust if needed
const { IcManagementService } = require("@dfinity/ic-management"); // Assuming IcManagementService is imported from the appropriate module
import { transform } from "./utils/transform.utils";
class ICManagementCanister {
  // Constructor accepts the service
  constructor(service) {
    this.service = service;
  }

  // Static method to create an instance of ICManagementCanister
  static create(options) {
    // Create the services using the given options and the IDL factories
    const { service } = createServices({
      options: {
        ...options,
        // Resolve to "aaaaa-aa" on mainnet (placeholder for the canister ID)
        canisterId: Principal.fromHex(""), // Placeholder for the canister ID
        callTransform: transform, // Assuming a transform function is defined
        queryTransform: transform, // Assuming a transform function is defined
      },
      idlFactory,
      certifiedIdlFactory,
    });

    // Return an instance of ICManagementCanister with the service
    return new ICManagementCanister(service);
  }
}

// Example of using the ICManagementCanister class
const options = {
  // Specify options as needed for creating the service
  // Example: network configuration, agent settings, etc.
};

const icManagementCanister = ICManagementCanister.create(options);
console.log(icManagementCanister);
