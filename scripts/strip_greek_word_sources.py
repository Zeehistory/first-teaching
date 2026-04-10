"""
Utility to trim the source file column from greek_words CSV exports.
"""

import argparse
import csv
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove the Source_File column from a greek word CSV."
    )
    parser.add_argument(
        "input_csv",
        type=Path,
        help="CSV produced by greek_word_extractor.py",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("greek_words_only.csv"),
        help="Output CSV containing a single Greek_Word column.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path: Path = args.input_csv
    output_path: Path = args.output

    if not input_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_path}")

    with input_path.open("r", encoding="utf-8") as inp, output_path.open(
        "w", newline="", encoding="utf-8"
    ) as out:
        reader = csv.reader(inp)
        writer = csv.writer(out)

        header = next(reader, None)
        greek_idx = 1 if header and len(header) > 1 else 0
        writer.writerow(["Greek_Word"])

        for row in reader:
            if not row:
                continue
            writer.writerow([row[greek_idx]])

    print(f"Saved Greek-only list to {output_path}")


if __name__ == "__main__":
    main()
