import { chain } from "@/app/chain";
import { client } from "@/app/client";
import { torexContract } from "@/constants/contracts";
import type { Stream } from "@/types";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { getCurrencyMetadata } from "thirdweb/extensions/erc20";
import {
  TokenIcon,
  TokenName,
  TokenProvider,
  TokenSymbol,
  useReadContract,
} from "thirdweb/react";

export const StreamList = ({ className }: { className?: string }) => {
  //   const { data: outTokenDistributionPool } = useReadContract({
  //     contract: torexContract,
  //     method: "function outTokenDistributionPool() view returns (address _outTokenDistributionPool)",
  //     params: []
  // });

  //const { data: outTokenDistributionPool, isLoading } = useReadContract('outTokenDistributionPool', { contract: torexContract });
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

  console.log(
    "loading outTokenDistributionPool:",
    isLoadingOutTokenDistributionPool
  );
  console.log("loading pairedTokens:", isLoadingPairedTokens);
  console.log("outTokenDistributionPool:", outTokenDistributionPool);
  console.log("pairedTokens:", pairedTokens);

  // const inTokenXContract = getContract({
  //   client,
  //   chain,
  //   address: pairedTokens[0],
  // });
  // const outTokenXContract = getContract({
  //   client,
  //   chain,
  //   address: pairedTokens[1],
  // });

  //  const inTokenXMetadata = await getCurrencyMetadata({ contract: inTokenXContract });
  //  const outTokenXMetadata = await getCurrencyMetadata({ contract: outTokenXContract });

  const streams: Stream[] = [
    {
      id: "1",
      inToken: pairedTokens[0],
      outToken: pairedTokens[1],
      flowRate: "0.5",
      status: "actif",
      startDate: "2024-02-01",
    },
    // {
    //   id: '2',
    //   inToken: 'USDC',
    //   outToken: 'WBTC',
    //   flowRate: '0.02',
    //   status: 'paused',
    //   startDate: '2024-01-15'
    // },
    // {
    //   id: '3',
    //   inToken: 'MATIC',
    //   outToken: 'USDC',
    //   flowRate: '10',
    //   status: 'completed',
    //   startDate: '2023-12-20'
    // },
    // {
    //   id: '4',
    //   inToken: 'ETH',
    //   outToken: 'DAI',
    //   flowRate: '0.1',
    //   status: 'actif',
    //   startDate: '2024-02-03'
    // },
    // {
    //   id: '5',
    //   inToken: 'WBTC',
    //   outToken: 'MATIC',
    //   flowRate: '0.005',
    //   status: 'error',
    //   startDate: '2024-01-30'
    // }
  ];

  return (
    <div className={`card bg-base-200 shadow-xl p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">
        📊 Streams actifs {outTokenDistributionPool} {pairedTokens?.[0]} -{" "}
        {pairedTokens?.[1]}
      </h2>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Flux/h</th>
              <th>Début</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {streams.map((stream) => (
              <tr key={stream.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{stream.inToken}</span>
                    <span>→</span>
                    <span className="font-bold">{stream.outToken}</span>
                  </div>
                </td>
                <td>{stream.flowRate}</td>
                <td>{stream.startDate}</td>
                <td>
                  <div
                    className={`badge ${
                      {
                        actif: "badge-success",
                        paused: "badge-warning",
                        completed: "badge-info",
                        error: "badge-error",
                      }[stream.status]
                    }`}
                  >
                    {stream.status}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-xs btn-ghost">✏️</button>
                    <button className="btn btn-xs btn-ghost">⏸️</button>
                    <button className="btn btn-xs btn-error">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
