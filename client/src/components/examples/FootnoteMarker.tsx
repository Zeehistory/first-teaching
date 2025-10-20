import FootnoteMarker from "../FootnoteMarker";

export default function FootnoteMarkerExample() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <p className="text-lg leading-relaxed">
        This is a sample text with a footnote
        <FootnoteMarker
          number={1}
          content="This is the footnote content explaining the reference in detail. It provides additional context and scholarly citations."
          onClick={() => console.log("Footnote clicked")}
        />{" "}
        that you can hover over or click.
      </p>
    </div>
  );
}
