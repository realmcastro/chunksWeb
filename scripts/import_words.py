import json
import sqlite3
import sys
import os

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

db_path = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
json_path = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\words_data.json"

with open(json_path, "r", encoding="utf-8") as f:
    words = json.load(f)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.executescript("""
CREATE TABLE IF NOT EXISTS vocabulary_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  subcategory TEXT,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  cefr_level TEXT,
  frequency_rank INTEGER,
  regional_variant TEXT,
  article TEXT,
  plural_form TEXT,
  countability TEXT,
  primary_meaning TEXT,
  secondary_meaning TEXT,
  usage_notes TEXT,
  common_collocations TEXT,
  synonyms TEXT,
  antonyms TEXT,
  image_search_query TEXT,
  image_context TEXT,
  image_tags TEXT,
  example_1 TEXT,
  example_1_translation TEXT,
  example_2 TEXT,
  example_2_translation TEXT,
  example_3 TEXT,
  example_3_translation TEXT,
  pronunciation_tips TEXT,
  memory_hook TEXT,
  related_words TEXT,
  common_mistakes TEXT,
  learning_priority TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocabulary_words(word);
CREATE INDEX IF NOT EXISTS idx_vocab_cefr ON vocabulary_words(cefr_level);
CREATE INDEX IF NOT EXISTS idx_vocab_category ON vocabulary_words(category, subcategory);
""")

cur.execute("DELETE FROM vocabulary_words")

stmt = """
INSERT INTO vocabulary_words (
  category, subcategory, word, phonetic, part_of_speech, cefr_level,
  frequency_rank, regional_variant, article, plural_form, countability,
  primary_meaning, secondary_meaning, usage_notes, common_collocations,
  synonyms, antonyms, image_search_query, image_context, image_tags,
  example_1, example_1_translation, example_2, example_2_translation,
  example_3, example_3_translation, pronunciation_tips, memory_hook,
  related_words, common_mistakes, learning_priority
) VALUES (
  ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""

count = 0
for w in words:
    cur.execute(stmt, (
        w.get("category", ""),
        w.get("subcategory", ""),
        w.get("word", ""),
        w.get("phonetic", ""),
        w.get("part_of_speech", ""),
        w.get("cefr_level", ""),
        w.get("frequency_rank"),
        w.get("regional_variant", ""),
        w.get("article", ""),
        w.get("plural_form", ""),
        w.get("countability", ""),
        w.get("primary_meaning", ""),
        w.get("secondary_meaning", ""),
        w.get("usage_notes", ""),
        w.get("common_collocations", ""),
        w.get("synonyms", ""),
        w.get("antonyms", ""),
        w.get("image_search_query", ""),
        w.get("image_context", ""),
        w.get("image_tags", ""),
        w.get("example_1", ""),
        w.get("example_1_translation", ""),
        w.get("example_2", ""),
        w.get("example_2_translation", ""),
        w.get("example_3", ""),
        w.get("example_3_translation", ""),
        w.get("pronunciation_tips", ""),
        w.get("memory_hook", ""),
        w.get("related_words", ""),
        w.get("common_mistakes", ""),
        w.get("learning_priority", ""),
    ))
    count += 1

conn.commit()
conn.close()
print(f"Imported {count} words successfully")

# Show sample
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT word, cefr_level, category, subcategory, image_search_query FROM vocabulary_words LIMIT 5")
for row in cur.fetchall():
    print(f"  - {row['word']} ({row['cefr_level']}) [{row['category']} > {row['subcategory']}]")
    print(f"    image_query: {row['image_search_query']}")
conn.close()
