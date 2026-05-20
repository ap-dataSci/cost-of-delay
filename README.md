# Cost of Delay

A scrollytelling explorable about FIRE (Financial Independence, Retire Early) and the compounding cost of waiting to invest.

> The cost of waiting compounds. The simplest possible portfolio is enough to win — if you start.

## What it does

The visitor fills out three scroll-gated form pages (10 inputs: where they are now, their working and investing timeline, growth and return assumptions). The narrative then plays two trajectories side-by-side:

- **Actual** — their path to financial independence on their current trajectory
- **Counterfactual** — the path if they had started investing the day they began working full-time

The reveal lands on two numbers: a dollar gap at today's age, and the **years gap at retirement** (the headline). The scroll ends in a sandbox where the visitor can perturb assumptions and watch both gaps move.

FIRE number = annual expenses × 25 (the 4% rule). All figures are in today's CAD, with an inflation disclosure in the footer.

## Stack

- **Next.js 15** (App Router, static export) + TypeScript + Tailwind v4
- **D3** — hand-rolled SVG chart with scroll-driven transitions (no Recharts/Tremor)
- **Scrollama** — scene state and progress
- **Vitest** — focused unit tests on the compound-growth math
- **AWS** — S3 + CloudFront + ACM + Route 53, deployed via GitHub Actions with OIDC. The IaC is itself a portfolio artifact.

Pure-frontend at runtime. No backend, no external data fetched, no LLM.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to out/
npx vitest run       # unit tests
```

## Status

v0.4 of the spec ([FIRE-TDD_v2.md](FIRE-TDD_v2.md)) is largely implemented:

- Math, types, narrative model, chart, counter
- Three-page form with scroll gates
- Scenes N1–N5 (rewind → reveal)

Remaining:

- Scene N6 sandbox (interactive control panel)
- AWS infra (`infra/` Terraform/CDK + GitHub Actions OIDC)
- Copy polish, OG image, mobile responsive pass, final QA

## Non-goals

This is not financial advice. It does not model tax-advantaged accounts (TFSA/RRSP/FHSA), inflation-adjust past contribution capacity, fetch live market data, or integrate with any brokerage. Desktop is the demo target; mobile is responsive but not feature-parity.

## License

Apache 2.0 — see [LICENSE](LICENSE).
