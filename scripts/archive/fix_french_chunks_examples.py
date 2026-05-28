#!/usr/bin/env python3
"""
French Chunks Remediation Script

Transforms patterns field into example_1, example_2, example_3 fields for French chunks.
Processes batches 1-57, handling level-appropriate sentence generation.
"""

import json
import glob
import os
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
FR_DIR = SCRIPT_DIR / "fr"


def load_chunks(filepath: Path) -> list[dict]:
    """Load chunks from JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_chunks(filepath: Path, chunks: list[dict]) -> None:
    """Save chunks to JSON file with proper formatting."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
        f.write("\n")


def extract_pattern_sentences(chunk: dict) -> tuple[str | None, str | None, str | None]:
    """
    Extract sentences from patterns array.
    
    Returns:
        Tuple of (example_1, example_2, example_3) - any may be None.
    """
    patterns = chunk.get("patterns", [])
    
    if not patterns or not isinstance(patterns, list):
        return None, None, None
    
    valid_patterns = [p for p in patterns if isinstance(p, str) and len(p.strip()) > 5]
    
    example_1 = valid_patterns[0] if len(valid_patterns) >= 1 else None
    example_2 = valid_patterns[1] if len(valid_patterns) >= 2 else None
    example_3 = valid_patterns[2] if len(valid_patterns) >= 3 else None
    
    return example_1, example_2, example_3


def generate_level_example(chunk: dict, example_num: int) -> str:
    """
    Generate a level-appropriate example sentence.
    
    Args:
        chunk: The chunk dictionary
        example_num: Which example being generated (1, 2, or 3)
    
    ! Uses level to determine sentence complexity.
    ? Returns a generated sentence appropriate to CEFR level.
    """
    chunk_text = chunk.get("chunk_text", "")
    meaning = chunk.get("meaning", "")
    level = chunk.get("level", "A1")
    
    level_num = int(level[1]) if level.startswith("A") or level.startswith("B") or level.startswith("C") else 1
    
    templates_a1 = [
        f"J'utilise '{chunk_text}' tous les jours.",
        f"'{chunk_text}' est une expression utile.",
        f"Je connais {chunk_text}.",
    ]
    
    templates_a2 = [
        f"J'utilise souvent {chunk_text} pour parler de {meaning}.",
        f"Tu peux dire {chunk_text} quand tu veux exprimer {meaning}.",
        f"On utilise {chunk_text} dans la vie quotidienne.",
    ]
    
    templates_b1 = [
        f"Je commence à maîtriser {chunk_text} dans mes conversations.",
        f"L'année dernière, j'ai appris à utiliser {chunk_text} naturellement.",
        f"Quand je parle français, j'emploie souvent {chunk_text}.",
    ]
    
    templates_b2_plus = [
        f"L'utilisation de {chunk_text} marque un registre soutenu.",
        f"Cela dit, {chunk_text} reste essentiel pour exprimer {meaning}.",
        f"Il va sans dire que {chunk_text} s'emploie dans divers contextes.",
    ]
    
    if level_num <= 1:
        templates = templates_a1
    elif level_num == 2:
        templates = templates_a2
    elif level_num == 3:
        templates = templates_b1
    else:
        templates = templates_b2_plus
    
    idx = (example_num - 1) % len(templates)
    return templates[idx]


def process_chunk(chunk: dict) -> dict:
    """
    Process a single chunk, adding example fields.
    
    ! Preserves all existing fields.
    ? Adds example_1, example_2, example_3 based on patterns or generates them.
    
    Pre-condition: chunk must be a valid dict with chunk_text and meaning.
    Post-condition: Returns chunk with example_1, example_2, example_3 fields.
    """
    example_1, example_2, example_3 = extract_pattern_sentences(chunk)
    
    if example_1 is None:
        example_1 = generate_level_example(chunk, 1)
    if example_2 is None:
        example_2 = generate_level_example(chunk, 2)
    if example_3 is None:
        example_3 = generate_level_example(chunk, 3)
    
    chunk["example_1"] = example_1
    chunk["example_2"] = example_2
    chunk["example_3"] = example_3
    
    return chunk


def process_batch_file(filepath: Path) -> tuple[int, int]:
    """
    Process a single batch file.
    
    Returns:
        Tuple of (chunks_processed, chunks_modified).
    """
    chunks = load_chunks(filepath)
    original_count = len(chunks)
    
    processed_chunks = [process_chunk(chunk) for chunk in chunks]
    
    save_chunks(filepath, processed_chunks)
    
    return original_count, original_count


def get_batch_files() -> list[Path]:
    """Get all French chunks batch files, sorted numerically."""
    pattern = str(FR_DIR / "french_chunks_batch*.json")
    files = sorted(glob.glob(pattern), key=lambda x: int(re.search(r"\d+", x).group()))
    return [Path(f) for f in files]


def process_batches(start_batch: int = 1, end_batch: int = 57) -> None:
    """
    Process batches in specified range.
    
    Args:
        start_batch: First batch number to process (1-indexed)
        end_batch: Last batch number to process (1-indexed)
    
    ! Processes files french_chunks_batch{N}.json where N in range.
    """
    files = get_batch_files()
    
    filtered_files = [f for f in files if start_batch <= int(re.search(r"\d+", str(f)).group()) <= end_batch]
    
    total_chunks = 0
    total_files = len(filtered_files)
    
    print(f"Processing batches {start_batch}-{end_batch} ({total_files} files)")
    print("-" * 50)
    
    for i, filepath in enumerate(filtered_files, start=start_batch):
        try:
            count, modified = process_batch_file(filepath)
            total_chunks += count
            print(f"Batch {i}: Processed {count} chunks")
        except Exception as e:
            print(f"Batch {i}: ERROR - {e}")
    
    print("-" * 50)
    print(f"Total: {total_chunks} chunks in {total_files} files")


def main():
    """Main entry point for batch processing."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix French chunks examples")
    parser.add_argument(
        "--start",
        type=int,
        default=1,
        help="Starting batch number (1-indexed)"
    )
    parser.add_argument(
        "--end",
        type=int,
        default=10,
        help="Ending batch number (1-indexed)"
    )
    
    args = parser.parse_args()
    
    process_batches(args.start, args.end)


if __name__ == "__main__":
    main()
