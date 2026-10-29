import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<TeamState>({ status: 'loading' });

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => setState({ status: 'loaded', teams }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">Unable to load teams.</p>}
        {state.status === 'loaded' && state.teams.length === 0 && <p>No teams yet.</p>}
        {state.status === 'loaded' && state.teams.length > 0 && (
          <ul>
            {state.teams.map((team, index) => (
              <li key={`${team.name}-${index}`}>
                {team.name}{team.mascot ? ` (${team.mascot})` : ''}
                {team.members.length > 0 ? `: ${team.members.join(', ')}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
