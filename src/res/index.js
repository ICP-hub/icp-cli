import icblast from "@infu/icblast";

export const project_backend = async () => {
  let ic = icblast({ ic: true });
  const canisterId = "";
  let backendActor = await ic(canisterId);
  return backendActor;
};