# Flowboard

A team Kanban board (Backlog, In Progress, In Review, Done) built with React, TypeScript and Vite, backed by Supabase.

## Develop

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev
```

## Test and build

```bash
npm test        # unit + regression tests (Supabase is mocked; no network)
npm run build   # type-check and production build
```

## CI/CD

- GitHub Actions (`.github/workflows/ci.yml`) runs the tests and build on every push and pull request.
- Vercel deploys every push. Its build command is `npm test && npm run build`, so a failing test blocks the deploy.
