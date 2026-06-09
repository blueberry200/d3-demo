import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { chipFactories } from "./bar-chip-factory-data";

const width = 900;
const height = 560;
const margin = { top: 40, right: 30, bottom: 150, left: 120 };

type ChipFactory = (typeof chipFactories)[number];

const chipKeys = ["cpuSales", "gpuSales", "aiChipSales"] as const;

type ChipKey = (typeof chipKeys)[number];

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

type TooltipData = {
  name: string;
  chipType: string;
  chipSales: number;
  totalSales: number;
  x: number;
  y: number;
};

export default function ChipFactoryStackedBarChart() {
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

    // 堆疊長條圖資料格式轉換器
    const stack = d3
      .stack<ChipFactory>()
      .keys(chipKeys)
      .value((d, key) => d[key as ChipKey]);

    // 堆疊長條圖資料，資料格式約略如下：
    // [
    //   {
    //     key: "cpuSales",
    //     [
    //       [0, 100, data: 原始 A 廠資料],
    //       [0, 80, data: 原始 B 廠資料],
    //     ]
    //   }
    // ]
    const stackedData = stack(data);

    // x 軸比例尺
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.45);

    // y 軸比例尺
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.sales2025) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
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

    // 一個 g 代表一種晶片，是以堆疊長條圖的一層為一組
    const layers = svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGGElement, d3.Series<ChipFactory, ChipKey>>("g")
      .data(stackedData, (d) => d.key)
      .join("g")
      .attr("fill", (d) => chipColors[d.key as ChipKey]);

    layers
      .selectAll<SVGRectElement, d3.SeriesPoint<ChipFactory>>("rect")
      .data(
        (d) => d,
        (d) => d.data.id,
      )
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.data.name) ?? 0)
            .attr("y", y(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .style("cursor", "pointer")
            .on("mouseenter", function () {
              d3.select(this).attr("opacity", 0.8);
            })
            .on("mouseleave", function () {
              d3.select(this).attr("opacity", 1);
            })
            .on("click", function (event, d) {
              event.stopPropagation();

              // 從父元素 (layer) 取得對應的晶片類別作為 key
              const key = d3
                .select<
                  SVGGElement,
                  d3.Series<ChipFactory, ChipKey>
                >(this.parentNode as SVGGElement)
                .datum().key as ChipKey;

              setTooltip({
                name: d.data.name,
                chipType: chipLabels[key],
                chipSales: d.data[key],
                totalSales: d.data.sales2025,
                x: event.clientX,
                y: event.clientY,
              });
            }),
        (update) => update,
        (exit) => exit.transition(t).attr("y", y(0)).attr("height", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => x(d.data.name) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]));

    // bar 上方 label
    svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, ChipFactory>("text")
      .data(data, (d) => d.id)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => d3.format(",")(d.sales2025))
      .transition(t)
      .attr("x", (d) => (x(d.name) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.sales2025) - 8);

    // legend
    const legend = svg
      .select<SVGGElement>(".legend")
      .attr("transform", `translate(${margin.left}, ${height - 70})`);

    const legendItems = legend
      .selectAll<SVGGElement, ChipKey>(".legend-item")
      .data(chipKeys)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (_, i) => `translate(${i * 170}, 0)`);

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
      .attr("fill", "#334155")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => chipLabels[d]);

    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("2025 銷售量")
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
        <div className="sample-title">長條圖模組-堆疊長條圖</div>
        <div className="sample-subtitle">
          - 模擬各晶片廠 2025 年不同晶片銷售量 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="bars" />
        <g className="labels" />
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
          <div className="mb-1 text-base font-bold">{tooltip.name}</div>
          <div>晶片類型：{tooltip.chipType}</div>
          <div>該晶片銷量：{d3.format(",")(tooltip.chipSales)}</div>
          <div>總銷售量：{d3.format(",")(tooltip.totalSales)}</div>
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
