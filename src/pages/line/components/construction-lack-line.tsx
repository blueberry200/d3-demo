import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import {
  constructionRevenue2025,
  type ConstructionRevenueData,
} from "./line-construction-lack-data";

const width = 900;
const height = 500;
const margin = { top: 50, right: 40, bottom: 90, left: 100 };

type ValidData = ConstructionRevenueData & {
  revenue: number;
};

type TooltipData = ValidData & {
  x: number;
  y: number;
};

export default function LineConstructionChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const data = constructionRevenue2025;

  // 過濾掉 null 資料
  // 後面畫線、畫點都使用這份資料
  const validData = useMemo(() => {
    return data.filter((d): d is ValidData => d.revenue !== null);
  }, [data]);

  // scroll 時關閉 tooltip
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
    const t = d3.transition().duration(750);

    // x 軸比例尺
    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.month))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    // y 軸比例尺
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(validData, (d) => d.revenue) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 整條虛線的折線生成器
    const line = d3
      .line<ValidData>()
      .x((d) => x(d.month) ?? 0)
      .y((d) => y(d.revenue))
      .curve(d3.curveLinear);

    // 正常實線折線生成器
    const solidLine = d3
      .line<ConstructionRevenueData>()
      .defined((d) => d.revenue !== null)
      .x((d) => x(d.month) ?? 0)
      .y((d) => y(d.revenue ?? 0))
      .curve(d3.curveLinear);

    // x 軸
    const xAxis = svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    xAxis
      .transition(t)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((month) => month.replace("2025-", "") + "月"),
      );

    // y 軸
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .transition(t)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `${d3.format(",")(d)}萬`),
      );

    // 先畫整條虛線
    svg
      .select<SVGPathElement>(".dashed-line")
      .datum(validData)
      .transition(t)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "8 6")
      .attr("d", line);

    // 再畫實線，實線會覆蓋虛線
    svg
      .select<SVGPathElement>(".solid-line")
      .datum(data)
      .transition(t)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 4)
      .attr("d", solidLine);

    // 畫點
    svg
      .select<SVGGElement>(".points")
      .selectAll<SVGCircleElement, ValidData>("circle")
      .data(validData, (d) => d.month)
      .join("circle")
      .attr("r", 6)
      .attr("fill", "#2563eb")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("pointer-events", "none")
      .transition(t)
      .attr("cx", (d) => x(d.month) ?? 0)
      .attr("cy", (d) => y(d.revenue));

    // 畫標籤
    svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, ValidData>("text")
      .data(validData, (d) => d.month)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d3.format(",")(d.revenue)}萬`)
      .transition(t)
      .attr("x", (d) => x(d.month) ?? 0)
      .attr("y", (d) => y(d.revenue) - 14);

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("營業額")
      .attr("x", -height / 2)
      .attr("y", 28)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");

    const focus = svg.select<SVGGElement>(".focus");

    const verticalLine = focus
      .select<SVGLineElement>(".vertical-line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5 5")
      .style("display", "none");

    const horizontalLine = focus
      .select<SVGLineElement>(".horizontal-line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5 5")
      .style("display", "none");

    const focusCircle = focus
      .select<SVGCircleElement>(".focus-circle")
      .attr("r", 8)
      .attr("fill", "#2563eb")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
      .style("display", "none");

    svg
      .select<SVGRectElement>(".overlay")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event) => {
        // 取得滑鼠的 x 座標
        const [mouseX] = d3.pointer(event, svg.node());

        // 找到距離滑鼠最近的資料
        const nearest = d3.least(validData, (d) => {
          return Math.abs((x(d.month) ?? 0) - mouseX);
        });

        if (!nearest) return;

        const cx = x(nearest.month) ?? 0;
        const cy = y(nearest.revenue);

        verticalLine
          .style("display", null)
          .attr("x1", cx)
          .attr("x2", cx)
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom);

        horizontalLine
          .style("display", null)
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("y1", cy)
          .attr("y2", cy);

        focusCircle.style("display", null).attr("cx", cx).attr("cy", cy);

        setTooltip({
          ...nearest,
          x: event.clientX,
          y: event.clientY,
        });
      })
      .on("mouseleave", () => {
        verticalLine.style("display", "none");
        horizontalLine.style("display", "none");
        focusCircle.style("display", "none");
        setTooltip(null);
      });
  }, [data, validData]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">折線圖模組-缺值虛線折線圖</div>
        <div className="sample-subtitle">
          - 模擬建築公司 2025 年每月營業額 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
      >
        <path className="dashed-line" />
        <path className="solid-line" />

        <g className="points" />
        <g className="labels" />

        <g className="focus">
          <line className="vertical-line" />
          <line className="horizontal-line" />
          <circle className="focus-circle" />
        </g>

        <g className="x-axis" />
        <g className="y-axis" />
        <text className="y-axis-title" />

        <rect className="overlay" />
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
            {tooltip.month.replace("2025-", "")}月
          </div>
          <div>營業額：{d3.format(",")(tooltip.revenue)}萬</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div className="mb-5">
            此折線圖模擬建築公司 2025
            年每月營業額資料，部分月份故意缺少資料，並使用虛線表示缺值區段。
          </div>
          <div className="mb-5">
            圖表互動部分會依據滑鼠目前位置，自動搜尋最近的資料點，並顯示：聚焦圓點、垂直輔助虛線、水平輔助虛線、Tooltip
            資料提示
          </div>
        </div>
      </div>
    </div>
  );
}
