import ReadingProgress from "../ReadingProgress";

export default function ReadingProgressExample() {
  return (
    <div>
      <ReadingProgress />
      <div className="p-8 space-y-4">
        <p className="text-lg">Scroll down to see the reading progress indicator at the top.</p>
        {Array.from({ length: 50 }).map((_, i) => (
          <p key={i} className="text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    </div>
  );
}
