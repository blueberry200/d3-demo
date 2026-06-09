import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import {
  companyMarketShareData,
  type CompanyMarketShareData,
} from "./market-share-pie-data";

const width = 900;
const height = 500;

const centerX = 330;
const centerY = 250;

const radius = 170;

type TooltipData = CompanyMarketShareData & {
  x: number;
  y: number;
};

const colors = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#fb923c",
  "#22d3ee",
  "#94a3b8",
];

export default function CompanyMarketSharePieChart() {
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
    const t = d3.transition().duration(500);

    // 顏色比例尺，依照公司名稱取得對應顏色
    const color = d3
      .scaleOrdinal<string>()
      .domain(companyMarketShareData.map((d) => d.company))
      .range(colors);

    // pie 會把原始資料轉成圓餅圖需要的角度資料
    const pie = d3
      .pie<CompanyMarketShareData>()
      .value((d) => d.marketShare)
      .sort(null);

    // 圓餅圖每一塊的形狀
    const arc = d3
      .arc<d3.PieArcDatum<CompanyMarketShareData>>()
      .innerRadius(0)
      .outerRadius(radius);

    // 文字放在圓餅圖內部的位置
    const labelArc = d3
      .arc<d3.PieArcDatum<CompanyMarketShareData>>()
      .innerRadius(radius * 0.62)
      .outerRadius(radius * 0.62);

    // 將原始資料轉成圓餅圖需要的角度資料
    const pieData = pie(companyMarketShareData);

    // 每一塊圓餅圖用 g 包起來
    // 這樣 hover 時可以讓該區塊以自己的中心點原地放大
    const slices = svg
      .select<SVGGElement>(".pie-group")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGGElement, d3.PieArcDatum<CompanyMarketShareData>>("g")
      .data(pieData, (d) => d.data.id)
      .join("g");

    slices
      .selectAll<SVGPathElement, d3.PieArcDatum<CompanyMarketShareData>>("path")
      .data((d) => [d])
      .join("path")
      .attr("fill", (d) => color(d.data.company))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        const parent = d3.select(this.parentNode as SVGGElement);

        const [cx, cy] = arc.centroid(d);

        parent
          .raise()
          .style("filter", "drop-shadow(0 6px 12px rgba(0,0,0,0.75))")
          .transition()
          .duration(200)
          .attr(
            "transform",
            `translate(${cx}, ${cy}) scale(1.10) translate(${-cx}, ${-cy})`,
          );
      })
      .on("mouseleave", function () {
        const parent = d3.select(this.parentNode as SVGGElement);

        parent
          .style("filter", null)
          .transition()
          .duration(200)
          .attr("transform", "translate(0,0)");
      })
      .on("click", (event, d) => {
        event.stopPropagation();

        setTooltip({
          ...d.data,
          x: event.clientX,
          y: event.clientY,
        });
      })
      .transition(t)
      .attr("d", arc);

    // 圓餅圖文字
    // 小於 10% 的區塊不顯示，避免文字太擠
    svg
      .select<SVGGElement>(".pie-labels")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGTextElement, d3.PieArcDatum<CompanyMarketShareData>>("text")
      .data(
        pieData.filter((d) => d.data.marketShare >= 10),
        (d) => d.data.id,
      )
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => `${d.data.company} ${d.data.marketShare}%`)
      .transition(t)
      .attr("transform", (d) => {
        const [x, y] = labelArc.centroid(d);
        return `translate(${x}, ${y})`;
      });

    // legend 圖例
    const legend = svg
      .select<SVGGElement>(".legend")
      .attr("transform", "translate(590, 110)")
      .selectAll<SVGGElement, CompanyMarketShareData>("g")
      .data(companyMarketShareData, (d) => d.id)
      .join("g")
      .attr("transform", (_, index) => `translate(0, ${index * 34})`);

    // legend 色塊
    legend
      .selectAll<SVGRectElement, CompanyMarketShareData>("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("rx", 4)
      .attr("fill", (d) => color(d.company));

    // legend 文字
    legend
      .selectAll<SVGTextElement, CompanyMarketShareData>("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 30)
      .attr("y", 14)
      .attr("fill", "#ffffff")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => `${d.company}：${d.marketShare}%`);
  }, []);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">圓餅圖模組</div>
        <div className="sample-subtitle">- 模擬各公司市場佔有率 -</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="pie-group" />
        <g className="pie-labels" />
        <g className="legend" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.company}</div>
          <div>市占率：{tooltip.marketShare}%</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            圓餅圖用來呈現整體比例分布，滑鼠移入時會讓對應區塊在原本位置直接放大，
            點擊區塊可顯示公司市占率。小於 10% 的區塊不直接顯示名稱，
            避免文字過度擁擠，詳細資訊可透過 legend 與 tooltip 查看。
          </div>
        </div>
      </div>
    </div>
  );
}
