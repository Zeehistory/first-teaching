"""
Deduplicate Greek words CSV.
Reads a single-column CSV (Greek_Word) and writes a new file
with one instance of each unique Greek word in original order.
"""

import argparse
import csv
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Remove duplicate Greek words from a CSV.")
    parser.add_argument("input_csv", type=Path, help="Path to greek_words_all_volumes_only.csv")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("greek_words_all_volumes_unique.csv"),
        help="Path for the deduplicated CSV output.",
    )
    return parser.parse_args()


def load_unique_words(input_path: Path) -> list[str]:
    with input_path.open("r", encoding="utf-8") as csv_file:
        reader = csv.reader(csv_file)
        header = next(reader, None)
        if header and header[0].lower() != "greek_word":
            raise ValueError("Expected header 'Greek_Word' in the first column.")
        seen: set[str] = set()
        unique_words: list[str] = []
        for row in reader:
            if not row:
                continue
            word = row[0].strip()
            if not word or word in seen:
                continue
            seen.add(word)
            unique_words.append(word)
    return unique_words


def write_words(words: list[str], output_path: Path) -> None:
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["Greek_Word"])
        for word in words:
            writer.writerow([word])


def main() -> None:
    args = parse_args()
    input_path: Path = args.input_csv
    output_path: Path = args.output

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    words = load_unique_words(input_path)
    write_words(words, output_path)
    print(f"Removed duplicates. {len(words)} unique words written to {output_path}")


if __name__ == "__main__":
    main()
