"""Import WordN5.docx into vocabulary_words (INSERT OR IGNORE)."""

import json
import re
import sqlite3
import sys
from docx import Document

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH   = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
DOCX_PATH = r"C:\Users\mathe\OneDrive\Documentos\chunks\WordN5.docx"


def fix_json_string_quotes(s):
    result = []
    in_string = False
    escape_next = False
    for i, c in enumerate(s):
        if escape_next:
            result.append(c)
            escape_next = False
            continue
        if c == '\\':
            result.append(c)
            escape_next = True
            continue
        if c == '"' and not in_string:
            in_string = True
            result.append(c)
            continue
        if c == '"' and in_string:
            j = i + 1
            while j < len(s) and s[j] in ' \t\n\r':
                j += 1
            if j < len(s) and s[j] in ':,}]':
                in_string = False
                result.append(c)
            else:
                result.append('\\"')
            continue
        result.append(c)
    return ''.join(result)


# Extract
doc = Document(DOCX_PATH)
full_text = "\n".join(p.text for p in doc.paragraphs)
match = re.search(r'\[\s*\{.*\}\s*\]', full_text, re.DOTALL)
if not match:
    print("ERROR: No JSON array found")
    sys.exit(1)

fixed = fix_json_string_quotes(match.group(0))
try:
    words = json.loads(fixed)
    print(f"Parsed: {len(words)} words from WordN5.docx")
except json.JSONDecodeError as e:
    print(f"JSON error at {e.pos}: {e.msg}")
    print(repr(fixed[max(0, e.pos-100):e.pos+100]))
    sys.exit(1)

# Import
STMT = """
INSERT OR IGNORE INTO vocabulary_words (
  category, subcategory, word, phonetic, part_of_speech, cefr_level,
  frequency_rank, regional_variant, article, plural_form, countability,
  primary_meaning, secondary_meaning, usage_notes, common_collocations,
  synonyms, antonyms, image_search_query, image_context, image_tags,
  example_1, example_1_translation, example_2, example_2_translation,
  example_3, example_3_translation, pronunciation_tips, memory_hook,
  related_words, common_mistakes, learning_priority
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
"""

conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()

cur.execute("SELECT COUNT(*) FROM vocabulary_words")
before = cur.fetchone()[0]

inserted = 0
for w in words:
    r = cur.execute(STMT, (
        w.get("category", ""), w.get("subcategory", ""), w.get("word", ""),
        w.get("phonetic", ""), w.get("part_of_speech", ""), w.get("cefr_level", ""),
        w.get("frequency_rank"), w.get("regional_variant", ""), w.get("article", ""),
        w.get("plural_form", ""), w.get("countability", ""), w.get("primary_meaning", ""),
        w.get("secondary_meaning", ""), w.get("usage_notes", ""), w.get("common_collocations", ""),
        w.get("synonyms", ""), w.get("antonyms", ""), w.get("image_search_query", ""),
        w.get("image_context", ""), w.get("image_tags", ""), w.get("example_1", ""),
        w.get("example_1_translation", ""), w.get("example_2", ""), w.get("example_2_translation", ""),
        w.get("example_3", ""), w.get("example_3_translation", ""), w.get("pronunciation_tips", ""),
        w.get("memory_hook", ""), w.get("related_words", ""), w.get("common_mistakes", ""),
        w.get("learning_priority", ""),
    ))
    if r.rowcount:
        inserted += 1

conn.commit()

cur.execute("SELECT COUNT(*) FROM vocabulary_words")
after = cur.fetchone()[0]

print(f"Before: {before}  After: {after}  New: {inserted}  Skipped: {len(words)-inserted}")

print("\nCEFR breakdown:")
cur.execute("SELECT cefr_level, COUNT(*) FROM vocabulary_words GROUP BY cefr_level ORDER BY cefr_level")
for row in cur.fetchall():
    print(f"  {row[0] or '(none)'}: {row[1]}")

conn.close()
