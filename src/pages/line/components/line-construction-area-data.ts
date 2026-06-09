export type ConstructionPercentData = {
  month: string;
  horizonBuild: number; // 宏景建設(%)
  urbanStone: number; // 城石營造(%)
  apexConstruct: number; // 鼎峰工程(%)
};

export const constructionPercentData: ConstructionPercentData[] = [
  { month: "2025-01", horizonBuild: 38, urbanStone: 30, apexConstruct: 18 },
  { month: "2025-02", horizonBuild: 42, urbanStone: 27, apexConstruct: 21 },
  { month: "2025-03", horizonBuild: 45, urbanStone: 31, apexConstruct: 17 },
  { month: "2025-04", horizonBuild: 41, urbanStone: 34, apexConstruct: 20 },
  { month: "2025-05", horizonBuild: 47, urbanStone: 29, apexConstruct: 19 },
  { month: "2025-06", horizonBuild: 50, urbanStone: 26, apexConstruct: 22 },
  { month: "2025-07", horizonBuild: 46, urbanStone: 32, apexConstruct: 21 },
  { month: "2025-08", horizonBuild: 40, urbanStone: 36, apexConstruct: 19 },
  { month: "2025-09", horizonBuild: 37, urbanStone: 40, apexConstruct: 21 },
  { month: "2025-10", horizonBuild: 43, urbanStone: 35, apexConstruct: 20 },
  { month: "2025-11", horizonBuild: 36, urbanStone: 42, apexConstruct: 19 },
  { month: "2025-12", horizonBuild: 33, urbanStone: 39, apexConstruct: 24 },
];
