# Architecture

## Overview

TextAlign is a React single-page application (SPA). It communicates with an external backend REST API and uses Auth0 for authentication. The frontend is responsible for all UI rendering, role-based routing, and client-side state; no server-side rendering is involved.

```
┌──────────────────────────────────────────────┐
│                  Browser                      │
│                                               │
│  ┌────────────┐   ┌────────────────────────┐  │
│  │   Auth0    │   │    TextAlign SPA        │  │
│  │  (login)   │◄──│  React + Vite + TS     │  │
│  └────────────┘   └───────────┬────────────┘  │
└──────────────────────────────-│───────────────┘
                                │ HTTP (Axios)
                    ┌───────────▼────────────┐
                    │    Backend REST API     │
                    │  (VITE_BASE_URL)        │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   AWS S3 (images)       │
                    │  proxied via /s3-proxy  │
                    └────────────────────────┘
```

## Folder Structure

```
src/
├── App.tsx                  # Provider composition root
├── main.tsx                 # Entry point, React DOM render
│
├── components/
│   ├── common/              # App-wide shared components (ThemeProvider)
│   ├── layout/              # Page shells (MainLayout, AuthLayout)
│   └── ui/                  # shadcn/ui primitives (Button, Dialog, etc.)
│
├── features/                # Domain slices — each owns its API, components, hooks
│   ├── auth/                # Auth0 login flow, callback, pending approval
│   ├── dashboard/           # Role-specific task queues and metrics
│   ├── workspace/           # Core editor (image viewer + text editor)
│   └── admin/               # User, group, and batch management
│
├── pages/                   # Thin page components — compose feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── workspace/
│   └── admin/
│
├── routes/
│   ├── app-routes.tsx       # Router config with lazy-loaded pages
│   └── protected-route.tsx  # Role-based route guard
│
├── lib/
│   ├── axios.ts             # Axios instance (baseURL, 401 handling)
│   ├── auth.ts              # Auth0 helper utilities
│   ├── i18n.ts              # i18next initialization
│   ├── constant.ts          # App-wide constants
│   ├── date-utils.ts        # Date formatting helpers
│   └── utils.ts             # General utilities (cn, etc.)
│
├── store/
│   └── use-ui-store.ts      # Zustand store (theme, language, editor prefs, toasts)
│
├── types/                   # TypeScript interfaces and enums
│   ├── task.ts              # TaskStatus, TaskAction, Task, AssignedTask
│   ├── user.ts              # UserRole, User, UserContribution
│   ├── group.ts             # Group
│   ├── batch.ts             # Batch
│   └── api.ts               # Generic API response wrappers
│
├── schema/                  # Zod validation schemas (form inputs)
│   ├── batch-schema.ts
│   ├── group-schema.ts
│   └── user-schema.ts
│
├── hooks/                   # Shared React hooks
│   ├── use-debounced-value.ts
│   └── use-language-sync.ts
│
└── locales/
    ├── en/                  # English translations (common, auth, admin, dashboard, workspace)
    └── bo/                  # Tibetan translations (same keys)
```

## Key Architectural Decisions

### Feature-First Organization

Code is organized by domain feature (`features/auth`, `features/workspace`, etc.) rather than by technical layer. Each feature owns its:
- API calls (`features/*/api/`)
- UI components (`features/*/components/`)
- Custom hooks (`features/*/hooks/`)

Pages in `pages/` are intentionally thin — they import and compose feature modules.

### State Management Split

Two state layers coexist by design:

| Store | Library | Purpose |
|---|---|---|
| UI store | Zustand | Theme, language, editor font/size, sidebar, toasts, modal state |
| Server state | TanStack Query | API data, caching, background refetching, mutations |

Zustand state is persisted to `localStorage` under the key `ui-storage` (theme, language, editor preferences). Server state is never persisted — TanStack Query's 5-minute stale time governs cache freshness.

### Routing and Auth Guards

`ProtectedRoute` wraps every authenticated route. It checks:
1. Auth0 authentication status
2. User role (for role-restricted routes like `/admin/*` and `/workspace`)

Unauthenticated users are redirected to `/login`. Authenticated users without a role land on `/pending-approval`.

Route paths and their role requirements:

| Path | Allowed Roles |
|---|---|
| `/dashboard` | All authenticated users |
| `/workspace` | Annotator, Reviewer |
| `/admin/users` | Admin |
| `/admin/groups` | Admin |
| `/admin/batches` | Admin |
| `/admin/batch/:batchId` | Admin |

All pages are lazy-loaded via `React.lazy()` with `Suspense` for code splitting.

### HTTP Client

A single Axios instance is created in `lib/axios.ts` with:
- `baseURL` from `VITE_BASE_URL`
- A response interceptor that unwraps `.data` and handles 401s

All API calls go through this instance, keeping auth and error handling centralized.

### S3 Image Proxy

The Vite dev server proxies `/s3-proxy/*` to `https://s3.us-east-1.amazonaws.com` to avoid CORS issues when loading task images locally. In production, configure your hosting layer (reverse proxy or CDN) to replicate this rewrite.

### Internationalization

i18n is handled by `i18next`. Translations are split into five namespaces per locale: `common`, `auth`, `admin`, `dashboard`, `workspace`. The active language is stored in Zustand (persisted to localStorage) and synced to i18next via the `use-language-sync` hook.

Supported locales: `en` (English), `bo` (Tibetan/Bodic).

### Editor Customization

Users can configure their workspace editor via the UI store:
- **Font family**: `monlam`, `monlam-2`, `noto-black`, `noto-bold`, `noto-medium`, `noto-regular`, `noto-semibold`
- **Font size**: 14, 16, 18, 20 (default), 24, 28, 32 px

These preferences are persisted across sessions via Zustand's `persist` middleware.
