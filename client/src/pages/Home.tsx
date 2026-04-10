import { useLocation } from "wouter";
import VolumesLanding from "@/components/VolumesLanding";
import { seriesOverview, volumes } from "@/lib/volumes";

export default function Home() {
  const [, setLocation] = useLocation();
  const featuredVolumes = volumes.filter((volume) => volume.number === 18);

  return (
    <VolumesLanding
      overview={seriesOverview}
      volumes={featuredVolumes}
      onSelectVolume={(volumeNumber) => setLocation(`/v/${volumeNumber}`)}
    />
  );
}
