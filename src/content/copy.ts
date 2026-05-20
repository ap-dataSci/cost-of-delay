export const copy = {
  intro: {
    eyebrow: "A thought experiment",
    title: "How much did waiting cost you?",
    intro:
      "About the importance of investing early. If you've been doing that already, this isn't for you. But if you waited a few years after you started earning to start investing for your future, this is. We'll run some quick math and put a number on the gap. In dollars, and in years.",
    microDisclaimer: "Not advice. Just compound interest.",
  },
  form: {
    page1: {
      heading: "Where you are now",
      subheading: "The starting point we'll project forward from.",
      fields: {
        currentAge: {
          label: "Your age",
          placeholder: "e.g. 32",
          unit: "years",
        },
        currentInvested: {
          label: "What you've invested so far",
          placeholder: "e.g. 25000",
          unit: "CAD",
          hint: "Across all accounts: TFSA, RRSP, non-registered. Rough number is fine.",
        },
        currentMonthlyCapacity: {
          label: "What you can invest each month",
          placeholder: "e.g. 800",
          unit: "CAD / month",
          hint: "Realistic, not aspirational.",
        },
      },
      scrollHint: "Good. Now your timeline.",
    },
    page2: {
      heading: "Your timeline",
      subheading: "The gap between earning and investing.",
      fields: {
        startWorkingAge: {
          label: "Age you started working full-time",
          placeholder: "e.g. 22",
          unit: "years",
        },
        pastMonthlyCapacity: {
          label: "Monthly savings capacity back then",
          placeholder: "e.g. 200",
          unit: "CAD / month",
          hint: "Realistic for that life stage. If you weren't saving at all, enter 0.",
        },
        startInvestingAge: {
          label: "Age you actually started investing",
          placeholder: "e.g. 28",
          unit: "years",
          hint: "If you haven't started yet, enter your current age.",
        },
        targetRetirementAge: {
          label: "Target retirement age",
          placeholder: "e.g. 60",
          unit: "years",
          hint: "Your ambition. We'll show how it compares to what the math says.",
        },
      },
      scrollHint: "Last section. The assumptions.",
    },
    page3: {
      heading: "Long-term assumptions",
      subheading: "What the next few decades look like.",
      fields: {
        annualExpenses: {
          label: "Annual expenses in retirement (today's CAD)",
          placeholder: "e.g. 50000",
          unit: "CAD / year",
          hint: "Your FIRE number is expenses × 25 (the 4% rule).",
        },
        savingsGrowthRate: {
          label: "Annual growth in savings capacity",
          placeholder: "e.g. 3",
          unit: "% / year",
          hint: "How much your savings ability grows per year as income rises. 3–5% is typical.",
        },
        investmentReturnRate: {
          label: "Expected investment return",
          placeholder: "e.g. 7",
          unit: "% / year",
          hint: "Globally diversified equity funds like XEQT have historically returned 7%+ nominal over multi-decade windows.",
        },
      },
      scrollHint: "That's all of it. Let's see what it adds up to.",
    },
    invalidHint: "Complete the fields above to continue.",
  },
  narrative: {
    n1: {
      text: (startWorkingAge: number) =>
        `Rewind. You're ${startWorkingAge}. First real paycheck. Nothing invested yet.`,
    },
    n2: {
      text: (pastMonthlyCapacity: number, returnRate: number) =>
        `What if you'd put even $${pastMonthlyCapacity.toLocaleString("en-CA")}/month into a globally-diversified index fund (XEQT, ${(returnRate * 100).toFixed(1)}% nominal) from day one?`,
    },
    n3: {
      text: "The first decade looks unremarkable. The second doesn't.",
      annotation: "This is compounding. Boring until it isn't.",
    },
    n4: {
      text: (currentAge: number, combined: string, actual: string, headStart: string) =>
        `You're ${currentAge} now. You have ${actual}. If you'd also been investing early, you'd have ${combined}. That's a ${headStart} head start.`,
    },
    n5: {
      text: (
        fireNumber: string,
        actualRetirementAge: number,
        counterfactualRetirementAge: number,
        yearsGap: number,
      ) =>
        `You'll hit ${fireNumber} at ${actualRetirementAge}. With the head start, you'd have got there at ${counterfactualRetirementAge}. That's ${yearsGap} years earlier.`,
    },
    n6: {
      text: "Try different versions of yourself. Different start ages. Different growth assumptions.",
    },
  },
  footer: {
    disclaimerBullets: [
      "Educational only. Not financial advice.",
      "All figures in today's CAD. Inflation is not modeled (long-run Canadian inflation has averaged ~2%).",
      "The FIRE number uses the 4% safe-withdrawal-rate heuristic, which is contested for non-US markets.",
      "Cost-of-delay numbers are approximate by design.",
    ],
    credit: "Built by bacon & eggs.",
  },
};
