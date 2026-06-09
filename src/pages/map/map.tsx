import TaiwanCountyStatisticsMap from "@/pages/map/components/taiwan-county-statistics-map";
import TaiwanLatLngStatisticsMap from "@/pages/map/components/taiwan-lat-lng-statistics-map";

import CustomDivider from "@/components/custom-divider";

export default function Map() {
  return (
    <div>
      <TaiwanCountyStatisticsMap />
      <CustomDivider />
      <TaiwanLatLngStatisticsMap />
    </div>
  );
}
