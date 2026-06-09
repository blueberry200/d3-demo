export type AIUsageData = {
  region: "北部" | "中部" | "南部" | "東部";
  company: string;

  // 員工 AI 使用比例 (%)
  usageRate: number;
};

export const aiUsageData: AIUsageData[] = [
  // 北部
  { region: "北部", company: "台北金融A", usageRate: 88 },
  { region: "北部", company: "台北金融B", usageRate: 85 },
  { region: "北部", company: "台北科技C", usageRate: 92 },
  { region: "北部", company: "新竹科技D", usageRate: 95 },
  { region: "北部", company: "桃園物流E", usageRate: 78 },
  { region: "北部", company: "台北顧問F", usageRate: 81 },
  { region: "北部", company: "新北保險G", usageRate: 86 },
  { region: "北部", company: "新竹製造H", usageRate: 90 },

  // 中部
  { region: "中部", company: "台中機械A", usageRate: 72 },
  { region: "中部", company: "台中貿易B", usageRate: 69 },
  { region: "中部", company: "彰化製造C", usageRate: 76 },
  { region: "中部", company: "南投物流D", usageRate: 61 },
  { region: "中部", company: "台中服務E", usageRate: 70 },
  { region: "中部", company: "彰化金融F", usageRate: 65 },
  { region: "中部", company: "台中軟體G", usageRate: 82 },
  { region: "中部", company: "雲林零售H", usageRate: 58 },

  // 南部
  { region: "南部", company: "高雄鋼鐵A", usageRate: 66 },
  { region: "南部", company: "台南科技B", usageRate: 80 },
  { region: "南部", company: "高雄物流C", usageRate: 62 },
  { region: "南部", company: "台南顧問D", usageRate: 73 },
  { region: "南部", company: "屏東零售E", usageRate: 57 },
  { region: "南部", company: "高雄金融F", usageRate: 69 },
  { region: "南部", company: "台南製造G", usageRate: 77 },
  { region: "南部", company: "高雄軟體H", usageRate: 84 },

  // 東部
  { region: "東部", company: "花蓮觀光A", usageRate: 45 },
  { region: "東部", company: "花蓮物流B", usageRate: 52 },
  { region: "東部", company: "台東零售C", usageRate: 48 },
  { region: "東部", company: "台東服務D", usageRate: 41 },
  { region: "東部", company: "花蓮教育E", usageRate: 58 },
  { region: "東部", company: "台東金融F", usageRate: 46 },
  { region: "東部", company: "花蓮顧問G", usageRate: 54 },
  { region: "東部", company: "台東醫療H", usageRate: 50 },
];
