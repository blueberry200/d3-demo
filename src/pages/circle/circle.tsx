import MarketSharePieChart from "./components/market-share-pie-chart";
import ProjectDashboardGaugeChart from "./components/project-dashboard-gauge-chart";
import RadarChart from "./components/radar";

import CustomDivider from "@/components/custom-divider";

export default function Circle() {
  return (
    <div>
      <MarketSharePieChart />
      <CustomDivider />
      <ProjectDashboardGaugeChart />
      <CustomDivider />
      <RadarChart />
    </div>
  );
}
