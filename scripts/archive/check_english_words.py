import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

# Check the clearly English words
english_candidates = ['with deep regard', 'withdrawal', 'knock-out', 'zealous', 'zen', 'hsien', 'yogue']
for w in english_candidates:
    cur.execute('SELECT word, cefr_level, category, phonetic FROM vocabulary_words WHERE word=? AND language="fr"', (w,))
    row = cur.fetchone()
    if row:
        print(f'{row[0]} | CEFR={row[1]} | cat={row[2]} | phon={row[3]}')
    else:
        print(f'{w} not found')

conn.close()