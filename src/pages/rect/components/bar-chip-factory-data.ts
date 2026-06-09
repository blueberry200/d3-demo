export type ChipFactory = {
  id: string;
  name: string;
  sales2025: number;

  // 相對於 2024 年營業額成長百分比
  revenueGrowthRate: number;

  // 三種晶片銷量
  cpuSales: number;
  gpuSales: number;
  aiChipSales: number;

  foundedYear: number;
  employeeCount: number;
  yieldRate: number;
};

export const chipKeys = ["cpuSales", "gpuSales", "aiChipSales"] as const;

export const chipFactories: ChipFactory[] = [
  {
    id: "aurora-semi",
    name: "Aurora Semi",
    revenueGrowthRate: 12.5,
    cpuSales: 42000,
    gpuSales: 36000,
    aiChipSales: 50000,
    sales2025: 128000,
    foundedYear: 2016,
    employeeCount: 3900,
    yieldRate: 95.5,
  },
  {
    id: "nova-chip",
    name: "NovaChip",
    revenueGrowthRate: 28.4,
    cpuSales: 68000,
    gpuSales: 52000,
    aiChipSales: 56000,
    sales2025: 176000,
    foundedYear: 2001,
    employeeCount: 12400,
    yieldRate: 89.7,
  },
  {
    id: "titan-foundry",
    name: "Titan Foundry",
    revenueGrowthRate: -8.6,
    cpuSales: 18000,
    gpuSales: 22500,
    aiChipSales: 33000,
    sales2025: 73500,
    foundedYear: 2020,
    employeeCount: 21600,
    yieldRate: 92.4,
  },
  {
    id: "quantum-core",
    name: "Quantum Core",
    revenueGrowthRate: 18.2,
    cpuSales: 47000,
    gpuSales: 39000,
    aiChipSales: 56000,
    sales2025: 142000,
    foundedYear: 2008,
    employeeCount: 5200,
    yieldRate: 90.6,
  },
  {
    id: "helios-micro",
    name: "Helios Micro",
    revenueGrowthRate: -3.4,
    cpuSales: 24000,
    gpuSales: 28500,
    aiChipSales: 37000,
    sales2025: 89500,
    foundedYear: 2018,
    employeeCount: 15800,
    yieldRate: 94.2,
  },
  {
    id: "lambda-silicon",
    name: "Lambda Silicon",
    revenueGrowthRate: 6.8,
    cpuSales: 41000,
    gpuSales: 32000,
    aiChipSales: 40000,
    sales2025: 113000,
    foundedYear: 2006,
    employeeCount: 7800,
    yieldRate: 88.9,
  },
  {
    id: "vector-wafer",
    name: "Vector Wafer",
    revenueGrowthRate: -12.1,
    cpuSales: 19500,
    gpuSales: 21000,
    aiChipSales: 28000,
    sales2025: 68500,
    foundedYear: 2014,
    employeeCount: 9800,
    yieldRate: 93.6,
  },
  {
    id: "stellar-logic",
    name: "Stellar Logic",
    revenueGrowthRate: 9.7,
    cpuSales: 30000,
    gpuSales: 26000,
    aiChipSales: 40000,
    sales2025: 96000,
    foundedYear: 2011,
    employeeCount: 6400,
    yieldRate: 91.8,
  },
];

export const sortChipFactoriesByGrowthRate = (data: ChipFactory[]) => {
  return [...data].sort((a, b) => a.revenueGrowthRate - b.revenueGrowthRate);
};

export type SortType =
  | "sales-desc"
  | "sales-asc"
  | "founded-year-asc"
  | "employee-count-desc"
  | "yield-rate-desc";

export const sortOptions: { label: string; value: SortType }[] = [
  { label: "銷售量由大至小", value: "sales-desc" },
  { label: "銷售量由小至大", value: "sales-asc" },
  { label: "成立年份由舊到新", value: "founded-year-asc" },
  { label: "員工數由多至少", value: "employee-count-desc" },
  { label: "良率由高至低", value: "yield-rate-desc" },
];

export const sortChipFactories = (data: ChipFactory[], sortType: SortType) => {
  return [...data].sort((a, b) => {
    if (sortType === "sales-desc") return b.sales2025 - a.sales2025;
    if (sortType === "sales-asc") return a.sales2025 - b.sales2025;
    if (sortType === "founded-year-asc") return a.foundedYear - b.foundedYear;
    if (sortType === "employee-count-desc") {
      return b.employeeCount - a.employeeCount;
    }
    if (sortType === "yield-rate-desc") return b.yieldRate - a.yieldRate;

    return 0;
  });
};
