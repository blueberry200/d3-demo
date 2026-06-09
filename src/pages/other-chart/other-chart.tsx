import TreeChart from "./components/tree-chart";
import AIUsageBoxPlot from "./components/ai-usage-box-plot";
import ProjectBubbleChart from "./components/project-bubble-chart";

import CustomDivider from "@/components/custom-divider";

export default function OtherChart() {
  return (
    <div>
      <TreeChart />
      <CustomDivider />
      <AIUsageBoxPlot />
      <CustomDivider />
      <ProjectBubbleChart />
    </div>
  );
}
