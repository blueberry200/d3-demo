import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { aiUsageData } from "./ai-office-boxplot-data";

const width = 900;
const height = 500;

const margin = {
  top: 30,
  right: 40,
  bottom: 80,
  left: 80,
};

type BoxPlotStat = {
  region: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

type TooltipData = BoxPlotStat & {
  x: number;
  y: number;
};

export default function AIUsageBoxPlot() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // scroll 時自動關閉 tooltip
  useEffect(() => {
    const handleScroll = () => {
      setTooltip(null);
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const regions = ["北部", "中部", "南部", "東部"];

    // 計算盒狀圖統計值
    const stats: BoxPlotStat[] = regions.map((region) => {
      const values = aiUsageData
        .filter((d) => d.region === region)
        .map((d) => d.usageRate)
        .sort(d3.ascending);

      return {
        region,
        min: d3.min(values) ?? 0,
        q1: d3.quantile(values, 0.25) ?? 0,
        median: d3.quantile(values, 0.5) ?? 0,
        q3: d3.quantile(values, 0.75) ?? 0,
        max: d3.max(values) ?? 0,
      };
    });

    // x 軸比例尺
    const x = d3
      .scaleBand()
      .domain(regions)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    // y 軸比例尺
    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "700");

    // y 軸
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "700");

    const boxGroup = svg
      .select<SVGGElement>(".boxes")
      .selectAll<SVGGElement, BoxPlotStat>("g")
      .data(stats, (d) => d.region)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        // 當盒狀圖被點擊時，顯示 Tooltip
        event.stopPropagation();

        setTooltip({
          ...d,
          x: event.clientX,
          y: event.clientY,
        });
      });

    // 盒子垂直中線
    boxGroup
      .selectAll<SVGLineElement, BoxPlotStat>(".whisker")
      .data((d) => [d])
      .join("line")
      .attr("class", "whisker")
      .attr("x1", (d) => (x(d.region) ?? 0) + x.bandwidth() / 2)
      .attr("x2", (d) => (x(d.region) ?? 0) + x.bandwidth() / 2)
      .attr("y1", (d) => y(d.min))
      .attr("y2", (d) => y(d.max))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

    // 盒子矩形
    boxGroup
      .selectAll<SVGRectElement, BoxPlotStat>(".box")
      .data((d) => [d])
      .join("rect")
      .attr("class", "box")
      .attr("x", (d) => x(d.region) ?? 0)
      .attr("y", (d) => y(d.q3))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(d.q1) - y(d.q3))
      .attr("fill", "#60a5fa")
      .attr("fill-opacity", 0.35)
      .attr("stroke", "#60a5fa")
      .attr("stroke-width", 2)
      .on("mouseenter", function () {
        d3.select(this).attr("fill-opacity", 0.55);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill-opacity", 0.35);
      });

    // 中位數
    boxGroup
      .selectAll<SVGLineElement, BoxPlotStat>(".median")
      .data((d) => [d])
      .join("line")
      .attr("class", "median")
      .attr("x1", (d) => x(d.region) ?? 0)
      .attr("x2", (d) => (x(d.region) ?? 0) + x.bandwidth())
      .attr("y1", (d) => y(d.median))
      .attr("y2", (d) => y(d.median))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 3)
      .style("pointer-events", "none");

    // Max 橫線
    boxGroup
      .selectAll<SVGLineElement, BoxPlotStat>(".max-line")
      .data((d) => [d])
      .join("line")
      .attr("class", "max-line")
      .attr("x1", (d) => (x(d.region) ?? 0) + x.bandwidth() * 0.25)
      .attr("x2", (d) => (x(d.region) ?? 0) + x.bandwidth() * 0.75)
      .attr("y1", (d) => y(d.max))
      .attr("y2", (d) => y(d.max))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

    // Min 橫線
    boxGroup
      .selectAll<SVGLineElement, BoxPlotStat>(".min-line")
      .data((d) => [d])
      .join("line")
      .attr("class", "min-line")
      .attr("x1", (d) => (x(d.region) ?? 0) + x.bandwidth() * 0.25)
      .attr("x2", (d) => (x(d.region) ?? 0) + x.bandwidth() * 0.75)
      .attr("y1", (d) => y(d.min))
      .attr("y2", (d) => y(d.min))
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

    // 中位數標籤
    svg
      .select<SVGGElement>(".middle-labels")
      .selectAll<SVGTextElement, BoxPlotStat>("text")
      .data(stats)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("dy", "0.35em")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.median.toFixed(0)}%`)
      .attr("x", (d) => (x(d.region) ?? 0) - x.bandwidth() / 4)
      .attr("y", (d) => y(d.median));

    // max 標籤
    svg
      .select<SVGGElement>(".top-labels")
      .selectAll<SVGTextElement, BoxPlotStat>("text")
      .data(stats)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("dy", "0.35em")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.max.toFixed(0)}%`)
      .attr("x", (d) => (x(d.region) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.max) - 14);

    // min 標籤
    svg
      .select<SVGGElement>(".bottom-labels")
      .selectAll<SVGTextElement, BoxPlotStat>("text")
      .data(stats)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("dy", "0.35em")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.min.toFixed(0)}%`)
      .attr("x", (d) => (x(d.region) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.min) + 14);

    // y 軸標題
    svg
      .select(".y-axis-title")
      .text("AI 使用比例 (%)")
      .attr("x", -height / 2)
      .attr("y", 24)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");
  }, []);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">盒狀圖模組-比例資料以四分位數分布</div>
        <div className="sample-subtitle">- 辦公室職業者 AI 使用比例 -</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="boxes" />
        <g className="top-labels" />
        <g className="middle-labels" />
        <g className="bottom-labels" />
        <g className="x-axis" />
        <g className="y-axis" />
        <text className="y-axis-title" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.region}</div>
          <div>最大值：{tooltip.max.toFixed(0)}%</div>
          <div>第三四分位數 Q3：{tooltip.q3.toFixed(0)}%</div>
          <div>中位數：{tooltip.median.toFixed(0)}%</div>
          <div>第一四分位數 Q1：{tooltip.q1.toFixed(0)}%</div>
          <div>最小值：{tooltip.min.toFixed(0)}%</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            分為北中南東四區，各區多家公司辦公室工作者 AI
            使用比例分布，點擊盒狀圖可以呈現該地區的 AI
            使用比例的四分位數及中位數比例。
          </div>
        </div>
      </div>
    </div>
  );
}
