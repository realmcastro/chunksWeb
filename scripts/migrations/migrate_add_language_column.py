"""
Migration script to add language column to database tables.
Adds language TEXT DEFAULT 'en' to chunks, grammar_structures, and vocabulary_words tables.
"""

import sqlite3
import sys

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"

TABLES = ["chunks", "grammar_structures", "vocabulary_words"]


def column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cur.fetchall()]
    return column in columns


def add_language_column(conn: sqlite3.Connection, table: str) -> bool:
    if column_exists(conn, table, "language"):
        print(f"  Table '{table}': 'language' column already exists, skipping")
        return False

    cur = conn.cursor()
    cur.execute(f"ALTER TABLE {table} ADD COLUMN language TEXT DEFAULT 'en'")
    print(f"  Table '{table}': added 'language' column")
    return True


def main():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)

    try:
        added_count = 0
        for table in TABLES:
            if add_language_column(conn, table):
                added_count += 1

        conn.commit()
        print(f"\nMigration complete: {added_count} column(s) added, {len(TABLES) - added_count} skipped")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
