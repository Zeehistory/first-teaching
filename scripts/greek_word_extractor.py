"""
Greek Word Extractor
---------------------
Parses DOCX files, finds Greek tokens, and writes them to a CSV output.
Supports either a single DOCX input or a directory of DOCX files.
"""

import argparse
import csv
import re
import sys
from pathlib import Path
from typing import Iterable, List

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
CSV_HEADERS = ["Source_File", "Greek_Word"]


def iter_doc_paths(path: Path) -> Iterable[Path]:
    """Yield DOCX file paths contained in the given path."""
    if path.is_file():
        if path.suffix.lower() != ".docx":
            raise ValueError(f"File is not a .docx: {path}")
        yield path
        return

    if not path.is_dir():
        raise FileNotFoundError(f"Path is neither file nor directory: {path}")

    for doc_path in sorted(path.rglob("*.docx")):
        yield doc_path


def load_doc_text(doc_path: Path) -> str:
    """Read full document text as a single string."""
    document = Document(doc_path)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs)


def tokenize(text: str) -> List[str]:
    """Split text into tokens (words + punctuation)."""
    return TOKEN_PATTERN.findall(text)


def is_greek_token(token: str) -> bool:
    """Return True if the token contains mostly Greek characters."""
    matches = GREEK_PATTERN.findall(token)
    greek_chars = sum(len(match) for match in matches)
    return greek_chars > 0 and greek_chars >= (len(token) / 2)


def extract_greek_words(doc_path: Path) -> List[str]:
    """Return all Greek tokens appearing in the document."""
    text = load_doc_text(doc_path)
    tokens = tokenize(text)
    return [token for token in tokens if is_greek_token(token)]


def write_csv(rows: List[List[str]], output_path: Path) -> None:
    """Write rows to CSV with headers."""
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(CSV_HEADERS)
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract Greek words from DOCX files (single file or directory)."
    )
    parser.add_argument(
        "input_path",
        type=Path,
        help="Path to a .docx file or directory containing DOCX files.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("greek_words.csv"),
        help="Output CSV path (default: greek_words.csv)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path: Path = args.input_path
    output_path: Path = args.output

    if not input_path.exists():
        raise FileNotFoundError(f"Input path not found: {input_path}")

    rows: List[List[str]] = []
    files_processed = 0
    for doc_path in iter_doc_paths(input_path):
        files_processed += 1
        try:
            greek_tokens = extract_greek_words(doc_path)
        except Exception as exc:
            print(f"Skipping {doc_path}: {exc}", file=sys.stderr)
            continue
        rows.extend([[str(doc_path), token] for token in greek_tokens])

    write_csv(rows, output_path)
    print(
        f"Extraction complete. {len(rows)} Greek word(s) written to {output_path} "
        f"from {files_processed} file(s)."
    )


if __name__ == "__main__":
    main()
