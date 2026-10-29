import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason: string;
};
type WorkoutState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const [state, setState] = useState<WorkoutState>({ status: 'loading' });

  useEffect(() => {
    getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    )
      .then(({ suggestions }) => setState({ status: 'loaded', suggestions }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
        {state.status === 'loaded' && state.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {state.status === 'loaded' && state.suggestions.length > 0 && (
          <ul>
            {state.suggestions.map((suggestion, index) => (
              <li key={`${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                {suggestion.focus && ` (${suggestion.focus})`}
                {suggestion.minutes && ` - ${suggestion.minutes} minutes`}
                {suggestion.difficulty && `, ${suggestion.difficulty}`}
                <p>{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
