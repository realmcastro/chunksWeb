#!/usr/bin/env py
"""
Fix incomplete French C2 vocabulary in the database.
"""

import json
import sqlite3
import sys
from pathlib import Path

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

DB_PATH = "chunks_v1.db"
FR_DIR = Path("scripts/fr")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Step 1: Delete incomplete French C2 entries from database
print("=== Step 1: Delete incomplete C2 entries from DB ===")
cur.execute("""
    DELETE FROM vocabulary_words 
    WHERE language = 'fr' 
    AND cefr_level = 'C2' 
    AND (part_of_speech IS NULL OR part_of_speech = '' 
         OR category IS NULL OR category = ''
         OR primary_meaning IS NULL OR primary_meaning = '')
""")
deleted = cur.rowcount
print(f"Deleted {deleted} incomplete C2 entries")
conn.commit()

# Step 2: Re-import the new C2 batch files
print("\n=== Step 2: Re-import new C2 batch files ===")

c2_files = sorted(FR_DIR.glob("french_vocab_c2_batch*.json"))
total_inserted = 0

for f in c2_files:
    print(f"\n→ Loading {f.name}")
    data = json.load(open(f, encoding="utf-8"))
    print(f"  {len(data)} words to import")
    
    inserted = 0
    for w in data:
        image_tags = w.get("image_tags", [])
        if isinstance(image_tags, list):
            image_tags = ", ".join(image_tags)
        
        # 30 placeholders + 'fr' literal = 31 columns
        cur.execute("""
            INSERT OR IGNORE INTO vocabulary_words (
                language, category, subcategory, word, phonetic, part_of_speech, cefr_level,
                frequency_rank, regional_variant, article, plural_form, countability,
                primary_meaning, secondary_meaning, usage_notes, common_collocations,
                synonyms, antonyms, image_search_query, image_context, image_tags,
                example_1, example_1_translation, example_2, example_2_translation,
                example_3, example_3_translation, pronunciation_tips, memory_hook,
                related_words, common_mistakes, learning_priority
            ) VALUES (
                'fr', ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
        """, (
            w.get("category", ""),          # 1
            "",                             # 2 - subcategory
            w.get("word", ""),              # 3
            w.get("phonetic", ""),          # 4
            w.get("part_of_speech", ""),    # 5
            w.get("cefr_level", ""),        # 6
            None,                           # 7 - frequency_rank
            "",                             # 8 - regional_variant
            "",                             # 9 - article
            "",                             # 10 - plural_form
            "",                             # 11 - countability
            w.get("primary_meaning", ""),   # 12
            "",                             # 13 - secondary_meaning
            "",                             # 14 - usage_notes
            "",                             # 15 - common_collocations
            "",                             # 16 - synonyms
            "",                             # 17 - antonyms
            w.get("image_search_query", ""), # 18
            w.get("image_context", ""),     # 19
            image_tags,                     # 20
            w.get("example_1", ""),         # 21
            w.get("example_1_translation", ""),  # 22
            w.get("example_2", ""),         # 23
            w.get("example_2_translation", ""),  # 24
            "",                             # 25 - example_3
            "",                             # 26 - example_3_translation
            "",                             # 27 - pronunciation_tips
            "",                             # 28 - memory_hook
            "",                             # 29 - related_words
            "",                             # 30 - common_mistakes
        ))
        inserted += 1
    
    print(f"  Inserted: {inserted}")
    total_inserted += inserted

conn.commit()

# Verify
print("\n=== Verification ===")
cur.execute("""
    SELECT COUNT(*) FROM vocabulary_words 
    WHERE language = 'fr' AND cefr_level = 'C2' 
    AND part_of_speech IS NOT NULL AND part_of_speech != ''
""")
complete = cur.fetchone()[0]
print(f"Complete C2 entries: {complete}")

cur.execute("SELECT COUNT(*) FROM vocabulary_words WHERE language = 'fr' AND cefr_level = 'C2'")
total_c2 = cur.fetchone()[0]
print(f"Total C2 entries: {total_c2}")

# Language distribution
print("\n=== Language distribution ===")
cur.execute("SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY language")
for row in cur.fetchall():
    print(f"  {row[0] or 'NULL'}: {row[1]}")

conn.close()
print(f"\n✓ Done! Inserted {total_inserted} C2 words")