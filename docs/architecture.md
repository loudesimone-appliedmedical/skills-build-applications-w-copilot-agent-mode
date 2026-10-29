# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep API access in the shared frontend client and rendering/state in the React route components. Each capability shows accessible loading, error, and empty states; workout suggestions use the seeded user's email.
- Logic tier decision: Keep HTTP handling in Express routes and business rules in the service layer. Return the documented JSON shapes, validate requests before database operations, and use deliberate 4xx responses for invalid or unknown resources.
- Data tier decision: Define required fields and references in Mongoose models. Give teams an empty members array by default. Keep seed operations idempotent and additive so unrelated existing records are preserved.
- Activity tracking approach: Accept user and team IDs, activity type, and positive minutes; validate ID format and that both records exist. Compute points on the server at one point per minute and set the occurrence timestamp on creation.
- Team management approach: Require a team name, preserve its name and mascot, and expose its member IDs when listing teams. Default omitted members to an empty array.
- Leaderboard approach: Sum activity points by team, sort from highest total to lowest, and assign ranks starting at 1.
- Workout suggestions approach: Find the user by email and use their fitness goal and recent activities to choose matching workouts. Include a human-readable reason; return a 4xx response when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`; model validation failures indicate missing constraints, fields, or defaults, while seed failures indicate missing fixtures, non-idempotent writes, or overwriting unrelated data.
- API command: `npm run test:api --prefix octofit-tracker/backend`; failures indicate incorrect HTTP validation/status codes, response shapes, activity persistence, leaderboard totals/ranks, or workout matching/reasons.
- Frontend command: `npm test --prefix octofit-tracker/frontend`; failures indicate missing API rendering, user-specific workout requests, loading/empty/error states, or accessible announcements.
- Backend build command: `npm run build --prefix octofit-tracker/backend`; failures indicate backend TypeScript compilation or type-contract errors.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`; failures indicate frontend TypeScript or Vite production-build errors.
