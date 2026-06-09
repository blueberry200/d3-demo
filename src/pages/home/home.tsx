import HomeEarthBanner from "./components/home-earth-banner";
import HomeIntroduction from "./components/home-introduction";
import HomeGroupCard from "./components/home-group-card";

import CustomDivider from "@/components/custom-divider";

export default function Home() {
  return (
    <div>
      <HomeEarthBanner />
      <CustomDivider />
      <HomeIntroduction />
      <CustomDivider />
      <HomeGroupCard />
    </div>
  );
}
