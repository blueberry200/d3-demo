import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import {
  constructionProjectBubbleData,
  type ConstructionProjectBubbleData,
} from "./project-bubble-data";

const width = 900;
const height = 500;
const margin = { top: 40, right: 50, bottom: 90, left: 90 };

type TooltipData = ConstructionProjectBubbleData & {
  x: number;
  y: number;
};

const statusColorMap: Record<ConstructionProjectBubbleData["status"], string> =
  {
    進行中: "#60a5fa",
    規劃中: "#f97316",
    已完工: "#22c55e",
  };

export default function ConstructionProjectBubbleChart() {
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
    const t = d3.transition().duration(750);

    const data = constructionProjectBubbleData;

    // x 軸比例尺：預期利潤率
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.profitRate) ?? 0])
      .nice()
      .range([margin.left, width - margin.right]);

    // y 軸比例尺：風險分數
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.riskScore) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 泡泡大小比例尺：總預算
    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.budget) ?? 0])
      .range([8, 38]);

    // x 軸繪製
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .transition(t)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => `${d}%`),
      )
      .selection()
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600");

    // y 軸繪製
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .transition(t)
      .call(d3.axisLeft(y).ticks(5))
      .selection()
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600");

    // 背景格線：x 方向
    svg
      .select<SVGGElement>(".x-grid")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-dasharray", "4 4");

    svg.select<SVGGElement>(".x-grid").select(".domain").remove();

    // 背景格線：y 方向
    svg
      .select<SVGGElement>(".y-grid")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-dasharray", "4 4");

    svg.select<SVGGElement>(".y-grid").select(".domain").remove();

    // 繪製泡泡
    svg
      .select<SVGGElement>(".bubbles")
      .selectAll<SVGCircleElement, ConstructionProjectBubbleData>("circle")
      .data(data, (d) => d.project)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", (d) => x(d.profitRate))
            .attr("cy", (d) => y(d.riskScore))
            .attr("r", 0)
            .attr("fill", (d) => statusColorMap[d.status])
            .attr("fill-opacity", 0.75)
            .attr("stroke", "#334155")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseenter", function () {
              d3.select(this).attr("fill-opacity", 1);
            })
            .on("mouseleave", function () {
              d3.select(this).attr("fill-opacity", 0.75);
            })
            .on("click", (event, d) => {
              event.stopPropagation();

              setTooltip({
                ...d,
                x: event.clientX,
                y: event.clientY,
              });
            }),
        (update) => update,
        (exit) => exit.transition(t).attr("r", 0).remove(),
      )
      .transition(t)
      .attr("r", (d) => radius(d.budget));

    // 泡泡上的文字
    svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, ConstructionProjectBubbleData>("text")
      .data(data, (d) => d.project)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .text((d) => d.project.slice(0, 4))
      .transition(t)
      .attr("x", (d) => x(d.profitRate))
      .attr("y", (d) => y(d.riskScore));

    // x 軸標題
    svg
      .select<SVGTextElement>(".x-axis-title")
      .text("預期利潤率 (%)")
      .attr("x", width / 2)
      .attr("y", height - 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("專案風險分數")
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
        <div className="sample-title">泡泡圖模組-搭配棋盤輔助線及分類顏色</div>
        <div className="sample-subtitle">
          - 模擬建築專案預期利潤、風險與預算規模 -
        </div>
      </div>

      <div className="mb-4 flex w-full max-w-225 items-center gap-6 rounded-xl border p-4">
        <div className="font-bold">專案狀態</div>

        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#60a5fa]" />
          <span>進行中</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#f97316]" />
          <span>規劃中</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#22c55e]" />
          <span>已完工</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="x-grid" />
        <g className="y-grid" />
        <g className="bubbles" />
        <g className="labels" />
        <g className="x-axis" />
        <g className="y-axis" />
        <text className="x-axis-title" />
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
          <div className="mb-1 text-base font-bold">{tooltip.project}</div>
          <div>預期利潤率：{tooltip.profitRate}%</div>
          <div>風險分數：{tooltip.riskScore}</div>
          <div>總預算：{tooltip.budget} 億元</div>
          <div>專案狀態：{tooltip.status}</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            x軸代表預期利潤率，y軸代表專案風險分數，泡泡大小代表總預算規模，顏色則代表專案目前狀態。
            點擊泡泡可以查看該建築專案的詳細資訊。
          </div>
        </div>
      </div>
    </div>
  );
}
