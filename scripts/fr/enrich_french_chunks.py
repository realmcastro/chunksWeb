#!/usr/bin/env python3
"""Enrich French chunk JSON files to match English reference schema."""

import json
import shutil
from pathlib import Path

# Target schema fields (in order)
SCHEMA_FIELDS = [
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

def enrich_chunk(chunk):
    """Enrich a single chunk with missing fields."""
    enriched = {}

    for field in SCHEMA_FIELDS:
        if field in chunk:
            enriched[field] = chunk[field]
        elif field == "output_priority":
            enriched[field] = "Both"
        elif field == "frequency":
            enriched[field] = level_to_frequency(chunk.get("level", "B1"))
        elif field == "formulaicity":
            enriched[field] = "Semi-fixed"
        elif field == "construction_type":
            enriched[field] = "Phrase"
        elif field == "acquisition_priority":
            enriched[field] = "Automatic production"
        elif field == "pattern":
            enriched[field] = chunk.get("chunk_text", "")
        elif field == "core_structure":
            enriched[field] = chunk.get("chunk_text", "")
        elif field == "substitution_slots":
            enriched[field] = "Variable based on context."
        elif field == "typical_collocates":
            # Rename from collocates if exists
            enriched[field] = chunk.get("collocates", chunk.get("typical_collocates", []))
        elif field == "common_substitutions":
            enriched[field] = "Similar expressions in French."
        elif field == "variations":
            enriched[field] = chunk.get("patterns", []) if isinstance(chunk.get("patterns"), list) else "N/A"
        elif field == "common_mistakes":
            enriched[field] = "Avoid literal translations from English."
        elif field == "similar_contrasting":
            enriched[field] = "Related French expressions."
        elif field == "interference_warnings":
            enriched[field] = "Watch for false cognates and L1 interference."
        elif field == "nuance":
            enriched[field] = f"Formal register. Common in {chunk.get('communicative_purpose', 'business')} contexts."
        elif field == "pragmatic_effect":
            enriched[field] = "Establishes professional context."
        elif field == "recall_cue":
            enriched[field] = chunk.get("communicative_purpose", "business context")
        elif field == "spacing_tag":
            spacing = "Immediate" if chunk.get("level", "B1") in ["A1", "A2"] else "Short-term"
            enriched[field] = spacing
        elif field == "upgrade_path":
            enriched[field] = "More formal or complex variant available."
        elif field == "chunk_family":
            enriched[field] = chunk.get("chunk_text", "")
        elif field == "is_idiom":
            enriched[field] = 0
        else:
            enriched[field] = chunk.get(field, "")

    return enriched

def level_to_frequency(level):
    """Map CEFR level to frequency."""
    if level in ["A1", "A2"]:
        return "Very high"
    elif level in ["B1"]:
        return "High"
    else:  # B2, C1, C2
        return "Medium"

def process_file(file_path):
    """Process a single JSON file."""
    # Create backup
    backup_path = Path(str(file_path) + ".bak")
    if not backup_path.exists():
        shutil.copy2(file_path, backup_path)
        print(f"✓ Backed up: {file_path.name}")

    # Read and enrich
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    enriched_data = [enrich_chunk(chunk) for chunk in data]

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_data, f, ensure_ascii=False, indent=2)

    print(f"✓ Enriched: {file_path.name} ({len(enriched_data)} chunks)")

def main():
    """Process all target files."""
    base_dir = Path("C:/Users/mathe/OneDrive/Documentos/ChunksWeb/scripts/fr")
    target_files = [
        "french_chunks_batch46.json",
        "french_chunks_batch47.json",
        "french_chunks_batch48.json",
        "french_chunks_batch49.json",
        "french_chunks_batch50.json",
    ]

    for filename in target_files:
        file_path = base_dir / filename
        if file_path.exists():
            process_file(file_path)
        else:
            print(f"✗ Not found: {filename}")

if __name__ == "__main__":
    main()
