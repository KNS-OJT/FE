# P03 - Inventory & Purchase Request Management (Frontend)

## Tech stack

React + TypeScript (strict) + Vite; Ant Design v5 and icons; Tailwind CSS v4
for layout and spacing; React Router; Axios; TanStack Query; Zustand; Zod; dayjs.
ESLint flat config, Prettier, Vitest, Testing Library, and jsdom support development.
The React 19 compatibility patch supports Ant Design v5.

## Getting started

Use Node.js >= 22.12 (or Node 20 >= 20.19) and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

If PowerShell blocks npm.ps1, use npm.cmd instead. No policy change is required.

The development server forwards `/api` to `VITE_DEV_PROXY_TARGET`, initially
`http://localhost:8080`. Confirm the backend port with the backend team. The prefix
is preserved. Production hosting must provide its own `/api` reverse proxy or set
`VITE_API_BASE_URL` at build time. Environment values are validated with Zod;
every `VITE_*` value is public, so never put credentials in these variables.

## Scripts

| Script              | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `npm run dev`       | Start Vite                                                  |
| `npm run build`     | Check both TypeScript projects and build without sourcemaps |
| `npm run preview`   | Serve the production build locally                          |
| `npm run lint`      | Run ESLint, including security rules                        |
| `npm run typecheck` | Check referenced TypeScript projects without emitting code  |
| `npm run test`      | Run the frontend smoke test once                            |
| `npm run format`    | Format source and configuration with Prettier               |

## Source structure

`src/app` contains providers, `src/config` validates client environment values,
and `src/lib/http` configures Axios with credentials and a 15-second timeout.
`src/auth`, `src/layouts`, `src/components/common`, `src/constants`, `src/types`,
`src/utils`, and the module directories under `src/features` are empty placeholders.
`src/test/setup.ts` initializes Testing Library. The app is a setup smoke screen;
business features and authentication behavior have not been implemented.

Tailwind v4 uses its Vite plugin. The global layer order and `StyleProvider layer`
keep Ant Design styles above Preflight. See the official
[Ant Design CSS compatibility guide](https://ant.design/docs/react/compatible-style/)
and [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite).
