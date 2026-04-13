# ParkIt

React + Vite front-end for the ParkIt parking app.

## What you need installed (new developer)

Install these on your machine **once**; everything else comes from this repo.

| Requirement | Notes |
|-------------|--------|
| **Node.js** | **20.x LTS** or newer (includes **npm**). [Download Node.js](https://nodejs.org/) |
| **Git** | To clone the repository. [Download Git](https://git-scm.com/) |

After cloning, project libraries are **not** installed manually. Run `npm install` in the project folder; that reads `package.json` and installs all packages below.

### Runtime libraries (`dependencies`)

These are installed automatically with `npm install`:

- **react** — UI library  
- **react-dom** — React DOM renderer  
- **react-router-dom** — Client-side routing  

### Tooling (`devDependencies`)

Used for development and builds (also installed by `npm install`):

- **vite** — Dev server and production build  
- **@vitejs/plugin-react** — React support in Vite  
- **eslint**, **@eslint/js**, **eslint-plugin-react-hooks**, **eslint-plugin-react-refresh**, **globals** — Linting  
- **@types/react**, **@types/react-dom** — TypeScript types for React (helpful in the editor even for `.jsx`)  

## How to run

1. Install **Node.js** (see above).
2. Clone the repo with Git.
3. In the project root, install packages:

   ```bash
   npm install
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open the URL Vite prints in the terminal (usually `http://localhost:5173`).

### Other scripts

- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview the production build locally
- `npm run lint` — Run ESLint

## Demo logins

There are three roles:

| Role | Username | Password |
|------|----------|----------|
| Normal user | `user` | `1` |
| Administrator | `admin` | `admin` |
| Kiosk | `kiosk` | `1` |
