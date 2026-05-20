# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal (decided 2026-05-18, v0.4 input model 2026-05-18)

This is a **scrollytelling FIRE explorable** called "Cost of Delay." The visitor fills out **three scroll-gated form pages** (10 inputs total: where they are now, their working/investing timeline, growth/return assumptions), then scrolls through a narrative that plays two trajectories side-by-side: their **actual** path to financial independence given current trajectory, and a **counterfactual** path where they'd started investing the day they started working full-time. The reveal lands on two numbers — a dollar gap at today's age and the **years gap at retirement** (the headline). The FIRE number = annual expenses × 25 (4% rule), all figures in today's CAD with an inflation disclosure in the footer. The scroll ends in a sandbox where the user can perturb assumptions and watch both gaps move.

**Thesis:** *The cost of waiting compounds. The simplest possible portfolio (XEQT) is enough to win — if you start.*

The operative design spec is [FIRE-TDD_v2.md](FIRE-TDD_v2.md) (v0.4).

## Current state

v0.4 migration is largely complete. What's in the tree:

- **Math** (`src/lib/math.ts`): monthly-compounded annual contribution FV, capacity growth, `projectTrajectory`, `actualTrajectory`, `counterfactualTrajectory`, `counterfactualAtCurrentAge`, `fireNumber`, `costOfDelay`. Test suite (`math.test.ts`) covers FV (with and without capacity growth), FIRE number, retirement-age projection (incl. principal-already-past-target edge case), and counterfactual divergence.
- **Types** (`src/lib/types.ts`): 10-field `StartInputs`, plus `SandboxState`, `Trajectory`, `FormPage`, `SceneId`, `AppState`.
- **Narrative model** (`src/lib/narrative.ts`): single `NarrativeModel` built once from `StartInputs` and consumed by all scenes + the chart. Holds both trajectories as `BalancePoint[]`, computed `maxAge`/`yMax`, and shared helpers `pointsThroughAge` / `pointAtAge` for scrub-style chart interpolation.
- **Form** (`src/components/form/`): `Page1Now`, `Page2Timeline`, `Page3Assumptions`, `ScrollGate`, `NumberField`. Each page exposes a `Page[N]Values` type and an `isPage[N]Valid` predicate; `src/app/page.tsx` composes them into `StartInputs` via `useMemo` and only mounts `NarrativeScroll` once valid.
- **Scenes** (`src/components/scenes/`): `NarrativeScroll` (scrollama wiring), `SceneShell` (two-column layout used by every scene), `SceneVisualization` (wraps `Timeline` + a debug progress slider), and `SceneN1Rewind` → `SceneN5RevealRetirement`. Old `Scene[1-7]*.tsx` files have been removed.
- **Chart** (`src/components/Timeline.tsx`): hand-rolled D3 SVG that picks a per-scene `ChartState` (domain, lines, markers, drop lines, gap line, FIRE-line visibility) and morphs between them with 520ms transitions.
- **Counter** (`src/components/CostOfDelayCounter.tsx`): RAF count-up easing from previous to next target value; resets when hidden.

Not yet built:

- **SceneN6 Sandbox** (interactive control panel that lets `SandboxState` diverge from `StartInputs`).
- **AWS infra** — there is no `infra/` directory yet; Terraform/CDK + GitHub Actions OIDC deploy are still TODO.
- Copy polish, OG image, mobile pass, final QA.

Build order remaining ([FIRE-TDD_v2.md §12](FIRE-TDD_v2.md)): Sandbox (N6) → AWS infra → copy/disclaimers/OG → mobile responsive → final QA + deploy.

**v1 leftovers** (stock-backtester pivot — see [project_v1_to_v2_pivot.md](.) in memory): `data/prices.csv`, `public/data/`, `scripts/*.py`, `requirements.txt`, `.venv/`. These are unused at runtime; the `name` field in `package.json` is still `portfolio-backtester` for the same reason. Don't wire them into the build.

## Architecture

Pure-frontend, no backend at runtime. No Python, no data pipeline.

```
Static site (Next.js 15, exported)        AWS edge
  Scrollama → scene state                   S3 + CloudFront
  D3 → counter + chart                     (ACM + R53)
  Compound-growth math (TS)
  No external data fetched
```

The math is light enough to run in the browser on every scroll event. The whole project lives in one Next.js app.

## Key files

- `src/app/page.tsx` — composes intro + 3 form pages + `NarrativeScroll` + `Disclaimer`. Builds `StartInputs` only when all three `isPage[N]Valid` predicates pass; until then renders `NarrativePlaceholder`.
- `src/lib/math.ts` / `math.test.ts` — pure compound-growth math; both trajectories share `projectTrajectory`, which is the single source of truth for retirement-age detection.
- `src/lib/narrative.ts` — derives `NarrativeModel` from `StartInputs`. Built once per inputs change and threaded into every scene. New scenes should read from this model, not call `math.ts` directly.
- `src/lib/scrollytelling.ts` — `useScrollama(stepSelector, { offset }, enabled)` returns `{ currentIndex, progress }`. Always sets `progress: true`.
- `src/components/form/*` — form pages share the `NumberField` primitive and the `ScrollGate` chevron. Each page's `Page[N]Values` partial state is owned by `src/app/page.tsx`.
- `src/components/scenes/NarrativeScroll.tsx` — clamps scrollama's `currentIndex` to scenes 1–5 and renders all five scenes statically with an `active` prop; the inactive ones dim to `opacity-45` rather than unmount.
- `src/components/scenes/SceneShell.tsx` — defines the `.narrative-step` selector that scrollama steps on. New scenes must use this shell so the scroll observer picks them up.
- `src/components/Timeline.tsx` — `getChartState(model, scene, progress)` returns a declarative chart description; the `useEffect` below it diffs that against the SVG with D3 selections + transitions. Per-scene visual logic lives in `getChartState`, not in the render block.
- `src/content/copy.ts` — all user-visible strings, organized as `copy.intro`, `copy.form.page[1-3]`, `copy.scenes.n[1-5]`.

## Non-obvious decisions

- **Counterfactual anchor is the user's `startWorkingAge`**, not a fixed 22. The "delay" is the gap between when they started working and when they started investing.
- **Return rate is a user input** (default 7%), not a constant. Same rate applies to both actual and counterfactual trajectories.
- **Capacity grows annually** by `savingsGrowthRate` (default ~3%). Flat-contribution model from v0.3 is gone.
- **FIRE number = annual expenses × 25** (4% rule). All figures in today's CAD; inflation noted in footer, not modeled.
- **Headline reveal is in years saved**, not dollars. Dollar gap is supporting.
- **Form is 3 scroll-gated pages, no Next/Back buttons.** Validity gates a scroll-down chevron that allows progress to the next section.
- **Counter uses RAF (requestAnimationFrame)** for smooth count-up, not D3 tween. Switches typography between dollar mode (N1–N4) and years mode (N5). The component is built but not yet wired into `NarrativeScroll` — currently each scene renders its own headline number.
- **Scrollama `progress: true`** enabled for scroll-driven animation within scenes.
- **Sandbox state is separate** from narrative inputs so the sandbox can diverge.
- **AWS primitives over Amplify.** The IaC in `infra/` is itself a portfolio artifact.
- **No charting library** — Recharts/Tremor can't do scroll-driven animation. Hand-rolled SVG with D3.
- **No state library** — React useState + useMemo. Scrollama state is local to its hook.

## Explicit non-goals

Do not propose or scope these in ([FIRE-TDD_v2.md §2](FIRE-TDD_v2.md)):

- Financial advice (strong disclaimer throughout)
- Tax-advantaged account modeling (TFSA/RRSP/FHSA)
- Inflation-adjusting past contribution capacity (disclosed simplification)
- Live market data, brokerage integration, retirement-spending modeling
- Mobile parity with desktop (responsive is fine; desktop is the demo target)
- Pattern B interactivity (mid-scroll inputs)
- LLM at runtime
- 80% test coverage — testing is focused, not exhaustive

## Commands

- `npm run dev` — Next.js dev server
- `npm run build` — Next.js build; `next.config.ts` has `output: "export"`, so this writes a static site to `out/`
- `npx vitest run` — run unit tests (no `npm test` script is defined)
- `npx vitest run src/lib/math.test.ts -t "<name>"` — run a single test by name

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind + D3 + Scrollama. No Python. Terraform or CDK for AWS. Deploy via GitHub Actions with OIDC-assumed IAM role.
