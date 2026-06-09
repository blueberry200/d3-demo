import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import taiwanMap from "taiwan-atlas/counties-10t.json";
import { salesByCounty } from "@/pages/map/components/taiwan-county-statistics-sales-data";

// 單個縣市的 GeoJSON 資料
type CountyFeature = Feature<
  Geometry,
  {
    COUNTYNAME: string;
    COUNTYCODE: string;
  }
>;

const width = 600;
const height = 1000;
const activeScale = 1.5; // 選中縣市時的放大比例

// 台灣地區的 TopoJSON
const topology = taiwanMap as unknown as Topology<{
  counties: GeometryObject;
}>;

// 台灣各縣市的 GeoJSON，因為 counties 有多個縣市，所以是 FeatureCollection
const geojson = feature(
  topology,
  topology.objects.counties,
) as FeatureCollection<Geometry, CountyFeature["properties"]>;

// 取出 GeoJSON 的各縣市資料，用作:
// 1. 經緯度換算跟畫面座標的比例尺
// 2. JSX 跑迴圈繪製地圖
const counties = geojson.features as CountyFeature[];

// 投影函式，將經緯度跟畫面座標換算的比例尺
const projection = d3.geoMercator().fitSize([width, height], {
  type: "FeatureCollection",
  features: counties,
});

// 轉換函式： GeoJSON -> 經緯度 -> 畫面座標 -> SVG 路徑
const path = d3.geoPath(projection);
// 銷售量轉色塊的比例尺需要用到的 domain 邊界值
const maxSales = d3.max(Object.values(salesByCounty), (d) => d.total) ?? 1;
// 銷售量轉色塊的比例尺
const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxSales]);

export default function TaiwanCountyStatisticsMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeCode, setActiveCode] = useState(""); // 選中的縣市
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  // 選中的縣市對應的銷售量資訊
  const activeSales = activeCode ? salesByCounty[activeCode] : null;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // 縣市區塊在 active 切換時的放大縮小
    svg
      .selectAll<SVGGElement, unknown>(".county-group")
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .attr("transform", function () {
        const code = this.dataset.code ?? "";
        const cx = Number(this.dataset.cx);
        const cy = Number(this.dataset.cy);
        // 不是選中的縣市，要把大小縮回來
        // d3.zoomIdentity 為放大縮小的初始值，等同於 teanslate(0, 0) scale(1)
        // toString() 轉成字串是因為 d3 的 transform 屬性只接受字串
        if (code !== activeCode) {
          return d3.zoomIdentity.toString();
        }
        // 選中的縣市，要放大
        // 因為放大的過程座標也會等比例放大，縣市區塊會跟著座標偏移
        // 所以需要先將原點偏移到縣市地區中心，再放大，再把原點移回來
        return d3.zoomIdentity
          .translate(cx, cy)
          .scale(activeScale)
          .translate(-cx, -cy)
          .toString();
      });

    // 縣市邊框在 active 切換時的線寬
    svg
      .selectAll<SVGPathElement, unknown>(".county-path")
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .attr("stroke-width", function () {
        return this.dataset.code === activeCode ? 2 : 1;
      });
  }, [activeCode]);

  return (
    <div className="stack flex-center w-full mt-10 p-4">
      <div className="mb-4">
        <div className="sample-title">地圖模組-以縣市為單位之統計圖表</div>
        <div className="sample-subtitle">
          - 模擬某產品在台灣各地區之銷售統計數據 -
        </div>
      </div>

      <div className="w-150 max-w-full flex h-35 md:h-25 flex-col justify-center rounded-xl border px-4">
        {activeSales ? (
          <div>
            <div className="flex flex-wrap items-center gap-x-5">
              <div className="text-2xl font-bold">{activeSales.countyName}</div>
              <div>總人數：{activeSales.total}</div>
              <div>男性人數：{activeSales.male}</div>
              <div>女性人數：{activeSales.female}</div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5">
              <div>20歲以下：{activeSales.ageGroups.under20}</div>
              <div>21-40歲：{activeSales.ageGroups.age21to40}</div>
              <div>41-60歲：{activeSales.ageGroups.age41to60}</div>
              <div>60歲以上：{activeSales.ageGroups.over60}</div>
            </div>
          </div>
        ) : (
          <div className="text-xl font-bold">點擊地圖查看縣市銷售資料</div>
        )}
      </div>

      <div className="mt-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-160 w-full overflow-visible"
          onClick={() => setActiveCode("")}
        >
          <g>
            {counties.map((county) => {
              const code = county.properties.COUNTYCODE;
              const name = county.properties.COUNTYNAME;
              const areaSalesData = salesByCounty[code];

              const [[x0, y0], [x1, y1]] = path.bounds(county);
              const cx = (x0 + x1) / 2;
              const cy = (y0 + y1) / 2;

              return (
                <g
                  key={code}
                  className="county-group"
                  data-code={code}
                  data-cx={cx}
                  data-cy={cy}
                  transform="translate(0,0) scale(1)"
                >
                  <path
                    className="county-path cursor-pointer hover:opacity-80"
                    data-code={code}
                    d={path(county) ?? ""}
                    fill={
                      areaSalesData ? color(areaSalesData.total) : "#d1d5db"
                    }
                    stroke="#ffffff"
                    strokeWidth={1}
                    onClick={(event) => {
                      event.stopPropagation();

                      d3.select(event.currentTarget.parentElement).raise();

                      setActiveCode((prev) => (prev === code ? "" : code));
                    }}
                    onMouseMove={(event) => {
                      setTooltip({
                        x: event.clientX,
                        y: event.clientY,
                        text: areaSalesData
                          ? `${name}｜總人數 ${areaSalesData.total}`
                          : `${name}｜尚無資料`,
                      });
                    }}
                    onMouseLeave={() => {
                      setTooltip(null);
                    }}
                  ></path>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed border z-50 rounded bg-slate-900 px-2 py-1 text-sm text-white shadow"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div>
            地圖形式的報表，適合呈現以縣市為單位的統計數據，比方某產品的全台銷售統計，各縣市依照銷售量以深淺顏色呈現分佈，鼠標懸浮時顯示該縣市的銷售數，點擊特定縣市會在上方儀表板顯示該縣市的各維度統計數據，並放大顯示該縣市的地圖。
          </div>
        </div>
      </div>
    </div>
  );
}
