import { useNavigate } from "react-router";
import {
  ChartColumnBig,
  ChartLine,
  MapPinned,
  ChartPie,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

type CardItem = {
  title: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export default function HomeGroupCard() {
  const navigate = useNavigate();

  const data: CardItem[] = [
    {
      title: "條狀圖",
      name: "bar",
      href: "/rect",
      icon: ChartColumnBig,
      description: "適合呈現分類資料、排名、數量比較。",
    },
    {
      title: "線圖",
      name: "line",
      href: "/line",
      icon: ChartLine,
      description: "適合呈現時間序列、趨勢變化。",
    },
    {
      title: "地圖",
      name: "map",
      href: "/map",
      icon: MapPinned,
      description: "適合呈現地理位置、區域分布。",
    },
    {
      title: "圓形圖",
      name: "circle",
      href: "/circle",
      icon: ChartPie,
      description: "適合呈現比例、占比、組成關係。",
    },
    {
      title: "其他",
      name: "other",
      href: "/other-chart",
      icon: LayoutGrid,
      description: "收錄較難依形狀分類的圖表。",
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-start justify-center px-6 py-10">
      <div className="w-full max-w-6xl">
        <div className="mb-10 text-center">
          <div className="ui-page-title">圖表分類</div>
          <div className="ui-page-desc mt-2">- 圖表以呈現形狀來分類 -</div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 justify-start items-center px-5">
          {data.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.name}
                onClick={() => navigate(item.href)}
                className="
                  group mx-auto flex h-85 w-62.5
                  cursor-pointer flex-col overflow-hidden
                  rounded-2xl border border-slate-200 bg-white
                  shadow-sm transition-all duration-200
                  hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl
                "
              >
                <div
                  className="
                    flex-center h-36 bg-slate-500 text-white
                    transition-all duration-300
                    group-hover:bg-slate-900
                  "
                >
                  <Icon
                    size={75}
                    strokeWidth={1.7}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-4 text-sm font-bold text-slate-400 transition-colors duration-300 group-hover:text-slate-900">
                    查看圖表 →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
