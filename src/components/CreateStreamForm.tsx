import { chain } from "@/app/chain";
import { client } from "@/app/client";
import { superTokenABI, torexContract } from "@/constants/contracts";
import { useEffect, useState } from "react";
import { getContract, readContract } from "thirdweb";
import { TokenIcon, TokenName, TokenProvider, TokenSymbol, useActiveAccount, useReadContract } from "thirdweb/react";


export const CreateStreamForm = () => {
  const account = useActiveAccount();
  const { data: pairedxTokens } = useReadContract({
    contract: torexContract,
    method: 'getPairedTokens',
  })
  const [pairedUnderlyingTokens, setPairedUnderlyingTokens] = useState<string[]>();
  const [status, setStatus] = useState<string>('idle');
  const [flowRateInput, setFlowRateInput] = useState<number>(0);
  const [allocatedAmount, setAllocatedAmount] = useState<number>(0);

  console.log(pairedUnderlyingTokens);
  useEffect(() => {
    const fetchUnderlyingToken = async () => {
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
          params: []
        })
        const underlyingTokenOut = await readContract({
          contract: superTokenOut,
          method: superTokenABI,
          params: []
        })
  
        setPairedUnderlyingTokens([underlyingTokenIn, underlyingTokenOut]);
      }
    };

    fetchUnderlyingToken();
  }, [pairedxTokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Processing...');

    try {
      if (!account) {
        setStatus('Error: No account');
        return;
      }
      console.log(allocatedAmount);
      console.log(flowRateInput);

     // const flowRate = (flowRateInput * 10 ** 18);

      setStatus('Success');
    } catch (error) {
      setStatus('Error');
    }
    
  }

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
        <div className="divider  divider-horizontal">In to</div>
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
            placeholder="0.0"
            id="flowRateInput"
            // value={flowRateInput}
            // onChange={(e) => setFlowRateInput(parseFloat(e.target.value))}
            className="input input-bordered"
            step="0.01"
          />
          /mois
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Montant total a allouer</span>
          </label>
          <input
            type="number"
            placeholder="0.0"
            id="allocatedAmount"
            // value={allocatedAmount}
            // onChange={(e) => setAllocatedAmount(parseFloat(e.target.value))}
            className="input input-bordered"
            step="0.01"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full mt-4 gap-2">
          <span>🚀 Lancer le stream</span>
        </button>
      </form>
      {status && (
        <div className="mt-4 text-sm text-gray-500">
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
};
