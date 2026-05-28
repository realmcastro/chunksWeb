#!/usr/bin/env py
"""
Fix English words incorrectly tagged as French in vocabulary_words.
These are words without French diacritics that have English phonetics
and should be in the English vocabulary, not French.
"""
import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

DB_PATH = "chunks_v1.db"

# Words to fix: English words incorrectly tagged as French
# These have English phonetics and no French diacritics
WORDS_TO_FIX = [
    'with deep regard',
    'withdrawal', 
    'knock-out',
    'zealous',
    'zen',
    'hsien',
    'yogue'
]

def fix_english_words():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    print(f"Words to fix: {len(WORDS_TO_FIX)}")
    
    for word in WORDS_TO_FIX:
        # Check if it exists as French
        cur.execute('SELECT id, word, cefr_level, category FROM vocabulary_words WHERE word=? AND language="fr"', (word,))
        fr_row = cur.fetchone()
        
        if fr_row:
            print(f"\nFound French: id={fr_row[0]}, word='{fr_row[1]}', CEFR={fr_row[2]}, cat='{fr_row[3]}'")
            
            # Check if it exists as English
            cur.execute('SELECT id FROM vocabulary_words WHERE word=? AND language="en"', (word,))
            en_row = cur.fetchone()
            
            if en_row:
                print(f"  -> Already exists as English (id={en_row[0]})")
                # Delete the French one
                cur.execute('DELETE FROM vocabulary_words WHERE id=?', (fr_row[0],))
                print(f"  -> Deleted French entry")
            else:
                # Update the French entry to English
                cur.execute('UPDATE vocabulary_words SET language="en" WHERE id=?', (fr_row[0],))
                print(f"  -> Updated to English")
    
    conn.commit()
    
    # Verify
    print("\n=== After fix ===")
    cur.execute('SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY language')
    for row in cur.fetchall():
        print(f"  {row[0] or 'NULL'}: {row[1]}")
    
    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    fix_english_words()