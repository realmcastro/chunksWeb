"""
Migration script to tag existing French content with language='fr'.
Updates chunks, grammar_structures, and vocabulary_words tables where source_file LIKE 'french_%'.
"""

import sqlite3
import sys

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"

TABLES_WITH_SOURCE_FILE = ["chunks", "grammar_structures"]
TABLES_WITHOUT_SOURCE_FILE = ["vocabulary_words"]


def column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cur.fetchall()]
    return column in columns


def update_french_content(conn: sqlite3.Connection, table: str) -> int:
    if not column_exists(conn, table, "source_file"):
        print(f"  Table '{table}': no source_file column, skipping")
        return 0
        
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {table} SET language = 'fr' WHERE source_file LIKE 'french_%'"
    )
    return cur.rowcount


def main():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)

    try:
        total_updated = 0
        for table in TABLES_WITH_SOURCE_FILE:
            updated = update_french_content(conn, table)
            print(f"  Table '{table}': {updated} row(s) updated")
            total_updated += updated
            
        for table in TABLES_WITHOUT_SOURCE_FILE:
            if not column_exists(conn, table, "source_file"):
                print(f"  Table '{table}': no source_file column, skipping")
            else:
                updated = update_french_content(conn, table)
                print(f"  Table '{table}': {updated} row(s) updated")
                total_updated += updated

        conn.commit()
        print(f"\nMigration complete: {total_updated} total row(s) updated")

    finally:
        conn.close()


if __name__ == "__main__":
    main()