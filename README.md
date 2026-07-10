# CivicConnect — Smart Citizen Issue Reporting Platform

A modern, full-stack, responsive web app that lets citizens report and track
local civic issues (potholes, garbage, streetlights, water leakage, and more).
Built with **TanStack Start (React 19 + Vite 7)** and **Tailwind CSS v4**.

> **Connecting Citizens. Solving Problems.**

---

## 🚀 Quick Start (VS Code / Local)

### 1. Prerequisites

Install these once on your machine:

| Tool | Version | Link |
| --- | --- | --- |
| **Node.js** | v20 or higher | https://nodejs.org |
| **Git** | latest | https://git-scm.com |
| **VS Code** | latest | https://code.visualstudio.com |
| **Bun** *(optional, faster)* | latest | https://bun.sh |

Check your versions:

```bash
node -v   # should print v20.x or higher
git --version
```

### 2. Get the code

```bash
git clone <YOUR_REPO_URL>
cd <PROJECT_FOLDER>
```

### 3. Install dependencies

Using **npm** (works everywhere):

```bash
npm install
```

Or using **Bun** (faster, lockfile already included):

```bash
bun install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

The app runs fully on **demo/dummy data** out of the box — no keys required.
Only fill in `.env` if/when you connect a real backend.

### 5. Run the dev server

```bash
npm run dev
```

Open the URL printed in the terminal (usually **http://localhost:8080**).
The app hot-reloads as you edit files. 🎉

---

## 📜 Available Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run format` | Auto-format the code with Prettier |

*(Replace `npm run` with `bun run` if you use Bun.)*

---

## 🌍 Deployment

This project produces a production build with `npm run build`. The output is
generated into the `.output/` folder (server + static assets) and can be
deployed to any modern host.

### Option A — Cloudflare (default target)

The build is preconfigured for Cloudflare. After `npm run build`:

```bash
npm install -g wrangler
wrangler deploy
```

### Option B — Vercel (ready to deploy ✅)

This repo is **pre-configured for Vercel**. The Nitro build target is set to
the `vercel` preset (see `vite.config.ts`) and a `vercel.json` is included, so
no manual setup is needed.

1. Push your repo to GitHub.
2. Import the repo at https://vercel.com/new.
3. Vercel reads `vercel.json` automatically:
   - **Framework Preset:** Other
   - **Build command:** `npm run build`
   - **Output:** auto-detected (`.vercel/output`)
4. Click **Deploy**. That's it — SSR routes work out of the box.

> The build emits `.vercel/output` (Vercel Build Output API), so do **not**
> set a custom "Output Directory" in Vercel — leave it on auto-detect.


### Option C — Netlify

1. Push your repo to GitHub.
2. Create a new site from the repo at https://app.netlify.com.
3. Build command: `npm run build`.
4. Click **Deploy**.

### Option D — Deploy from Lovable (easiest)

Open the project in Lovable and click **Publish** (top-right). Your app goes
live on a `*.lovable.app` URL instantly, and you can connect a custom domain
from **Project Settings → Domains**.

---

## 🗂️ Project Structure

```text
src/
├── assets/          # Images and static assets
├── components/      # Reusable UI + site components
│   ├── site/        # Navbar, Footer, layout
│   └── ui/          # shadcn-style UI primitives
├── hooks/           # Custom React hooks
├── lib/             # Demo data, utilities, API helpers
├── routes/          # File-based routes (each file = a page/URL)
│   ├── __root.tsx   # App shell (head, providers)
│   ├── index.tsx    # Landing page  →  /
│   ├── report.tsx   # Report issue  →  /report
│   ├── track.tsx    # Track issue   →  /track
│   └── ...          # about, contact, dashboard, admin, etc.
└── styles.css       # Design system (theme tokens, glassmorphism)
```

Routing is **file-based** — add a file in `src/routes/` and it becomes a page.
`src/routeTree.gen.ts` is auto-generated; do not edit it by hand.

---

## 🛠️ Recommended VS Code Extensions

When you open the project in VS Code, it will suggest these
(see `.vscode/extensions.json`):

- **ESLint** — linting
- **Prettier** — formatting
- **Tailwind CSS IntelliSense** — class autocomplete
- **TypeScript** — built in

---

## 🔌 Backend / API Integration (optional)

The app is **API & AWS integration ready**. To wire up a real backend
(authentication, database, file storage), add the relevant keys to `.env`
and replace the demo data in `src/lib/demo-data.ts` with real API calls.

---

## 📄 License

This project is provided as-is for demonstration and educational use.
