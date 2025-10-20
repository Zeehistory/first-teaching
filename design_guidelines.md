# Design Guidelines: Classical Islamic Philosophical Book Companion

## Design Approach: Classical Manuscript-Inspired

Drawing inspiration from classical Islamic manuscripts, traditional book design, and modern reading platforms like Medium and Readwise Reader, combined with the sophistication of archive.org's digital libraries.

---

## Core Design Elements

### A. Color Palette

**Primary Palette (Parchment & Ink):**
- Background (Light): 45 25% 92% - warm parchment
- Background (Dark): 30 15% 12% - deep manuscript brown
- Primary Text: 30 20% 15% (light mode) / 45 20% 88% (dark mode)
- Accent (Islamic Teal): 180 45% 35% - refined, scholarly
- Border/Divider: 40 15% 75% (light) / 30 10% 25% (dark)

**Functional Colors:**
- Footnote Highlight: 45 60% 85% - subtle golden glow
- Link Color: 180 50% 40% - distinguished teal
- Quote/Citation Background: 45 20% 88%

### B. Typography

**Font Families (via Google Fonts):**
- Headings: 'Cormorant Garamond' (classical serif, ornate)
- Body Text: 'Crimson Text' or 'Libre Baskerville' (readable serif)
- Arabic Text (if needed): 'Amiri' or 'Scheherazade New'
- UI Elements: 'Lato' (minimal sans-serif for navigation)

**Type Scale:**
- Chapter Titles: text-5xl font-semibold (48px)
- Section Headings: text-3xl font-medium (30px)
- Body Text: text-lg leading-relaxed (18px, 1.75 line-height)
- Footnotes: text-base (16px)
- Navigation: text-sm uppercase tracking-wide

### C. Layout System

**Spacing Primitives:** Use tailwind units of 4, 6, 8, 12, 16, 24
- Section padding: py-16 to py-24
- Content margins: mb-8, mb-12
- Component gaps: gap-6, gap-8

**Reading Container:**
- Max-width: max-w-3xl (optimal reading width ~65-75 characters)
- Side margins: px-6 on mobile, px-8 on desktop
- Centered: mx-auto

**Grid Structure:**
- Sidebar navigation: Fixed 280px width on desktop, collapsible on mobile
- Main content: Remaining space with max-w-3xl constraint
- Footnote panel: Slide-in drawer or inline expansion

### D. Component Library

**Navigation:**
- Persistent sidebar with hierarchical chapter/section tree
- Breadcrumb trail at top of content
- Floating back-to-top button with progress indicator
- Chapter switcher (previous/next) at bottom of each section
- Mobile: Hamburger menu with full-screen overlay

**Reading Components:**
- Footnote markers: Superscript numbers with subtle circular background
- Footnote display: Inline expansion with smooth animation OR side panel drawer
- Cross-reference links: Underlined with icon indicator
- Quote blocks: Left border accent, italic text, indented
- Chapter introductions: Larger drop cap, decorative initial letter

**Interactive Elements:**
- Text size controls: A-/A+ buttons in header
- Theme toggle: Sun/moon icon for light/dark mode
- Bookmark system: Ribbon icon, saves position to localStorage
- Search overlay: Full-screen with highlighted results
- Page reference mapper: Input for physical book page number → website section

**Decorative Elements:**
- Ornamental dividers between major sections (SVG flourishes)
- Drop caps for chapter beginnings
- Subtle Islamic geometric patterns as section backgrounds (very low opacity)
- Corner ornaments on chapter title cards

### E. Animations

**Minimal & Purposeful:**
- Footnote expansion: 200ms ease-in-out
- Navigation drawer: 300ms slide transition
- Smooth scroll to anchors: behavior: smooth
- Hover states: 150ms color/underline transitions
- NO scrolljack, parallax, or distracting effects

---

## Page Structure

**Homepage:**
- Elegant title banner with book cover image (if available)
- Introduction to companion website purpose
- Chapter grid/list with brief descriptions
- Search bar prominence
- About the book section

**Chapter Pages:**
- Breadcrumb navigation
- Chapter title with ornamental header
- Hierarchical section navigation (sticky sidebar)
- Main content area with footnote integration
- Physical book page reference numbers in margin
- Previous/Next chapter navigation at bottom

**Footnote System:**
- Superscript numbers as clickable triggers
- On click: Smoothly expand inline OR open side drawer
- Hover preview: Small tooltip with first 100 characters
- Back-reference link to return to reading position
- Visual connection between marker and content

**Search Results:**
- Full-page overlay with dark backdrop
- Results grouped by chapter
- Context snippets with highlighted search terms
- Direct jump to exact position in text

---

## Images

**Book Cover/Hero Image:**
- Placement: Homepage hero section, centered or left-aligned with title/description
- Style: High-quality scan or photograph of physical book cover
- Treatment: Subtle shadow, optional ornamental frame border
- Size: 400-500px width on desktop, scales responsively

**Chapter Headers (optional):**
- Decorative Islamic geometric patterns or calligraphy as subtle background images
- Very low opacity (10-15%) to not interfere with text readability
- Tiled or positioned as accent elements

**NO large background images** that would distract from reading content. This is a text-first experience.

---

## Accessibility & Reading Experience

- High contrast ratios for text (WCAG AAA)
- Consistent dark mode across all elements including footnotes
- Keyboard navigation for all interactive elements
- Focus indicators on all clickable elements
- Skip-to-content link for screen readers
- Print-friendly CSS for saving/printing chapters
- Responsive text sizing that maintains readability 14px-22px range

---

## Key Differentiators

This design combines the gravitas of classical manuscripts with modern web usability, creating a seamless bridge between physical book and digital companion. The footnote system is the centerpiece, implemented with elegance and precision. Every element reinforces the scholarly, timeless nature of the content while ensuring practical, friction-free navigation.