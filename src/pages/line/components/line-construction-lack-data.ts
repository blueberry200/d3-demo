export type ConstructionRevenueData = {
  month: string;
  revenue: number | null;
};

export const constructionRevenue2025: ConstructionRevenueData[] = [
  { month: "2025-01", revenue: 1680 },
  { month: "2025-02", revenue: 1420 },
  { month: "2025-03", revenue: 1890 },

  // 缺資料
  { month: "2025-04", revenue: null },

  { month: "2025-05", revenue: 1510 },
  { month: "2025-06", revenue: 2230 },
  { month: "2025-07", revenue: 2040 },

  // 缺資料
  { month: "2025-08", revenue: null },

  { month: "2025-09", revenue: 2560 },
  { month: "2025-10", revenue: 2310 },
  { month: "2025-11", revenue: 2760 },
  { month: "2025-12", revenue: 2480 },
];
