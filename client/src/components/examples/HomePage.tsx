import HomePage from "../HomePage";
import { completeBookData } from "@/lib/bookContent";

export default function HomePageExample() {
  return (
    <HomePage
      bookData={completeBookData}
      onChapterClick={(id) => console.log("Chapter clicked:", id)}
      onSearchClick={() => console.log("Search clicked")}
    />
  );
}
