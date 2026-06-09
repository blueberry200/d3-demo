import { useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryObject, Topology } from "topojson-specification";
import taiwanMap from "taiwan-atlas/counties-10t.json";
import {
  stores,
  monthlyData,
} from "@/pages/map/components/taiwan-lat-lng-statistics-sales.data";

// 單個縣市的 GeoJSON 資料
type CountyFeature = Feature<
  Geometry,
  {
    COUNTYNAME: string;
    COUNTYCODE: string;
  }
>;

type TooltipData = {
  x: number;
  y: number;
  storeName: string;
  openedAt: string;
  lat: number;
  lng: number;
  month: string;
  monthlySales: number;
  cumulativeSales: number;
};

type CurrentStorePoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  openedAt: string;
  storeId: string;
  monthlySales: number;
  cumulativeSales: number;
  x: number;
  y: number;
  month: string;
};

const width = 600;
const height = 1000;

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

// 門市資料查找用，map 物件時間複雜度 O(1)
const storeMap = new Map(stores.map((store) => [store.id, store]));

// 累計銷售量最大值
const maxCumulativeSales =
  d3.max(
    monthlyData.flatMap((month) => month.stores),
    (d) => d.cumulativeSales,
  ) ?? 1;

// 累計銷售量跟圓面積的比例尺
const radiusScale = d3
  .scaleSqrt()
  .domain([0, maxCumulativeSales])
  .range([4, 30]);

export default function TaiwanStoreSalesPlaybackMap() {
  const timerRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const currentMonthData = monthlyData[currentIndex];

  // 單一時間點的門市陣列資料，每一個門市結合地理資訊、銷售資訊以及轉換後的網頁座標資訊
  const currentStores = useMemo<CurrentStorePoint[]>(() => {
    return currentMonthData.stores
      .map((sales): CurrentStorePoint | null => {
        // 銷售資料查地理資訊失敗，篩掉
        const store = storeMap.get(sales.storeId);
        if (!store) return null;

        // 地理資訊經緯度落在台灣地圖外，篩掉
        const point = projection([store.lng, store.lat]);
        if (!point) return null;

        return {
          ...store,
          ...sales,
          x: point[0],
          y: point[1],
          month: currentMonthData.month,
        };
      })
      .filter((store): store is CurrentStorePoint => store !== null);
  }, [currentMonthData]);

  // 暫停播放
  const stopPlaying = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPlaying(false);
  };

  // 開始播放
  const startPlaying = () => {
    if (timerRef.current) return;

    setIsPlaying(true);

    // 0.1 秒播放一組年月門市資訊
    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // 判斷是否最後一組年月
        if (next >= monthlyData.length) {
          stopPlaying();
          return prev;
        }

        return next;
      });
    }, 100);
  };

  // 播放按鈕的點擊
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      // 已經在最後一組年月，重置播放
      if (currentIndex >= monthlyData.length - 1) {
        setCurrentIndex(0);

        // 因為 setState 非同步
        // 下一個 event loop 再開始播放
        setTimeout(() => {
          startPlaying();
        }, 0);
      } else {
        startPlaying();
      }
    }
  };

  // 拖曳進度條到想查看的年月，停止動畫並清空 Tooltip
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    stopPlaying();
    setTooltip(null);
    setCurrentIndex(Number(event.target.value));
  };

  return (
    <div className="stack flex-center w-full mt-10 p-4">
      <div className="mb-4">
        <div className="sample-title">
          地圖模組-以經緯度為單位之統計圖表(有時間軸播放器)
        </div>
        <div className="sample-subtitle">
          - 模擬某產品在不同時間點分佈在各地的門市銷售量 -
        </div>
      </div>

      <div className="mb-4 flex w-full max-w-150 items-center gap-4 rounded-xl border p-4">
        <button
          type="button"
          className="rounded border px-4 py-2 text-white"
          onClick={handleTogglePlay}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <input
          type="range"
          min={0}
          max={monthlyData.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="flex-1"
        />

        <div className="w-24 text-lg font-bold">{currentMonthData.month}</div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-160 w-full overflow-visible"
        onClick={() => setTooltip(null)}
      >
        <g>
          {counties.map((county) => {
            const code = county.properties.COUNTYCODE;

            return (
              <path
                key={code}
                d={path(county) ?? ""}
                fill="#e5e7eb"
                stroke="#ffffff"
                strokeWidth={1}
              />
            );
          })}
        </g>

        <g>
          {currentStores.map((store) => (
            <Popover>
              <PopoverTrigger asChild>
                <circle
                  cx={store.x}
                  cy={store.y}
                  r={radiusScale(store.cumulativeSales)}
                  fill="#ef4444"
                  fillOpacity={0.65}
                  stroke="#991b1b"
                  strokeWidth={1}
                  className="cursor-pointer"
                  onClick={() => {
                    stopPlaying();
                  }}
                />
              </PopoverTrigger>

              <PopoverContent
                side="bottom"
                align="start"
                className="
                  w-64
                  border
                  bg-slate-900
                  text-white
                  shadow-xl
                "
              >
                <div className="space-y-1">
                  <div className="text-base font-bold">{store.name}</div>

                  <div>開始營業：{store.openedAt}</div>
                  <div>經度：{store.lng}</div>
                  <div>緯度：{store.lat}</div>
                  <div>年月：{store.month}</div>
                  <div>當月銷售量：{store.monthlySales}</div>
                  <div>累計銷售量：{store.cumulativeSales}</div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </g>
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 rounded border bg-slate-900 px-3 py-2 text-sm text-white shadow"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="mb-1 text-base font-bold">{tooltip.storeName}</div>
          <div>開始營業：{tooltip.openedAt}</div>
          <div>經度：{tooltip.lng}</div>
          <div>緯度：{tooltip.lat}</div>
          <div>年月：{tooltip.month}</div>
          <div>當月銷售量：{tooltip.monthlySales}</div>
          <div>累計銷售量：{tooltip.cumulativeSales}</div>
        </div>
      )}

      <div className="paragraph-wrap-outter">
        <div className="paragraph-wrap-inner">
          <div className="sample-desc-title">簡易介紹：</div>
          <div className="mb-5">
            在地圖圖表上以經緯度標記出來的門市資訊，使用者可以概略了解門市分佈的狀況，而門市標記點的半徑大小，則可以作為某項數據在不同門市之間的比較。
          </div>
          <div className="mb-5">
            假設以「門市累積銷售量」作為產品在「市場流通程度」的評估，可以將標記點的半徑設計為「累積銷售量」，依據不同門市標記點的半徑大小及分佈情形，了解各地區產品的使用量分佈，如果再加入時間維度，以時間軸查看標記點的半徑成長速度，也可以大致評估產品的推廣力度。
          </div>
          <div>
            資料模擬為2024年一月到2025年十二月的門市銷售資料，以一組年月為一個單位，共計24組資料，每一組資料包含所有門市各自的當月銷售量及累積銷售量，點擊地圖上的標記點可以查看該門市在該年月時間點的銷售資料及門市本身的地理資訊，點擊畫面上的播放鍵會依據時間軸在地圖上依序呈現各門市的累積銷售量，以每秒10個月份的速度播放，呈現出產品在各地區的銷售成長速度。
          </div>
        </div>
      </div>
    </div>
  );
}
