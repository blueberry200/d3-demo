import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import {
  constructionProfitData,
  type ConstructionProfitData,
} from "./line-construction-regression-data";

const width = 900;
const height = 500;
const margin = { top: 40, right: 40, bottom: 90, left: 100 };

type ChartData = ConstructionProfitData & {
  date: Date;
};

type TooltipData = ChartData & {
  x: number;
  y: number;
};

const parseMonth = d3.timeParse("%Y-%m");

const getChartData = () => {
  return constructionProfitData
    .map((d) => {
      const date = parseMonth(d.month);

      if (!date) return null;

      return {
        ...d,
        date,
      };
    })
    .filter((d): d is ChartData => d !== null);
};

// 計算簡單線性回歸線
const getRegressionLine = (data: ChartData[]) => {
  const points = data.map((d, index) => ({
    x: index,
    y: d.profit,
    date: d.date,
  }));

  const xMean = d3.mean(points, (d) => d.x) ?? 0;
  const yMean = d3.mean(points, (d) => d.y) ?? 0;

  const numerator = d3.sum(points, (d) => {
    return (d.x - xMean) * (d.y - yMean);
  });

  const denominator = d3.sum(points, (d) => {
    return Math.pow(d.x - xMean, 2);
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const first = points[0];
  const last = points[points.length - 1];

  return [
    {
      date: first.date,
      profit: slope * first.x + intercept,
    },
    {
      date: last.date,
      profit: slope * last.x + intercept,
    },
  ];
};

export default function ConstructionProfitRegressionChart() {
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

    const data = getChartData();
    const regressionData = getRegressionLine(data);

    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(750);

    // x 軸的比例尺，使用時間作為橫軸
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    // y 軸的比例尺，呈現建案利潤
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.profit) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // x 軸繪製
    const xAxis = svg
      .select<SVGGElement>(".x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    xAxis
      .transition(t)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeMonth.every(1))
          .tickFormat((d) => d3.timeFormat("%Y-%m")(d as Date)),
      )
      .on("end", () => {
        xAxis
          .selectAll<SVGTextElement, Date>("text")
          .style("font-size", "13px")
          .style("font-weight", "600")
          .attr("text-anchor", "end")
          .attr("transform", "rotate(-35)")
          .attr("dx", "-0.6em")
          .attr("dy", "0.25em");
      });

    // y 軸繪製
    svg
      .select<SVGGElement>(".y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .transition(t)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")))
      .on("end", function () {
        d3.select(this)
          .selectAll("text")
          .style("font-size", "14px")
          .style("font-weight", "600");
      });

    // 回歸線產生器
    const regressionLine = d3
      .line<(typeof regressionData)[number]>()
      .x((d) => x(d.date))
      .y((d) => y(d.profit));

    // 繪製回歸線
    svg
      .select<SVGGElement>(".regression-line-wrap")
      .selectAll<SVGPathElement, (typeof regressionData)[]>("path")
      .data([regressionData])
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "8 6")
      .transition(t)
      .attr("d", regressionLine);

    // 繪製資料點
    svg
      .select<SVGGElement>(".points")
      .selectAll<SVGCircleElement, ChartData>("circle")
      .data(data, (d) => d.id)
      .join("circle")
      .attr("fill", "#60a5fa")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2)
      .attr("r", 6)
      .style("cursor", "pointer")
      .on("mouseenter", function () {
        d3.select(this).attr("fill", "#3b82f6").attr("r", 8);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", "#60a5fa").attr("r", 6);
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
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.profit));

    // 繪製資料點上的利潤標籤
    svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, ChartData>("text")
      .data(data, (d) => d.id)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("pointer-events", "none")
      .text((d) => d3.format(",")(d.profit))
      .transition(t)
      .attr("x", (d) => x(d.date))
      .attr("y", (d) => y(d.profit) - 12);

    // y 軸標題
    svg
      .select<SVGTextElement>(".y-axis-title")
      .text("建案利潤（萬元）")
      .attr("x", -height / 2)
      .attr("y", 28)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#334155")
      .style("font-size", "15px")
      .style("font-weight", "700");

    // 回歸線說明
    svg
      .select<SVGTextElement>(".regression-label")
      .text("紅色虛線：利潤回歸趨勢線")
      .attr("x", width - margin.right)
      .attr("y", margin.top)
      .attr("text-anchor", "end")
      .attr("fill", "#ef4444")
      .style("font-size", "14px")
      .style("font-weight", "700");
  }, []);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">回歸線圖表模組-建案利潤趨勢</div>
        <div className="sample-subtitle">
          - 模擬宏景建設 2025 年各建案利潤 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
        onClick={() => setTooltip(null)}
      >
        <g className="regression-line-wrap" />
        <g className="points" />
        <g className="labels" />
        <g className="x-axis" />
        <g className="y-axis" />
        <text className="y-axis-title" />
        <text className="regression-label" />
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.projectName}</div>
          <div>建設公司：{tooltip.companyName}</div>
          <div>月份：{tooltip.month}</div>
          <div>建案利潤：{d3.format(",")(tooltip.profit)} 萬元</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            這個圖表用散點呈現宏景建設在不同月份的各建案利潤，紅色虛線則是依據所有資料點計算出的簡單線性回歸線，
            可用來觀察整體利潤是否呈現上升或下降趨勢。點擊資料點可查看建案詳細資訊。
          </div>
        </div>
      </div>
    </div>
  );
}
