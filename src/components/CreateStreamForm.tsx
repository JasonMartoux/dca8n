import { chain } from "@/app/chain";
import { client } from "@/app/client";
import {
  DEFAULT_EXAMPLE_USER_ADDRESS,
  macroForwarderContract,
  sb712MacroContract,
  sbMacroContract,
  torexContract,
} from "@/constants/contracts";
import { useEffect, useState, useCallback } from "react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
  stringToBytes,
  toEther,
  toHex,
  toTokens,
  toUnits,
  toWei,
  ZERO_ADDRESS,
} from "thirdweb";
import { approve, balanceOf } from "thirdweb/extensions/erc20";
import {
  ConnectButton,
  TokenIcon,
  TokenName,
  TokenProvider,
  TokenSymbol,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { maxUint256 } from "thirdweb/utils";

export const CreateStreamForm = () => {
  const account = useActiveAccount();
  const { data: pairedxTokens } = useReadContract({
    contract: torexContract,
    method: "getPairedTokens",
  });
  const [pairedUnderlyingTokens, setPairedUnderlyingTokens] = useState<
    string[]
  >([]);
  const [isTokensLoaded, setIsTokensLoaded] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [flowRateInput, setFlowRateInput] = useState<string>("0");
  const [upgradeAmountInput, setUpgradeAmountInput] = useState<string>("0");
  const [underlyingTokenInBalance, setUnderlyingTokenInBalance] = useState<bigint>(0n);
  const [superTokenInBalance, setSuperTokenInBalance] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);

  const fetchUnderlyingToken = async () => {
    const [superTokenAddress, ] = await readContract({
      contract: torexContract,
      method: "getPairedTokens",
      params: [],
    });

    return
      //fetchBalanceAndAllowance(account?.address, underlyingTokenIn);


  };

  useEffect(() => {
    if (account) {
      fetchUnderlyingToken();
    }
  });
  const bytes =
    "0x656e000000000000000000000000000000000000000000000000000000000000";

  //console.log("bytes:", bytes);
  const fetchBalanceAndAllowance = async (
    accountAddress: string,
    tokenAddress: string
  ) => {
    if (!account) {
      console.error(
        "Error fetching balance and allowance address:",
        "No account connected"
      );
      return;
    }
    try {
      const tokenContract = getContract({
        client,
        chain,
        address: tokenAddress,
      });
      const balanceToken = await balanceOf({
        contract: tokenContract,
        address: accountAddress,
      });

      const allowance = await readContract({
        contract: tokenContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [accountAddress, macroForwarderContract.address],
      });

      console.log("Current Balance:", toTokens(balanceToken, 6));
      console.log("Current Allowance:", toTokens(allowance, 6));
      setUnderlyingTokenInBalance(toWei(balanceToken.toString()));
      setAllowance(allowance);
    } catch (error) {
      console.log(error);
      console.error("Error fetching balance and allowance:", error);
    }
  };

  const approveToken = async (upgradeAmountBN: bigint) => {
    if (pairedUnderlyingTokens && pairedxTokens && account) {
      const superTokenIn = getContract({
        client,
        chain,
        address: pairedUnderlyingTokens?.[0],
      });

      const tx = prepareContractCall({
        contract: superTokenIn,
        method:
          "function approve(address spender, uint256 amount) external returns (bool)",
        params: [pairedxTokens[0], upgradeAmountBN],
      });
      try {
        const receipt = await sendAndConfirmTransaction({
          transaction: tx,
          account,
        });

        setStatus("Approval of tokens completed");
      } catch (error) {
        setStatus("Error approving token. Please try again.");
        console.error("Error approving token:", error);
        alert("Error approving token. Please try again.");
      }
    }
  };

  /**
   * Handles the submission of the form.
   * @param e The form event.
   *
   * Checks if the wallet is connected and if the user has enough allowance.
   * If not enough allowance, it will approve the allowance and wait for the transaction to be mined.
   * Then it will create a new stream with the `macroForwarder` contract.
   * If the transaction is successful, it will set the status to 'DCA position started successfully!'.
   * If an error occurs, it will set the status to 'Error: <error message>'.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const torexAddress = torexContract.address.toLowerCase();
      if (!torexAddress) {
        alert("Please enter a Torex address");
        return;
      }

      const flowratePerMonth = parseFloat(flowRateInput);
      const distributor = DEFAULT_EXAMPLE_USER_ADDRESS;
      const referrer = ZERO_ADDRESS;
      let upgradeAmount = upgradeAmountInput;

      // Convert flowrate from tokens/month to wei/second
      const tokensPerSecond = flowratePerMonth / (30 * 24 * 60 * 60);
      const weiPerSecond = tokensPerSecond.toFixed(18);
      const flowrate = toWei(weiPerSecond);
      console.log("flowrate:", flowrate.toString(), weiPerSecond);
      //return;
      // Handle upgrade amount
      let upgradeAmountBN: bigint;

      upgradeAmountBN = toUnits(upgradeAmount, 6);

      console.log("upgradeAmountBN:", upgradeAmountBN);
      console.log("underlyingTokenInBalance:", underlyingTokenInBalance);
      console.log(upgradeAmountBN > underlyingTokenInBalance);
      //return;

      if (upgradeAmountBN > underlyingTokenInBalance) {
        alert("Upgrade amount exceeds balance");
        return;
      }

      // if (upgradeAmountBN > allowance) {
      //   alert("Upgrade amount exceeds allowance");
      //   return;
      // }
      //1902587519025
      //1929012345679
      //3086419753086n

      //if (upgradeAmountBN > superTokenInBalance) {
        await approveToken(upgradeAmountBN);
     // }

      console.log("upgradeAmountWei:", upgradeAmountBN);
      console.log("superTokenInBalance:", superTokenInBalance);

      // Contract interactions
      const params = await readContract({
        contract: sbMacroContract,
        method:
          "function getParams(address torexAddr, int96 flowRate, address distributor, address referrer, uint256 upgradeAmount) public pure returns (bytes memory)",
        params: [
          torexContract.address.toLocaleLowerCase(),
          flowrate,
          distributor,
          referrer,
          //superTokenInBalance > upgradeAmountBN ? upgradeAmountBN : BigInt(0),
          upgradeAmountBN
        ],
      });
      console.log("params:",[
          torexContract.address.toLocaleLowerCase(),
          flowrate,
          distributor,
          referrer,
          //superTokenInBalance > upgradeAmountBN ? upgradeAmountBN : BigInt(0),
          toWei(upgradeAmount)
        ],);
      console.log("paramsEncoded:", params);

      const tx = prepareContractCall({
        contract: macroForwarderContract,
        method:
          "function runMacro(address macro, bytes memory params) external",
        params: [sbMacroContract.address, params],
        //params: [sbMacroContract.address, '0x000000000000000000000000a8e5f011f72088e3113e2f4f8c3fb119fc2e226c00000000000000000000000000000000000000000000000000000435eb6df4be0000000000000000000000002c9139d5ec9206bd779a71ecdb927c8cd42e963900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
      });

      await sendAndConfirmTransaction({
        transaction: tx,
        account,
      });

      setStatus("DCA position started successfully!");
      setStatus("Success");
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus("Transaction failed: " + error?.message);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-4">🔄 Nouveau stream DCA</h2>
      <div className="flex w-full">
        <div className="card bg-primary-300 border border-info rounded-box grid h-20 flex-grow place-items-center">
          <TokenProvider
            address={pairedUnderlyingTokens?.[0]}
            chain={chain}
            client={client}
          >
            <div className="flex items-center gap-2">
              <TokenIcon className="w-4 h-4" />
              <TokenName /> (<TokenSymbol />) <TokenIcon />
            </div>
          </TokenProvider>
        </div>
        <div className="divider divider-horizontal">In to</div>
        <div className="card bg-primary-300  border border-success rounded-box grid h-20 flex-grow place-items-center">
          <TokenProvider
            address={pairedUnderlyingTokens?.[1]}
            chain={chain}
            client={client}
          >
            <div className="flex items-center gap-2">
              <TokenIcon className="w-4 h-4" />
              <TokenName /> (<TokenSymbol />) <TokenIcon />
            </div>
          </TokenProvider>
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Monthly flow rate</span>
          </label>
          <input
            type="number"
            placeholder="0"
            id="flowRateInput"
            value={flowRateInput}
            onChange={(e) => setFlowRateInput(e.target.value)}
            className="input input-bordered"
            step={1}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Amount to allocate</span>
            <span className="badge badge-info">
              {pairedxTokens ? (
                <TokenProvider
                  address={pairedxTokens[0]}
                  chain={chain}
                  client={client}
                >
                  <div className="flex items-center gap-2">
                    <TokenIcon className="w-4 h-4" />
                    Current Allocated Amount:
                    {toTokens(superTokenInBalance, 18)}
                    <TokenSymbol />
                  </div>
                </TokenProvider>
              ) : (
                ""
              )}
            </span>
          </label>
          <input
            type="number"
            placeholder="0"
            id="upgradeAmountInput"
            value={upgradeAmountInput}
            onChange={(e) => setUpgradeAmountInput(e.target.value)}
            className="input input-bordered"
            step={0.01}
          />
        </div>
        {account ? (
          <button
            type="submit"
            disabled={!isTokensLoaded || status === "loading"}
            className="btn btn-primary w-full mt-4"
          >
            {status === "loading" ? "Processing..." : "Create Stream"}
          </button>
        ) : (
          <ConnectButton client={client} chain={chain} />
        )}
      </form>
      {status && (
        <div className="mt-4 text-sm text-gray-500">
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
};
