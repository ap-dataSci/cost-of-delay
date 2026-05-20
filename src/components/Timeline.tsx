"use client";

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { NarrativeModel } from "@/lib/narrative";
import { pointAtAge, pointsThroughAge, type BalancePoint } from "@/lib/narrative";

type Props = {
  model: NarrativeModel;
  scene: 1 | 2 | 3 | 4 | 5;
  progress: number;
};

type ChartMarker = {
  id: string;
  point: BalancePoint;
  color: string;
  label: string;
  labelOffsetY: number;
  labelAnchor?: "start" | "end";
  labelOffsetX?: number;
};

type DropLine = {
  id: string;
  point: BalancePoint;
  color: string;
  label: string;
  labelOffsetY?: number;
  labelAnchor?: "start" | "end";
  labelOffsetX?: number;
};

type ChartState = {
  subtitle: string;
  xDomain: [number, number];
  yMax: number;
  // Early-only accumulation phase (startWorkingAge → currentAge). Shown in
  // N1–N4 as the "head start being built". Not shown in N5.
  earlyOnlyLine: BalancePoint[];
  // Additive counterfactual from currentAge forward (currentInvested +
  // earlyBalance, then currentMonthlyCapacity). Shown only in N5.
  counterfactualLine: BalancePoint[];
  actualLine: BalancePoint[];
  markers: ChartMarker[];
  dropLines: DropLine[];
  showFireLine: boolean;
  gapLine:
    | { actual: BalancePoint; counterfactual: BalancePoint; label?: string }
    | null;
  // Vertical reference line at the user's target retirement age. Shown in N5
  // so they can see where the actual/counterfactual FIRE ages land relative
  // to their stated ambition.
  targetAgeLine: { age: number; label: string } | null;
};

const fmtCADCompact = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const TRANSITION_MS = 520;

// Chart palette — dark editorial.
// Emerald: counterfactual / early-start path (luminous). Cream-ink: actual /
// your path. Amber-copper: the gap. FIRE line: pale gold.
const COLOR_EMERALD = "#34d399";
const COLOR_INK = "#f4ede1";
const COLOR_COPPER = "#f59e0b";
const COLOR_COPPER_DEEP = "#fbbf24";
const COLOR_FIRE = "#e7d9b4";
const COLOR_AXIS = "#3a4256";
const COLOR_GRID = "#1a212c";
const COLOR_TICK = "#3a4256";
const COLOR_TEXT_MUTED = "#a7a195";
const COLOR_TEXT_WHISPER = "#6b6759";

export default function Timeline({ model, scene, progress }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartState = useMemo(
    () => getChartState(model, scene, progress),
    [model, scene, progress],
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 780;
    const height = 520;
    const margin = { top: 36, right: 110, bottom: 76, left: 96 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${width} ${height}`);

    const root = svg
      .selectAll<SVGGElement, null>("g.timeline-root")
      .data([null])
      .join("g")
      .attr("class", "timeline-root")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(chartState.xDomain)
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, chartState.yMax])
      .nice()
      .range([innerHeight, 0]);

    const line = d3
      .line<BalancePoint>()
      .x((d) => x(d.age))
      .y((d) => y(d.balance))
      .curve(d3.curveMonotoneX);

    svg
      .selectAll<SVGTextElement, null>("text.chart-subtitle")
      .data([null])
      .join("text")
      .attr("class", "chart-subtitle")
      .attr("x", margin.left)
      .attr("y", 22)
      .attr("fill", COLOR_TEXT_MUTED)
      .attr("font-size", 12)
      .attr("font-style", "italic")
      .text(chartState.subtitle);

    root
      .selectAll<SVGGElement, null>("g.grid")
      .data([null])
      .join("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").attr("stroke", COLOR_GRID);
      });

    root
      .selectAll<SVGGElement, null>("g.x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(7)
          .tickSizeOuter(0)
          .tickFormat((d) => `${Math.round(Number(d))}`),
      )
      .call((g) => {
        g.select(".domain").attr("stroke", COLOR_AXIS);
        g.selectAll("line").attr("stroke", COLOR_TICK);
        g.selectAll("text")
          .attr("fill", COLOR_TEXT_MUTED)
          .attr("font-size", 11)
          .attr("font-family", "var(--font-mono), ui-monospace, monospace");
      });

    root
      .selectAll<SVGGElement, null>("g.y-axis")
      .data([null])
      .join("g")
      .attr("class", "y-axis")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSizeOuter(0)
          .tickFormat((d) => fmtCADCompact.format(Number(d))),
      )
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll("line").attr("stroke", COLOR_TICK);
        g.selectAll("text")
          .attr("fill", COLOR_TEXT_MUTED)
          .attr("font-size", 11)
          .attr("font-family", "var(--font-mono), ui-monospace, monospace");
      });

    renderAxisMarkers(root, x, innerHeight, model);
    renderFireLine(root, x, y, innerWidth, model, chartState);
    renderTargetAgeLine(root, x, innerHeight, chartState);
    renderGapLine(root, x, y, chartState);
    renderPath(
      root,
      x,
      y,
      line,
      chartState.earlyOnlyLine,
      "early-only",
      COLOR_EMERALD,
      "",
    );
    renderPath(
      root,
      x,
      y,
      line,
      chartState.counterfactualLine,
      "counterfactual",
      COLOR_EMERALD,
      "Early start",
    );
    renderPath(
      root,
      x,
      y,
      line,
      chartState.actualLine,
      "actual",
      COLOR_INK,
      "Your path",
    );
    renderMarkers(root, x, y, chartState.markers);
    renderDropLines(root, x, y, innerHeight, chartState.dropLines);

    svg
      .selectAll<SVGTextElement, null>("text.x-axis-title")
      .data([null])
      .join("text")
      .attr("class", "x-axis-title")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 14)
      .attr("text-anchor", "middle")
      .attr("fill", COLOR_TEXT_MUTED)
      .attr("font-size", 10)
      .attr("font-weight", 500)
      .attr("letter-spacing", "0.18em")
      .text("AGE");

    svg
      .selectAll<SVGTextElement, null>("text.y-axis-title")
      .data([null])
      .join("text")
      .attr("class", "y-axis-title")
      .attr("transform", `translate(20, ${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", COLOR_TEXT_MUTED)
      .attr("font-size", 10)
      .attr("font-weight", 500)
      .attr("letter-spacing", "0.18em")
      .text("BALANCE (CAD, TODAY)");
  }, [chartState, model]);

  return (
    <div className="relative w-full border-y border-[var(--color-rule-strong)] bg-[var(--color-paper-elevated)]/85 py-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_18px_40px_-20px_rgba(52,211,153,0.25),0_1px_30px_-12px_rgba(245,158,11,0.18)] backdrop-blur-sm lg:rounded-sm lg:border-y lg:border-x lg:py-2">
      {/* Tiny chart-corner numeral, like a wealth-report figure label. */}
      <span
        aria-hidden
        className="absolute right-3 top-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-whisper)]"
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
      >
        Fig. 01 · Trajectory
      </span>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Projected balance timeline comparing actual and counterfactual investing paths"
        className="h-auto max-h-[52vh] w-full overflow-visible lg:max-h-none"
      />
    </div>
  );
}

function renderPath(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  line: d3.Line<BalancePoint>,
  points: BalancePoint[],
  className: string,
  color: string,
  label: string,
) {
  const visible = points.length > 1;
  const pathData = visible ? line(points) : null;
  const end = points.at(-1) ?? null;

  root
    .selectAll<SVGPathElement, null>(`path.${className}-line`)
    .data([null])
    .join("path")
    .attr("class", `${className}-line`)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("d", pathData)
    .style("opacity", visible ? 1 : 0);

  root
    .selectAll<SVGTextElement, null>(`text.${className}-label`)
    .data([null])
    .join("text")
    .attr("class", `${className}-label`)
    .attr("fill", color)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("x", end ? x(end.age) + 8 : 0)
    .attr("y", end ? y(end.balance) + 4 : 0)
    .style("opacity", visible && end ? 1 : 0)
    .text(label);
}

function renderAxisMarkers(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  innerHeight: number,
  model: NarrativeModel,
) {
  const markers = [
    {
      id: "started-working",
      age: model.inputs.startWorkingAge,
      label: "Started working",
      muted: false,
      offset: 26,
    },
    {
      id: "today",
      age: model.inputs.currentAge,
      label: "Today",
      muted: false,
      offset: 26,
    },
    {
      id: "started-investing",
      age: model.inputs.startInvestingAge,
      label: "Started investing",
      muted: true,
      offset: 42,
    },
  ].filter(
    (marker) =>
      marker.id !== "started-investing" ||
      model.inputs.startInvestingAge > model.inputs.startWorkingAge,
  );

  const groups = root
    .selectAll<SVGGElement, (typeof markers)[number]>("g.axis-marker")
    .data(markers, (d) => d.id)
    .join(
      (enter) => enter.append("g").attr("class", "axis-marker"),
      (update) => update,
      (exit) => exit.remove(),
    );

  groups.each(function render(marker) {
    const group = d3.select(this);
    group
      .selectAll<SVGLineElement, null>("line")
      .data([null])
      .join("line")
      .attr("x1", x(marker.age))
      .attr("x2", x(marker.age))
      .attr("y1", innerHeight)
      .attr("y2", innerHeight + 8)
      .attr("stroke", marker.muted ? COLOR_TICK : COLOR_TEXT_MUTED)
      .attr("stroke-width", 1.5);

    group
      .selectAll<SVGTextElement, null>("text")
      .data([null])
      .join("text")
      .attr("x", x(marker.age))
      .attr("y", innerHeight + marker.offset)
      .attr("text-anchor", "middle")
      .attr("fill", marker.muted ? COLOR_TEXT_WHISPER : COLOR_TEXT_MUTED)
      .attr("font-size", 10)
      .attr("font-style", "italic")
      .text(marker.label);
  });
}

function renderFireLine(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  innerWidth: number,
  model: NarrativeModel,
  chartState: ChartState,
) {
  const data = chartState.showFireLine ? [model.fireTarget] : [];

  root
    .selectAll<SVGLineElement, number>("line.fire-line")
    .data(data)
    .join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "fire-line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d))
          .attr("stroke", COLOR_FIRE)
          .attr("stroke-dasharray", "4 5")
          .attr("stroke-width", 1.5)
          .style("opacity", 0),
      (update) => update,
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    )
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("x2", innerWidth)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .style("opacity", 1);

  root
    .selectAll<SVGTextElement, number>("text.fire-label")
    .data(data)
    .join(
      (enter) =>
        enter
          .append("text")
          .attr("class", "fire-label")
          .attr("text-anchor", "start")
          .attr("fill", COLOR_FIRE)
          .attr("font-size", 11)
          .attr("font-weight", 600)
          .attr("font-family", "var(--font-mono), ui-monospace, monospace")
          .style("opacity", 0),
      (update) => update.attr("text-anchor", "start"),
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    )
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("x", 4)
    .attr("y", (d) => y(d) - 8)
    .style("opacity", 1)
    .text(`FIRE number ${fmtCADCompact.format(model.fireTarget)}`);
}

function renderTargetAgeLine(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  innerHeight: number,
  chartState: ChartState,
) {
  const data = chartState.targetAgeLine ? [chartState.targetAgeLine] : [];

  const groups = root
    .selectAll<SVGGElement, NonNullable<ChartState["targetAgeLine"]>>(
      "g.target-age-line",
    )
    .data(data)
    .join(
      (enter) =>
        enter.append("g").attr("class", "target-age-line").style("opacity", 0),
      (update) => update,
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    );

  groups
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  groups.each(function render(line) {
    const groupSelection = d3.select(this);

    groupSelection
      .selectAll<SVGLineElement, null>("line")
      .data([null])
      .join("line")
      .attr("stroke", COLOR_INK)
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1.25)
      .attr("stroke-dasharray", "2 6")
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeCubicOut)
      .attr("x1", x(line.age))
      .attr("x2", x(line.age))
      .attr("y1", 0)
      .attr("y2", innerHeight);

    // Small notch/circle at the bottom of the line so it reads as a tick.
    groupSelection
      .selectAll<SVGCircleElement, null>("circle")
      .data([null])
      .join("circle")
      .attr("fill", COLOR_INK)
      .attr("fill-opacity", 0.55)
      .attr("r", 2.5)
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeCubicOut)
      .attr("cx", x(line.age))
      .attr("cy", innerHeight);

    groupSelection
      .selectAll<SVGTextElement, null>("text")
      .data([null])
      .join("text")
      .attr("fill", COLOR_INK)
      .attr("fill-opacity", 0.7)
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("font-family", "var(--font-mono), ui-monospace, monospace")
      .attr("text-anchor", "start")
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeCubicOut)
      .attr("x", x(line.age) + 6)
      .attr("y", 12)
      .text(line.label);
  });
}

function renderGapLine(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  chartState: ChartState,
) {
  const data = chartState.gapLine ? [chartState.gapLine] : [];

  const group = root
    .selectAll<SVGGElement, NonNullable<ChartState["gapLine"]>>("g.gap-line")
    .data(data)
    .join(
      (enter) => enter.append("g").attr("class", "gap-line").style("opacity", 0),
      (update) => update,
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    );

  group
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  group.each(function render(gap) {
    const groupSelection = d3.select(this);
    groupSelection
      .selectAll<SVGLineElement, null>("line")
      .data([null])
      .join("line")
      .attr("stroke", COLOR_COPPER)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3 4")
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeCubicOut)
      .attr("x1", x(gap.actual.age))
      .attr("x2", x(gap.counterfactual.age))
      .attr("y1", y(gap.actual.balance))
      .attr("y2", y(gap.counterfactual.balance));

    groupSelection
      .selectAll<SVGTextElement, null>("text")
      .data([null])
      .join("text")
      .attr("fill", COLOR_COPPER_DEEP)
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("font-family", "var(--font-mono), ui-monospace, monospace")
      .attr("text-anchor", "end")
      .transition()
      .duration(TRANSITION_MS)
      .ease(d3.easeCubicOut)
      .attr("x", x(gap.actual.age) - 10)
      .attr("y", (y(gap.actual.balance) + y(gap.counterfactual.balance)) / 2)
      .text(gap.label ?? "The gap");
  });
}

function renderMarkers(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  markers: ChartMarker[],
) {
  const groups = root
    .selectAll<SVGGElement, ChartMarker>("g.chart-marker")
    .data(markers, (d) => d.id)
    .join(
      (enter) => {
        const group = enter.append("g").attr("class", "chart-marker").style("opacity", 0);
        group.append("circle").attr("r", 0);
        group.append("text");
        return group;
      },
      (update) => update,
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    );

  groups
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("transform", (d) => `translate(${x(d.point.age)},${y(d.point.balance)})`)
    .style("opacity", 1);

  groups
    .select("circle")
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("r", 5)
    .attr("fill", (d) => d.color);

  groups
    .select("text")
    .attr("font-size", 11)
    .attr("font-weight", 600)
    .attr("font-family", "var(--font-mono), ui-monospace, monospace")
    .attr("text-anchor", (d) => d.labelAnchor ?? "start")
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("x", (d) => d.labelOffsetX ?? (d.labelAnchor === "end" ? -10 : 10))
    .attr("y", (d) => d.labelOffsetY)
    .attr("fill", (d) => d.color)
    .text((d) => d.label);
}

function renderDropLines(
  root: d3.Selection<SVGGElement, null, SVGSVGElement, unknown>,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  innerHeight: number,
  dropLines: DropLine[],
) {
  const groups = root
    .selectAll<SVGGElement, DropLine>("g.drop-line")
    .data(dropLines, (d) => d.id)
    .join(
      (enter) => {
        const group = enter.append("g").attr("class", "drop-line").style("opacity", 0);
        group.append("line");
        group.append("circle");
        group.append("text");
        return group;
      },
      (update) => update,
      (exit) =>
        exit
          .transition()
          .duration(TRANSITION_MS)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .remove(),
    );

  groups
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .style("opacity", 1);

  groups
    .select("line")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1.5)
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("x1", (d) => x(d.point.age))
    .attr("x2", (d) => x(d.point.age))
    .attr("y1", (d) => y(d.point.balance))
    .attr("y2", innerHeight)
    .attr("stroke", (d) => d.color);

  groups
    .select("circle")
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr("cx", (d) => x(d.point.age))
    .attr("cy", (d) => y(d.point.balance))
    .attr("r", 5)
    .attr("fill", (d) => d.color);

  groups
    .select("text")
    .attr("font-size", 11)
    .attr("font-weight", 600)
    .attr("font-family", "var(--font-mono), ui-monospace, monospace")
    .attr("text-anchor", (d) => d.labelAnchor ?? "start")
    .transition()
    .duration(TRANSITION_MS)
    .ease(d3.easeCubicOut)
    .attr(
      "x",
      (d) =>
        x(d.point.age) +
        (d.labelOffsetX ?? (d.labelAnchor === "end" ? -10 : 10)),
    )
    .attr("y", (d) => y(d.point.balance) + (d.labelOffsetY ?? -12))
    .attr("fill", (d) => d.color)
    .text((d) => d.label);
}

function getChartState(
  model: NarrativeModel,
  scene: 1 | 2 | 3 | 4 | 5,
  rawProgress: number,
): ChartState {
  const progress = clamp(rawProgress);
  const { inputs, maxAge } = model;
  const yearsToToday = Math.max(inputs.currentAge - inputs.startWorkingAge, 1);
  const presentXDomain = presentDayXDomain(inputs.startWorkingAge, inputs.currentAge);
  const actualToday = {
    age: inputs.currentAge,
    balance: inputs.currentInvested,
  };
  const combinedToday = {
    age: inputs.currentAge,
    balance: model.counterfactualToday,
  };
  // N1–N3 chart is sized to the early-only line's max (smaller). N4 rescales
  // up to fit the additive combined total. That rescale is the visual
  // reveal of "your savings stacked on top".
  const earlyPhaseYMaxValue = earlyPhaseYMax(model.earlyOnlyPoints);
  const revealYMaxValue = revealYMax(
    model.counterfactualToday,
    inputs.currentInvested,
    inputs.pastMonthlyCapacity,
  );

  if (scene === 1) {
    const rewindAge =
      inputs.currentAge - yearsToToday * Math.max(Math.min(progress, 1), 0);
    return {
      subtitle: `Age ${Math.round(rewindAge)}. Nothing invested yet.`,
      xDomain: presentXDomain,
      yMax: earlyPhaseYMaxValue,
      earlyOnlyLine: [model.earlyOnlyPoints[0]],
      counterfactualLine: [],
      actualLine: [],
      markers: [
        {
          id: "start",
          point: { age: rewindAge, balance: 0 },
          color: COLOR_EMERALD,
          label:
            progress > 0.96
              ? `$0 at ${inputs.startWorkingAge}`
              : `Age ${Math.round(rewindAge)}`,
          labelOffsetY: -12,
        },
      ],
      dropLines: [],
      showFireLine: false,
      gapLine: null,
      targetAgeLine: null,
    };
  }

  if (scene === 2) {
    const ageLimit =
      inputs.startWorkingAge + yearsToToday * Math.max(progress, 0.12);
    const earlyOnlyLine = pointsThroughAge(model.earlyOnlyPoints, ageLimit);
    return {
      subtitle: `${fmtCADCompact.format(inputs.pastMonthlyCapacity)}/month starts compounding at ${inputs.startWorkingAge}`,
      xDomain: presentXDomain,
      yMax: earlyPhaseYMaxValue,
      earlyOnlyLine,
      counterfactualLine: [],
      actualLine: [],
      markers: markerAtEnd(earlyOnlyLine, COLOR_EMERALD, "Early start begins"),
      dropLines: [],
      showFireLine: false,
      gapLine: null,
      targetAgeLine: null,
    };
  }

  if (scene === 3) {
    const ageLimit =
      inputs.startWorkingAge + yearsToToday * (0.72 + progress * 0.28);
    const earlyOnlyLine = pointsThroughAge(model.earlyOnlyPoints, ageLimit);
    return {
      subtitle: "The line bends slowly, then all at once",
      xDomain: presentXDomain,
      yMax: earlyPhaseYMaxValue,
      earlyOnlyLine,
      counterfactualLine: [],
      actualLine: [],
      markers: markerAtEnd(earlyOnlyLine, COLOR_EMERALD, "Compounding"),
      dropLines: [],
      showFireLine: false,
      gapLine: null,
      targetAgeLine: null,
    };
  }

  if (scene === 4) {
    // Three progressive reveals at age = currentAge:
    //   ≥0.25  "You: $current"        (black)
    //   ≥0.55  "Combined: $total"     (blue, stacked on top)
    //   ≥0.55  vertical "Head start"  gap line connecting the two
    const markers: ChartMarker[] = [];
    if (progress >= 0.25) {
      markers.push({
        id: "you-today",
        point: actualToday,
        color: COLOR_INK,
        label: `You: ${fmtCADCompact.format(actualToday.balance)}`,
        labelOffsetY: 20,
        labelAnchor: "end",
        labelOffsetX: -10,
      });
    }
    if (progress >= 0.55) {
      markers.push({
        id: "combined-today",
        point: combinedToday,
        color: COLOR_EMERALD,
        label: `Combined: ${fmtCADCompact.format(combinedToday.balance)}`,
        labelOffsetY: -14,
        labelAnchor: "end",
        labelOffsetX: -10,
      });
    }

    return {
      subtitle: `Head start: ${fmtCADCompact.format(model.headStart)}`,
      xDomain: presentXDomain,
      yMax: revealYMaxValue,
      earlyOnlyLine: model.earlyOnlyPoints,
      counterfactualLine: [],
      actualLine: [],
      markers,
      dropLines: [],
      showFireLine: false,
      gapLine:
        progress >= 0.55
          ? {
              actual: actualToday,
              counterfactual: combinedToday,
              label: `Head start: ${fmtCADCompact.format(model.headStart)}`,
            }
          : null,
      targetAgeLine: null,
    };
  }

  // N5: two forward-projected lines from currentAge to retirement, no early-
  // only line. Both lines share the same monthly capacity. The only
  // difference is the counterfactual's larger starting principal.
  const yearsForward = Math.max(maxAge - inputs.currentAge, 1);
  const ageLimit = inputs.currentAge + yearsForward * (0.45 + progress * 0.55);
  const counterfactualLine = pointsThroughAge(model.counterfactualPoints, ageLimit);
  const actualLine = pointsThroughAge(model.actualPoints, ageLimit);

  return {
    subtitle:
      model.yearsGap !== null
        ? `${Math.abs(model.yearsGap)}-year gap at FIRE`
        : "One path doesn't reach FIRE in the projection window",
    xDomain: [inputs.startWorkingAge, maxAge],
    yMax: model.yMax,
    earlyOnlyLine: [],
    counterfactualLine,
    actualLine,
    markers: [],
    dropLines: progress > 0.35 ? retirementDropLines(model) : [],
    showFireLine: true,
    gapLine: null,
    targetAgeLine: {
      age: inputs.targetRetirementAge,
      label: `Target · age ${inputs.targetRetirementAge}`,
    },
  };
}

function markerAtEnd(
  points: BalancePoint[],
  color: string,
  label: string,
): ChartMarker[] {
  const point = points.at(-1);
  return point
    ? [
        {
          id: label,
          point,
          color,
          label,
          labelOffsetY: -12,
        },
      ]
    : [];
}

function retirementDropLines(model: NarrativeModel): DropLine[] {
  const lines: DropLine[] = [];
  // Both points land near the FIRE-target balance, so vertical stacking with
  // y-12 would overlap. Anchor the early-start (left point) label to its
  // *left* and the actual (right point) label to its *right*, and offset
  // vertically in opposite directions so they never collide.
  if (model.counterfactualRetirementAge !== null) {
    const point = pointAtAge(
      model.counterfactualPoints,
      model.counterfactualRetirementAge,
    );
    if (point) {
      lines.push({
        id: "counterfactual-fire",
        point,
        color: COLOR_EMERALD,
        label: `Early-start FIRE · age ${Math.round(model.counterfactualRetirementAge)}`,
        labelAnchor: "end",
        labelOffsetX: -10,
        labelOffsetY: -16,
      });
    }
  }
  if (model.actualRetirementAge !== null) {
    const point = pointAtAge(model.actualPoints, model.actualRetirementAge);
    if (point) {
      lines.push({
        id: "actual-fire",
        point,
        color: COLOR_INK,
        label: `Your FIRE · age ${Math.round(model.actualRetirementAge)}`,
        labelAnchor: "start",
        labelOffsetX: 10,
        labelOffsetY: 22,
      });
    }
  }
  return lines;
}

function presentDayXDomain(startWorkingAge: number, currentAge: number): [number, number] {
  const right = Math.max(currentAge, startWorkingAge + 4);
  return [startWorkingAge, right];
}

function earlyPhaseYMax(earlyOnlyPoints: BalancePoint[]): number {
  const max = earlyOnlyPoints.reduce(
    (m, p) => Math.max(m, p.balance),
    0,
  );
  return niceUpperBound(Math.max(max, 1_000) * 1.35);
}

function revealYMax(
  counterfactualToday: number,
  currentInvested: number,
  pastMonthlyCapacity: number,
): number {
  const anchor = Math.max(
    counterfactualToday,
    currentInvested,
    pastMonthlyCapacity * 12,
    1_000,
  );
  return niceUpperBound(anchor * 1.35);
}

function niceUpperBound(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 5
          ? 5
          : 10;
  return nice * magnitude;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
