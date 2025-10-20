import HomePage from "../HomePage";
import { volumeOneData } from "@/lib/content";

export default function HomePageExample() {
  return (
    <HomePage
      bookData={volumeOneData}
      onChapterClick={(id) => console.log("Chapter clicked:", id)}
      onSearchClick={() => console.log("Search clicked")}
    />
  );
}
