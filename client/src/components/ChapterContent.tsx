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
  const [contentElements, setContentElements] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const renderContent = () => {
      const elements: JSX.Element[] = [];
      
      // Split by paragraphs first
      const paragraphs = section.content.split('\n\n');
      
      paragraphs.forEach((para, pIndex) => {
        if (!para.trim()) return;
        
        // Check if it's a block quote (starts with " or ends with citation)
        const isBlockQuote = para.trim().startsWith('"') && para.length > 100;
        
        // Split paragraph by footnote markers
        const parts = para.split(/(<sup data-footnote="\d+">\d+<\/sup>)/);
        const paraContent: (string | JSX.Element)[] = [];
        
        parts.forEach((part, index) => {
          const footnoteMatch = part.match(/<sup data-footnote="(\d+)">(\d+)<\/sup>/);
          if (footnoteMatch) {
            const footnoteNum = parseInt(footnoteMatch[1]);
            const footnote = section.footnotes.find((f) => f.number === footnoteNum);
            if (footnote) {
              paraContent.push(
                <FootnoteMarker
                  key={`fn-${pIndex}-${index}`}
                  number={footnote.number}
                  content={footnote.content}
                  onClick={() => onFootnoteClick(footnote)}
                />
              );
            }
          } else if (part) {
            paraContent.push(part);
          }
        });
        
        if (isBlockQuote) {
          elements.push(
            <div
              key={`para-${pIndex}`}
              className="scripture-quote"
              dangerouslySetInnerHTML={{ __html: para.replace(/<sup data-footnote="\d+">\d+<\/sup>/g, '') }}
            />
          );
        } else {
          elements.push(
            <p
              key={`para-${pIndex}`}
              className="mb-6"
            >
              {paraContent.map((content, i) => 
                typeof content === 'string' ? (
                  <span key={i} dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  content
                )
              )}
            </p>
          );
        }
      });
      
      return elements;
    };

    setContentElements(renderContent());
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
        className="chapter-prose max-w-none leading-relaxed"
        style={{ fontSize: `${textSize}px` }}
        data-testid="chapter-text-content"
      >
        {contentElements}
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
                <span
                  className="text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: footnote.content }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
