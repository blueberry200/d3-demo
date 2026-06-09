export type ConstructionProjectBubbleData = {
  project: string;

  // X軸：預期利潤率(%)
  profitRate: number;

  // Y軸：專案風險分數
  riskScore: number;

  // 泡泡大小：總預算(億元)
  budget: number;

  // 分類
  status: "進行中" | "規劃中" | "已完工";
};

export const constructionProjectBubbleData: ConstructionProjectBubbleData[] = [
  {
    project: "台北信義商辦大樓",
    profitRate: 24,
    riskScore: 42,
    budget: 85,
    status: "進行中",
  },
  {
    project: "新北板橋住宅一期",
    profitRate: 18,
    riskScore: 28,
    budget: 45,
    status: "已完工",
  },
  {
    project: "桃園航空城商業區",
    profitRate: 32,
    riskScore: 68,
    budget: 130,
    status: "進行中",
  },
  {
    project: "新竹科技園區辦公園區",
    profitRate: 36,
    riskScore: 55,
    budget: 110,
    status: "規劃中",
  },
  {
    project: "台中七期豪宅開發案",
    profitRate: 28,
    riskScore: 38,
    budget: 92,
    status: "進行中",
  },
  {
    project: "彰化物流中心",
    profitRate: 14,
    riskScore: 18,
    budget: 35,
    status: "已完工",
  },
  {
    project: "台南高鐵特區住宅案",
    profitRate: 26,
    riskScore: 44,
    budget: 58,
    status: "進行中",
  },
  {
    project: "高雄亞洲新灣區商辦",
    profitRate: 34,
    riskScore: 72,
    budget: 150,
    status: "規劃中",
  },
  {
    project: "高雄港區倉儲園區",
    profitRate: 20,
    riskScore: 30,
    budget: 70,
    status: "已完工",
  },
  {
    project: "屏東產業園區開發案",
    profitRate: 22,
    riskScore: 58,
    budget: 65,
    status: "規劃中",
  },
  {
    project: "宜蘭渡假飯店開發案",
    profitRate: 17,
    riskScore: 46,
    budget: 40,
    status: "進行中",
  },
  {
    project: "花蓮海景住宅社區",
    profitRate: 19,
    riskScore: 63,
    budget: 52,
    status: "規劃中",
  },
  {
    project: "台東觀光商場計畫",
    profitRate: 15,
    riskScore: 54,
    budget: 33,
    status: "規劃中",
  },
  {
    project: "台中捷運聯開案",
    profitRate: 30,
    riskScore: 48,
    budget: 120,
    status: "進行中",
  },
  {
    project: "台北都更重建案",
    profitRate: 40,
    riskScore: 85,
    budget: 180,
    status: "規劃中",
  },
];
