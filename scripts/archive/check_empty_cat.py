import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

# Get all unique empty category words
cur.execute('SELECT DISTINCT word, cefr_level FROM vocabulary_words WHERE language="fr" AND category="" ORDER BY word')
rows = cur.fetchall()
print(f'Unique empty category French words: {len(rows)}')

# Identify potential English words (words without French diacritics and not obviously French)
french_chars = set('àâäéèêëïîôùûüÿçœæ')
suspected_english = []
confirmed_french = []

for w, c in rows:
    has_french_chars = any(ch in w.lower() for ch in french_chars)
    if has_french_chars:
        confirmed_french.append(w)
    else:
        suspected_english.append(w)

print(f'\nConfirmed French (with diacritics): {len(confirmed_french)}')
print(f'Suspected English (without diacritics): {len(suspected_english)}')

print('\nSuspected English words:')
for w in suspected_english:
    print(f'  {w}')

conn.close()