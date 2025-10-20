import PageReferenceInput from "../PageReferenceInput";
import { mockBookData } from "@/lib/mockData";

export default function PageReferenceInputExample() {
  return (
    <div className="flex items-center justify-center p-8">
      <PageReferenceInput
        chapters={mockBookData.chapters}
        onNavigate={(chapterId, sectionId) => {
          console.log("Navigate to:", chapterId, sectionId);
        }}
      />
    </div>
  );
}
