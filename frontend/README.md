# Frontend App

This is the Next.js frontend for Draft Kit.

## Overview

The frontend is responsible for the user interface, client-side sorting, page navigation, and Auth0-based login state. It talks to the backend for player, draft, and evaluation data.

## Scripts

From the `frontend` directory:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

The frontend reads the following environment variables:

| Name | Required | Purpose |
| ---- | -------- | ------- |
| `NEXT_PUBLIC_BACKEND_URL` | no | Backend base URL used by client-side requests. Falls back to the hosted backend URL if not set. |
| `NEXT_PUBLIC_APP_BASE_URL` | yes | Base URL for the frontend app, used by Auth0. |
| `AUTH0_DOMAIN` | yes | Auth0 tenant domain. |
| `AUTH0_CLIENT_ID` | yes | Auth0 application client ID. |
| `AUTH0_CLIENT_SECRET` | yes | Auth0 application client secret. |
| `AUTH0_SECRET` | yes | Auth0 session/cookie secret required by `@auth0/nextjs-auth0`. |

Example `.env` file:

```txt
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_SECRET=your-auth0-secret
```

## App Structure

Main routes live under `app/(main)` and include:

- `/` - dashboard / landing page
- `/players` - player browser
- `/players/[id]` - player detail page
- `/draft` - draft workflow
- `/evaluation` - player evaluation view
- `/feed` - sports feed
- `/profile` - user profile page
- `/auth0-profile` - Auth0 profile demo page

## Notes

- Sorting is handled on the frontend.
- The frontend uses shared utility types and API helpers from `_lib`.
- Auth0 middleware protects the app routes configured in `middleware.ts`.
