import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

import {
  projectFeatureTreeData,
  type ProjectFeatureNode,
} from "./project-feature-tree-data";

const width = 1300;
const margin = { top: 95, right: 260, bottom: 70, left: 180 };

const nodeGapY = 100;
const nodeGapX = 250;

// TreeNode 額外加入 _children，供 D3 收合節點使用
type TreeNode = Omit<ProjectFeatureNode, "children"> & {
  children?: TreeNode[];
  _children?: TreeNode[];
};

// Tooltip 顯示資料
type TooltipData = TreeNode & {
  x: number;
  y: number;
};

const statusTextMap: Record<ProjectFeatureNode["status"], string> = {
  done: "已完成",
  doing: "進行中",
  todo: "待處理",
};

const statusColorMap: Record<ProjectFeatureNode["status"], string> = {
  done: "#22c55e",
  doing: "#f97316",
  todo: "#94a3b8",
};

const formatNodeName = (name: string) => {
  return name.length > 12 ? `${name.slice(0, 12)}...` : name;
};

// Tooltip 顯示資料
const cloneTree = (node: ProjectFeatureNode): TreeNode => {
  return {
    ...node,
    children: node.children?.map(cloneTree),
  };
};

// 第一層以下預設收合
const collapseByDefault = (node: TreeNode, depth = 0) => {
  if (!node.children) return;

  node.children.forEach((child) => collapseByDefault(child, depth + 1));

  if (depth >= 1) {
    node._children = node.children;
    node.children = undefined;
  }
};

// 遞迴計算節點與所有子節點總工時
const getNodeTotalHours = (node: TreeNode): number => {
  const allChildren = node.children ?? node._children;

  if (!allChildren?.length) return node.estimateHours;

  return d3.sum(allChildren, getNodeTotalHours);
};

export default function ProjectFeatureTreeChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const treeDataRef = useRef<TreeNode | null>(null);

  const [renderKey, setRenderKey] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // 僅第一次 render 初始化樹資料
  if (!treeDataRef.current) {
    const clonedData = cloneTree(projectFeatureTreeData);
    collapseByDefault(clonedData);
    treeDataRef.current = clonedData;
  }

  // D3 階層資料，已被 hierarchy 處理，並補充了節點位置
  const root = useMemo(() => {
    if (!treeDataRef.current) return null;

    // 將 TreeNode 轉為 D3 階層資料
    const hierarchyRoot = d3.hierarchy<TreeNode>(
      treeDataRef.current,
      (d) => d.children,
    );

    // Tree 排版器
    // nodeSize:
    //   第一個參數控制兄弟節點上下距離
    //   第二個參數控制父子節點左右距離
    const treeLayout = d3
      .tree<TreeNode>()
      .nodeSize([nodeGapY, nodeGapX])
      // 不同父節點群組拉開距離
      .separation((a, b) => (a.parent === b.parent ? 1.25 : 1.65));

    treeLayout(hierarchyRoot);

    return hierarchyRoot;
  }, [renderKey]);

  // 攤平整棵樹的所有節點
  const nodes = root
    ? (root.descendants() as d3.HierarchyPointNode<TreeNode>[])
    : [];

  // 取得所有父子連線
  const links = root ? (root.links() as d3.HierarchyPointLink<TreeNode>[]) : [];

  const minX = d3.min(nodes, (d) => d.x) ?? 0;
  const maxX = d3.max(nodes, (d) => d.x) ?? 0;
  const chartHeight = Math.max(680, maxX - minX + margin.top + margin.bottom);

  // 將 D3 Tree 座標轉成 SVG 座標
  const getNodeTransform = (d: d3.HierarchyPointNode<TreeNode>): string => {
    const x = d.y + margin.left;
    const y = d.x - minX + margin.top;

    return `translate(${x}, ${y})`;
  };

  // 沒有 children 與 _children 即為葉節點
  const isLeafNode = (d: d3.HierarchyPointNode<TreeNode>): boolean => {
    return !d.data.children && !d.data._children;
  };

  useEffect(() => {
    // 當滾動頁面時隱藏 tooltip
    const handleScroll = () => {
      setTooltip(null);
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !root) return;

    const svg = d3.select(svgRef.current);
    const t = d3.transition().duration(650);

    // 使用三次貝茲曲線繪製父子連線
    const linkGenerator = (d: d3.HierarchyPointLink<TreeNode>): string => {
      const sourceX = d.source.x - minX + margin.top;
      const sourceY = d.source.y + margin.left;
      const targetX = d.target.x - minX + margin.top;
      const targetY = d.target.y + margin.left;

      return `
        M ${sourceY},${sourceX}
        C ${(sourceY + targetY) / 2},${sourceX}
          ${(sourceY + targetY) / 2},${targetX}
          ${targetY},${targetX}
      `;
    };

    svg
      .select<SVGGElement>(".links")
      .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeNode>>("path")
      .data(links, (d) => d.target.data.id)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "#334155")
            .attr("stroke-opacity", 0.75)
            .attr("stroke-width", 1.5),
        (update) => update,
        (exit) => exit.transition(t).style("opacity", 0).remove(),
      )
      .transition(t)
      .attr("d", linkGenerator);

    const nodeGroup = svg
      .select<SVGGElement>(".nodes")
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeNode>>("g")
      .data(nodes, (d) => d.data.id)
      .join(
        (enter) => {
          // 每個節點使用 <g> 包裝
          // 內含 circle + title + subtitle
          const g = enter
            .append("g")
            .attr("transform", getNodeTransform)
            .style("cursor", "pointer")
            .style("opacity", 0)
            // 點擊節點切換展開 / 收合
            .on("click", (event, d) => {
              event.stopPropagation();

              if (d.data.children) {
                d.data._children = d.data.children;
                d.data.children = undefined;
              } else if (d.data._children) {
                d.data.children = d.data._children;
                d.data._children = undefined;
              }

              setTooltip(null);
              setRenderKey((prev) => prev + 1);
            })
            .on("mouseenter", (event, d) => {
              setTooltip({
                ...d.data,
                estimateHours: getNodeTotalHours(d.data),
                x: event.clientX,
                y: event.clientY,
              });
            })
            .on("mouseleave", () => {
              setTooltip(null);
            });

          g.append("circle")
            .attr("r", 0)
            .attr("stroke", "#020617")
            .attr("stroke-width", 2);

          g.append("text")
            .attr("class", "node-name")
            .attr("dy", "0.32em")
            .attr("fill", "#ffffff")
            .style("font-size", "13px")
            .style("font-weight", "700")
            .style("pointer-events", "none");

          g.append("text")
            .attr("class", "node-subtitle")
            .attr("dy", "1.65em")
            .attr("fill", "#cbd5e1")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("pointer-events", "none");

          return g;
        },
        (update) => update,
        (exit) =>
          exit
            .transition(t)
            .style("opacity", 0)
            .attr("transform", getNodeTransform)
            .remove(),
      );

    nodeGroup
      .transition(t)
      .style("opacity", 1)
      .attr("transform", getNodeTransform);

    nodeGroup
      .select<SVGCircleElement>("circle")
      .transition(t)
      .attr("r", (d) => {
        if (d.data.children || d.data._children) return 8;
        return 6;
      })
      // 收合節點：白色
      // 展開節點：藍色
      // 葉節點：依狀態顯示顏色
      .attr("fill", (d) => {
        if (d.data._children) return "#ffffff";
        if (d.data.children) return "#38bdf8";
        return statusColorMap[d.data.status];
      });

    nodeGroup
      .select<SVGTextElement>(".node-name")
      // 葉節點文字靠右
      // 非葉節點文字靠左
      .attr("x", (d) => (isLeafNode(d) ? 14 : -14))
      .attr("text-anchor", (d) => (isLeafNode(d) ? "start" : "end"))
      .text((d) => formatNodeName(d.data.name));

    nodeGroup
      .select<SVGTextElement>(".node-subtitle")
      // 葉節點文字靠右
      // 非葉節點文字靠左
      .attr("x", (d) => (isLeafNode(d) ? 14 : -14))
      .attr("text-anchor", (d) => (isLeafNode(d) ? "start" : "end"))
      .text((d) => {
        const totalHours = getNodeTotalHours(d.data);
        const childCount =
          d.data.children?.length ?? d.data._children?.length ?? 0;

        if (childCount > 0) {
          return `${childCount} 個子項目 / ${totalHours} 小時`;
        }

        return `${statusTextMap[d.data.status]} / ${totalHours} 小時`;
      });

    const legendData = [
      { label: "已展開", color: "#38bdf8" },
      { label: "可展開 / 已收合", color: "#ffffff" },
      { label: "已完成", color: "#22c55e" },
      { label: "進行中", color: "#f97316" },
      { label: "待處理", color: "#94a3b8" },
    ];

    const legend = svg
      .select<SVGGElement>(".legend")
      .attr("transform", `translate(${margin.left}, 36)`);

    const legendItems = legend
      .selectAll<SVGGElement, (typeof legendData)[number]>("g")
      .data(legendData, (d) => d.label)
      .join("g")
      .attr("transform", (_, index) => `translate(${index * 150}, 0)`);

    legendItems
      .selectAll<SVGCircleElement, (typeof legendData)[number]>("circle")
      .data((d) => [d])
      .join("circle")
      .attr("r", 6)
      .attr("fill", (d) => d.color);

    legendItems
      .selectAll<SVGTextElement, (typeof legendData)[number]>("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 14)
      .attr("dy", "0.35em")
      .attr("fill", "#ffffff")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text((d) => d.label);
  }, [root, nodes, links, minX, renderKey]);

  return (
    <div className="stack flex-center relative mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title text-white">
          樹狀圖模組-橫向可收合樹狀圖
        </div>
        <div className="sample-subtitle text-slate-300">
          - 模擬專案功能、子功能與工時拆分 -
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="w-full max-w-325"
        onClick={() => setTooltip(null)}
      >
        <g className="links" />
        <g className="nodes" />
        <g className="legend" />
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.name}</div>
          <div>負責人：{tooltip.owner}</div>
          <div>狀態：{statusTextMap[tooltip.status]}</div>
          <div>預估工時：{tooltip.estimateHours} 小時</div>
          <div className="mt-1 text-xs text-slate-300">
            點擊節點可展開 / 收合
          </div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            此圖表用來呈現一個專案由主要模組、子功能、細項任務組成的階層關係。
            文字配置參照 D3 tree 的做法，非葉節點文字放在節點左側，
            葉節點文字放在節點右側，避免白色文字被連接線壓住。非頁節點可展開、收合。
          </div>
        </div>
      </div>
    </div>
  );
}
