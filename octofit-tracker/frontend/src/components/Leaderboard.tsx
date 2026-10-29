import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => setState({ status: 'loaded', leaderboard }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load leaderboard.</p>}
        {state.status === 'loaded' && state.leaderboard.length === 0 && <p>No leaderboard results yet.</p>}
        {state.status === 'loaded' && state.leaderboard.length > 0 && (
          <ol>
            {state.leaderboard.map((entry) => (
              <li key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
