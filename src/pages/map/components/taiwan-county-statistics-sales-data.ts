export type SalesData = {
  countyCode: string;
  countyName: string;
  total: number;
  male: number;
  female: number;
  ageGroups: {
    under20: number;
    age21to40: number;
    age41to60: number;
    over60: number;
  };
};

export const salesByCounty: Record<string, SalesData> = {
  "63000": {
    countyCode: "63000",
    countyName: "臺北市",
    total: 100,
    male: 65,
    female: 35,
    ageGroups: { under20: 30, age21to40: 33, age41to60: 24, over60: 13 },
  },
  "65000": {
    countyCode: "65000",
    countyName: "新北市",
    total: 180,
    male: 90,
    female: 90,
    ageGroups: { under20: 40, age21to40: 70, age41to60: 50, over60: 20 },
  },
  "68000": {
    countyCode: "68000",
    countyName: "桃園市",
    total: 145,
    male: 72,
    female: 73,
    ageGroups: { under20: 32, age21to40: 58, age41to60: 39, over60: 16 },
  },
  "66000": {
    countyCode: "66000",
    countyName: "臺中市",
    total: 150,
    male: 80,
    female: 70,
    ageGroups: { under20: 35, age21to40: 60, age41to60: 40, over60: 15 },
  },
  "67000": {
    countyCode: "67000",
    countyName: "臺南市",
    total: 120,
    male: 62,
    female: 58,
    ageGroups: { under20: 25, age21to40: 48, age41to60: 33, over60: 14 },
  },
  "64000": {
    countyCode: "64000",
    countyName: "高雄市",
    total: 160,
    male: 78,
    female: 82,
    ageGroups: { under20: 34, age21to40: 62, age41to60: 45, over60: 19 },
  },
  "10017": {
    countyCode: "10017",
    countyName: "基隆市",
    total: 45,
    male: 23,
    female: 22,
    ageGroups: { under20: 9, age21to40: 17, age41to60: 13, over60: 6 },
  },
  "10018": {
    countyCode: "10018",
    countyName: "新竹市",
    total: 70,
    male: 36,
    female: 34,
    ageGroups: { under20: 15, age21to40: 30, age41to60: 18, over60: 7 },
  },
  "10020": {
    countyCode: "10020",
    countyName: "嘉義市",
    total: 38,
    male: 19,
    female: 19,
    ageGroups: { under20: 8, age21to40: 14, age41to60: 11, over60: 5 },
  },
  "10004": {
    countyCode: "10004",
    countyName: "新竹縣",
    total: 82,
    male: 43,
    female: 39,
    ageGroups: { under20: 18, age21to40: 34, age41to60: 21, over60: 9 },
  },
  "10005": {
    countyCode: "10005",
    countyName: "苗栗縣",
    total: 64,
    male: 33,
    female: 31,
    ageGroups: { under20: 13, age21to40: 24, age41to60: 18, over60: 9 },
  },
  "10007": {
    countyCode: "10007",
    countyName: "彰化縣",
    total: 95,
    male: 49,
    female: 46,
    ageGroups: { under20: 20, age21to40: 36, age41to60: 27, over60: 12 },
  },
  "10008": {
    countyCode: "10008",
    countyName: "南投縣",
    total: 52,
    male: 27,
    female: 25,
    ageGroups: { under20: 10, age21to40: 19, age41to60: 15, over60: 8 },
  },
  "10009": {
    countyCode: "10009",
    countyName: "雲林縣",
    total: 58,
    male: 30,
    female: 28,
    ageGroups: { under20: 11, age21to40: 21, age41to60: 17, over60: 9 },
  },
  "10010": {
    countyCode: "10010",
    countyName: "嘉義縣",
    total: 50,
    male: 26,
    female: 24,
    ageGroups: { under20: 9, age21to40: 18, age41to60: 15, over60: 8 },
  },
  "10013": {
    countyCode: "10013",
    countyName: "屏東縣",
    total: 76,
    male: 39,
    female: 37,
    ageGroups: { under20: 15, age21to40: 28, age41to60: 22, over60: 11 },
  },
  "10002": {
    countyCode: "10002",
    countyName: "宜蘭縣",
    total: 62,
    male: 31,
    female: 31,
    ageGroups: { under20: 12, age21to40: 23, age41to60: 18, over60: 9 },
  },
  "10015": {
    countyCode: "10015",
    countyName: "花蓮縣",
    total: 48,
    male: 25,
    female: 23,
    ageGroups: { under20: 10, age21to40: 17, age41to60: 14, over60: 7 },
  },
  "10014": {
    countyCode: "10014",
    countyName: "臺東縣",
    total: 36,
    male: 19,
    female: 17,
    ageGroups: { under20: 7, age21to40: 13, age41to60: 10, over60: 6 },
  },
  "10016": {
    countyCode: "10016",
    countyName: "澎湖縣",
    total: 24,
    male: 12,
    female: 12,
    ageGroups: { under20: 5, age21to40: 9, age41to60: 7, over60: 3 },
  },
  "09020": {
    countyCode: "09020",
    countyName: "金門縣",
    total: 28,
    male: 15,
    female: 13,
    ageGroups: { under20: 6, age21to40: 11, age41to60: 8, over60: 3 },
  },
  "09007": {
    countyCode: "09007",
    countyName: "連江縣",
    total: 12,
    male: 7,
    female: 5,
    ageGroups: { under20: 2, age21to40: 5, age41to60: 3, over60: 2 },
  },
};
