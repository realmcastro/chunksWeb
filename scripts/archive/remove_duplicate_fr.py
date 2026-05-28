#!/usr/bin/env py
"""
Remove duplicate French entries for English words that were fixed.
The fix_english_words.py changed some entries to English but left duplicates.
"""
import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

DB_PATH = "chunks_v1.db"

# Words that have both EN and FR entries
WORDS = ['hsien', 'knock-out', 'with deep regard', 'withdrawal', 'yogue', 'zealous', 'zen']

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

for word in WORDS:
    # Get all IDs for this word in French
    cur.execute('SELECT id FROM vocabulary_words WHERE word=? AND language="fr"', (word,))
    fr_ids = [r[0] for r in cur.fetchall()]
    
    if fr_ids:
        print(f"{word}: deleting {len(fr_ids)} French entries: {fr_ids}")
        cur.execute('DELETE FROM vocabulary_words WHERE id IN ({})'.format(','.join('?' * len(fr_ids))), fr_ids)
    else:
        print(f"{word}: no French entries to delete")

conn.commit()

# Final counts
print("\n=== Final counts ===")
cur.execute('SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY language')
for row in cur.fetchall():
    print(f"  {row[0] or 'NULL'}: {row[1]}")

conn.close()
print("\nDone!")