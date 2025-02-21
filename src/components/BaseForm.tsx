"use client";
import {
  DEFAULT_EXAMPLE_USER_ADDRESS,
  macroForwarderContract,
  sbMacroContract,
  torexContract,
} from "@/constants/contracts";
import { FormEvent, useEffect, useState } from "react";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendAndConfirmTransaction,
  ThirdwebContract,
  toTokens,
  toUnits,
  toWei,
  ZERO_ADDRESS,
} from "thirdweb";
import { chain } from "@/app/chain";
import { client } from "@/app/client";
import {
  allowance,
  approve,
  balanceOf,
  decimals,
} from "thirdweb/extensions/erc20";
import { Account } from "thirdweb/wallets";
import {
  TokenIcon,
  TokenName,
  TokenProvider,
  TokenSymbol,
  useReadContract,
} from "thirdweb/react";
import { maxUint256 } from "thirdweb/utils";

interface BaseFormProps {
  account: Account;
}

export const BaseForm = ({ account }: BaseFormProps) => {
  const { data: pairedxTokens } = useReadContract({
    contract: torexContract,
    method: "getPairedTokens",
  });

  const [superTokenInContract, setSuperTokenInContract] =
    useState<ThirdwebContract>();
  const [superTokenInDecimals, setSuperTokenInDecimals] = useState<number>();
  const [superTokenInBalance, setSuperTokenInBalance] = useState<bigint>(0n);
  const [underlyingTokenInContract, setUnderlyingTokenInContract] =
    useState<ThirdwebContract>();
  const [underlyingTokenDecimals, setUnderlyingTokenDecimals] =
    useState<number>();
  const [underlyingTokenBalance, setUnderlyingTokenBalance] =
    useState<bigint>(0n);
  const [underlyingTokenAllowance, setUnderlyingTokenAllowance] =
    useState<bigint>(0n);
  const [allowanceAmount, setAllowanceAmount] = useState<string>("10");
  const [flowRateInput, setFlowRateInput] = useState<number>(10);
  const [upgradeAmountInput, setUpgradeAmountInput] = useState<string>("0");

  useEffect(() => {
    if (pairedxTokens?.length === 2) {
      const superTokenInContract = getContract({
        client,
        chain,
        address: pairedxTokens[0],
      });

      setSuperTokenInContract(superTokenInContract);
      fetchUnderlyingToken(superTokenInContract);
    }
  }, [pairedxTokens]);

  const fetchUnderlyingToken = async (
    superTokenInContract: ThirdwebContract
  ) => {
    if (!superTokenInContract && !account) {
      console.error("superTokenInContract not initialized");
      return;
    }

    const superTokenInDecimals = await decimals({
      contract: superTokenInContract,
    });
    const superTokenInBalance = await balanceOf({
      contract: superTokenInContract,
      address: account?.address as string,
    });

    setSuperTokenInDecimals(superTokenInDecimals);
    setSuperTokenInBalance(superTokenInBalance);

    const underlyingTokenInAddress = await readContract({
      contract: superTokenInContract as ThirdwebContract,
      method: "function getUnderlyingToken() external view returns (address)",
      params: [],
    });

    const underlyingTokenInContract = getContract({
      client,
      chain,
      address: underlyingTokenInAddress,
    });

    const underlyingTokenDecimals = await decimals({
      contract: underlyingTokenInContract,
    });
    const underlyingTokenBalance = await balanceOf({
      contract: underlyingTokenInContract,
      address: account?.address as string,
    });
    const underlyingTokenAllowance = await allowance({
      contract: underlyingTokenInContract,
      owner: account?.address as string,
      spender: superTokenInContract?.address as string,
    });

    setUnderlyingTokenInContract(underlyingTokenInContract);
    setUnderlyingTokenDecimals(underlyingTokenDecimals);
    setUnderlyingTokenBalance(underlyingTokenBalance);
    setUnderlyingTokenAllowance(underlyingTokenAllowance);
  };

  async function approveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!account) {
      console.error("No account connected");
      return;
    }
    if (
      !superTokenInContract ||
      !underlyingTokenInContract ||
      !underlyingTokenDecimals
    ) {
      console.error("Contracts not initialized");
      return;
    }
    console.log("approve", allowanceAmount, underlyingTokenDecimals);
    const amount = toUnits(allowanceAmount, underlyingTokenDecimals).toString();

    try {
      const transaction = approve({
        contract: underlyingTokenInContract,
        spender: superTokenInContract.address,
        amount,
      });

      await sendAndConfirmTransaction({ transaction, account });

      console.log("Approval successful");
    } catch (error) {
      console.error("Error approving token:", error);
      alert("Error approving token. Please try again.");
    }
  }

  function setMaxUpgradeAmount() {
    setUpgradeAmountInput("max");
    console.log(upgradeAmountInput);
  }

  async function handleStartDCA(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Convert flowrate from tokens per month to wei per second
    const tokensPerSecond = flowRateInput / (30 * 24 * 60 * 60);
    const flowrate = toWei(tokensPerSecond.toString());

    // Handle upgrade amount
    const upgradeAmount =
      upgradeAmountInput === "max"
        ? maxUint256
        : toUnits(upgradeAmountInput, underlyingTokenDecimals as number);
    if (
      upgradeAmount >
      toUnits(
        underlyingTokenBalance.toString(),
        underlyingTokenDecimals as number
      )
    ) {
      alert(
        "Upgrade amount exceeds your balance. Please enter a lower amount."
      );
      return;
    }
    if (
      upgradeAmount >
      toUnits(
        underlyingTokenAllowance.toString(),
        underlyingTokenDecimals as number
      )
    ) {
      const transaction = approve({
        contract: underlyingTokenInContract as ThirdwebContract,
        spender: superTokenInContract?.address as string,
        amount: toUnits(
          upgradeAmountInput,
          underlyingTokenDecimals as number
        ).toString() as string,
      });

      await sendAndConfirmTransaction({ transaction, account });
    }

    // Contract interactions
    const params = await readContract({
      contract: sbMacroContract,
      method:
        "function getParams(address torexAddr, int96 flowRate, address distributor, address referrer, uint256 upgradeAmount) public pure returns (bytes memory)",
      params: [
        torexContract.address.toLocaleLowerCase(),
        flowrate,
        DEFAULT_EXAMPLE_USER_ADDRESS,
        ZERO_ADDRESS,
        toWei(upgradeAmountInput),
      ],
    });

    console.log("paramsEncoded:", params);

    const tx = prepareContractCall({
      contract: macroForwarderContract,
      method: "function runMacro(address macro, bytes memory params) external",
      params: [sbMacroContract.address, params],
      //params: [sbMacroContract.address, '0x000000000000000000000000a8e5f011f72088e3113e2f4f8c3fb119fc2e226c00000000000000000000000000000000000000000000000000000435eb6df4be0000000000000000000000002c9139d5ec9206bd779a71ecdb927c8cd42e963900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
    });

    try {
      const receipt = await sendAndConfirmTransaction({
        transaction: tx,
        account,
      });
      console.log("Transaction receipt:", receipt);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  }

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-4">🔄 New DCA Stream</h2>
      <div className="flex w-full">
        <div className="card bg-primary-300 border border-info rounded-box grid h-20 flex-grow place-items-center">
          <TokenProvider
            address={underlyingTokenInContract?.address as string}
            chain={chain}
            client={client}
          >
            <div className="flex items-center gap-2">
              <TokenIcon className="w-4 h-4" />
              <TokenName /> <TokenSymbol /> <TokenIcon />
            </div>
          </TokenProvider>
        </div>
        <div className="divider divider-horizontal">In to</div>
        <div className="card bg-primary-300  border border-success rounded-box grid h-20 flex-grow place-items-center">
          <TokenProvider
            address={pairedxTokens?.[1] as string}
            chain={chain}
            client={client}
          >
            <div className="flex items-center gap-2">
              <TokenIcon className="w-4 h-4" />
              <TokenName /> <TokenSymbol /> <TokenIcon />
            </div>
          </TokenProvider>
        </div>
      </div>
      {torexContract && superTokenInContract && underlyingTokenInContract ? (
        <div>
          {/* {<div id="approvalForm" className="space-y-4 mt-4">
                    <h2>ERC20 Approval for Upgrade to SuperToken</h2>
                    <p id="tokenBalance"></p>
                    <p id="currentAllowance"></p>
                    <form className="space-y-4" onSubmit={approveToken}>
                        <div className="form-group">
                            <label className="label">New Allowance Amount:</label>
                            <input
                                className="input input-bordered"
                                type="number"
                                id="allowanceAmount"
                                name="allowanceAmount"
                                value={allowanceAmount}
                                onChange={(e) => setAllowanceAmount(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-4"
                        >
                            Approve Allowance
                        </button>
                    </form>
                </div>} */}

          <div id="createStreamForm" className="space-y-4 mt-6">
            <form className="space-y-4" onSubmit={handleStartDCA}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Flowrate (tokens per Month):
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  id="flowRateInput"
                  value={flowRateInput}
                  onChange={(e) => setFlowRateInput(Number(e.target.value))}
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
                          Current Allocated Amount:{" "}
                          {toTokens(
                            superTokenInBalance,
                            superTokenInDecimals as number
                          )}
                          <TokenSymbol />
                        </div>
                      </TokenProvider>
                    ) : (
                      ""
                    )}
                  </span>
                  <button
                    className="btn btn-warning mt-4"
                    type="button"
                    onClick={(e) => setMaxUpgradeAmount()}
                  >
                    Max
                  </button>
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

                <button
                  type="submit"
                  // disabled={!isTokensLoaded || status === "loading"}
                  className="btn btn-primary w-full mt-4"
                >
                  {/* {status === "loading" ? "Processing..." : "Create Stream"} */}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
