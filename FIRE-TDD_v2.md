# Technical Design Document

**Project:** Cost-of-Delay — Scrollytelling FIRE Explorable
**Owner:** Amit (bacon & eggs)
**Status:** Locked — pre-build (input-model revision)
**Version:** 0.4
**Last updated:** 2026-05-18

---

## 1. Overview

A scrollytelling FIRE explorable. The visitor fills out **three scroll-gated input pages** capturing where they are now, their working/investing timeline, and their growth/return assumptions. The piece then plays two trajectories side-by-side: their **actual** path to financial independence given current trajectory, and a **counterfactual** path where they had started investing the day they started working full-time. Two numbers anchor the reveal — the dollar gap at today's age, and **the years gap at retirement** ("you could have retired N years earlier"). The scroll ends in a sandbox where the user can perturb assumptions and watch both gaps move.

**FIRE number** = annual expenses × 25 (the 4% safe-withdrawal-rate heuristic). All figures in today's CAD, with an inflation callout on the result.

**Thesis:** *The cost of waiting compounds. The simplest possible portfolio (XEQT) is enough to win — if you start.*

---

## 2. Goals / Non-goals

**Goals**

- Bacon & eggs portfolio piece — demonstrate frontend, data viz, scroll-driven animation, AWS deployment.
- Land an emotional reveal — both in dollars *and* in retirement years saved — in under 90 seconds of scrolling on desktop.
- Personalize: the visitor sees *their* cost of delay computed from *their* timeline.
- Ship in 5–7 weekends of focused work.

**Non-goals**

- Financial advice. Strong disclaimer throughout.
- Modeling tax-advantaged accounts (TFSA/RRSP/FHSA differentiation). Future iteration.
- Inflation modeling. All figures in today's CAD. Inflation noted as a ± callout in the footer, not modeled in the math.
- Live market data, brokerage integration, withdrawal-sequencing modeling.
- Mobile parity with desktop. Mobile is supported but desktop is the demo target.
- Pattern B interactivity (mid-narrative inputs). Inputs are collected up front in the form phase; perturbation knobs come at the end.

---

## 3. Architecture

Unchanged from v0.3.

```
Static site (Next.js 15, exported)        AWS edge
┌─────────────────────────────┐       ┌──────────────────┐
│  Scrollama → scene state    │       │                  │
│  D3 → counter + chart       │       │  S3 + CloudFront │
│  Compound-growth math (TS)  │ ───▶  │  (ACM + R53)     │
│  No external data fetched   │       │                  │
└─────────────────────────────┘       └──────────────────┘
```

Pure-frontend, no backend at runtime. The math runs in the browser on every scroll event.

---

## 4. Math

### Core formula

Future value of a portfolio with monthly contributions and **annually-growing** contribution capacity:

For each year `t`:
- Capacity grows annually by `g` (savings growth rate).
- Within a year, monthly contributions of `capacity[t] / 12` compound at `r/12` monthly.
- Across years, the prior balance rolls forward at annual rate `r`.

```
balance[0]     = startingPrincipal
capacity[t]    = baseCapacity · (1 + g)^t
balance[t+1]   = balance[t] · (1 + r) + capacity[t] · annuityFactor(r)

where annuityFactor(r) = [(1 + r/12)^12 - 1] / (r/12)   // FV of $1/yr contributed monthly
```

### FIRE number

```
fireNumber = annualExpenses × 25
```

In today's CAD. Implicitly assumes the 4% safe-withdrawal rule.

### Actual trajectory

Starting state: today.
- `P` = current invested total
- `baseCapacity` = current monthly capacity × 12
- Compound forward year-by-year until `balance[t] ≥ fireNumber`.

Output: **actualRetirementAge** = `currentAge + t` at first crossing.

### Counterfactual trajectory

Starting state: the year the user started working full-time.
- `P` = 0
- `baseCapacity` = past monthly capacity × 12
- `g`, `r` shared with actual trajectory
- Compound forward year-by-year from `startWorkingAge` until balance ≥ fireNumber.

Outputs:
- **counterfactualToday** = balance at `currentAge`.
- **counterfactualRetirementAge** = age at first crossing.

### Cost of delay (two numbers)

```
dollarGap = counterfactualToday - currentInvested
yearsGap  = actualRetirementAge - counterfactualRetirementAge
```

Both are displayed. **Years gap is the headline**. Dollar gap is supporting.

### Validation

- `test_fv_known_case` — known textbook compound case (no capacity growth) matches manual calc.
- `test_fv_with_capacity_growth` — capacity-growth scaling correct year-over-year.
- `test_fire_number` — expenses × 25.
- `test_retirement_age_projection` — projected retirement age matches manual iteration for a specific case.
- `test_counterfactual_diverges_correctly` — counterfactual retirement age < actual when start-investing > start-working.

Five tests. Enough.

---

## 5. Input model (3 scroll-gated pages)

The piece collects **10 inputs across 3 pages**, all before the narrative scroll begins. Each page renders a **scroll-down arrow** only once its fields are valid. Invalid → arrow is disabled with a subtle "complete fields to continue" hint. **No Next/Back buttons** — the page is one continuous scroll where input validity gates progress to the next section.

### Page 1 — Where you are now

1. Current age
2. Current invested total (CAD)
3. Current monthly savings capacity (CAD)

### Page 2 — Your timeline

4. Age you started working full-time
5. Monthly savings capacity back then (CAD)
6. Age you actually started investing
7. Target retirement age

### Page 3 — Assumptions

8. Annual expenses (today's CAD) — hint: *"We compute your FIRE number as expenses × 25 (the 4% rule)."*
9. Annual growth in savings capacity (%) — hint: *"How much your savings ability grows per year as income rises. 3–5% is typical."*
10. Expected investment return (%) — hint: *"Globally diversified equity funds like XEQT have historically returned 7%+ nominal over multi-decade windows."*

After Page 3 validates, the narrative scroll begins.

---

## 6. Narrative structure (post-form)

Five narrative scenes plus the sandbox. Two trajectories — actual and counterfactual — animate in over the scroll, culminating in the "you could have retired N years earlier" reveal.

### Scene N1 — Rewind

- **Visual:** timeline appears, axis from `startWorkingAge` → `targetRetirementAge`. Marker labeled "you at [startWorkingAge]" at the left edge. Portfolio = $0.
- **Text:** *"Rewind. You're [startWorkingAge]. First real paycheck. Nothing invested yet."*

### Scene N2 — The road not taken

- **Visual:** counterfactual line begins drawing from the left edge. Initially a flat ramp, then curving.
- **Text:** *"What if you'd put even \$[pastCapacity]/month into a globally-diversified index fund — XEQT, [returnRate]% nominal — from day one?"*

### Scene N3 — Compounding kicks in

- **Visual:** counterfactual line visibly curves upward. Annotation: *"This is compounding. Boring until it isn't."*
- **Text:** *"The first decade looks unremarkable. The second doesn't."*

### Scene N4 — The reveal at today

- **Visual:** marker reaches today's age. Counterfactual line settles at `counterfactualToday`. Actual current portfolio appears as a second dot, well below.
- **Text:** *"You're [currentAge] now. That parallel version of you has \$[counterfactualToday]. You have \$[actual]."*
- **Counter:** ticks up to `dollarGap` over ~1.5 seconds.

### Scene N5 — The reveal at retirement

- **Visual:** both lines extend forward until each crosses the `fireNumber` horizontal. Two vertical drop-lines mark the ages where each crosses.
- **Text:** *"You'll hit \$[fireNumber] at [actualRetirementAge]. The parallel version of you got there at [counterfactualRetirementAge]. **You could have retired [yearsGap] years earlier.**"*
- **Counter:** transitions to display "[yearsGap] years" in the headline slot.

### Scene N6 — Sandbox

- **Visual:** all charts stay visible, now respond to controls.
- **Controls:**
  - Age you started investing (slider, between `startWorkingAge` and `currentAge`)
  - Annual savings growth % (slider, 0–10%)
  - Investment return % (slider, 3–10%)
  - Past monthly capacity (editable)
  - Annual expenses (editable, drives FIRE number)
- **Text:** *"Try different versions of yourself. Different start ages. Different growth assumptions."*
- **Counter:** updates live.

### Footer

- *"Built by bacon & eggs. Educational only — not financial advice. All figures in today's CAD; inflation is not modeled (long-run Canadian inflation has averaged ~2%, which means today's \$1M of expenses is roughly \$1.5M in 20 years — adjust accordingly). The FIRE number assumes the 4% safe-withdrawal-rate heuristic, which is contested for non-US markets. The cost-of-delay numbers are approximate by design."*
- Link to source repo + other bacon & eggs projects.

---

## 7. State shape

```ts
type StartInputs = {
  // Page 1 — where you are now
  currentAge: number;
  currentInvested: number;
  currentMonthlyCapacity: number;

  // Page 2 — your timeline
  startWorkingAge: number;
  pastMonthlyCapacity: number;
  startInvestingAge: number;
  targetRetirementAge: number;

  // Page 3 — assumptions
  annualExpenses: number;
  savingsGrowthRate: number;     // decimal, e.g. 0.03
  investmentReturnRate: number;  // decimal, e.g. 0.07
};

type SandboxState = StartInputs;  // sandbox can diverge from initial inputs

type Trajectory = {
  balanceByYear: number[];          // index 0 = starting age
  retirementAge: number | null;     // null if FIRE never reached within window
};

type AppState = {
  inputs: StartInputs | null;
  currentFormPage: 1 | 2 | 3 | null;  // null once narrative starts
  currentScene: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  sandboxActive: boolean;
  sandbox: SandboxState;
};
```

---

## 8. Components

```
src/
├── app/
│   ├── page.tsx                # composes form pages + narrative scroll
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── form/
│   │   ├── Page1Now.tsx
│   │   ├── Page2Timeline.tsx
│   │   ├── Page3Assumptions.tsx
│   │   └── ScrollGate.tsx      # renders scroll-down arrow when fields valid
│   ├── scenes/
│   │   ├── SceneN1Rewind.tsx
│   │   ├── SceneN2RoadNotTaken.tsx
│   │   ├── SceneN3Compounding.tsx
│   │   ├── SceneN4RevealToday.tsx
│   │   ├── SceneN5RevealRetirement.tsx
│   │   └── SceneN6Sandbox.tsx
│   ├── CostOfDelayCounter.tsx
│   ├── Timeline.tsx
│   ├── SandboxControls.tsx
│   └── Disclaimer.tsx
├── lib/
│   ├── math.ts
│   ├── math.test.ts
│   └── scrollytelling.ts
└── content/
    └── copy.ts
```

### ScrollGate

A small component that observes a form page's validity. While invalid, renders a faded scroll-down chevron with the hint *"Complete the fields above to continue."* When valid, the chevron animates in (fade + small bounce) and the next scene is allowed to trigger.

### Timeline

Single persistent SVG that morphs across N1–N5 via D3 transitions. Two lines: counterfactual (from N2 onward) and actual (from N4 onward). FIRE-number horizontal appears in N5. Vertical drop-lines at each line's retirement-age crossing appear in N5.

### CostOfDelayCounter

Sticky-positioned. Displays dollar gap during N1–N4, then switches to "years saved" headline in N5. Currency formatted via `Intl.NumberFormat('en-CA', { currency: 'CAD', style: 'currency' })`. RAF-based count-up.

---

## 9. Project structure

```
cost-of-delay/
├── public/                       # favicon, og-image, etc.
├── src/                          # see §8
├── infra/                        # S3 + CF + ACM + R53 (Terraform or CDK)
├── .github/
│   └── workflows/
│       └── deploy.yml            # OIDC, build, sync, invalidate
├── tests/
│   └── e2e.spec.ts               # playwright
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js                # output: 'export'
└── README.md
```

---

## 10. Testing strategy

### TypeScript (vitest)

- `test_fv_known_case` — known textbook compound case matches manual calc.
- `test_fv_with_capacity_growth` — capacity-growth scaling correct year-over-year.
- `test_fire_number` — expenses × 25.
- `test_retirement_age_projection` — projected retirement age matches manual iteration.
- `test_counterfactual_diverges_correctly` — counterfactual retirement age < actual when `startInvestingAge > startWorkingAge`.

### End-to-end (playwright)

- Load page, fill all 3 form pages, scroll through narrative, assert counter reaches expected `dollarGap` at N4 and `yearsGap` at N5.
- Sandbox: move start-investing slider, assert years-saved counter updates.

### Visual / manual

- Scene transitions reviewed manually. No automated visual regression — overkill for a portfolio piece.

---

## 11. Deployment

Unchanged from v0.3:

- AWS S3 + CloudFront + ACM + Route 53
- Terraform or CDK for IaC, committed under `infra/`
- GitHub Actions workflow with OIDC-assumed IAM role
- `npm ci && npm run build && aws s3 sync out/ s3://bucket --delete && aws cloudfront create-invalidation --paths "/*"`
- Domain: `costofdelay.baconandeggs.dev` (or similar — naming is still open)
- Cost: ~$1–2/month

---

## 12. Time budget

Revised to **5–7 weekends** (~60–100 hours) to account for the wider input model and richer math/visualization.

| Phase | Estimate |
|---|---|
| Math layer + tests (with capacity growth + FIRE projection) | 1 weekend |
| AWS infra ("hello world" deploy) | 0.5 weekend |
| 3-page form with scroll gating | 1 weekend |
| Scene scaffolding + scrollama wiring | 0.5 weekend |
| Timeline D3 chart + per-scene transitions | 1.5 weekends |
| Counter + animations (dollar + years modes) | 0.5 weekend |
| Sandbox controls + state wiring | 0.75 weekend |
| Copy polish, disclaimers, footer, OG image | 0.5 weekend |
| Mobile responsive pass | 0.5 weekend |
| Final QA + deploy | 0.25 weekend |

Scrollytelling animation polish remains the long pole.

---

## 13. Risks

- **R1 — Input fatigue.** 10 inputs across 3 pages is a real ask before any payoff. Mitigation: scroll-gated UX is friction-light (no buttons, no clicks), each input has a single-line "why we ask" hint, defaults pre-populated where defensible (e.g., 7% return, 3% growth, 65 retirement).
- **R2 — Past-capacity ask is hard to answer accurately.** "What were you saving at 22?" is fuzzy for most users. Mitigation: hint says *"Realistic for that life stage. If you weren't saving at all, enter 0."* Sandbox lets users explore.
- **R3 — 4% rule is contested for non-US markets.** Footer discloses. Sandbox doesn't currently expose the multiplier (locked to 25× for now).
- **R4 — Inflation not modeled.** All figures today's CAD. Footer discloses with a plain-language inflation note.
- **R5 — Counter switching from dollars to years is a cognitive jolt.** Mitigation: scene N5 explicitly pivots (*"Now look at retirement age…"*) and the counter uses different typography for the years readout.
- **R6 — Scrollytelling on mobile is hard.** Sticky-positioned counter + scrolling text + below-it viz needs careful layout. Mitigation: dedicated mobile pass in the time budget plus a "best on desktop" caveat above ~640px.
- **R7 — AWS setup eats time budget.** Same as v0.3 R5. Hello-world bucket on day one.
- **R8 — D3 + React composition.** Standard pattern: React for layout + lifecycle, D3 owns inner SVG inside a ref'd container.
- **R9 — Narrative feels preachy.** Tone in the copy is observational, not prescriptive. Footer disclosure softens.

---

## 14. Open questions

1. **Project name.** "Cost of Delay" is the working title. Alternatives: "Started at 22", "Compound", "Time, Compounded".
2. **Visual identity.** Document-aesthetic vs. financial-app vs. data-journalism. Separate design pass.
3. **OG image.** Probably the N5 frame with the two retirement-age drop-lines and the "[N] years" headline.
4. **Sandbox — should annual expenses be a knob?** It changes the FIRE number, the largest lever in the model. Worth including but might dominate.
5. **Past-capacity default.** Pre-fill with a fraction of current capacity (e.g., 40%) or leave blank? Pre-fill reduces friction but biases the answer.

---

## 15. What carried over from v0.3 and what didn't

**Carried over:**
- AWS S3 + CloudFront deployment
- Next.js + TypeScript + Tailwind frontend stack
- D3 + Scrollama (no Recharts)
- Static export, no backend
- Bacon & eggs portfolio framing
- The sandbox-at-the-end pattern

**Changed:**
- **Inputs grew from 3 → 10**, across **3 scroll-gated form pages**.
- **Counterfactual is no longer fixed at age 22** — it's anchored to the user's actual `startWorkingAge`.
- **Math now includes annual capacity growth** (not flat contributions).
- **FIRE projection added** — actual and counterfactual retirement ages are now computed.
- **Headline reveal is in years**, not just dollars. Dollar gap is supporting.
- **Inflation now an explicit disclosure** (not modeled, footer callout).
- **Return rate is now a user input** (default 7%), not a constant.

---

## Changelog

- **v0.4 (2026-05-18)** — Input model expanded from 3 → 10 inputs across 3 scroll-gated form pages. Counterfactual anchor moved from fixed age 22 to user's actual `startWorkingAge`. Annual capacity-growth modeling added. FIRE projection (expenses × 25, projected retirement age) added. Reveal pivots: years-saved is now headline, dollar gap supports. Return rate is now a user input. Test count revised to 5. Time budget revised to 5–7 weekends.
- **v0.3 (2026-05-17)** — Full pivot. Stock backtester → scrollytelling FIRE explorable. Thesis locked: "cost of waiting compounds." Signature visual: Cost-of-Delay Counter + Age Dial. Pattern A scrollytelling (story → sandbox). Knobs live in end-of-scroll sandbox, not at start. D3 + Scrollama replaces Recharts. Python data layer removed entirely. Time budget revised up to 4–6 weekends.
- **v0.2 (2026-05-17)** — Stock backtester with CAD FX, AWS hosting, reveal button. Locked but never built.
- **v0.1 (2026-05-16)** — Initial stock backtester design with Vercel hosting and per-ticker native currency. Superseded.
