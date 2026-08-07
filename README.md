# Chapter IP Platform

Chapter IP is a full-stack Credenza customer platform. The monorepo includes frontend, admin, and backend applications plus shared authentication, provider, UI, notification, content-type, and service packages.

It is managed with pnpm and Turborepo. Install dependencies at the root and use the root scripts to run coordinated builds, development servers, linting, and type checks.

## Repository layout

- `apps/` — deployable frontend, admin, and backend applications.
- `packages/` — shared UI, authentication, configuration, providers, services, notifications, and API types.
- `scripts/` — workspace generation and maintenance utilities.
