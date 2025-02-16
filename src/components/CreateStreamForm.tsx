import { chain } from "@/app/chain";
import { client } from "@/app/client";
import {
  DEFAULT_EXAMPLE_USER_ADDRESS,
  macroForwarderContract,
  SB_MACRO_ADDRESS,
  sbMacroContract,
  superTokenABI,
  torexContract,
  USDC_TOKEN_ADDRESS,
} from "@/constants/contracts";
import { useEffect, useState, useCallback } from "react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
  sendTransaction,
  toEther,
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
import { Account } from "thirdweb/wallets";

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
  const [maxBalance, setMaxBalance] = useState<bigint>();
  const [allowance, setAllowance] = useState<bigint>();

  const fetchUnderlyingToken = useCallback(async () => {
    if (pairedxTokens?.[0] && pairedxTokens?.[1]) {
      const superTokenIn = getContract({
        client,
        chain,
        address: pairedxTokens[0],
      });

      const superTokenOut = getContract({
        client,
        chain,
        address: pairedxTokens[1],
      });
      const underlyingTokenIn = await readContract({
        contract: superTokenIn,
        method: superTokenABI,
        params: [],
      });
      const underlyingTokenOut = await readContract({
        contract: superTokenOut,
        method: superTokenABI,
        params: [],
      });

      setPairedUnderlyingTokens([underlyingTokenIn, underlyingTokenOut]);
      setIsTokensLoaded(true);
      fetchBalanceAndAllowance(account, underlyingTokenIn);
    }
  }, [pairedxTokens, account]);

  useEffect(() => {
    if (account) {
      fetchUnderlyingToken();
    }
  }, [account, fetchUnderlyingToken]);

  const fetchBalanceAndAllowance = async (
    account: Account | undefined,
    tokenAddress: string
  ) => {
    if (!account) {
      console.error(
        "Error fetching balance and allowance:",
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
        address: account.address,
      });

      const allowance = await readContract({
        contract: tokenContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address as string, macroForwarderContract.address],
      });

      console.log("Current Balance:", toTokens(balanceToken, 6));
      console.log("Current Allowance:", toTokens(allowance, 6));
      setMaxBalance(balanceToken);
      setAllowance(allowance);
    } catch (error) {
      console.log(error);
      console.error("Error fetching balance and allowance:", error);
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
    setStatus("Processing...");

    try {
      if (!account) {
        throw new Error("No wallet found");
      }
      console.log("input upgradeAmount:", upgradeAmountInput);
      const upgradeAmountBN = toUnits(upgradeAmountInput, 6); // Returns bigint

      console.log("upgradeAmountBN:", upgradeAmountBN);
      console.log("Allowance:", allowance);

      if (!allowance) {
        setStatus("error");
        throw new Error("Allowance data not loaded");
      }

      if (pairedUnderlyingTokens.length < 2) {
        setStatus("error");
        throw new Error("Missing token pair configuration");
      }

      // Check allowance
      if (allowance !== null && upgradeAmountBN > allowance) {
        const inTokenContract = getContract({
          client,
          chain,
          address: pairedUnderlyingTokens[0],
        });

        const tx = await prepareContractCall({
          contract: inTokenContract,
          method:
            "function approve(address spender, uint256 amount) external returns (bool)",
          params: [macroForwarderContract.address, upgradeAmountBN],
        });

        const receipt = await sendAndConfirmTransaction({
          transaction: tx,
          account,
        });
        setStatus("Approval successful. Starting DCA position.");
        console.log("Approval successful. Starting DCA position.", receipt);
        //if (underlyingTokenAddress !== ZERO_ADDRESS) {
        //const erc20 = new ethers.Contract(underlyingTokenAddress, erc20ABI, signer);
        //const approveTx = await erc20.approve(inTokenAddress, upgradeAmountBN);
        //await approveTx.wait();
        //}
      }

      // Convert monthly flow rate to wei per second using thirdweb
      const monthlyFlowRate = parseFloat(flowRateInput);
      const secondsInMonth = 30 * 24 * 60 * 60;
      const flowRatePerSecond = monthlyFlowRate / secondsInMonth;
      console.log("Flow rate per second:", flowRatePerSecond);
      // Convert to smallest units with 6 decimals (USDC)
      //const flowRateBN = flowRatePerSecond.toFixed(6); // 6 decimals for USDC
      // const flowRateBN = parseEther(flowRatePerSecond.toFixed(18));
      // console.log("Flow rate in wei:", flowRateBN);
      const flowRateBN = toWei(flowRatePerSecond.toFixed(18));

      console.log("Allocated amount in wei:", upgradeAmountBN);

      console.log(flowRateBN, upgradeAmountBN);
      const params = await readContract({
        contract: sbMacroContract,
        method:
          "function getParams(address torexAddr, int96 flowRate, address distributor, address referrer, uint256 upgradeAmount) public pure returns (bytes memory)",
        params: [
          torexContract.address,
          flowRateBN,
          DEFAULT_EXAMPLE_USER_ADDRESS,
          ZERO_ADDRESS,
          upgradeAmountBN,
        ],
      });
      console.log("Generated params:", params);

      console.log("Submitting runMacro transaction...");
      const tx = await prepareContractCall({
        contract: macroForwarderContract,
        method:
          "function runMacro(address macro, bytes memory params) external",
        params: [sbMacroContract.address, params],
      });

      await sendAndConfirmTransaction({
        transaction: tx,
        account,
      });

      setStatus("DCA position started successfully!");
      setStatus("Success");
    } catch (error: any) {
      setStatus("Error: " + error?.message);
      console.error(error);
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
            <span className="label-text">Allocation par mois</span>
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
          /mois
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Montant total a allouer</span>
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
