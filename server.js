/**
 * Root entry point for platform deployments (e.g. Hostinger's GitHub-connected
 * Node.js apps) where the application root is the repository root.
 *
 * The backend boots on import: it starts Express, serves /api, and — when
 * frontend/dist exists (created by `npm run build`) — serves the SPA too.
 * Environment comes from the platform's env vars (or backend/.env locally).
 */
import "./backend/index.js";
