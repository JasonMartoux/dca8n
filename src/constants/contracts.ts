import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";

export const MACRO_FORWARDER_ADDRESS =
  "0xfD01285b9435bc45C243E5e7F978E288B2912de6";
export const SB_MACRO_ADDRESS = "0xE581E09a9c2a9188c3E6F0fAb5a0b3EC88cA39aE";
export const SB712_MACRO_ADDRESS = "0x353890b5ec7e97a514f749e2d5778d901e4d9c5f";
export const TOREX_USDC_cBTCx_ADDRESS =
  "0xA8E5F011F72088E3113E2f4F8C3FB119Fc2E226C";
export const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const CFA_FORWARDER_ADDRESS =
  "0xcfA132E353cB4E398080B9700609bb008eceB125";
export const GDA_FORWARDER_ADDRESS =
  "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";
export const DEFAULT_EXAMPLE_USER_ADDRESS =
  "0x2C9139D5eC9206Bd779A71ecdB927C8cD42E9639";

export const torexAbi = [
  "function getPairedTokens() view returns (address, address)",
];
export const superTokenABI = [
  "function getUnderlyingToken() external view returns (address)",
  "function transferFrom(address from, address to, uint value)",
  "function balanceOf(address owner) view returns (uint balance)",
  "function upgrade(uint256 amount) external",
];

export const macroForwarderContract = getContract({
  client: client,
  chain: base,
  address: MACRO_FORWARDER_ADDRESS,
});

export const sbMacroContract = getContract({
  client: client,
  chain: base,
  address: SB_MACRO_ADDRESS.toLocaleLowerCase(),
});

export const sb712MacroContract = getContract({
  client: client,
  chain: base,
  address: SB712_MACRO_ADDRESS.toLocaleLowerCase(),
});

export const cfaForwarderContract = getContract({
  client: client,
  chain: base,
  address: CFA_FORWARDER_ADDRESS,
});

export const gdaForwarderContract = getContract({
  client: client,
  chain: base,
  address: GDA_FORWARDER_ADDRESS,
});
// "message": "Set your DCA position to 10 USDCx/month",
// "torex": "0xa8e5f011f72088e3113e2f4f8c3fb119fc2e226c",
// "flowRate": "3805175038051",
// "distributor": "0x8ef73f36d9e176a36622c15aa85e2564123e8171",
// "referrer": "0x0000000000000000000000000000000000000000",
// "upgradeAmount": "4985203000000000000"
// }
export const torexContract = getContract({
  client: client,
  chain: base,
  address: TOREX_USDC_cBTCx_ADDRESS,
  abi: [
    {
      type: "function",
      name: "getPairedTokens",
      inputs: [],
      outputs: [
        {
          type: "address",
          name: "inToken",
        },
        {
          type: "address",
          name: "outToken",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "outTokenDistributionPool",
      inputs: [],
      outputs: [
        {
          type: "address",
          name: "_outTokenDistributionPool",
        },
      ],
      stateMutability: "view",
    },
  ],
});
