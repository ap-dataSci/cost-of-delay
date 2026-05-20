import type { StartInputs, Trajectory } from "./types";

/**
 * Annual future-value factor for $1/year of contributions delivered monthly,
 * compounded monthly at annual rate r. Used to roll a year's worth of monthly
 * deposits into a single end-of-year balance contribution.
 *
 *   annuityFactor(r) = [(1 + r/12)^12 - 1] / (r/12)
 *
 * At r = 0 it degenerates to 12 (twelve flat monthly deposits, no growth).
 */
function annuityFactorAnnualContribution(annualRate: number): number {
  if (annualRate === 0) return 12;
  const monthlyRate = annualRate / 12;
  return (Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate;
}

/**
 * Future value of one year of monthly contributions totaling `annualContribution`,
 * compounded monthly within the year at annual rate `r`.
 */
export function annualContributionFV(annualContribution: number, annualRate: number): number {
  return (annualContribution / 12) * annuityFactorAnnualContribution(annualRate);
}

/**
 * FIRE number under the 4% rule.
 */
export function fireNumber(annualExpenses: number): number {
  return annualExpenses * 25;
}

/**
 * Build a balance series, year by year, with an annually-growing contribution capacity.
 *
 *   balance[0]      = startingPrincipal
 *   capacity[t]     = baseAnnualCapacity * (1 + g)^t
 *   balance[t+1]    = balance[t] * (1 + r) + annualContributionFV(capacity[t], r)
 *
 * The series stops the year balance crosses `fireTarget` (if provided) or after
 * `maxYears` years, whichever comes first.
 *
 * Returns `{ balanceByYear, retirementAge }` where retirementAge is the age at
 * which balance first reaches fireTarget, or null if it never does.
 */
export function projectTrajectory(params: {
  startingAge: number;
  startingPrincipal: number;
  baseAnnualCapacity: number;
  savingsGrowthRate: number;
  investmentReturnRate: number;
  fireTarget: number | null;
  maxYears: number;
}): Trajectory {
  const {
    startingAge,
    startingPrincipal,
    baseAnnualCapacity,
    savingsGrowthRate,
    investmentReturnRate,
    fireTarget,
    maxYears,
  } = params;

  const balanceByYear: number[] = [startingPrincipal];
  let retirementAge: number | null = null;

  if (fireTarget !== null && startingPrincipal >= fireTarget) {
    retirementAge = startingAge;
  }

  // Effective annual growth from monthly compounding. Keeps the model
  // consistent: contributions compound monthly within a year (via
  // annualContributionFV), and the prior balance also grows at the
  // monthly-compounded annual rate, not the nominal rate.
  const effectiveAnnualGrowth = Math.pow(1 + investmentReturnRate / 12, 12);

  let balance = startingPrincipal;
  for (let t = 0; t < maxYears; t++) {
    const capacityThisYear = baseAnnualCapacity * Math.pow(1 + savingsGrowthRate, t);
    balance =
      balance * effectiveAnnualGrowth +
      annualContributionFV(capacityThisYear, investmentReturnRate);
    balanceByYear.push(balance);

    if (fireTarget !== null && retirementAge === null && balance >= fireTarget) {
      retirementAge = startingAge + t + 1;
    }
  }

  return { balanceByYear, retirementAge };
}

/**
 * Project the user's actual trajectory: today forward, starting from
 * current invested total and current monthly capacity.
 */
export function actualTrajectory(inputs: StartInputs, maxYears = 60): Trajectory {
  return projectTrajectory({
    startingAge: inputs.currentAge,
    startingPrincipal: inputs.currentInvested,
    baseAnnualCapacity: inputs.currentMonthlyCapacity * 12,
    savingsGrowthRate: inputs.savingsGrowthRate,
    investmentReturnRate: inputs.investmentReturnRate,
    fireTarget: fireNumber(inputs.annualExpenses),
    maxYears,
  });
}

/**
 * Early-only accumulation phase: startWorkingAge → currentAge, with
 * pastMonthlyCapacity contributions and zero starting principal. Used for the
 * N1–N3 visualizations and as the head-start that feeds the counterfactual.
 *
 * Returns a single-point trajectory [0] when currentAge <= startWorkingAge.
 */
export function earlyOnlyTrajectory(inputs: StartInputs): Trajectory {
  const yearsBeforeNow = inputs.currentAge - inputs.startWorkingAge;
  if (yearsBeforeNow <= 0) {
    return { balanceByYear: [0], retirementAge: null };
  }
  return projectTrajectory({
    startingAge: inputs.startWorkingAge,
    startingPrincipal: 0,
    baseAnnualCapacity: inputs.pastMonthlyCapacity * 12,
    savingsGrowthRate: inputs.savingsGrowthRate,
    investmentReturnRate: inputs.investmentReturnRate,
    fireTarget: null,
    maxYears: yearsBeforeNow,
  });
}

/**
 * Counterfactual = "what if you'd also invested early, on top of everything you
 * actually did." Starts at currentAge with principal = currentInvested +
 * earlyBalance, and contributes currentMonthlyCapacity from then on (identical
 * to the actual trajectory after currentAge — the only difference is the
 * head-start principal).
 */
export function counterfactualTrajectory(inputs: StartInputs, maxYears = 60): Trajectory {
  const earlyBalance = earlyOnlyBalanceAtCurrentAge(inputs);
  return projectTrajectory({
    startingAge: inputs.currentAge,
    startingPrincipal: inputs.currentInvested + earlyBalance,
    baseAnnualCapacity: inputs.currentMonthlyCapacity * 12,
    savingsGrowthRate: inputs.savingsGrowthRate,
    investmentReturnRate: inputs.investmentReturnRate,
    fireTarget: fireNumber(inputs.annualExpenses),
    maxYears,
  });
}

/**
 * The "what you'd have at your current age" total under the counterfactual —
 * i.e. your current invested balance plus the bonus accumulated by hypothetical
 * early investing. Revealed in scene N4.
 */
export function counterfactualAtCurrentAge(inputs: StartInputs): number {
  return inputs.currentInvested + earlyOnlyBalanceAtCurrentAge(inputs);
}

function earlyOnlyBalanceAtCurrentAge(inputs: StartInputs): number {
  const series = earlyOnlyTrajectory(inputs).balanceByYear;
  return series[series.length - 1] ?? 0;
}

/**
 * The two cost-of-delay numbers shown in the reveal.
 *
 *   dollarGap = counterfactual balance at today's age - current invested
 *   yearsGap  = actual retirement age - counterfactual retirement age
 *
 * yearsGap is null if either trajectory never reaches FIRE within its window.
 */
export function costOfDelay(inputs: StartInputs): {
  dollarGap: number;
  yearsGap: number | null;
  actualRetirementAge: number | null;
  counterfactualRetirementAge: number | null;
} {
  const actual = actualTrajectory(inputs);
  const counterfactual = counterfactualTrajectory(inputs);
  const counterfactualToday = counterfactualAtCurrentAge(inputs);

  const dollarGap = counterfactualToday - inputs.currentInvested;
  const yearsGap =
    actual.retirementAge !== null && counterfactual.retirementAge !== null
      ? actual.retirementAge - counterfactual.retirementAge
      : null;

  return {
    dollarGap,
    yearsGap,
    actualRetirementAge: actual.retirementAge,
    counterfactualRetirementAge: counterfactual.retirementAge,
  };
}
