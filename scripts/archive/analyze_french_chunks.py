#!/usr/bin/env python3
"""
Analyze French chunk files for missing example_1/2/3 fields.
Generates a report on remediation needs.
"""
import json
import os
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
FR_CHUNKS_DIR = SCRIPT_DIR / "fr"

def analyze_chunk(chunk: dict) -> dict:
    """Analyze a single chunk for remediation needs."""
    has_patterns = "patterns" in chunk and chunk["patterns"]
    has_example_1 = "example_1" in chunk and chunk["example_1"]
    has_example_2 = "example_2" in chunk and chunk["example_2"]
    has_example_3 = "example_3" in chunk and chunk["example_3"]
    
    needs_remediation = has_patterns and not (has_example_1 and has_example_2 and has_example_3)
    
    return {
        "chunk_text": chunk.get("chunk_text", "UNKNOWN"),
        "level": chunk.get("level", "UNKNOWN"),
        "has_patterns": has_patterns,
        "has_example_1": has_example_1,
        "has_example_2": has_example_2,
        "has_example_3": has_example_3,
        "needs_remediation": needs_remediation
    }

def analyze_file(filepath: Path) -> dict:
    """Analyze a single JSON file containing chunks."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        return {
            "filename": filepath.name,
            "error": str(e),
            "total_chunks": 0,
            "needs_remediation": 0,
            "chunks": []
        }
    
    chunks = data if isinstance(data, list) else []
    analyzed = [analyze_chunk(c) for c in chunks]
    
    return {
        "filename": filepath.name,
        "total_chunks": len(analyzed),
        "needs_remediation": sum(1 for a in analyzed if a["needs_remediation"]),
        "has_patterns": sum(1 for a in analyzed if a["has_patterns"]),
        "has_example_1": sum(1 for a in analyzed if a["has_example_1"]),
        "has_example_2": sum(1 for a in analyzed if a["has_example_2"]),
        "has_example_3": sum(1 for a in analyzed if a["has_example_3"]),
        "chunks": analyzed
    }

def main():
    """Analyze all French chunk files and generate report."""
    # Find all french_chunks_batch*.json files
    chunk_files = sorted(FR_CHUNKS_DIR.glob("french_chunks_batch*.json"))
    
    print("=" * 80)
    print("FRENCH CHUNKS ANALYSIS REPORT")
    print("=" * 80)
    print()
    
    results = []
    total_chunks = 0
    total_needing_remediation = 0
    
    for filepath in chunk_files:
        result = analyze_file(filepath)
        results.append(result)
        total_chunks += result["total_chunks"]
        total_needing_remediation += result["needs_remediation"]
    
    # Sort by remediation need (descending)
    results.sort(key=lambda x: x["needs_remediation"], reverse=True)
    
    print(f"Total batch files analyzed: {len(results)}")
    print(f"Total chunks: {total_chunks}")
    print(f"Total needing remediation: {total_needing_remediation}")
    print()
    
    # Per-file breakdown
    print("-" * 80)
    print("PER-FILE BREAKDOWN (sorted by remediation need):")
    print("-" * 80)
    print(f"{'Filename':<35} {'Total':>7} {'Need Fix':>8} {'Has Pat':>8} {'Ex1':>5} {'Ex2':>5} {'Ex3':>5}")
    print("-" * 80)
    
    for r in results:
        if "error" in r:
            print(f"{r['filename']:<35} ERROR: {r['error']}")
        else:
            print(f"{r['filename']:<35} {r['total_chunks']:>7} {r['needs_remediation']:>8} "
                  f"{r['has_patterns']:>8} {r['has_example_1']:>5} {r['has_example_2']:>5} {r['has_example_3']:>5}")
    
    print()
    
    # Level distribution for chunks needing remediation
    level_counts = defaultdict(int)
    for r in results:
        if "error" in r:
            continue
        for chunk in r["chunks"]:
            if chunk["needs_remediation"]:
                level_counts[chunk["level"]] += 1
    
    print("-" * 80)
    print("LEVEL DISTRIBUTION (chunks needing remediation):")
    print("-" * 80)
    for level in ["A1", "A2", "B1", "B2", "C1", "C2"]:
        count = level_counts.get(level, 0)
        if count > 0:
            print(f"  {level}: {count}")
    print()
    
    # Recommended batch strategy
    print("-" * 80)
    print("RECOMMENDED BATCH STRATEGY:")
    print("-" * 80)
    batches_needed = (total_needing_remediation + 9) // 10  # 10 chunks per batch
    print(f"  Total chunks needing examples: {total_needing_remediation}")
    print(f"  Chunks per batch: 10")
    print(f"  Batches needed: {batches_needed}")
    print()
    
    # Top 10 most affected files
    print("-" * 80)
    print("TOP 10 FILES BY REMEDIATION NEED:")
    print("-" * 80)
    for i, r in enumerate(results[:10], 1):
        if "error" not in r:
            print(f"  {i}. {r['filename']}: {r['needs_remediation']} chunks need fix")

if __name__ == "__main__":
    main()