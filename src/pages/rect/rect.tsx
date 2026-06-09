import SortableBar from "./components/sortable-bar";
import StackedBar from "./components/stacked-bar";
import GroupBar from "./components/group-bar";
import RaceBar from "./components/race-bar"; // 未完成
import DivergingBar from "./components/diverging-bar";
import CombineHistogramLine from "./components/combine-histogram-line";

import CustomDivider from "@/components/custom-divider";

export default function Rect() {
  return (
    <div>
      <SortableBar />
      <CustomDivider />
      <StackedBar />
      <CustomDivider />
      <GroupBar />
      <CustomDivider />
      <DivergingBar />
      <CustomDivider />
      <CombineHistogramLine />
    </div>
  );
}
