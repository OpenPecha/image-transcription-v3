# Getting Started

This guide walks a new developer through setting up TextAlign locally from scratch.

## Prerequisites

- **Node.js** 18 or later ([download](https://nodejs.org))
- **npm** 9+ (bundled with Node)
- Access to the backend API (deployed separately)
- An **Auth0** account and application — only if you are **not** using dev auth (see [Auth0 Setup](#auth0-setup) below)

## 1. Clone and Install

```bash
git clone <repo-url>
cd image-transcription-v3
npm install
```

## 2. Environment Variables

Create a `.env` file at the project root.

> All variables must be prefixed with `VITE_` to be exposed to the browser by Vite.

### Option A — Local dev without Auth0 (recommended for UI work)

Skip Auth0 and sign in with a test user email. The app loads the user profile from `GET /user/by-identifier/{email}` on the backend.

```env
VITE_BASE_URL=http://localhost:8000
VITE_DEV_AUTH=true
```

| Variable | Description |
|---|---|
| `VITE_BASE_URL` | Backend API base URL. Defaults to `http://localhost:3000` if omitted. |
| `VITE_DEV_AUTH` | Set to `true` to bypass Auth0. API requests use a placeholder `dev-token`. |

**Sign in:** open `/login`, enter a user email that exists in the backend, then click **Dev sign in**. You can also pass `?email=user@example.com` in the URL.

Dev auth is also enabled automatically when Auth0 credentials are missing, or when `?dev=true` is in the URL (stored in `localStorage` as `dev_auth_mode`).

### Option B — Full Auth0 login

Use this when testing the real authentication flow.

```env
# Base URL of the backend REST API
VITE_BASE_URL=http://localhost:8000

# Auth0 credentials (from your Auth0 application dashboard)
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
```

| Variable | Description |
|---|---|
| `VITE_BASE_URL` | Backend API base URL. Defaults to `http://localhost:3000` if omitted. |
| `VITE_AUTH0_DOMAIN` | Your Auth0 tenant domain (e.g. `dev-xxxx.us.auth0.com`). |
| `VITE_AUTH0_CLIENT_ID` | Client ID from your Auth0 Single Page Application. |
| `VITE_AUTH0_AUDIENCE` | The API identifier registered in Auth0. Required for access tokens. |
| `VITE_AUTH0_REDIRECT_URI` | Optional. Defaults to `{origin}/callback`. |

Do **not** set `VITE_DEV_AUTH=true` when using Auth0. Clear `dev_auth_mode` and `dev_user_email` from browser `localStorage` if you previously used dev auth.

## 3. Auth0 Setup

### Create a Single Page Application

1. Go to **Auth0 Dashboard → Applications → Create Application**.
2. Choose **Single Page Application**.
3. Note the **Domain** and **Client ID** — these go into `.env`.

### Configure Allowed URLs

In the application settings, set the following (adjust port/domain for production):

| Setting | Value |
|---|---|
| Allowed Callback URLs | `http://localhost:3000/callback` |
| Allowed Logout URLs | `http://localhost:3000/login` |
| Allowed Web Origins | `http://localhost:3000` |

### Register an API (for access tokens)

1. Go to **Auth0 Dashboard → Applications → APIs → Create API**.
2. Set an **Identifier** (this becomes `VITE_AUTH0_AUDIENCE`).
3. Enable **RBAC** and **Add Permissions in the Access Token** in the API settings.

### User Roles

The backend expects users to carry one of these roles in their Auth0 profile. Assign roles to users via **Auth0 Dashboard → User Management → Users → Roles**.

| Role | Slug |
|---|---|
| Admin | `admin` |
| Annotator | `annotator` |
| Reviewer | `reviewer` |

A user who logs in without an assigned role lands on the `/pending-approval` page until an admin grants them a role.

## 4. Run the Development Server

```bash
npm run dev
```

Opens at **http://localhost:3000**.

The dev server proxies `/s3-proxy/*` requests to `https://s3.us-east-1.amazonaws.com` so that task images served from S3 load without CORS issues during local development.

## 5. Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:3000` |
| `npm run build` | Compile TypeScript and bundle for production (output: `dist/`) |
| `npm run preview` | Serve the production build locally at `http://localhost:10000` |
| `npm run lint` | Run ESLint across the `src/` directory |

## 6. Mocking (Optional)

The project ships with [MSW (Mock Service Worker)](https://mswjs.io/) configured for local development. If you want to run the frontend without a live backend, check `src/mocks/` for handler setup and enable MSW in `src/main.tsx`.

## Next Steps

- [Architecture](architecture.md) — understand how the codebase is organized
- [Workflows](workflows.md) — understand user roles and the task lifecycle
- [Contributing](../CONTRIBUTING.md) — how to make and submit changes
