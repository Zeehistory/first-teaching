import { useLocation } from "wouter";
import VolumesLanding from "@/components/VolumesLanding";
import { seriesOverview, volumes } from "@/lib/volumes";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <VolumesLanding
      overview={seriesOverview}
      volumes={volumes}
      onSelectVolume={(volumeNumber) => setLocation(`/v/${volumeNumber}`)}
    />
  );
}
