import { Fragment } from "react";
import { splitTransliteration } from "@/lib/transliteration";

/**
 * Renders a plain string with transliterated terms set in italics — for titles
 * and headings, where content is React text rather than HTML.
 */
export default function Transliterated({ text }: { text: string }) {
  const parts = splitTransliteration(text);
  return (
    <>
      {parts.map((part, i) =>
        part.translit ? (
          <em key={i} className="translit">
            {part.text}
          </em>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
