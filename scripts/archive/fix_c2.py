#!/usr/bin/env py
"""Fix incomplete French C2 vocabulary."""
import json, sqlite3, sys
from pathlib import Path
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

conn = sqlite3.connect("chunks_v1.db")
cur = conn.cursor()

# Delete incomplete C2 entries
cur.execute("DELETE FROM vocabulary_words WHERE language='fr' AND cefr_level='C2' AND (part_of_speech IS NULL OR part_of_speech='' OR category IS NULL OR category='' OR primary_meaning IS NULL OR primary_meaning='')")
print(f"Deleted {cur.rowcount} incomplete C2 entries")
conn.commit()

# Import C2 batch files
c2_files = sorted(Path("scripts/fr").glob("french_vocab_c2_batch*.json"))
for f in c2_files:
    data = json.load(open(f, encoding="utf-8"))
    for w in data:
        image_tags = w.get("image_tags", [])
        if isinstance(image_tags, list):
            image_tags = ", ".join(image_tags)
        # 31 placeholders: language is literal 'fr'
        cur.execute("INSERT OR IGNORE INTO vocabulary_words (language, category, subcategory, word, phonetic, part_of_speech, cefr_level, frequency_rank, regional_variant, article, plural_form, countability, primary_meaning, secondary_meaning, usage_notes, common_collocations, synonyms, antonyms, image_search_query, image_context, image_tags, example_1, example_1_translation, example_2, example_2_translation, example_3, example_3_translation, pronunciation_tips, memory_hook, related_words, common_mistakes, learning_priority) VALUES ('fr', ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            w.get("category",""), "", w.get("word",""), w.get("phonetic",""),
            w.get("part_of_speech",""), w.get("cefr_level",""), None, "", "", "", "", "",
            w.get("primary_meaning",""), "", "", "", "", "", "",
            w.get("image_search_query",""), w.get("image_context",""), image_tags,
            w.get("example_1",""), w.get("example_1_translation",""),
            w.get("example_2",""), w.get("example_2_translation",""), "", "", "", "", ""
        ))
conn.commit()
print(f"Imported {sum(len(json.load(open(f, encoding='utf-8'))) for f in c2_files)} C2 words")

# Verify
cur.execute("SELECT COUNT(*) FROM vocabulary_words WHERE language='fr' AND cefr_level='C2' AND part_of_speech IS NOT NULL AND part_of_speech!=''")
print(f"Complete C2: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM vocabulary_words WHERE language='fr'")
print(f"Total French vocab: {cur.fetchone()[0]}")
conn.close()
print("Done")