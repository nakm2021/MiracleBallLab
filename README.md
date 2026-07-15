# Miracle Ball Lab

A browser-based pachinko-style miracle research game built with TypeScript, Matter.js, and Vite.

## Development

```bash
npm ci
npm run dev
```

Use `npm run validate` before committing. It runs formatting checks, linting, tests, type checking, and a production build.

## Architecture

See [docs/architecture.md](docs/architecture.md) for module boundaries and the incremental migration policy. Save compatibility is treated as a public contract and is covered by migration tests.
