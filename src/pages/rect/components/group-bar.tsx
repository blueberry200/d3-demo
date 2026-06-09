import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { chipFactories, chipKeys } from "./bar-chip-factory-data";

const width = 980;
const height = 560;

const margin = {
  top: 40,
  right: 30,
  bottom: 140,
  left: 120,
};

type ChipFactory = (typeof chipFactories)[number];
type ChipKey = (typeof chipKeys)[number];

type TooltipData = {
  factoryName: string;
  chipType: string;
  chipSales: number;
  totalSales: number;
  x: number;
  y: number;
};

type ChipBarDatum = {
  key: ChipKey;
  value: number;
  factory: ChipFactory;
};

const chipLabels: Record<ChipKey, string> = {
  cpuSales: "CPU 晶片",
  gpuSales: "GPU 晶片",
  aiChipSales: "AI 晶片",
};

const chipColors: Record<ChipKey, string> = {
  cpuSales: "#60a5fa",
  gpuSales: "#34d399",
  aiChipSales: "#f59e0b",
};

export default function ChipFactoryGroupedBarChart() {
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

    const data = chipFactories;

    // 外層 x 軸比例尺：廠商
    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.28);

    // 內層 x 軸比例尺：三種晶片
    const x1 = d3
      .scaleBand<ChipKey>()
      .domain(chipKeys)
      .range([0, x0.bandwidth()])
      .padding(0.14);

    // y 軸比例尺
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d3.max(chipKeys, (key) => d[key])) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-35)")
      .attr("dx", "-0.6em")
      .attr("dy", "0.25em");

    // y 軸
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600");

    // 每個廠商 group
    const groups = svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGGElement, ChipFactory>(".factory-group")
      .data(data, (d) => d.id)
      .join("g")
      .attr("class", "factory-group")
      .attr("transform", (d) => `translate(${x0(d.name) ?? 0},0)`);

    // 每個 group 內的三種 bar
    groups
      .selectAll<SVGRectElement, ChipBarDatum>("rect")
      .data((d) =>
        chipKeys.map((key) => ({
          key,
          value: d[key],
          factory: d,
        })),
      )
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x1(d.key) ?? 0)
            .attr("y", y(0))
            .attr("width", x1.bandwidth())
            .attr("height", 0)
            .attr("rx", 6)
            .attr("fill", (d) => chipColors[d.key])
            .style("cursor", "pointer")
            .on("mouseenter", function () {
              d3.select(this).attr("opacity", 0.8);
            })
            .on("mouseleave", function () {
              d3.select(this).attr("opacity", 1);
            })
            .on("click", (event, d) => {
              event.stopPropagation();

              setTooltip({
                factoryName: d.factory.name,
                chipType: chipLabels[d.key],
                chipSales: d.value,
                totalSales: d.factory.sales2025,
                x: event.clientX,
                y: event.clientY,
              });
            }),
        (update) => update,
        (exit) => exit.transition(t).attr("y", y(0)).attr("height", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => x1(d.key) ?? 0)
      .attr("width", x1.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value));

    // bar 上方 label
    groups
      .selectAll<SVGTextElement, ChipBarDatum>(".bar-label")
      .data((d) =>
        chipKeys.map((key) => ({
          key,
          value: d[key],
          factory: d,
        })),
      )
      .join("text")
      .attr("class", "bar-label")
      .attr("text-anchor", "start")
      .attr("fill", "#ffffff")
      .style("font-size", "10px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${Math.round(d.value / 1000)}k`)
      .transition(t)
      .attr("x", (d) => (x1(d.key) ?? 0) + x1.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 8)
      .attr(
        "transform",
        (d) =>
          `rotate(-45, ${(x1(d.key) ?? 0) + x1.bandwidth() / 2}, ${
            y(d.value) - 8
          })`,
      );

    // legend
    const legend = svg
      .select<SVGGElement>(".legend")
      .attr("transform", `translate(${margin.left}, ${height - 70})`);

    const legendItems = legend
      .selectAll<SVGGElement, ChipKey>(".legend-item")
      .data(chipKeys)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(${i * 170},0)`);

    legendItems
      .selectAll("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 4)
      .attr("fill", (d) => chipColors[d]);

    legendItems
      .selectAll("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 28)
      .attr("y", 14)
      .attr("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => chipLabels[d]);

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("2025 晶片銷售量")
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
        <div className="sample-title">長條圖模組-群組長條圖</div>
        <div className="sample-subtitle">
          - 模擬各晶片廠 2025 年不同晶片銷售量 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-245"
        onClick={() => setTooltip(null)}
      >
        <g className="bars" />
        <g className="x-axis" />
        <g className="y-axis" />
        <g className="legend" />
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
          <div className="mb-1 text-base font-bold">{tooltip.factoryName}</div>
          <div>晶片類型：{tooltip.chipType}</div>
          <div>
            該晶片銷量：
            {d3.format(",")(tooltip.chipSales)}
          </div>
          <div>
            總銷售量：
            {d3.format(",")(tooltip.totalSales)}
          </div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>模擬各晶片廠不同晶片銷售量，點擊長條圖可查看詳細資訊。</div>
        </div>
      </div>
    </div>
  );
}
