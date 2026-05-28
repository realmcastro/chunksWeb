#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

# Files to process
FILES = [
    "french_chunks_batch16.json",
    "french_chunks_batch17.json",
    "french_chunks_batch18.json",
    "french_chunks_batch19.json",
    "french_chunks_batch20.json",
]

# Required schema fields with defaults
REQUIRED_FIELDS = {
    "chunk_text": "",
    "meaning": "",
    "primary_function": "Expression",
    "communicative_purpose": "",
    "trigger_situations": "",
    "contexts": "",
    "output_priority": "Both",
    "frequency": "Medium",
    "formulaicity": "Semi-fixed",
    "construction_type": "Phrase",
    "acquisition_priority": "Recognition first",
    "pattern": "",
    "core_structure": "",
    "substitution_slots": "",
    "typical_collocates": [],
    "common_substitutions": "",
    "variations": "",
    "common_mistakes": "",
    "similar_contrasting": "",
    "interference_warnings": "",
    "nuance": "",
    "pragmatic_effect": "",
    "recall_cue": "",
    "spacing_tag": "Short-term",
    "upgrade_path": "",
    "chunk_family": "",
    "is_idiom": 1,
    "level": "A1",
    "example_1": "",
    "example_2": "",
    "example_3": "",
    "example_1_translation": "",
    "example_2_translation": "",
    "example_3_translation": "",
}

def enrich_chunk(chunk):
    """Enrich a chunk entry with missing fields."""
    enriched = {}

    # Process each required field
    for field, default in REQUIRED_FIELDS.items():
        if field in chunk:
            value = chunk[field]
            # Special handling for typical_collocates (rename from collocates)
            if field == "typical_collocates" and "collocates" in chunk:
                enriched[field] = chunk["collocates"]
            else:
                enriched[field] = value
        else:
            enriched[field] = default

    # Rename collocates to typical_collocates if present
    if "collocates" in chunk and "typical_collocates" not in enriched:
        enriched["typical_collocates"] = chunk["collocates"]

    # Generate pattern from core_structure if not present
    if not enriched.get("pattern") and enriched.get("chunk_text"):
        enriched["pattern"] = enriched["chunk_text"]

    # Generate core_structure from chunk_text if not present
    if not enriched.get("core_structure") and enriched.get("chunk_text"):
        enriched["core_structure"] = enriched["chunk_text"]

    # Infer is_idiom: 1 for idioms, 0 for regular phrases
    if "patterns" in chunk or "collocates" in chunk:
        if enriched["is_idiom"] == 1 and not any(x in enriched["chunk_text"].lower() for x in ["faire", "prendre", "être", "avoir", "jouer"]):
            enriched["is_idiom"] = 1

    return enriched

def process_file(filename):
    """Process a single file: backup, enrich, and write."""
    file_path = Path(filename)

    # Create backup if it doesn't exist
    backup_path = Path(f"{filename}.bak")
    if not backup_path.exists():
        shutil.copy(file_path, backup_path)
        print(f"Backed up {filename}")

    # Read original
    with open(file_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    # Enrich each chunk
    enriched_chunks = [enrich_chunk(chunk) for chunk in chunks]

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_chunks, f, ensure_ascii=False, indent=2)

    print(f"Enriched {filename} ({len(enriched_chunks)} entries)")

if __name__ == "__main__":
    for fname in FILES:
        process_file(fname)
    print("\nAll files enriched successfully!")
