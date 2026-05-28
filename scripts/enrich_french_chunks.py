#!/usr/bin/env python3
"""Enrich French chunk JSON files to match English reference schema."""

import json
import shutil
from pathlib import Path

# All required fields per reference schema
REQUIRED_FIELDS = [
    "chunk_text", "meaning", "primary_function", "communicative_purpose",
    "trigger_situations", "contexts", "output_priority", "frequency",
    "formulaicity", "construction_type", "acquisition_priority", "pattern",
    "core_structure", "substitution_slots", "typical_collocates",
    "common_substitutions", "variations", "common_mistakes",
    "similar_contrasting", "interference_warnings", "nuance",
    "pragmatic_effect", "recall_cue", "spacing_tag", "upgrade_path",
    "chunk_family", "is_idiom", "level", "example_1", "example_2",
    "example_3", "example_1_translation", "example_2_translation",
    "example_3_translation"
]

# Default values for missing fields
DEFAULTS = {
    "output_priority": "Both",
    "frequency": "High",
    "formulaicity": "Semi-fixed",
    "construction_type": "Phrase",
    "acquisition_priority": "Automatic production",
    "core_structure": "",
    "substitution_slots": "",
    "common_substitutions": "",
    "similar_contrasting": "",
    "interference_warnings": "",
    "nuance": "",
    "pragmatic_effect": "",
    "recall_cue": "",
    "spacing_tag": "Short-term",
    "upgrade_path": "",
    "chunk_family": "",
    "is_idiom": 0,
    "level": "A2",
}

def enrich_chunk(chunk):
    """Add missing fields to chunk, rename 'collocates' to 'typical_collocates'."""

    # Rename collocates → typical_collocates
    if "collocates" in chunk:
        chunk["typical_collocates"] = chunk.pop("collocates")

    # Rename patterns → pattern (singular, join with comma)
    if "patterns" in chunk and "pattern" not in chunk:
        patterns = chunk.pop("patterns")
        if isinstance(patterns, list):
            chunk["pattern"] = ", ".join(patterns)
        else:
            chunk["pattern"] = patterns

    # Add missing fields with defaults
    for field in REQUIRED_FIELDS:
        if field not in chunk:
            chunk[field] = DEFAULTS.get(field, "")

    return chunk

def process_file(filepath):
    """Read, enrich, write back; backup original."""

    path = Path(filepath)
    backup = path.with_suffix(".bak")

    # Skip backup if exists
    if not backup.exists():
        shutil.copy2(path, backup)
        print(f"  Backed up to {backup.name}")

    # Read
    with open(path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    # Enrich
    enriched = [enrich_chunk(c) for c in chunks]

    # Reorder fields to match reference schema
    ordered = []
    for chunk in enriched:
        ordered_chunk = {k: chunk[k] for k in REQUIRED_FIELDS if k in chunk}
        ordered.append(ordered_chunk)

    # Write back
    with open(path, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)

    print(f"  Enriched {len(enriched)} chunks")

def main():
    files = [
        "C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_chunks_batch71.json",
        "C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_chunks_batch72.json",
        "C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_chunks_batch73.json",
        "C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_chunks_batch74.json",
        "C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_chunks_batch75.json",
    ]

    for file in files:
        print(f"\nProcessing {Path(file).name}...")
        process_file(file)

    print("\n✓ Done. All files enriched and ordered.")

if __name__ == "__main__":
    main()
