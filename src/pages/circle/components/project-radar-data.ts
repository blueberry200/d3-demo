export type RadarAttributeKey =
  | "marketGrowth"
  | "expectedProfit"
  | "customerDependency"
  | "operationEfficiency"
  | "technicalScalability";

export type ProjectRadarData = {
  id: string;
  name: string;
  color: string;

  // 市場規模提升
  marketGrowth: number;

  // 預期利潤
  expectedProfit: number;

  // 客戶依賴度
  customerDependency: number;

  // 維運效益提升
  operationEfficiency: number;

  // 技術擴展性
  technicalScalability: number;
};

export const radarAttributes: {
  key: RadarAttributeKey;
  label: string;
}[] = [
  {
    key: "marketGrowth",
    label: "市場規模提升",
  },
  {
    key: "expectedProfit",
    label: "預期利潤",
  },
  {
    key: "customerDependency",
    label: "客戶依賴度",
  },
  {
    key: "operationEfficiency",
    label: "維運效益提升",
  },
  {
    key: "technicalScalability",
    label: "技術擴展性",
  },
];

export const projectRadarData: ProjectRadarData[] = [
  {
    id: "ai-customer-service",
    name: "AI 智慧客服平台",
    color: "#60a5fa",

    // AI 類產品
    marketGrowth: 98,
    expectedProfit: 88,
    customerDependency: 45,
    operationEfficiency: 92,
    technicalScalability: 97,
  },
  {
    id: "supply-chain-system",
    name: "供應鏈管理系統",
    color: "#f97316",

    // 傳統企業系統
    marketGrowth: 40,
    expectedProfit: 75,
    customerDependency: 98,
    operationEfficiency: 96,
    technicalScalability: 38,
  },
  {
    id: "data-analysis-platform",
    name: "企業數據分析平台",
    color: "#22c55e",

    // 資料平台
    marketGrowth: 82,
    expectedProfit: 55,
    customerDependency: 35,
    operationEfficiency: 68,
    technicalScalability: 100,
  },
];
