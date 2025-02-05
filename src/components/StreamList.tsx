import type { Stream } from '@/types';

export const StreamList = ({ className }: { className?: string }) => {
  const streams: Stream[] = [
    {
      id: '1',
      inToken: 'DAI',
      outToken: 'ETH',
      flowRate: '0.5',
      status: 'actif',
      startDate: '2024-02-01'
    },
    {
      id: '2',
      inToken: 'USDC',
      outToken: 'WBTC',
      flowRate: '0.02',
      status: 'paused',
      startDate: '2024-01-15'
    },
    {
      id: '3',
      inToken: 'MATIC',
      outToken: 'USDC',
      flowRate: '10',
      status: 'completed',
      startDate: '2023-12-20'
    },
    {
      id: '4',
      inToken: 'ETH',
      outToken: 'DAI',
      flowRate: '0.1',
      status: 'actif',
      startDate: '2024-02-03'
    },
    {
      id: '5',
      inToken: 'WBTC',
      outToken: 'MATIC',
      flowRate: '0.005',
      status: 'error',
      startDate: '2024-01-30'
    }
  ];

  return (
    <div className={`card bg-base-200 shadow-xl p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">📊 Streams actifs</h2>
      
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
                  <div className={`badge ${{
                    actif: 'badge-success',
                    paused: 'badge-warning',
                    completed: 'badge-info',
                    error: 'badge-error'
                  }[stream.status]}`}>
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
