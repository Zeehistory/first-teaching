import PageReferenceInput from "../PageReferenceInput";
import { completeBookData } from "@/lib/bookContent";

export default function PageReferenceInputExample() {
  return (
    <div className="flex items-center justify-center p-8">
      <PageReferenceInput
        volumeNumber={completeBookData.volumeNumber}
        chapters={completeBookData.chapters}
        onNavigate={(volumeNumber, chapterId, sectionId) => {
          console.log("Navigate to:", volumeNumber, chapterId, sectionId);
        }}
      />
    </div>
  );
}
