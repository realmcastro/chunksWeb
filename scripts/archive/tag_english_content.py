#!/usr/bin/env python3
"""
Tag English content and check vocabulary_words table structure.
"""

import sqlite3

DB_PATH = "chunks_v1.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Task 1: Tag English content in chunks
    print("=" * 60)
    print("TASK 1: Tag English content")
    print("=" * 60)

    cursor.execute("SELECT COUNT(*) FROM chunks WHERE language IS NULL OR language = ''")
    null_lang_count = cursor.fetchone()[0]
    print(f"Chunks with NULL or empty language: {null_lang_count}")

    if null_lang_count > 0:
        cursor.execute("""
            UPDATE chunks 
            SET language = 'en' 
            WHERE language IS NULL OR language = ''
        """)
        conn.commit()
        print(f"Updated {cursor.rowcount} chunks to language='en'")
    else:
        print("No chunks to update")

    # Tag English content in grammar_structures
    cursor.execute("SELECT COUNT(*) FROM grammar_structures WHERE language IS NULL OR language = ''")
    null_grammar_count = cursor.fetchone()[0]
    print(f"Grammar structures with NULL or empty language: {null_grammar_count}")

    if null_grammar_count > 0:
        cursor.execute("""
            UPDATE grammar_structures 
            SET language = 'en' 
            WHERE language IS NULL OR language = ''
        """)
        conn.commit()
        print(f"Updated {cursor.rowcount} grammar_structures to language='en'")
    else:
        print("No grammar_structures to update")

    # Task 2: Check vocabulary_words table structure
    print("\n" + "=" * 60)
    print("TASK 2: vocabulary_words table structure (PRAGMA table_info)")
    print("=" * 60)

    cursor.execute("PRAGMA table_info(vocabulary_words)")
    columns = cursor.fetchall()
    
    if columns:
        print(f"\nvocabulary_words has {len(columns)} columns:")
        print(f"{'cid':<5} {'name':<25} {'type':<15} {'notnull':<10} {'dflt_value':<20} {'pk':<5}")
        print("-" * 85)
        for col in columns:
            print(f"{col['cid']:<5} {col['name']:<25} {col['type']:<15} {col['notnull']:<10} {str(col['dflt_value']):<20} {col['pk']:<5}")
    else:
        print("vocabulary_words table does not exist!")

    # Show current language distribution in vocabulary_words
    print("\n" + "=" * 60)
    print("Current language distribution in vocabulary_words")
    print("=" * 60)
    
    try:
        cursor.execute("""
            SELECT language, COUNT(*) as count 
            FROM vocabulary_words 
            GROUP BY language 
            ORDER BY count DESC
        """)
        lang_rows = cursor.fetchall()
        if lang_rows:
            for row in lang_rows:
                lang = row['language'] if row['language'] else 'NULL/empty'
                print(f"  {lang:<15}: {row['count']} words")
        else:
            print("  No data found in vocabulary_words")
    except sqlite3.OperationalError as e:
        print(f"  Error querying language distribution: {e}")

    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    main()