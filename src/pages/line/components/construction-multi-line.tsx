import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import { constructionRevenueData } from "./line-construction-multi-data";

const width = 900;
const height = 520;
const margin = { top: 80, right: 80, bottom: 80, left: 120 };

const companyKeys = ["horizonBuild", "urbanStone", "apexConstruct"] as const;

type CompanyKey = (typeof companyKeys)[number];

type RevenuePoint = {
  month: string;
  revenue: number;
  companyKey: CompanyKey;
  companyName: string;
};

type LineGroup = {
  key: CompanyKey;
  name: string;
  values: RevenuePoint[];
};

type TooltipData = RevenuePoint & {
  x: number;
  y: number;
};

const companyNameMap: Record<CompanyKey, string> = {
  horizonBuild: "宏景建設",
  urbanStone: "城石營造",
  apexConstruct: "鼎峰工程",
};

const companyColorMap: Record<CompanyKey, string> = {
  horizonBuild: "#2563eb",
  urbanStone: "#f97316",
  apexConstruct: "#16a34a",
};

export default function ConstructionRevenueBrushLineChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const months = useMemo(() => {
    return constructionRevenueData.map((d) => d.month);
  }, []);

  const lineGroups = useMemo<LineGroup[]>(() => {
    return companyKeys.map((key) => ({
      key,
      name: companyNameMap[key],
      values: constructionRevenueData.map((item) => ({
        month: item.month,
        revenue: item[key],
        companyKey: key,
        companyName: companyNameMap[key],
      })),
    }));
  }, []);

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
    const allPoints = lineGroups.flatMap((group) => group.values);

    let currentMonths = [...months];

    // x 軸比例尺
    // 使用 scalePoint + padding，讓一月、十二月不會貼到左右邊界
    const x = d3
      .scalePoint<string>()
      .domain(currentMonths)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    // y 軸比例尺
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allPoints, (d) => d.revenue) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // 折線產生器
    const line = d3
      .line<RevenuePoint>()
      .x((d) => x(d.month) ?? 0)
      .y((d) => y(d.revenue))
      .curve(d3.curveMonotoneX);

    // x 軸
    const xAxis = svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    // y 軸
    const yAxis = svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`);

    // clipPath 外擴一點，避免線條、圓點在邊界被切掉
    svg
      .select<SVGRectElement>(".clip-rect")
      .attr("x", margin.left - 14)
      .attr("y", margin.top - 40)
      .attr("width", width - margin.left - margin.right + 28)
      .attr("height", height - margin.top - margin.bottom + 54);

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("營業額（萬元）")
      .attr("x", -height / 2)
      .attr("y", 24)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");

    // 圖例
    const legends = svg
      .select<SVGGElement>(".legends")
      .selectAll<SVGGElement, LineGroup>("g")
      .data(lineGroups, (d) => d.key)
      .join("g")
      .attr("transform", (_, index) => {
        return `translate(${margin.left + index * 140}, 20)`;
      });

    legends
      .selectAll<SVGRectElement, LineGroup>("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", 18)
      .attr("height", 10)
      .attr("rx", 3)
      .attr("fill", (d) => companyColorMap[d.key]);

    legends
      .selectAll<SVGTextElement, LineGroup>("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 26)
      .attr("y", 10)
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .text((d) => d.name);

    const getVisibleGroups = () => {
      return lineGroups.map((group) => ({
        ...group,
        values: group.values.filter((d) => currentMonths.includes(d.month)),
      }));
    };

    const getVisiblePoints = () => {
      return getVisibleGroups().flatMap((group) => group.values);
    };

    const renderChart = (duration = 750) => {
      const t = d3.transition().duration(duration);

      x.domain(currentMonths);

      // x 軸繪製
      xAxis
        .transition(t)
        .call(
          d3
            .axisBottom(x)
            .tickFormat((month) => month.replace("2025-", "") + "月"),
        )
        .selection()
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "600");

      // y 軸繪製
      yAxis
        .transition(t)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
        .selection()
        .selectAll("text")
        .style("font-size", "13px")
        .style("font-weight", "600");

      // 繪製折線
      svg
        .select<SVGGElement>(".lines")
        .selectAll<SVGPathElement, LineGroup>("path")
        .data(getVisibleGroups(), (d) => d.key)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", (d) => companyColorMap[d.key])
        .attr("stroke-width", 3)
        .transition(t)
        .attr("d", (d) => line(d.values));

      // 繪製資料點
      svg
        .select<SVGGElement>(".points")
        .selectAll<SVGCircleElement, RevenuePoint>("circle")
        .data(getVisiblePoints(), (d) => `${d.companyKey}-${d.month}`)
        .join("circle")
        .attr("r", 7)
        .attr("fill", (d) => companyColorMap[d.companyKey])
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseenter", function () {
          d3.select(this).attr("r", 10);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("r", 7);
        })
        .on("click", (event, d) => {
          event.stopPropagation();

          setTooltip({
            ...d,
            x: event.clientX,
            y: event.clientY,
          });
        })
        .transition(t)
        .attr("cx", (d) => x(d.month) ?? 0)
        .attr("cy", (d) => y(d.revenue));

      // 繪製數值標籤
      svg
        .select<SVGGElement>(".labels")
        .selectAll<SVGTextElement, RevenuePoint>("text")
        .data(getVisiblePoints(), (d) => `${d.companyKey}-${d.month}`)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("fill", (d) => companyColorMap[d.companyKey])
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("pointer-events", "none")
        .text((d) => d3.format(",")(d.revenue))
        .transition(t)
        .attr("x", (d) => x(d.month) ?? 0)
        .attr("y", (d) => y(d.revenue) - 14);
    };

    // brush 拖曳放大月份區間
    const brush = d3
      .brushX<unknown>()
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("end", (event) => {
        const extent = event.selection as [number, number] | null;
        if (!extent) return;

        const selectedMonths = currentMonths.filter((month) => {
          const monthX = x(month) ?? 0;
          return monthX >= extent[0] && monthX <= extent[1];
        });

        if (selectedMonths.length >= 2) {
          currentMonths = selectedMonths;
          setTooltip(null);
          renderChart(1000);
        }

        svg.select<SVGGElement>(".brush").call(brush.move, null);
      });

    svg.select<SVGGElement>(".brush").call(brush);

    renderChart(0);

    svg.on("dblclick", () => {
      currentMonths = [...months];
      setTooltip(null);
      renderChart(1000);
    });
  }, [lineGroups, months]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">折線圖模組- 多線圖搭配局部放大選取器</div>

        <div className="sample-subtitle">- 建築廠商 2025 年全年銷售額 -</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225 overflow-visible"
        onClick={() => setTooltip(null)}
      >
        <defs>
          <clipPath id="construction-revenue-clip">
            <rect className="clip-rect" />
          </clipPath>
        </defs>

        <g className="legends" />

        <g className="lines" clipPath="url(#construction-revenue-clip)" />

        <g className="brush" />

        <g className="points" clipPath="url(#construction-revenue-clip)" />

        <g className="labels" clipPath="url(#construction-revenue-clip)" />

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
          <div className="mb-1 text-base font-bold">{tooltip.companyName}</div>

          <div>月份：{tooltip.month}</div>

          <div>營業額：{d3.format(",")(tooltip.revenue)} 萬元</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>

          <div>
            本範例為多線圖搭配局部放大選取器，使用者可以透過拖曳的方式放大月份區間，以查看不同月份的營業額資訊，雙擊圖表可恢復到初始狀態。
          </div>
        </div>
      </div>
    </div>
  );
}
