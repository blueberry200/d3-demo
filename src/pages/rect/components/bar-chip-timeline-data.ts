export type ChipProductionData = {
  year: number;
  totalProduction: number;
  yieldRate: number;
};

export const chipProductionData: ChipProductionData[] = [
  // 初期產量不高，但良率逐漸改善
  { year: 2016, totalProduction: 120000, yieldRate: 78.5 },

  // 擴產成功，產量與良率一起提升
  { year: 2017, totalProduction: 168000, yieldRate: 82.1 },

  // 新製程導入，產量增加但良率下滑
  { year: 2018, totalProduction: 235000, yieldRate: 77.8 },

  // 調整製程後，良率回升，但產量反而下降
  { year: 2019, totalProduction: 198000, yieldRate: 86.2 },

  // 市場需求暴增，大量生產，但良率略降
  { year: 2020, totalProduction: 310000, yieldRate: 83.4 },

  // 生產線穩定，良率提升，但產量小幅修正
  { year: 2021, totalProduction: 288000, yieldRate: 90.1 },

  // 新廠啟用，產量再次暴增，但良率受到影響
  { year: 2022, totalProduction: 405000, yieldRate: 84.7 },

  // 良率優化成功，但產量因高階製程轉換而下降
  { year: 2023, totalProduction: 352000, yieldRate: 92.5 },

  // 接單增加，產量提升，但良率略微下降
  { year: 2024, totalProduction: 438000, yieldRate: 89.6 },

  // 製程成熟，產量與良率同步創高
  { year: 2025, totalProduction: 520000, yieldRate: 94.2 },
];
