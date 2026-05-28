import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

# Check if these words exist in English vocabulary
english_candidates = ['withdrawal', 'knock-out', 'zealous', 'zen']
for w in english_candidates:
    cur.execute('SELECT word, cefr_level, category FROM vocabulary_words WHERE word=? AND language="en"', (w,))
    row = cur.fetchone()
    if row:
        print(f'EN: {row[0]} | CEFR={row[1]} | cat={row[2]}')
    else:
        print(f'{w} not found in English')

conn.close()