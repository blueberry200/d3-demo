import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { chipProductionData } from "./bar-chip-timeline-data";

const width = 900;
const height = 500;
const margin = { top: 40, right: 90, bottom: 80, left: 100 };

type ChipProductionData = (typeof chipProductionData)[number];

type TooltipData = ChipProductionData & {
  x: number;
  y: number;
  source: "bar" | "line";
};

export default function ChipProductionComboChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // scroll 時自動關閉 tooltip
  useEffect(() => {
    const handleScroll = () => setTooltip(null);

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const data = chipProductionData;
    const t = d3.transition().duration(750);

    // x 軸比例尺
    const x = d3
      .scaleBand()
      .domain(data.map((d) => String(d.year)))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    // 左側 y 軸比例尺
    const yProduction = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.totalProduction) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 右側 y 軸比例尺
    const yieldExtent = d3.extent(data, (d) => d.yieldRate);
    const minYield = (yieldExtent[0] ?? 0) - 3;
    const maxYield = (yieldExtent[1] ?? 100) + 3;
    const yYield = d3
      .scaleLinear()
      .domain([minYield, maxYield])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 畫 x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600");

    // 畫左側 y 軸
    svg
      .select<SVGGElement>(".y-production-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yProduction).ticks(5).tickFormat(d3.format(",")))
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "600");

    // 畫右側 y 軸
    svg
      .select<SVGGElement>(".y-yield-axis")
      .attr("transform", `translate(${width - margin.right}, 0)`)
      .call(
        d3
          .axisRight(yYield)
          .ticks(6)
          .tickFormat((d) => `${d}%`),
      )
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "600");

    // 畫長條圖：總生產量
    svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGRectElement, ChipProductionData>("rect")
      .data(data, (d) => String(d.year))
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(String(d.year)) ?? 0)
            .attr("y", yProduction(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("rx", 8)
            .attr("fill", "#60a5fa")
            .style("cursor", "pointer")
            .on("mouseenter", function () {
              d3.select(this).attr("fill", "#3b82f6");
            })
            .on("mouseleave", function () {
              d3.select(this).attr("fill", "#60a5fa");
            })
            .on("click", (event, d) => {
              event.stopPropagation();

              setTooltip({
                ...d,
                x: event.clientX,
                y: event.clientY,
                source: "bar",
              });
            }),
        (update) => update,
        (exit) =>
          exit
            .transition(t)
            .attr("y", yProduction(0))
            .attr("height", 0)
            .remove(),
      )
      .transition(t)
      .attr("x", (d) => x(String(d.year)) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", (d) => yProduction(d.totalProduction))
      .attr("height", (d) => yProduction(0) - yProduction(d.totalProduction));

    // 畫長條頂端標籤：總生產量
    svg
      .select<SVGGElement>(".bar-labels")
      .selectAll<SVGTextElement, ChipProductionData>("text")
      .data(data, (d) => String(d.year))
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => d3.format(",")(d.totalProduction))
      .transition(t)
      .attr("x", (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => yProduction(d.totalProduction) - 8);

    // 折線繪製函式
    const line = d3
      .line<ChipProductionData>()
      .x((d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2)
      .y((d) => yYield(d.yieldRate))
      .curve(d3.curveMonotoneX);

    // 畫折線：良率
    svg
      .select<SVGPathElement>(".yield-line")
      .datum(data)
      .transition(t)
      .attr("fill", "none")
      .attr("stroke", "#f97316")
      .attr("stroke-width", 3)
      .attr("d", line);

    // 畫折線頂點：良率
    svg
      .select<SVGGElement>(".yield-dots")
      .selectAll<SVGCircleElement, ChipProductionData>("circle")
      .data(data, (d) => String(d.year))
      .join("circle")
      .attr("fill", "#f97316")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function () {
        d3.select(this).attr("r", 7);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("r", 5);
      })
      .on("click", (event, d) => {
        event.stopPropagation();

        setTooltip({
          ...d,
          x: event.clientX,
          y: event.clientY,
          source: "line",
        });
      })
      .transition(t)
      .attr("cx", (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2)
      .attr("cy", (d) => yYield(d.yieldRate))
      .attr("r", 5);

    // 畫折線頂端標籤：良率
    svg
      .select<SVGGElement>(".yield-labels")
      .selectAll<SVGTextElement, ChipProductionData>("text")
      .data(data, (d) => String(d.year))
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#f97316")
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.yieldRate}%`)
      .transition(t)
      .attr("x", (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => yYield(d.yieldRate) - 12);

    // 畫左側 y 軸標題
    svg
      .select<SVGTextElement>(".production-axis-title")
      .text("總生產量")
      .attr("x", -height / 2)
      .attr("y", 28)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");

    // 畫右側 y 軸標題
    svg
      .select<SVGTextElement>(".yield-axis-title")
      .text("良率")
      .attr("x", -height / 2)
      .attr("y", width - 28)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#f97316")
      .style("font-size", "15px")
      .style("font-weight", "700");
  }, []);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">組合圖表模組-總生產量與良率</div>
        <div className="sample-subtitle">
          - 2016 至 2025 年晶片總生產量與良率 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="bars" />
        <g className="bar-labels" />

        <path className="yield-line" />
        <g className="yield-dots" />
        <g className="yield-labels" />

        <g className="x-axis" />
        <g className="y-production-axis" />
        <g className="y-yield-axis" />

        <text className="production-axis-title" />
        <text className="yield-axis-title" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">
            {tooltip.year} 年
            {tooltip.source === "bar" ? "｜總生產量" : "｜良率"}
          </div>

          <div>總生產量：{d3.format(",")(tooltip.totalProduction)}</div>
          <div>良率：{tooltip.yieldRate}%</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            此圖表使用直方圖呈現每年度晶片總生產量，並使用折線圖呈現同年度良率。
            點擊長條圖或折線頂點時，會顯示該年度的總生產量與良率。
          </div>
        </div>
      </div>
    </div>
  );
}
