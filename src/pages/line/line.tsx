import ConstructionLackLine from "./components/construction-lack-line";
import ConstructionMultiLine from "./components/construction-multi-line";
import ConstructionAreaLine from "./components/construction-area-line";
import ConstructionRegressionLine from "./components/construction-regression-line";

import CustomDivider from "@/components/custom-divider";

export default function Line() {
  return (
    <div>
      <ConstructionLackLine />
      <CustomDivider />
      <ConstructionMultiLine />
      <CustomDivider />
      <ConstructionAreaLine />
      {/* <ConstructionRegressionLine /> */}
    </div>
  );
}
