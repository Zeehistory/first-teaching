import PageReferenceInput from "../PageReferenceInput";
import { volumeOneData } from "@/lib/content";

export default function PageReferenceInputExample() {
  return (
    <div className="flex items-center justify-center p-8">
      <PageReferenceInput
        volumeNumber={volumeOneData.volumeNumber}
        chapters={volumeOneData.chapters}
        onNavigate={(volumeNumber, chapterId, sectionId) => {
          console.log("Navigate to:", volumeNumber, chapterId, sectionId);
        }}
      />
    </div>
  );
}
