export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Principal, 'Err' : IDL.Text });
  return IDL.Service({ 'redeem_to_cycles_ledger' : IDL.Func([], [Result], []) });
};
export const init = ({ IDL }) => { return []; };
