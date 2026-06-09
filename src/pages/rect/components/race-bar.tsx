import { useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import * as d3 from "d3";
import {
  stores,
  monthlyData,
} from "@/pages/map/components/taiwan-lat-lng-statistics-sales.data";

type RaceBarData = {
  storeId: string;
  name: string;
  openedAt: string;
  monthlySales: number;
  cumulativeSales: number;
  rank: number;
};

const width = 900;
const height = 560;

const margin = {
  top: 30,
  right: 130,
  bottom: 40,
  left: 120,
};

const barHeight = 34;
const barGap = 10;

const storeMap = new Map(stores.map((store) => [store.id, store]));

const maxCumulativeSales =
  d3.max(
    monthlyData.flatMap((month) => month.stores),
    (d) => d.cumulativeSales,
  ) ?? 1;

const colorScale = d3.scaleOrdinal<string, string>(d3.schemeTableau10);

export default function StoreSalesBarChartRace() {
  const timerRef = useRef<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentMonthData = monthlyData[currentIndex];

  const currentBars = useMemo<RaceBarData[]>(() => {
    return currentMonthData.stores
      .map((sales) => {
        const store = storeMap.get(sales.storeId);
        if (!store) return null;

        return {
          storeId: sales.storeId,
          name: store.name,
          openedAt: store.openedAt,
          monthlySales: sales.monthlySales,
          cumulativeSales: sales.cumulativeSales,
          rank: 0,
        };
      })
      .filter((item): item is RaceBarData => item !== null)
      .sort((a, b) => b.cumulativeSales - a.cumulativeSales)
      .map((item, index) => ({
        ...item,
        rank: index,
      }));
  }, [currentMonthData]);

  const chartInnerWidth = width - margin.left - margin.right;

  const xScale = d3
    .scaleLinear()
    .domain([0, maxCumulativeSales])
    .range([0, chartInnerWidth]);

  const yScale = d3
    .scaleBand<string>()
    .domain(currentBars.map((d) => d.storeId))
    .range([margin.top, margin.top + currentBars.length * (barHeight + barGap)])
    .padding(0.18);

  const xTicks = xScale.ticks(5);

  const stopPlaying = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPlaying(false);
  };

  const startPlaying = () => {
    if (timerRef.current) return;

    setIsPlaying(true);

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;

        if (next >= monthlyData.length) {
          stopPlaying();
          return prev;
        }

        return next;
      });
    }, 700);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlaying();
      return;
    }

    if (currentIndex >= monthlyData.length - 1) {
      setCurrentIndex(0);

      setTimeout(() => {
        startPlaying();
      }, 0);
    } else {
      startPlaying();
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    stopPlaying();
    setCurrentIndex(Number(event.target.value));
  };

  return (
    <div className="stack flex-center mt-10 w-full p-4">
      <div className="mb-4">
        <div className="sample-title">門市累積銷售量 Bar Chart Race</div>
        <div className="sample-subtitle">
          - 隨年月播放，依照累積銷售量自動排序 -
        </div>
      </div>

      <div className="mb-4 flex w-full max-w-180 items-center gap-4 rounded-xl border p-4">
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

        <div className="w-28 text-lg font-bold">{currentMonthData.month}</div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-220 overflow-visible rounded-xl border bg-white"
      >
        <g>
          {xTicks.map((tick) => {
            const x = margin.left + xScale(tick);

            return (
              <g key={tick} transform={`translate(${x},0)`}>
                <line
                  y1={margin.top}
                  y2={height - margin.bottom}
                  stroke="#e5e7eb"
                />
                <text
                  y={height - margin.bottom + 24}
                  textAnchor="middle"
                  className="fill-slate-500 text-xs"
                >
                  {tick}
                </text>
              </g>
            );
          })}
        </g>

        <g>
          {currentBars.map((bar) => {
            const y = yScale(bar.storeId) ?? margin.top;
            const barWidth = xScale(bar.cumulativeSales);

            return (
              <g
                key={bar.storeId}
                className="transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateY(${y}px)`,
                }}
              >
                <text
                  x={margin.left - 12}
                  y={barHeight / 2}
                  dominantBaseline="middle"
                  textAnchor="end"
                  className="fill-slate-700 text-sm font-bold"
                >
                  {bar.name}
                </text>

                <rect
                  x={margin.left}
                  y={0}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={colorScale(bar.storeId)}
                  className="transition-all duration-700 ease-in-out"
                />

                <text
                  x={margin.left + barWidth + 8}
                  y={barHeight / 2}
                  dominantBaseline="middle"
                  className="fill-slate-700 text-sm font-semibold transition-all duration-700 ease-in-out"
                >
                  {d3.format(",")(bar.cumulativeSales)}
                </text>

                <text
                  x={margin.left + barWidth + 8}
                  y={barHeight / 2 + 17}
                  dominantBaseline="middle"
                  className="fill-slate-400 text-xs transition-all duration-700 ease-in-out"
                >
                  本月 +{d3.format(",")(bar.monthlySales)}
                </text>
              </g>
            );
          })}
        </g>

        <text
          x={width - margin.right}
          y={height - 70}
          textAnchor="end"
          className="fill-slate-200 text-7xl font-black"
        >
          {currentMonthData.month}
        </text>

        <text
          x={margin.left}
          y={height - 16}
          className="fill-slate-500 text-sm"
        >
          累積銷售量
        </text>
      </svg>
    </div>
  );
}
