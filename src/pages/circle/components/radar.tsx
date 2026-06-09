import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import { projectRadarData, radarAttributes } from "./project-radar-data";

const width = 900;
const height = 650;

const centerX = width / 2;
const centerY = 340;

const radarRadius = 220;
const maxValue = 100;

type RadarPoint = {
  x: number;
  y: number;
  attributeKey: string;
  color: string;
  id: string;
};

export default function ProjectRadarChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    projectRadarData.map((d) => d.id),
  );

  const data = useMemo(() => {
    return projectRadarData.filter((project) =>
      selectedProjects.includes(project.id),
    );
  }, [selectedProjects]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(750);

    const angleSlice = (Math.PI * 2) / radarAttributes.length;

    // 計算座標
    const getPoint = (index: number, value: number) => {
      // 角度由上開始，所以要 - Math.PI / 2
      const angle = angleSlice * index - Math.PI / 2;
      const radius = (value / maxValue) * radarRadius;

      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    };

    // 多邊形繪製工具
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveLinearClosed);

    // 中心點，選消的時候用
    const centerPoints = radarAttributes.map(() => ({
      x: centerX,
      y: centerY,
    }));

    // 網格距離
    const levels = [20, 40, 60, 80, 100];

    // 背景網格
    svg
      .select<SVGGElement>(".grid")
      .selectAll<SVGPolygonElement, number>("polygon")
      .data(levels)
      .join("polygon")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1)
      .attr("points", (level) => {
        return radarAttributes
          .map((_, index) => {
            const point = getPoint(index, level);
            return `${point.x},${point.y}`;
          })
          .join(" ");
      });

    // 中心放射線
    svg
      .select<SVGGElement>(".axis-lines")
      .selectAll<SVGLineElement, (typeof radarAttributes)[number]>("line")
      .data(radarAttributes, (d) => d.key)
      .join("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("x2", (_, index) => getPoint(index, maxValue).x)
      .attr("y2", (_, index) => getPoint(index, maxValue).y)
      .attr("stroke", "#cbd5e1");

    // 頂點標籤
    svg
      .select<SVGGElement>(".axis-labels")
      .selectAll<SVGTextElement, (typeof radarAttributes)[number]>("text")
      .data(radarAttributes, (d) => d.key)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("dy", "0.35em")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text((d) => d.label)
      .transition(t)
      .attr("x", (_, index) => getPoint(index, 125).x)
      .attr("y", (_, index) => getPoint(index, 125).y);

    const radarData = data.map((project) => {
      const points = radarAttributes.map((attribute, index) => {
        return {
          ...getPoint(index, project[attribute.key]),
          attributeKey: attribute.key,
        };
      });

      return {
        ...project,
        points,
      };
    });

    // 雷達圖區域
    svg
      .select<SVGGElement>(".areas")
      .selectAll<SVGPathElement, (typeof radarData)[number]>("path")
      .data(radarData, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("fill", (d) => d.color)
            .attr("fill-opacity", 0.18)
            .attr("stroke", (d) => d.color)
            .attr("stroke-width", 3)
            .attr("d", line(centerPoints)),
        (update) => update,
        (exit) => exit.transition(t).attr("d", line(centerPoints)).remove(),
      )
      .transition(t)
      .attr("d", (d) => line(d.points));

    // 資料點
    svg
      .select<SVGGElement>(".points")
      .selectAll<SVGCircleElement, RadarPoint>("circle")
      .data(
        radarData.flatMap((project) =>
          project.points.map((point) => ({
            ...point,
            color: project.color,
            id: project.id,
          })),
        ),
        (d) => `${d.id}-${d.attributeKey}`,
      )
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", 0)
            .attr("fill", (d) => d.color),
        (update) => update,
        (exit) =>
          exit
            .transition(t)
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", 0)
            .remove(),
      )
      .transition(t)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 5)
      .attr("fill", (d) => d.color);
  }, [data]);

  // 專案勾選框
  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      }

      return [...prev, projectId];
    });
  };

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">雷達圖模組-多選屬性比對</div>
        <div className="sample-subtitle">
          - 比較不同軟體專案的商業與技術價值 -
        </div>
      </div>

      <div className="mb-4 flex w-full max-w-225 flex-wrap gap-4 rounded-xl border p-4">
        <div className="font-bold">選擇專案</div>

        {projectRadarData.map((project) => (
          <label
            key={project.id}
            className="flex cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              checked={selectedProjects.includes(project.id)}
              onChange={() => toggleProject(project.id)}
            />

            <span
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: project.color }}
            />

            <span>{project.name}</span>
          </label>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-225"
      >
        <g className="grid" />
        <g className="axis-lines" />
        <g className="areas" />
        <g className="points" />
        <g className="axis-labels" />
      </svg>

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>

          <div>
            雷達圖可用於比較不同專案的綜合能力表現，每個頂點代表一項評估指標，
            上方可勾選欲顯示的專案，勾選框旁的色塊則代表該專案在雷達圖中的對應顏色。
          </div>
        </div>
      </div>
    </div>
  );
}
