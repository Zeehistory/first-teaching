import { useState, useEffect } from "react";
import type { Section, Footnote } from "@shared/schema";
import FootnoteMarker from "./FootnoteMarker";
import OrnamentalDivider from "./OrnamentalDivider";

interface ChapterContentProps {
  section: Section;
  chapterTitle: string;
  chapterNumber: number;
  textSize: number;
  onFootnoteClick: (footnote: Footnote) => void;
}

export default function ChapterContent({
  section,
  chapterTitle,
  chapterNumber,
  textSize,
  onFootnoteClick,
}: ChapterContentProps) {
  const [contentWithFootnotes, setContentWithFootnotes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const parts = section.content.split(/(<sup data-footnote="\d+">\d+<\/sup>)/);
    const elements = parts.map((part, index) => {
      const match = part.match(/<sup data-footnote="(\d+)">(\d+)<\/sup>/);
      if (match) {
        const footnoteNum = parseInt(match[1]);
        const footnote = section.footnotes.find((f) => f.number === footnoteNum);
        if (footnote) {
          return (
            <FootnoteMarker
              key={index}
              number={footnote.number}
              content={footnote.content}
              onClick={() => onFootnoteClick(footnote)}
            />
          );
        }
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
    setContentWithFootnotes(elements);
  }, [section, onFootnoteClick]);

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-sm font-sans uppercase tracking-wide text-primary mb-2">
          Chapter {chapterNumber}
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-2">
          {chapterTitle}
        </h1>
      </div>

      <OrnamentalDivider />

      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-3xl font-heading font-medium">{section.title}</h2>
          {section.pageReference && (
            <div className="text-sm font-sans text-muted-foreground whitespace-nowrap ml-4">
              Physical book p. {section.pageReference}
            </div>
          )}
        </div>
      </div>

      <div
        className="prose prose-lg max-w-none leading-relaxed"
        style={{ fontSize: `${textSize}px` }}
        data-testid="chapter-text-content"
      >
        {contentWithFootnotes.map((element, index) => {
          const isNewParagraph = typeof element.props.children === 'string' && 
                                 element.props.children.includes('\n\n');
          if (isNewParagraph) {
            return element.props.children.split('\n\n').map((para: string, i: number) => (
              <p key={`${index}-${i}`} className="mb-6">{para}</p>
            ));
          }
          return element;
        })}
      </div>

      {section.footnotes.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-xl font-heading font-medium mb-6">Notes</h3>
          <div className="space-y-4">
            {section.footnotes.map((footnote) => (
              <div
                key={footnote.id}
                className="text-sm leading-relaxed"
                data-testid={`footnote-${footnote.number}`}
              >
                <span className="font-semibold text-primary mr-2">
                  {footnote.number}.
                </span>
                <span className="text-muted-foreground">{footnote.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
