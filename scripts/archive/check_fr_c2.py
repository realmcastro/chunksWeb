import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

# Check French C2 vocabulary for missing data
cur.execute('SELECT word, phonetic, part_of_speech, category FROM vocabulary_words WHERE language="fr" AND cefr_level="C2" LIMIT 10')
for row in cur.fetchall():
    print(row)

conn.close()