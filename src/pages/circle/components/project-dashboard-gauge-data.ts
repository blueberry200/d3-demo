export type ProjectModule = {
  id: string;
  name: string;
  hours: number;
};

export const projectModules: ProjectModule[] = [
  { id: "auth", name: "登入驗證", hours: 10 },
  { id: "member", name: "會員管理", hours: 8 },
  { id: "permission", name: "權限設定", hours: 14 },
  { id: "order", name: "訂單流程", hours: 13 },
  { id: "report", name: "報表統計", hours: 9 },
  { id: "notification", name: "通知中心", hours: 5 },
];

export const totalProjectHours = projectModules.reduce(
  (sum, item) => sum + item.hours,
  0,
);
