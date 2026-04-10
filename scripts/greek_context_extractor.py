"""
Greek Context Extractor Script
---------------------------------
Reads a .docx file, finds tokens that are primarily Greek, and writes a CSV
with each Greek token followed by the next five tokens of context.
"""

import argparse
import csv
import re
import sys
from pathlib import Path
from typing import List

try:
    from docx import Document
except Exception as exc:  # pragma: no cover - dependency guard
    raise SystemExit(
        "Unable to import python-docx. Install it for the interpreter you are using "
        "or run this script with an interpreter where python-docx + lxml are available "
        "(e.g., python3.12 in this repo)."
    ) from exc

GREEK_PATTERN = re.compile(r"[\u0370-\u03FF]+")
TOKEN_PATTERN = re.compile(r"\w+|[^\w\s]", re.UNICODE)
CSV_HEADERS = ["Greek_Word", "Word_1", "Word_2", "Word_3", "Word_4", "Word_5"]


def load_doc_text(doc_path: Path) -> str:
    """Read full document into a single string with whitespace normalized."""
    document = Document(doc_path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs)


def tokenize(text: str) -> List[str]:
    """Split the text into ordered tokens (words and punctuation)."""
    return TOKEN_PATTERN.findall(text)


def is_greek_token(token: str) -> bool:
    """Return True if at least half the token's characters are Greek."""
    matches = GREEK_PATTERN.findall(token)
    greek_chars = sum(len(match) for match in matches)
    return greek_chars > 0 and greek_chars >= (len(token) / 2)


def extract_greek_context(tokens: List[str]) -> List[List[str]]:
    """Collect Greek tokens and the next five tokens of context."""
    records: List[List[str]] = []
    for idx, token in enumerate(tokens):
        if not is_greek_token(token):
            continue
        context = []
        for offset in range(1, 6):
            next_index = idx + offset
            context.append(tokens[next_index] if next_index < len(tokens) else "")
        records.append([token, *context])
    return records


def write_csv(records: List[List[str]], output_path: Path) -> None:
    """Write extraction results to CSV with required headers."""
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(CSV_HEADERS)
        writer.writerows(records)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract Greek word context from a DOCX.")
    parser.add_argument(
        "docx_path",
        type=Path,
        help='Path to the .docx file (e.g., "content/source/volume1.docx")',
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("greek_context_extraction.csv"),
        help="Optional output CSV path (default: greek_context_extraction.csv)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    docx_path: Path = args.docx_path
    output_path: Path = args.output

    if not docx_path.exists():
        raise FileNotFoundError(f"Input file not found: {docx_path}")

    text = load_doc_text(docx_path)
    tokens = tokenize(text)
    records = extract_greek_context(tokens)
    write_csv(records, output_path)
    print(f"Extraction complete. {len(records)} record(s) written to {output_path}")


if __name__ == "__main__":
    main()
