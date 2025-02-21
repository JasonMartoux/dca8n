import { defineChain } from "thirdweb";
import { base } from "thirdweb/chains";

// export const chain = defineChain({
//     id: base.id,
//     rpc: "https://virtual.base.rpc.tenderly.co/4cb6d78e-f45b-4ee3-828f-b9dc5eaa0ab5",
//     displayName: base.displayName,
// });

export const chain = defineChain(base);
//  export const chain = defineChain({
//     id: base.id,
//     rpc: "https://virtual.base.rpc.tenderly.co/1b0db10e-a169-4ce4-837d-695c75147f38",
//  });
