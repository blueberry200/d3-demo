import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import * as d3 from "d3";

import {
  chipFactories,
  sortChipFactories,
  sortOptions,
  type SortType,
} from "./bar-chip-factory-data";

const width = 900;
const height = 500;
const margin = { top: 30, right: 30, bottom: 120, left: 120 };

type ChipFactory = (typeof chipFactories)[number];

type TooltipData = ChipFactory & {
  x: number;
  y: number;
};

// 顯示在 X 軸的子標題，根據排序方式來決定顯示的內容
const getXAxisSubLabel = (d: ChipFactory, sortType: SortType) => {
  if (sortType === "founded-year-asc") return `成立：${d.foundedYear}`;
  if (sortType === "employee-count-desc") {
    return `員工數：${d.employeeCount.toLocaleString()}`;
  }
  if (sortType === "yield-rate-desc") return `良率：${d.yieldRate}%`;
  return "";
};

export default function ChipFactorySalesBarChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [sortType, setSortType] = useState<SortType>("sales-desc");
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

  // 根據排序方式來排序，不希望重新渲染，所以使用 useMemo
  const data = useMemo(
    () => sortChipFactories(chipFactories, sortType),
    [sortType],
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(750);

    // x 軸的比例尺
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.45);

    // y 軸的比例尺
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.sales2025) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // x 軸繪製
    const xAxis = svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    xAxis
      .transition(t)
      .call(d3.axisBottom(x))
      .on("end", () => {
        // x 軸上的標籤
        xAxis
          .selectAll<SVGTextElement, string>("text")
          .style("font-size", "14px")
          .style("font-weight", "600")
          .attr("text-anchor", "end")
          .attr("transform", "rotate(-35)")
          .attr("dx", "-0.6em")
          .attr("dy", "0.25em")
          .each(function (name) {
            const factory = data.find((d) => d.name === name);
            if (!factory) return;

            // 根據排序方式來決定顯示的內容
            const subLabel = getXAxisSubLabel(factory, sortType);
            const text = d3.select(this);

            text.text(null);

            text.append("tspan").attr("x", 0).attr("dy", 0).text(factory.name);

            if (subLabel) {
              text
                .append("tspan")
                .attr("x", 0)
                .attr("dy", "1.2em")
                .text(`(${subLabel})`);
            }
          });
      });

    // y 軸繪製
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(","))) // 指定 y 軸的標籤，並格式化數字
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600");

    // 繪製矩形
    svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGRectElement, ChipFactory>("rect")
      .data(data, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.name) ?? 0) // 矩形的 x 座標，slot 的左側
            .attr("y", y(0))
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("rx", 8)
            .attr("fill", "#60a5fa")
            .style("cursor", "pointer")
            .on("mouseenter", function () {
              // 不要在 hover 使用 transition，避免中斷排序時的位移動畫
              d3.select(this).attr("fill", "#3b82f6");
            })
            .on("mouseleave", function () {
              // 不要在 hover 使用 transition，避免中斷排序時的位移動畫
              d3.select(this).attr("fill", "#60a5fa");
            })
            .on("click", (event, d) => {
              // 當矩形被點擊時，顯示 Tooltip
              event.stopPropagation();

              setTooltip({
                ...d,
                x: event.clientX,
                y: event.clientY,
              });
            }),
        (update) => update,
        // 因為 join 只會回傳 enter 或 update，所以 exit 的 transition 需要另外寫
        (exit) => exit.transition(t).attr("y", y(0)).attr("height", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => x(d.name) ?? 0) // 用於切換排序方式動畫
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.sales2025)) // 用於矩形長高的動畫
      .attr("height", (d) => y(0) - y(d.sales2025)); // 用於矩形長高的動畫

    // 繪製矩形上的標籤
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
      .text((d) => d3.format(",")(d.sales2025)) // 加千分位數字格式
      .transition(t) // 標籤進入動畫
      .attr("x", (d) => (x(d.name) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.sales2025) - 8);

    // y 軸標題
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
  }, [data, sortType]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">長條圖模組-可排序長條圖</div>
        <div className="sample-subtitle">- 模擬各晶片廠 2025 年銷售量 -</div>
      </div>

      <div className="mb-4 flex w-full max-w-225 items-center gap-4 rounded-xl border p-4">
        <div className="font-bold">x 軸排序方式</div>

        <Select
          value={sortType}
          onChange={(value) => {
            setSortType(value);
            setTooltip(null);
          }}
          options={sortOptions}
          className="w-64"
        />
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
          <div>2025 銷售量：{d3.format(",")(tooltip.sales2025)}</div>
          <div>成立年份：{tooltip.foundedYear}</div>
          <div>員工數：{d3.format(",")(tooltip.employeeCount)}</div>
          <div>良率：{tooltip.yieldRate}%</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            x軸可依據不同條件排序，排序條件可參照下拉選單內容，點擊長條圖可呈現該晶片廠的詳細資訊。
          </div>
        </div>
      </div>
    </div>
  );
}
