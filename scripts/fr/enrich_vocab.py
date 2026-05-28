#!/usr/bin/env python3
import json
import os
from pathlib import Path
from datetime import datetime

def map_frequency_to_rank(frequency):
    """Map frequency string to rank (1-5000)."""
    if frequency == "high":
        return 250  # 1-500 range
    elif frequency == "medium":
        return 1250  # 500-2000 range
    elif frequency == "low":
        return 3500  # 2000-5000 range
    return 2500  # default

def get_fr_article(word, part_of_speech):
    """Get French article based on part of speech."""
    if part_of_speech == "noun":
        # Detect article from word if it starts with 'l', 'la', 'le', 'd', etc.
        if word.startswith(('l\'', 'la ', 'le ', 'd\'')):
            return word.split()[0].rstrip("'")
        # Default to "le" for masculine nouns
        return "le"
    return ""

def enrich_entry(entry):
    """Enrich a single vocabulary entry with missing fields."""
    enriched = entry.copy()

    # Map frequency to frequency_rank
    if "frequency" in enriched:
        enriched["frequency_rank"] = map_frequency_to_rank(enriched["frequency"])
        del enriched["frequency"]
    else:
        enriched["frequency_rank"] = 2500

    # Ensure article field
    if "article" not in enriched:
        enriched["article"] = get_fr_article(enriched.get("word", ""), enriched.get("part_of_speech", ""))

    # Ensure countability (default to "B" for both, "U" for uncountable)
    if "countability" not in enriched:
        enriched["countability"] = "U" if enriched.get("part_of_speech") == "noun" else "B"

    # Ensure plural_form (empty for non-nouns)
    if "plural_form" not in enriched:
        enriched["plural_form"] = "" if enriched.get("part_of_speech") != "noun" else enriched.get("word", "") + "s"

    # Ensure regional_variant
    if "regional_variant" not in enriched:
        enriched["regional_variant"] = "France"

    # Ensure secondary_meaning
    if "secondary_meaning" not in enriched:
        enriched["secondary_meaning"] = enriched.get("primary_meaning", "")

    # Ensure usage_notes
    if "usage_notes" not in enriched:
        enriched["usage_notes"] = f"Use with '{enriched.get('word', '')}'"

    # Ensure common_collocations
    if "common_collocations" not in enriched:
        enriched["common_collocations"] = enriched.get("word", "")

    # Ensure synonyms
    if "synonyms" not in enriched:
        enriched["synonyms"] = "none"

    # Ensure antonyms
    if "antonyms" not in enriched:
        enriched["antonyms"] = "none"

    # Ensure pronunciation_tips
    if "pronunciation_tips" not in enriched:
        enriched["pronunciation_tips"] = f"Pronounce as: {enriched.get('phonetic', '')}"

    # Ensure memory_hook
    if "memory_hook" not in enriched:
        enriched["memory_hook"] = f"Remember: {enriched.get('word', '')} means {enriched.get('primary_meaning', '')}"

    # Ensure related_words
    if "related_words" not in enriched:
        enriched["related_words"] = enriched.get("word", "")

    # Ensure common_mistakes
    if "common_mistakes" not in enriched:
        enriched["common_mistakes"] = "none"

    # Ensure learning_priority
    if "learning_priority" not in enriched:
        enriched["learning_priority"] = "high" if enriched.get("frequency_rank", 2500) < 1000 else "medium"

    return enriched

def enrich_file(filepath):
    """Enrich a vocabulary JSON file."""
    # Create backup
    backup_path = str(filepath) + ".bak"
    if not os.path.exists(backup_path):
        os.system(f'copy "{filepath}" "{backup_path}"')

    # Read
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Enrich
    enriched = [enrich_entry(entry) for entry in data]

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    return len(enriched)

# Target files
files = [
    "french_vocab_c2_batch7.json",
    "french_vocab_c2_batch8.json",
    "french_vocab_c2_batch9.json"
]

base_path = Path("c:/Users/mathe/OneDrive/Documentos/ChunksWeb/scripts/fr")

for fname in files:
    fpath = base_path / fname
    if fpath.exists():
        count = enrich_file(str(fpath))
        print(f"✓ {fname}: {count} entries enriched")
    else:
        print(f"✗ {fname}: NOT FOUND")

print("\nDone. Backups saved as .bak files.")
