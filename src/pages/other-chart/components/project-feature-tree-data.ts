export type ProjectFeatureNode = {
  id: string;
  name: string;
  owner: string;
  estimateHours: number;
  status: "done" | "doing" | "todo";
  children?: ProjectFeatureNode[];
};

export const projectFeatureTreeData: ProjectFeatureNode = {
  id: "project-root",
  name: "企業內部管理系統",
  owner: "產品團隊",
  estimateHours: 620,
  status: "doing",
  children: [
    {
      id: "auth-module",
      name: "帳號與權限模組",
      owner: "後端組",
      estimateHours: 150,
      status: "doing",
      children: [
        {
          id: "login",
          name: "登入流程",
          owner: "後端組",
          estimateHours: 48,
          status: "doing",
          children: [
            {
              id: "jwt-login",
              name: "JWT 登入驗證",
              owner: "Jerry",
              estimateHours: 18,
              status: "done",
            },
            {
              id: "captcha",
              name: "圖形驗證碼",
              owner: "前端組",
              estimateHours: 12,
              status: "doing",
            },
            {
              id: "login-error",
              name: "登入錯誤提示",
              owner: "前端組",
              estimateHours: 18,
              status: "todo",
            },
          ],
        },
        {
          id: "permission",
          name: "權限控管",
          owner: "後端組",
          estimateHours: 58,
          status: "todo",
          children: [
            {
              id: "role-table",
              name: "角色資料表",
              owner: "後端組",
              estimateHours: 20,
              status: "todo",
            },
            {
              id: "route-guard",
              name: "前端路由守衛",
              owner: "前端組",
              estimateHours: 18,
              status: "todo",
            },
            {
              id: "api-policy",
              name: "API 權限檢查",
              owner: "後端組",
              estimateHours: 20,
              status: "todo",
            },
          ],
        },
        {
          id: "forget-password",
          name: "忘記密碼",
          owner: "全端組",
          estimateHours: 44,
          status: "doing",
        },
      ],
    },
    {
      id: "dashboard-module",
      name: "儀表板模組",
      owner: "前端組",
      estimateHours: 170,
      status: "doing",
      children: [
        {
          id: "summary-card",
          name: "統計卡片",
          owner: "前端組",
          estimateHours: 36,
          status: "done",
        },
        {
          id: "sales-chart",
          name: "營收圖表",
          owner: "前端組",
          estimateHours: 72,
          status: "doing",
          children: [
            {
              id: "line-chart",
              name: "月營收折線圖",
              owner: "Jerry",
              estimateHours: 26,
              status: "done",
            },
            {
              id: "tree-chart",
              name: "功能拆分樹狀圖",
              owner: "Jerry",
              estimateHours: 24,
              status: "doing",
            },
            {
              id: "chart-tooltip",
              name: "圖表 Tooltip",
              owner: "前端組",
              estimateHours: 22,
              status: "todo",
            },
          ],
        },
        {
          id: "filter-panel",
          name: "篩選條件區",
          owner: "前端組",
          estimateHours: 62,
          status: "todo",
        },
      ],
    },
    {
      id: "order-module",
      name: "訂單管理模組",
      owner: "全端組",
      estimateHours: 180,
      status: "todo",
      children: [
        {
          id: "order-list",
          name: "訂單列表",
          owner: "前端組",
          estimateHours: 54,
          status: "todo",
        },
        {
          id: "order-detail",
          name: "訂單詳情",
          owner: "前端組",
          estimateHours: 48,
          status: "todo",
        },
        {
          id: "order-api",
          name: "訂單 API",
          owner: "後端組",
          estimateHours: 78,
          status: "todo",
          children: [
            {
              id: "order-create",
              name: "新增訂單",
              owner: "後端組",
              estimateHours: 22,
              status: "todo",
            },
            {
              id: "order-update",
              name: "更新訂單",
              owner: "後端組",
              estimateHours: 24,
              status: "todo",
            },
            {
              id: "order-export",
              name: "匯出訂單",
              owner: "後端組",
              estimateHours: 32,
              status: "todo",
            },
          ],
        },
      ],
    },
    {
      id: "notify-module",
      name: "通知中心模組",
      owner: "全端組",
      estimateHours: 120,
      status: "todo",
      children: [
        {
          id: "email-notify",
          name: "Email 通知",
          owner: "後端組",
          estimateHours: 42,
          status: "todo",
        },
        {
          id: "system-message",
          name: "站內訊息",
          owner: "前端組",
          estimateHours: 46,
          status: "todo",
        },
        {
          id: "notify-setting",
          name: "通知設定",
          owner: "全端組",
          estimateHours: 32,
          status: "todo",
        },
      ],
    },
  ],
};
