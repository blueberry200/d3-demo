import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "antd";
import * as d3 from "d3";

import {
  projectModules,
  type ProjectModule,
} from "./project-dashboard-gauge-data";

const width = 900;
const height = 560;

const centerX = width / 2;
const centerY = 320;

// 儀表板最大值固定 40 小時
const gaugeMaxHours = 40;

// 兩組軸線貼合：內圈外半徑 = 外圈內半徑
const outerAxisInnerRadius = 160;
const outerAxisOuterRadius = 168;

const innerAxisInnerRadius = 152;
const innerAxisOuterRadius = 160;

// 指針固定長度，不用 x2/y2 transition，避免移動時忽長忽短
const pointerLength = innerAxisInnerRadius - 12;

// 下方缺口 90 度，所以實際儀表板使用 270 度
const startAngle = 135;
const endAngle = 405;
const totalAngle = endAngle - startAngle;

const degToRad = (deg: number) => (deg * Math.PI) / 180;

// 將一般 SVG 角度轉成 d3.arc 使用的角度
const toD3Angle = (deg: number) => degToRad(deg + 90);

// 依據角度計算座標
const getPointByAngle = (angle: number, radius: number) => {
  return {
    x: Math.cos(degToRad(angle)) * radius,
    y: Math.sin(degToRad(angle)) * radius,
  };
};

// 角度最大固定只到 40 小時
const getAngleByHours = (hours: number) => {
  const safeHours = Math.min(hours, gaugeMaxHours);
  return startAngle + (safeHours / gaugeMaxHours) * totalAngle;
};

// 依據目前工時比例取得狀態顏色
const getScheduleColor = (progress: number) => {
  if (progress <= 3 / 5) return "#22c55e";
  if (progress <= 4 / 5) return "#f59e0b";
  return "#ef4444";
};

export default function ProjectDashboardGaugeChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 目前勾選的子功能
  const selectedModules = useMemo(() => {
    return projectModules.filter((item) => selectedIds.includes(item.id));
  }, [selectedIds]);

  // 實際累加總時數，可超過 40
  const currentHours = useMemo(() => {
    return selectedModules.reduce((sum, item) => sum + item.hours, 0);
  }, [selectedModules]);

  // 儀表板顯示用時數，最多只顯示到 40 小時
  const displayHours = useMemo(() => {
    return Math.min(currentHours, gaugeMaxHours);
  }, [currentHours]);

  // 目前工時百分比，最多不超過 100%
  const progress = useMemo(() => {
    return displayHours / gaugeMaxHours;
  }, [displayHours]);

  const scheduleColor = getScheduleColor(progress);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(750);

    const outerAxisArc = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(outerAxisInnerRadius)
      .outerRadius(outerAxisOuterRadius)
      .cornerRadius(0);

    const innerAxisArc = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(innerAxisInnerRadius)
      .outerRadius(innerAxisOuterRadius)
      .cornerRadius(0);

    const progressArc = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(outerAxisInnerRadius)
      .outerRadius(outerAxisOuterRadius)
      .cornerRadius(0);

    // 外圈：每 8 小時一天，共 5 天
    const daySegments = d3.range(0, 5).map((index) => {
      const startHour = index * 8;
      const endHour = (index + 1) * 8;

      return {
        id: `day-${index + 1}`,
        startHour,
        endHour,
        color: index <= 2 ? "#22c55e" : index === 3 ? "#f59e0b" : "#ef4444",
      };
    });

    // 外圈軸線
    svg
      .select<SVGGElement>(".outer-axis")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGPathElement, (typeof daySegments)[number]>("path")
      .data(daySegments, (d) => d.id)
      .join("path")
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.45)
      .attr("d", (d) => {
        return outerAxisArc({
          startAngle: toD3Angle(getAngleByHours(d.startHour)),
          endAngle: toD3Angle(getAngleByHours(d.endHour)),
        });
      });

    // 內圈軸線
    svg
      .select<SVGGElement>(".inner-axis")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGPathElement, number>("path")
      .data([1])
      .join("path")
      .attr("fill", "#ffffff")
      .attr("opacity", 0.85)
      .attr("d", () => {
        return innerAxisArc({
          startAngle: toD3Angle(startAngle),
          endAngle: toD3Angle(endAngle),
        });
      });

    // 目前進度外圈
    svg
      .select<SVGGElement>(".gauge-progress")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGPathElement, number>("path")
      .data([progress])
      .join("path")
      .attr("fill", scheduleColor)
      .transition(t)
      .attrTween("d", function () {
        const previous = Number(this.getAttribute("data-progress") ?? 0);
        const interpolate = d3.interpolate(previous, progress);

        this.setAttribute("data-progress", String(progress));

        return (value) => {
          const nextProgress = interpolate(value);
          const nextAngle = startAngle + nextProgress * totalAngle;

          return (
            progressArc({
              startAngle: toD3Angle(startAngle),
              endAngle: toD3Angle(nextAngle),
            }) ?? ""
          );
        };
      });

    // 外圈大刻度：每 8 小時
    const outerTicks = d3.range(0, 41, 8).map((hours) => {
      return {
        id: `outer-${hours}`,
        hours,
        angle: getAngleByHours(hours),
      };
    });

    svg
      .select<SVGGElement>(".outer-ticks")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGLineElement, (typeof outerTicks)[number]>("line")
      .data(outerTicks, (d) => d.id)
      .join("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "butt")
      .attr("x1", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 2).x)
      .attr("y1", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 2).y)
      .attr("x2", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 22).x)
      .attr("y2", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 22).y);

    // 外圈文字：1天～5天
    const outerLabels = d3.range(0, 6).map((day) => {
      const hours = day * 8;

      return {
        id: `day-label-${day}`,
        angle: getAngleByHours(hours),
        label: `${day}天`,
      };
    });

    svg
      .select<SVGGElement>(".outer-labels")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGTextElement, (typeof outerLabels)[number]>("text")
      .data(outerLabels, (d) => d.id)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => d.label)
      .attr("x", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 48).x)
      .attr("y", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 48).y)
      .attr("dy", "0.35em");

    // 內圈小刻度：每 1 小時
    const innerTicks = d3.range(0, 41, 1).map((hours) => {
      return {
        id: `inner-${hours}`,
        hours,
        angle: getAngleByHours(hours),
        isTenHour: hours % 10 === 0,
      };
    });

    svg
      .select<SVGGElement>(".inner-ticks")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGLineElement, (typeof innerTicks)[number]>("line")
      .data(innerTicks, (d) => d.id)
      .join("line")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", (d) => (d.isTenHour ? 2 : 1))
      .attr("stroke-linecap", "butt")
      .attr("x1", (d) => getPointByAngle(d.angle, innerAxisInnerRadius - 2).x)
      .attr("y1", (d) => getPointByAngle(d.angle, innerAxisInnerRadius - 2).y)
      .attr(
        "x2",
        (d) =>
          getPointByAngle(
            d.angle,
            innerAxisInnerRadius - (d.isTenHour ? 20 : 12),
          ).x,
      )
      .attr(
        "y2",
        (d) =>
          getPointByAngle(
            d.angle,
            innerAxisInnerRadius - (d.isTenHour ? 20 : 12),
          ).y,
      );

    // 內圈文字：10小時～40小時
    const innerLabels = d3.range(0, 41, 10).map((hours) => {
      return {
        id: `hour-label-${hours}`,
        angle: getAngleByHours(hours),
        label: `${hours}小時`,
      };
    });

    svg
      .select<SVGGElement>(".inner-labels")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGTextElement, (typeof innerLabels)[number]>("text")
      .data(innerLabels, (d) => d.id)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "700")
      .text((d) => d.label)
      .attr("x", (d) => getPointByAngle(d.angle, innerAxisInnerRadius - 46).x)
      .attr("y", (d) => getPointByAngle(d.angle, innerAxisInnerRadius - 46).y)
      .attr("dy", "0.35em");

    // 狀態文字：放到外軸線外側
    const rangeLabels = [
      {
        id: "safe",
        angle: getAngleByHours(13),
        label: "時程充裕",
        color: "#22c55e",
      },
      {
        id: "warning",
        angle: getAngleByHours(29),
        label: "略微緊迫",
        color: "#f59e0b",
      },
      {
        id: "danger",
        angle: getAngleByHours(37),
        label: "時程緊迫",
        color: "#ef4444",
      },
    ];

    svg
      .select<SVGGElement>(".range-labels")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll<SVGTextElement, (typeof rangeLabels)[number]>("text")
      .data(rangeLabels, (d) => d.id)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", (d) => d.color)
      .style("font-size", "16px")
      .style("font-weight", "800")
      .text((d) => d.label)
      .attr("x", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 88).x)
      .attr("y", (d) => getPointByAngle(d.angle, outerAxisOuterRadius + 88).y)
      .attr("dy", "0.35em");

    const currentAngle = startAngle + progress * totalAngle;

    // 指針
    svg
      .select<SVGGElement>(".pointer-group")
      .transition(t)
      .attr(
        "transform",
        `translate(${centerX}, ${centerY}) rotate(${currentAngle})`,
      );

    svg.select<SVGLineElement>(".pointer").attr("stroke", scheduleColor);

    // 總時數
    svg
      .select<SVGTextElement>(".pointer-hours-label")
      .transition(t)
      .attr("x", centerX)
      .attr("y", centerY + 160)
      .attr("text-anchor", "middle")
      .attr("fill", scheduleColor)
      .style("font-size", "32px")
      .style("font-weight", "900")
      .text(`${currentHours}h`);

    // 指針中心點
    svg
      .select<SVGCircleElement>(".pointer-center")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("fill", scheduleColor);
  }, [currentHours]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">圓形儀表板模組-壓力評估計量表</div>
        <div className="sample-subtitle">
          - 模擬專案子功能工時累加與時程壓力 -
        </div>
      </div>

      <div className="mb-4 grid w-full max-w-225 grid-cols-2 gap-3 rounded-xl border p-4 md:grid-cols-3">
        {projectModules.map((item: ProjectModule) => {
          return (
            <Checkbox
              key={item.id}
              checked={selectedIds.includes(item.id)}
              onChange={(event) => {
                const checked = event.target.checked;

                if (checked) {
                  setSelectedIds((prev) => [...prev, item.id]);
                } else {
                  setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                }
              }}
            >
              <span className="font-bold text-white">{item.name}</span>
              <span className="ml-2 text-slate-200">({item.hours}h)</span>
            </Checkbox>
          );
        })}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
      >
        <g className="outer-axis" />
        <g className="inner-axis" />
        <g className="gauge-progress" />

        <g className="outer-ticks" />
        <g className="inner-ticks" />

        <g className="outer-labels" />
        <g className="inner-labels" />
        <g className="range-labels" />

        <g
          className="pointer-group"
          transform={`translate(${centerX}, ${centerY}) rotate(${startAngle})`}
        >
          <line
            className="pointer"
            x1={0}
            y1={0}
            x2={pointerLength}
            y2={0}
            stroke="#22c55e"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </g>

        <text className="pointer-hours-label" />

        <circle className="pointer-center" r={14} />
        <circle cx={centerX} cy={centerY} r={6} fill="#ffffff" />
      </svg>

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            此圖表為模擬一週工時規劃的壓力評估計量表，
            勾選專案內的子功能後，系統會累加各功能預估時數，並將結果呈現在汽車儀表板樣式的圓形圖表上。
            由於每日工時預計為 8 小時，一週總時數為 40
            小時，因此儀表板最大值固定為 40 小時，外圈每 8 小時代表 1 天，內圈每
            1 小時為一個小刻度，每 10 小時標記一次。若累加超過 40
            小時，指針仍會停在 40 小時位置，但指針底下會顯示實際累加總時數。
          </div>
        </div>
      </div>
    </div>
  );
}
