import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import { constructionPercentData } from "./line-construction-area-data";

const width = 900;
const height = 520;
const margin = { top: 80, right: 80, bottom: 80, left: 120 };

const companyKeys = ["horizonBuild", "urbanStone", "apexConstruct"] as const;

type RawData = (typeof constructionPercentData)[number];
type CompanyKey = (typeof companyKeys)[number];

type ChartPoint = {
  key: CompanyKey;
  month: string;
  value: number;
  y0: number;
  y1: number;
};

type TooltipItem = {
  key: CompanyKey;
  companyName: string;
  value: number;
};

type TooltipData = {
  month: string;
  items: TooltipItem[];
  total: number;
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

export default function ConstructionMarketShareAreaChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [_, setActiveMonth] = useState<string | null>(null);

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

  // 將原始資料轉成 d3 stack 需要的堆疊資料
  const stackedGroups = useMemo(() => {
    const stack = d3.stack<RawData>().keys([...companyKeys]);

    return stack(constructionPercentData).map((layer) => {
      const key = layer.key as CompanyKey;

      return {
        key,
        points: layer.map<ChartPoint>((point) => ({
          key,
          month: point.data.month,
          value: point.data[key],
          y0: point[0],
          y1: point[1],
        })),
      };
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // 攤平成所有點，後面畫圓點、label、tooltip 都會用到
    const allPoints = stackedGroups.flatMap((group) => group.points);

    const months = constructionPercentData.map((d) => d.month);

    const x = d3
      .scalePoint<string>()
      .domain(months)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(allPoints, (d) => d.y1) ?? 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const area = d3
      .area<ChartPoint>()
      .x((d) => x(d.month) ?? 0)
      .y0((d) => y(d.y0))
      .y1((d) => y(d.y1))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<ChartPoint>()
      .x((d) => x(d.month) ?? 0)
      .y((d) => y(d.y1))
      .curve(d3.curveMonotoneX);

    const t = d3.transition().duration(750);

    // x 軸
    svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
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
          .tickFormat((d) => `${d}%`),
      );

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("累積市占率（%）")
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
      .selectAll<SVGGElement, CompanyKey>("g")
      .data(companyKeys)
      .join("g")
      .attr("transform", (_, index) => {
        return `translate(${margin.left + index * 140}, 20)`;
      });

    legends
      .selectAll<SVGRectElement, CompanyKey>("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", 18)
      .attr("height", 10)
      .attr("rx", 3)
      .attr("fill", (d) => companyColorMap[d]);

    legends
      .selectAll<SVGTextElement, CompanyKey>("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 26)
      .attr("y", 10)
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .text((d) => companyNameMap[d]);

    // 面積區塊
    svg
      .select<SVGGElement>(".areas")
      .selectAll<SVGPathElement, (typeof stackedGroups)[number]>("path")
      .data(stackedGroups, (d) => d.key)
      .join("path")
      .attr("fill", (d) => companyColorMap[d.key])
      .attr("fill-opacity", 0.18)
      .transition(t)
      .attr("d", (d) => area(d.points));

    // 每一家公司的累積線
    svg
      .select<SVGGElement>(".lines")
      .selectAll<SVGPathElement, (typeof stackedGroups)[number]>("path")
      .data(stackedGroups, (d) => d.key)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) => companyColorMap[d.key])
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .transition(t)
      .attr("d", (d) => line(d.points));

    // 每個月份、每家公司對應的點
    svg
      .select<SVGGElement>(".points")
      .selectAll<SVGCircleElement, ChartPoint>("circle")
      .data(allPoints, (d) => `${d.key}-${d.month}`)
      .join("circle")
      .attr("r", 7)
      .attr("fill", (d) => companyColorMap[d.key])
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("pointer-events", "none")
      .transition(t)
      .attr("cx", (d) => x(d.month) ?? 0)
      .attr("cy", (d) => y(d.y1));

    // 點上方的百分比文字
    svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, ChartPoint>("text")
      .data(allPoints, (d) => `${d.key}-${d.month}`)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", (d) => companyColorMap[d.key])
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.value}%`)
      .transition(t)
      .attr("x", (d) => x(d.month) ?? 0)
      .attr("y", (d) => y(d.y1) - 14);

    // hover 時顯示的垂直虛線，預設隱藏
    svg
      .select<SVGLineElement>(".hover-line")
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5 5")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // 透明 hover 感應層
    svg
      .select<SVGRectElement>(".hover-layer")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", (event) => {
        // 取得滑鼠目前在 svg 裡面的 x 座標
        const [mouseX] = d3.pointer(event, svg.node());

        // 依照滑鼠 x 位置，找出距離最近的月份
        const nearestMonth = d3.least(months, (month) => {
          return Math.abs((x(month) ?? 0) - mouseX);
        });

        if (!nearestMonth) return;

        const nearestX = x(nearestMonth) ?? 0;

        // 將垂直虛線移動到最近月份的位置
        svg
          .select<SVGLineElement>(".hover-line")
          .attr("x1", nearestX)
          .attr("x2", nearestX)
          .style("opacity", 1);

        // 放大同一個月份的所有 point
        svg
          .select<SVGGElement>(".points")
          .selectAll<SVGCircleElement, ChartPoint>("circle")
          .attr("r", (d) => (d.month === nearestMonth ? 11 : 7))
          .attr("stroke-width", (d) => (d.month === nearestMonth ? 3 : 2));

        setActiveMonth(nearestMonth);
      })
      .on("click", (event) => {
        // click 時也重新計算一次最近月份
        // 這樣不用依賴 mousemove 的狀態
        const [mouseX] = d3.pointer(event, svg.node());

        const nearestMonth = d3.least(months, (month) => {
          return Math.abs((x(month) ?? 0) - mouseX);
        });

        if (!nearestMonth) return;

        const nearestX = x(nearestMonth) ?? 0;

        // 點擊時也同步更新虛線位置
        svg
          .select<SVGLineElement>(".hover-line")
          .attr("x1", nearestX)
          .attr("x2", nearestX)
          .style("opacity", 1);

        // 點擊時也同步放大該月份所有 point
        svg
          .select<SVGGElement>(".points")
          .selectAll<SVGCircleElement, ChartPoint>("circle")
          .attr("r", (d) => (d.month === nearestMonth ? 11 : 7))
          .attr("stroke-width", (d) => (d.month === nearestMonth ? 3 : 2));

        setActiveMonth(nearestMonth);

        // 找出目前月份的三家公司資料
        const currentPoints = allPoints.filter((point) => {
          return point.month === nearestMonth;
        });

        const items = currentPoints.map((point) => ({
          key: point.key,
          companyName: companyNameMap[point.key],
          value: point.value,
        }));

        const total = d3.sum(items, (item) => item.value);

        // 如果點同一個月份，就關閉 tooltip
        // 如果點不同月份，就切換 tooltip 內容
        setTooltip((prev) => {
          if (prev?.month === nearestMonth) {
            return null;
          }

          return {
            month: nearestMonth,
            items,
            total,
            x: event.clientX,
            y: event.clientY,
          };
        });
      })
      .on("mouseleave", () => {
        // 離開圖表區域時，隱藏虛線
        svg.select<SVGLineElement>(".hover-line").style("opacity", 0);

        // 所有 point 恢復原本大小
        svg
          .select<SVGGElement>(".points")
          .selectAll<SVGCircleElement, ChartPoint>("circle")
          .attr("r", 7)
          .attr("stroke-width", 2);

        setActiveMonth(null);
      });
  }, [stackedGroups]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">面積圖模組-建築廠商市占率</div>

        <div className="sample-subtitle">
          - 建築廠商 2025 年全年市占率變化 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225 overflow-visible"
      >
        <g className="legends" />
        <g className="areas" />
        <g className="lines" />
        <line className="hover-line" />
        <g className="points" />
        <g className="labels" />
        <g className="x-axis" />
        <g className="y-axis" />
        <text className="y-axis-title" />
        <rect className="hover-layer" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-2 text-base font-bold">{tooltip.month}</div>

          {tooltip.items.map((item) => (
            <div key={item.key} className="flex min-w-40 justify-between gap-4">
              <span>{item.companyName}</span>
              <span>{item.value}%</span>
            </div>
          ))}

          <div className="mt-2 border-t border-white/30 pt-2 font-bold">
            總和：{tooltip.total}%
          </div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div className="mb-5">
            以面積圖呈現三家建築公司市占率，可以點擊任一年月區塊，查看該月份的市占率分佈及總分佈。
          </div>
        </div>
      </div>
    </div>
  );
}
