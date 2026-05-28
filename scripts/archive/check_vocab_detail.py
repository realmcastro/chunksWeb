import sqlite3
conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

cur.execute('''
    SELECT language, category, COUNT(*) as count 
    FROM vocabulary_words 
    GROUP BY language, category 
    ORDER BY language, category
''')
for row in cur.fetchall():
    print(f'{row[0]:<5} | {row[1]:<30} | {row[2]}')

conn.close()