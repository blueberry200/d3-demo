import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import {
  chipFactories,
  sortChipFactoriesByGrowthRate,
} from "./bar-chip-factory-data";

const width = 900;
const height = 520;
const margin = { top: 40, right: 170, bottom: 60, left: 170 };

type ChipFactory = (typeof chipFactories)[number];

type TooltipData = ChipFactory & {
  x: number;
  y: number;
};

export default function ChipFactoryDivergingBarChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // 成長率越低，排序越上面
  const data = useMemo(() => sortChipFactoriesByGrowthRate(chipFactories), []);

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

    // 找最大絕對值，讓左右對稱
    const maxAbsValue = d3.max(data, (d) => Math.abs(d.revenueGrowthRate)) ?? 0;

    // x 軸比例尺：負值在左，正值在右
    const x = d3
      .scaleLinear()
      .domain([-maxAbsValue, maxAbsValue])
      .nice()
      .range([margin.left, width - margin.right]);

    // y 軸比例尺：已經以營業額成長率排序
    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.id))
      .range([margin.top, height - margin.bottom])
      .padding(0.32);

    const formatPercent = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

    // x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .transition(t)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => `${d}%`),
      );

    svg
      .select<SVGGElement>(".x-axis")
      .selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "600");

    // 中央線
    svg
      .select<SVGLineElement>(".zero-line")
      .transition(t)
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.5);

    // 長條圖
    svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGRectElement, ChipFactory>("rect")
      .data(data, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", x(0))
            .attr("y", (d) => y(d.id) ?? 0)
            .attr("width", 0)
            .attr("height", y.bandwidth())
            .attr("rx", 8)
            .attr("fill", (d) =>
              d.revenueGrowthRate >= 0 ? "#60a5fa" : "#f87171",
            )
            .style("cursor", "pointer")
            .on("mouseenter", function (_, d) {
              d3.select(this).attr(
                "fill",
                d.revenueGrowthRate >= 0 ? "#3b82f6" : "#ef4444",
              );
            })
            .on("mouseleave", function (_, d) {
              d3.select(this).attr(
                "fill",
                d.revenueGrowthRate >= 0 ? "#60a5fa" : "#f87171",
              );
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
        (exit) => exit.transition(t).attr("width", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => Math.min(x(0), x(d.revenueGrowthRate)))
      .attr("y", (d) => y(d.id) ?? 0)
      .attr("width", (d) => Math.abs(x(d.revenueGrowthRate) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.revenueGrowthRate >= 0 ? "#60a5fa" : "#f87171"));

    // 廠商名稱
    // 正值放左側
    // 負值放右側
    svg
      .select<SVGGElement>(".name-labels")
      .selectAll<SVGTextElement, ChipFactory>("text")
      .data(data, (d) => d.id)
      .join("text")
      .attr("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => d.name)
      .transition(t)
      .attr("x", (d) => (d.revenueGrowthRate < 0 ? x(0) + 12 : x(0) - 12))
      .attr("y", (d) => (y(d.id) ?? 0) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.revenueGrowthRate < 0 ? "start" : "end"));

    // 百分比標籤
    svg
      .select<SVGGElement>(".value-labels")
      .selectAll<SVGTextElement, ChipFactory>("text")
      .data(data, (d) => d.id)
      .join("text")
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => formatPercent(d.revenueGrowthRate))
      .transition(t)
      .attr("x", (d) => {
        if (d.revenueGrowthRate < 0) {
          return x(d.revenueGrowthRate) - 8;
        }

        return x(d.revenueGrowthRate) + 8;
      })
      .attr("y", (d) => (y(d.id) ?? 0) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.revenueGrowthRate < 0 ? "end" : "start"));

    // x 軸標題
    svg
      .select<SVGTextElement>(".x-axis-title")
      .text("相對於 2024 年營業額成長百分比")
      .attr("x", width / 2)
      .attr("y", height - 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");
  }, [data]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">長條圖模組-雙邊橫向長條圖</div>

        <div className="sample-subtitle">
          - 模擬各晶片廠相對 2024 年營業額成長百分比 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="bars" />

        <g className="name-labels" />

        <g className="value-labels" />

        <line className="zero-line" />

        <g className="x-axis" />

        <text className="x-axis-title" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.name}</div>

          <div>
            營業額成長率：
            {tooltip.revenueGrowthRate > 0 ? "+" : ""}
            {tooltip.revenueGrowthRate}%
          </div>

          <div>
            2025 銷售量：
            {d3.format(",")(tooltip.sales2025)}
          </div>

          <div>
            CPU 銷量：
            {d3.format(",")(tooltip.cpuSales)}
          </div>

          <div>
            GPU 銷量：
            {d3.format(",")(tooltip.gpuSales)}
          </div>

          <div>
            AI 晶片銷量：
            {d3.format(",")(tooltip.aiChipSales)}
          </div>

          <div>成立年份：{tooltip.foundedYear}</div>

          <div>
            員工數：
            {d3.format(",")(tooltip.employeeCount)}
          </div>

          <div>良率：{tooltip.yieldRate}%</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>

          <div>
            雙邊橫向長條圖適合呈現有正負方向的資料。本範例以 0%
            作為中心線，右側代表相對 2024 年營業額成長，左側代表相對 2024
            年營業額衰退，並依照成長百分比由低到高排序。
          </div>
        </div>
      </div>
    </div>
  );
}
