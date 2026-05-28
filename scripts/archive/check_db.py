#!/usr/bin/env py
import sqlite3
conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

cur.execute('SELECT category_id, COUNT(*) FROM chunks WHERE language="fr" GROUP BY category_id ORDER BY category_id')
print('French chunks by category_id:')
for row in cur.fetchall():
    print(f'  cat_id={row[0]}: {row[1]} chunks')

print()
print('All categories:')
cur.execute('SELECT id, name, type, total_entries FROM categories ORDER BY id')
for row in cur.fetchall():
    print(f'  id={row[0]}, name={row[1]}, type={row[2]}, total={row[3]}')

conn.close()