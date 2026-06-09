export type CompanyMarketShareData = {
  id: string;
  company: string;
  marketShare: number;
};

export const companyMarketShareData: CompanyMarketShareData[] = [
  { id: "macro-tech", company: "宏景科技", marketShare: 32 },
  { id: "future-cloud", company: "未來雲端", marketShare: 24 },
  { id: "nova-system", company: "新星系統", marketShare: 15 },
  { id: "smart-link", company: "智慧連線", marketShare: 10 },
  { id: "apex-data", company: "鼎峰數據", marketShare: 7 },
  { id: "blue-chip", company: "藍海晶片", marketShare: 5 },
  { id: "urban-ai", company: "城市智能", marketShare: 4 },
  { id: "next-code", company: "新創程式", marketShare: 3 },
];
