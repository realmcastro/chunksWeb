#!/usr/bin/env python3
import json
from pathlib import Path

# Frequency to rank mapping
FREQ_TO_RANK = {
    "high": 250,
    "medium": 1250,
    "low": 3500
}

# French articles for nouns
ARTICLE_MAP = {
    "la ": "la",
    "le ": "le",
    "l'": "l'",
}

def get_article_and_plural(word):
    """Extract article and guess plural form for French nouns."""
    if not word:
        return "", ""

    # Extract article from word (e.g., "la bibliothèque" → "la", "bibliothèque")
    parts = word.split(" ", 1)
    if len(parts) == 2 and parts[0] in ["la", "le", "l'"]:
        article = parts[0]
        noun = parts[1]
    else:
        return "", ""

    # Guess plural (simple rules for A2 level)
    if noun.endswith("eau"):
        plural = noun  # eau → eaux (no change in base form)
    elif noun.endswith("al"):
        plural = noun.replace("al", "aux")
    else:
        plural = noun + "s"

    return article, plural

def determine_countability(part_of_speech):
    """Determine if noun is countable, uncountable, or both."""
    if part_of_speech == "verb" or part_of_speech == "adjective":
        return "U"
    return "C"

def enrich_entry(entry, index):
    """Enrich a vocabulary entry with missing fields."""

    word = entry.get("word", "")

    # Frequency rank mapping
    freq = entry.get("frequency", "medium")
    frequency_rank = FREQ_TO_RANK.get(freq, 1250)

    # Article and plural for nouns
    article, plural_form = get_article_and_plural(word) if entry.get("part_of_speech") == "noun" else ("", "")

    # Countability
    countability = determine_countability(entry.get("part_of_speech", ""))

    # Regional variant (France is default for standard French)
    regional_variant = entry.get("regional_variant", "France")

    # Enriched entry
    enriched = {
        "word": word,
        "phonetic": entry.get("phonetic", ""),
        "part_of_speech": entry.get("part_of_speech", ""),
        "cefr_level": entry.get("cefr_level", "A2"),
        "category": entry.get("category", "General"),
        "subcategory": entry.get("subcategory", ""),
        "article": article,
        "plural_form": plural_form,
        "countability": countability,
        "regional_variant": regional_variant,
        "frequency_rank": frequency_rank,
        "primary_meaning": entry.get("primary_meaning", ""),
        "secondary_meaning": entry.get("secondary_meaning", ""),
        "usage_notes": entry.get("usage_notes", ""),
        "common_collocations": entry.get("common_collocations", ""),
        "synonyms": entry.get("synonyms", ""),
        "antonyms": entry.get("antonyms", ""),
        "image_search_query": entry.get("image_search_query", ""),
        "image_context": entry.get("image_context", ""),
        "image_tags": entry.get("image_tags", ""),
        "example_1": entry.get("example_1", ""),
        "example_1_translation": entry.get("example_1_translation", ""),
        "example_2": entry.get("example_2", ""),
        "example_2_translation": entry.get("example_2_translation", ""),
        "example_3": entry.get("example_3", ""),
        "example_3_translation": entry.get("example_3_translation", ""),
        "pronunciation_tips": entry.get("pronunciation_tips", ""),
        "memory_hook": entry.get("memory_hook", ""),
        "related_words": entry.get("related_words", ""),
        "common_mistakes": entry.get("common_mistakes", ""),
        "learning_priority": entry.get("learning_priority", "high")
    }

    return enriched

def process_file(input_path):
    """Process a single vocabulary file."""
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    enriched_data = [enrich_entry(entry, i) for i, entry in enumerate(data)]

    with open(input_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_data, f, ensure_ascii=False, indent=2)

    return len(enriched_data)

# Process all three files
files = [
    r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_a2_batch1.json",
    r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_a2_batch2.json",
    r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_a2_batch3.json",
]

total = 0
for f in files:
    try:
        count = process_file(f)
        print(f"{Path(f).name}: {count} entries enriched")
        total += count
    except Exception as e:
        print(f"ERROR {Path(f).name}: {e}")

print(f"\nTotal: {total} entries processed")
