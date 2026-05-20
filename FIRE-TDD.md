# Technical Design Document

**Project:** Portfolio Backtester with Hindsight-Optimal Comparison
**Owner:** Amit (bacon & eggs)
**Status:** Locked — pre-build
**Version:** 0.2
**Last updated:** 2026-05-17

---

## 1. Overview

A static web app that lets a visitor allocate a fixed budget across a curated set of six tickers, then visualizes the historical performance of their allocation against a hindsight-optimal "consistent returns" allocation over Aug 2019 – Dec 2024. All data is precomputed in Python; the deployed site is static and CAD-denominated end to end.

---

## 2. Goals / Non-goals

**Goals**

- Demonstrate frontend + data-viz capability for the bacon & eggs portfolio.
- Demonstrate AWS cloud chops (S3 + CloudFront + ACM + Route 53 + GitHub Actions OIDC).
- Ship in 2–3 weekends of focused work.
- Demo readable in <30s on the landing view.

**Non-goals**

- Live data, brokerage integration, account linking.
- User-typed tickers, custom date ranges, scenario saving, auth.
- Rebalancing strategies, DCA, withdrawals.
- Monte Carlo, forward-looking simulation, financial advice.
- Mobile-first design (responsive is fine; mobile is not the demo target).
- LLM at runtime. AI text is generated once and committed as a string constant.

---

## 3. Architecture

Three layers, asynchronous to each other:

```
Python (one-time, offline)        Repo artifact            Next.js (runtime)
┌──────────────────────────┐      ┌────────────────┐      ┌─────────────────┐
│ fetch_data.py → yfinance │ ───▶ │ prices.csv     │      │                 │
│ precompute.py            │ ───▶ │ backtest.json  │ ───▶ │ Static site     │
│ (FX convert, covariance, │      │ summary.ts     │      │ (S3+CloudFront) │
│  min-var, drawdown)      │      │                │      │                 │
└──────────────────────────┘      └────────────────┘      └─────────────────┘
```

The frontend has zero Python dependency at runtime. Rebuilding the data is a manual `make data` step run before any deploy that changes the date range or tickers.

---

## 4. Data layer

### Tickers (Yahoo Finance symbols)

| Display | Yahoo symbol | Type | Native currency |
|---|---|---|---|
| XEQT | `XEQT.TO` | Canadian all-equity ETF | CAD |
| VEQT | `VEQT.TO` | Canadian all-equity ETF | CAD |
| S&P 500 | `^GSPC` | US large-cap index | USD |
| AMZN | `AMZN` | US single stock | USD |
| NVDA | `NVDA` | US single stock | USD |
| TSLA | `TSLA` | US single stock | USD |
| USD/CAD | `CAD=X` | FX series (1 USD → CAD) | — |

### Window

2019-08-07 (XEQT inception) → 2024-12-31. Daily adjusted close. Constrained by XEQT — VEQT existed earlier (Jan 2019).

### FX conversion

All returns are reported in **CAD**. Conversion happens in `precompute.py`, not in `prices.csv` — raw native-currency prices stay in the CSV for auditability. For each date `t`:

```
price_cad[t] = price_usd[t] * usdcad[t]
```

Monthly returns are computed on CAD-denominated price series. Covariance matrix and min-variance optimization are therefore apples-to-apples across tickers.

**Edge cases:**

- FX missing on dates a US ticker traded (rare): forward-fill the FX rate.
- Period start: should align cleanly to 2019-08-07 (Wednesday, trading day in both markets).

### Files

- `data/prices.csv` — long format: `date, ticker, adj_close, currency`. ~7 series × ~1350 trading days ≈ 9,500 rows. ~250 KB.
- `public/data/backtest.json` — precomputed analytics (schema in §6). Single file, frontend fetches on load.

---

## 5. Math

### Monthly returns

Resample daily adjusted close (post-FX-conversion) to last trading day of each month. Compute `r_t = P_t / P_{t-1} - 1`. ~64 monthly observations.

### Per-ticker stats

- `mean_monthly_return` — arithmetic mean of monthly returns.
- `stdev_monthly_return` — population stdev of monthly returns. **This is the "consistency" metric.**
- `total_return` — `P_end / P_start - 1`.
- `cagr` — annualized.
- `max_drawdown` — for the drawdown chart only.

### User's portfolio returns

Weighted sum: `r_p,t = Σ w_i · r_i,t`. Weights from UI sliders, sum to 1.

### Hindsight-optimal "consistent" allocation

Minimum-variance portfolio. Minimize `w'Σw` subject to:

- `Σ w_i = 1`
- `0 ≤ w_i ≤ 1` (long-only)

Solved with `scipy.optimize.minimize(method='SLSQP')` using the sample covariance matrix of monthly CAD returns. ~5 lines of code. Closed-form unconstrained solution (`w* = Σ⁻¹·1 / (1'·Σ⁻¹·1)`) would likely produce shorts; we want long-only.

### Validation

Unit-test the optimizer against a 2-asset case with known analytical solution from portfolio-theory textbooks. If it matches, trust the 6-asset case.

---

## 6. `backtest.json` schema

```json
{
  "meta": {
    "start": "2019-08-07",
    "end": "2024-12-31",
    "currency": "CAD",
    "fx_source": "Yahoo Finance CAD=X, daily close, forward-filled for non-trading days",
    "tickers": ["XEQT", "VEQT", "SP500", "AMZN", "NVDA", "TSLA"]
  },
  "tickers": [
    {
      "symbol": "XEQT",
      "yahoo": "XEQT.TO",
      "monthly_returns": [0.0123, -0.0045, ...],
      "stdev_monthly": 0.0412,
      "mean_monthly": 0.0087,
      "total_return": 0.612,
      "cagr": 0.094,
      "max_drawdown": -0.218
    }
  ],
  "covariance_matrix": [[...], [...]],
  "optimal_allocation": {
    "weights": {
      "XEQT": 0.41, "VEQT": 0.38, "SP500": 0.15,
      "AMZN": 0.04, "NVDA": 0.01, "TSLA": 0.01
    },
    "stdev_monthly": 0.0398,
    "total_return": 0.532,
    "cagr": 0.084,
    "max_drawdown": -0.196
  },
  "month_index": ["2019-08", "2019-09", "...", "2024-12"]
}
```

Frontend takes this + the user's allocation weights and computes portfolio value series + drawdown series on the fly in TypeScript. The math is trivial (weighted sums); no need to precompute every possible allocation.

---

## 7. Frontend

### Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- No state library; React `useState` + `useMemo` is sufficient
- No backend route handlers; static export (`output: 'export'`)

### Routes

Single page, `/`.

### State shape

```ts
type AppState = {
  weights: Record<TickerSymbol, number>;  // 0..1, sums to 1
  budget: number;                          // CAD
  showOptimal: boolean;                    // gated by reveal button
};
```

Everything else derives via `useMemo`.

### Components

- `<TickerAllocator />` — six native `<input type="range">` sliders styled with Tailwind, plus the `$ Budget` input. Auto-normalization on slider change (see §8). "Reset to equal weights" button below.
- `<PortfolioValueChart />` — line chart. User portfolio value always shown. Optimal series fades in when `showOptimal` is true.
- `<DrawdownChart />` — line chart below zero. Same dual-series behavior.
- `<AllocationCompareChart />` — side-by-side horizontal bar chart: user weights vs. optimal weights. Mounts only when `showOptimal` is true.
- `<StatsTable />` — total return, CAGR, monthly stdev, max drawdown. User-only by default; optimal column appears on reveal.
- `<AISummary />` — static prose component reading from `summary.ts`. Hidden until reveal.
- `<HindsightDisclaimer />` — small italic line: "Hindsight only. Nobody could have known this allocation ex ante."

---

## 8. UI flow

Single-page, top-to-bottom scroll:

1. **Hero** — project title, one-sentence description, disclaimers ("educational, not advice"; "all values in CAD"; "hindsight only").
2. **Allocator** — six sliders + budget. Live preview of allocation as a donut.
3. **Charts (live update as sliders move)** — portfolio value over time, drawdown chart. Both showing user-only by default.
4. **Stats table** — user portfolio only by default.
5. **Reveal button:** `Reveal the most consistent allocation →`. On click, `showOptimal: true` triggers:
   - Optimal series fades into PortfolioValueChart and DrawdownChart.
   - `<AllocationCompareChart />` mounts and animates in.
   - StatsTable gains an "optimal" column.
   - `<AISummary />` appears below.
6. **Footer** — built by bacon & eggs, link to repo, link to other projects.

### Slider auto-normalization

Lock-then-distribute pattern. When the user moves slider *i* to a new value `v_i`:

- Hold the *ratios* between the other five sliders constant.
- Rescale them to sum to `100 - v_i`.

**Edge cases:**

- All others are zero: distribute the remainder equally across them.
- User drags one to 100: others smoothly go to zero.

---

## 9. Project structure

```
backtester/
├── data/
│   ├── prices.csv                  # raw, committed (~250KB)
│   └── README.md
├── scripts/
│   ├── fetch_data.py               # yfinance pull (tickers + CAD=X)
│   ├── precompute.py               # FX-convert, covariance, min-var, stats → JSON
│   ├── test_math.py                # pytest
│   └── requirements.txt
├── public/
│   └── data/
│       └── backtest.json
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── TickerAllocator.tsx
│   │   ├── PortfolioValueChart.tsx
│   │   ├── DrawdownChart.tsx
│   │   ├── AllocationCompareChart.tsx
│   │   ├── StatsTable.tsx
│   │   ├── AISummary.tsx
│   │   └── HindsightDisclaimer.tsx
│   ├── lib/
│   │   ├── backtest.ts             # weighted portfolio math in TS
│   │   ├── backtest.test.ts        # vitest
│   │   └── types.ts
│   └── content/
│       └── summary.ts              # static AI prose
├── infra/
│   ├── main.tf  (or cdk/)          # S3 + CF + ACM + R53
│   └── README.md
├── .github/
│   └── workflows/
│       └── deploy.yml              # OIDC, build, sync, invalidate
├── tests/
│   └── e2e.spec.ts                 # playwright happy path
├── Makefile                        # `make data`, `make dev`, `make build`, `make deploy`
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js                  # output: 'export'
└── README.md
```

---

## 10. Testing strategy

Focused, not exhaustive. Portfolio piece doesn't need 80% coverage; it needs the *math* to be defensibly right and the demo to not break.

### Python (`pytest`)

- `test_min_variance_two_asset` — analytical 2-asset min-var case, compare to closed-form.
- `test_weights_sum_to_one` — sanity on optimizer output.
- `test_no_negative_weights` — long-only constraint holds.
- `test_known_drawdown` — synthetic series with known drawdown.
- `test_fx_conversion_dimensional` — converted CAD price equals USD price × FX rate.

### TypeScript (`vitest`)

- `test_weighted_portfolio_returns` — given fixed weights and known monthly returns, verify portfolio series.
- `test_drawdown_calc` — same series as Python test, verify TS computes the same value.

### End-to-end (`playwright`)

- One test: load page, drag a slider, assert chart re-renders. Click reveal button, assert optimal series appears.

---

## 11. Deployment

### Target

AWS S3 + CloudFront + ACM + Route 53. Provisioned as infrastructure-as-code (Terraform or CDK — pick one when starting the infra task).

**Why raw primitives over AWS Amplify Hosting:** Amplify is managed and ships fast, but it hides the AWS primitives that the cloud-signal portion of this portfolio piece is meant to demonstrate. The IaC committed to `infra/` is itself a portfolio artifact.

### Build artifact

Next.js with `output: 'export'` in `next.config.js` produces a `/out` static directory. That's what gets synced to S3.

### Pipeline

GitHub Actions workflow on push to `main`:

1. OIDC-assumed IAM role (no long-lived keys committed).
2. `npm ci && npm run build`.
3. `aws s3 sync out/ s3://bucket --delete`.
4. `aws cloudfront create-invalidation --paths "/*"`.

### Cost

~$1–2/month for low-traffic portfolio piece. Negligible.

### Domain

Subdomain of `baconandeggs.dev`, e.g., `backtester.baconandeggs.dev`. Requires either moving the apex DNS to Route 53 or adding a CNAME at the existing registrar pointing at the CloudFront distribution.

---

## 12. AI summary generation

Run once, manually. Use Claude/ChatGPT — it's not part of the product.

**Prompt template:**

> Given the following backtest results [insert JSON stats], write a 100-word summary explaining (a) which allocation produced the most consistent returns, (b) what that allocation suggests about portfolio construction, (c) the caveat that this is hindsight only. Tone: data-confident, not preachy.

Output goes in `src/content/summary.ts` as a string constant. If the data window changes, regenerate this. Friction is fine — it's a portfolio piece, not a SaaS.

---

## 13. Risks

- **R2 — Optimal allocation is "boring."** Min-var will likely concentrate in XEQT/VEQT (lowest-vol of the six). The demo's hindsight reveal could feel anticlimactic. Mitigation: the *contrast* with TSLA/NVDA volatility is the story; the chart will show this dramatically even if the allocation is unsurprising.
- **R3 — Demo on mobile looks bad.** Charts + sliders both struggle on narrow viewports. Mitigation: add a "best viewed on desktop" banner under 640px and don't optimize further.
- **R4 — yfinance breaks.** It's an unofficial scraper. Mitigation: data is committed to the repo, so a yfinance outage doesn't affect deployment, only regeneration.
- **R5 — AWS setup eats time budget.** Mitigation: do S3+CF setup once, in parallel with the Python data layer. Deploy a "hello world" `index.html` to the bucket on day one to de-risk the infra story before the Next.js code exists.
- **R6 — FX forward-fill assumption.** On dates where `CAD=X` has no value but a US ticker traded, forward-filling FX is a small approximation. Magnitude: typically <0.5% error on the converted price. Acceptable, documented in code.

---

## 14. Build order

1. `scripts/fetch_data.py` + `scripts/precompute.py` + `scripts/test_math.py` — the math foundation. Produces `backtest.json`.
2. Verify the precomputed JSON looks reasonable (sanity-check the optimal allocation).
3. AWS infra ("hello world" deploy to confirm pipeline).
4. Next.js scaffold + components.
5. Wire data → UI → final deploy.

---

## Changelog

- **v0.2 (2026-05-17)** — Locked. Switched window to Aug 2019–Dec 2024 (XEQT inception). Added FX conversion to CAD. Added reveal button + `showOptimal` state. Replaced Vercel deployment with AWS S3+CloudFront. Resolved R1 (currency mixing). Added R5 (AWS setup), R6 (FX forward-fill).
- **v0.1 (2026-05-16)** — Initial draft. Scope locked: frontend portfolio piece, static CSVs, hardcoded tickers, AI-as-static-text, min-variance hindsight comparison.
