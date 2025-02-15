"use client";
import { torexContract } from "@/constants/contracts";
import { toEther, toTokens } from "thirdweb";
import { useReadContract } from "thirdweb/react";
import { usePosition } from "./PositionContext";
import { useEffect, useState } from "react";
import { ChevronsDown, ChevronsUp, Wallet } from "lucide-react";
import FlowingBalance from "./FlowingBalance";

export const StreamList = () => {
  const {
    data: outTokenDistributionPool,
    isLoading: isLoadingOutTokenDistributionPool,
  } = useReadContract({
    contract: torexContract,
    method: "outTokenDistributionPool",
  });

  const { data: pairedTokens, isLoading: isLoadingPairedTokens } =
    useReadContract({
      contract: torexContract,
      method: "getPairedTokens",
    });

  const { positionData, loading, error } = usePosition();

  console.log(
    "loading outTokenDistributionPool:",
    isLoadingOutTokenDistributionPool
  );
  console.log("loading pairedTokens:", isLoadingPairedTokens);
  console.log("outTokenDistributionPool:", outTokenDistributionPool);
  console.log("pairedTokens:", pairedTokens);

  useEffect(() => {
    console.log("loading:", loading);
    console.log("error:", error);
    console.log("positionData:", positionData);
    if (!positionData?.pools) return;

    positionData.pools.forEach((pool) => {
      pool.poolMembers.forEach((member) => {
        const latestOutflow = member.account.outflows
          .filter((outflow) => outflow.currentFlowRate !== "1")
          .sort(
            (a, b) =>
              parseInt(b.createdAtTimestamp) - parseInt(a.createdAtTimestamp)
          )[0];
        console.log("latestOutflow:", latestOutflow);
      });
    });
  }, [loading, error, positionData]);

  const calculateMonthlyFlowRate = (flowRate: string) => {
    const flowRateBN = BigInt(flowRate);
    const secondsInMonth = 30 * 24 * 60 * 60;
    const monthlyFlowRateWei = flowRateBN * BigInt(secondsInMonth);
    return parseFloat(toTokens(monthlyFlowRateWei, 18)).toFixed(4);
  };

  const calculateTotalStreamed = (
    flowRate: string,
    createdTimestamp: string
  ) => {
    const flowRatePerSecond = parseFloat(toTokens(BigInt(flowRate), 18));
    const startTime = parseInt(createdTimestamp);
    const currentTime = Date.now() / 1000; // Use millisecond precision
    const secondsElapsed = currentTime - startTime;
    return (flowRatePerSecond * secondsElapsed).toString();
  };

  return (
    <div className={`card bg-base-200 shadow-xl p-6 `}>
      <h2 className="text-2xl font-bold mb-4">Current automatised positions</h2>

      <div className="overflow-x-auto">
        {positionData && positionData.pools.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {/* <div className="stats shadow">
              <div className="stat place-items-center">
                <div className="stat-title">Current Positions</div>
                <div className="stat-value">{positionData.pools.length}</div>
                <div className="stat-desc">Active automated strategies</div>
              </div>

              <div className="stat place-items-center">
                <div className="stat-title">Active Streams</div>
                <div className="stat-value text-secondary">
                  {positionData.pools.reduce((acc, pool) => {
                    return (
                      acc +
                      pool.poolMembers.reduce((acc, member) => {
                        return (
                          acc +
                          member.account.outflows.filter(
                            (outflow) => outflow.currentFlowRate > "0"
                          ).length
                        );
                      }, 0)
                    );
                  }, 0)}
                </div>
                <div className="stat-desc text-secondary">
                  ↗︎{" "}
                  {positionData.pools.reduce((acc, pool) => {
                    return (
                      acc +
                      pool.poolMembers.reduce((acc, member) => {
                        return (
                          acc +
                          member.account.outflows.filter(
                            (outflow) => outflow.currentFlowRate > "0"
                          ).length
                        );
                      }, 0)
                    );
                  }, 0) -
                    positionData.pools.reduce((acc, pool) => {
                      return (
                        acc +
                        pool.poolMembers.reduce((acc, member) => {
                          return (
                            acc +
                            member.account.outflows.filter(
                              (outflow) => outflow.currentFlowRate > "0"
                            ).length
                          );
                        }, 0)
                      );
                    }, 0)}
                  (%)
                </div>
              </div>

              <div className="stat place-items-center">
                <div className="stat-title">Total Value</div>
                <div className="stat-value">
                  $
                  {positionData.pools
                    .reduce((acc, pool) => {
                      return (
                        acc +
                        pool.poolMembers.reduce((acc, member) => {
                          return (
                            acc +
                            member.account.outflows.reduce((acc, outflow) => {
                              return acc + parseFloat(toEther(outflow.deposit));
                            }, 0)
                          );
                        }, 0)
                      );
                    }, 0)
                    .toFixed(2)}
                </div>
                <div className="stat-desc">
                  ↘︎{" "}
                  {positionData.pools
                    .reduce((acc, pool) => {
                      return (
                        acc +
                        pool.poolMembers.reduce((acc, member) => {
                          return (
                            acc +
                            member.account.outflows.reduce((acc, outflow) => {
                              return acc + parseFloat(toEther(outflow.deposit));
                            }, 0)
                          );
                        }, 0)
                      );
                    }, 0)
                    .toFixed(2)}
                  (%)
                </div>
              </div>
            </div> */}

            {positionData.pools.map((pool, poolIndex) =>
              pool.poolMembers.map((member, memberIndex) => {
                const latestOutflow = member.account.outflows
                  .filter((outflow) => outflow.currentFlowRate !== "1")
                  .sort(
                    (a, b) =>
                      parseInt(b.createdAtTimestamp) -
                      parseInt(a.createdAtTimestamp)
                  )[0];

                if (!latestOutflow) return null; // Skip if no active outflow

                return (
                  <div
                    key={`${poolIndex}-${memberIndex}`}
                    className="bg-base-100 border border-base-300 rounded-box p-4 shadow-sm"
                  >
                    <div className="card-body">
                      <div className="space-y-4">
                        <h3 className=" text-lg font-bold flex items-center">
                          <ChevronsUp className="w-8 h-8 text-info" />
                          <div className="badge badge-info">
                            Automatised streams
                          </div>
                        </h3>
                        {member.account.outflows
                          .filter((outflow) => outflow.currentFlowRate > "0")
                          .map((outflow, outflowIndex) => {
                            const monthlyFlowRate = calculateMonthlyFlowRate(
                              outflow.currentFlowRate
                            );
                            return (
                              <div
                                key={outflowIndex}
                                className=" stats stats-vertical lg:stats-horizontal shadow flex justify-evenly bg-base-100 mb-4"
                              >
                                <div className="stat">
                                  <div className="stat-title">Started</div>
                                  <div className="stat-value">
                                    {new Date(
                                      parseInt(outflow.createdAtTimestamp) *
                                        1000
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="stat-desc">
                                    {new Date(
                                      parseInt(outflow.createdAtTimestamp) *
                                        1000
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="stat">
                                  <div className="stat-title">Flow Rate</div>
                                  <div className="stat-value">
                                    {parseFloat(monthlyFlowRate).toFixed(2)}{" "}
                                    {outflow.token.symbol}
                                  </div>
                                  <div className="stat-desc">per month</div>
                                  {/* <div className="stat-desc">Current: {toEther(outflow.currentFlowRate)}/sec</div> */}
                                </div>

                                <div className="stat">
                                  <div className="stat-title">
                                    Total Streamed
                                  </div>
                                  <div className="stat-value">
                                    <FlowingBalance
                                      startingBalance={BigInt(outflow.deposit)}
                                      startingBalanceDate={
                                        new Date(
                                          parseInt(outflow.createdAtTimestamp) *
                                            1000
                                        )
                                      }
                                      flowRate={BigInt(outflow.currentFlowRate)}
                                      className=""
                                      format={(value) =>
                                        `${parseFloat(value.toFixed(6))} `
                                      }
                                    />
                                  </div>
                                  <div className="stat-desc">
                                    {outflow.token.symbol}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="divider"></div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center">
                          <ChevronsDown className="w-8 h-8 text-success" />
                          <div className="badge badge-success">
                            Incoming Tokens
                          </div>
                        </h3>
                        {member.account.poolMemberships.map(
                          (membership, membershipIndex) => (
                            <div
                              key={`membership-${membershipIndex}`}
                              className="rounded-xl p-4 stats shadow"
                            >
                              <div className="flex justify-between stat place-items-center">
                                <div>
                                  <div className="stat-title">
                                    Accumulated {membership.pool.token.symbol}
                                  </div>
                                  <div className="text-base-content text-xl font-bold mt-1 stat-value">
                                    {parseFloat(
                                      toEther(
                                        membership.pool.perUnitSettledValue
                                      )
                                    ).toFixed(18)}{" "}
                                    {membership.pool.token.symbol}
                                  </div>
                                </div>
                                {/* <div className="text-right">
                                      <p className="text-sm text-neutral-content">Total Claimed</p>
                                      <p className="text-base-content font-medium">
                                        {parseFloat(membership.totalAmountClaimed).toFixed(18)} {membership.pool.token.symbol}
                                      </p>
                                    </div> */}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {(!positionData ||
              positionData.pools.length === 0 ||
              positionData.pools.every(
                (pool) => pool.poolMembers.length === 0
              )) && <p className="text-white">No active positions</p>}
          </div>
        )}
      </div>
    </div>
  );
};
