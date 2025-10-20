import HomePage from "../HomePage";
import { mockBookData } from "@/lib/mockData";

export default function HomePageExample() {
  return (
    <HomePage
      bookData={mockBookData}
      onChapterClick={(id) => console.log("Chapter clicked:", id)}
      onSearchClick={() => console.log("Search clicked")}
    />
  );
}
