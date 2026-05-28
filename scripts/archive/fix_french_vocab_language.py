"""
Corrige vocabulary_words com language='en' que são palavras francesas.

Causa raiz: migrate_add_language_column.py definiu DEFAULT 'en' para todos os
registros existentes (incluindo os franceses). O migrate_tag_french_content.py
não conseguiu corrigir vocabulary_words pois a tabela não tem coluna source_file.
import_french_vocabulary.py usa INSERT OR IGNORE, então palavras já existentes
(com language='en' errado) foram ignoradas.

Esta script lê todos os JSONs de scripts/fr/french_vocab_*.json, coleta as
palavras francesas e faz UPDATE SET language='fr' WHERE word IN (...).
"""

import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "chunks_v1.db"
FR_DIR = Path(__file__).parent / "fr"


def collect_french_words(fr_dir: Path) -> set[str]:
    french_words: set[str] = set()
    vocab_files = sorted(fr_dir.glob("french_vocab_*.json"))

    if not vocab_files:
        print(f"AVISO: Nenhum arquivo french_vocab_*.json encontrado em {fr_dir}")
        return french_words

    for path in vocab_files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            word = item.get("word", "").strip()
            if word:
                french_words.add(word)

    return french_words


def fix_french_vocab(conn: sqlite3.Connection, french_words: set[str]) -> int:
    if not french_words:
        return 0

    cur = conn.cursor()

    # Quantas palavras francesas estão marcadas como 'en'
    placeholders = ",".join("?" * len(french_words))
    cur.execute(
        f"SELECT COUNT(*) FROM vocabulary_words WHERE language = 'en' AND word IN ({placeholders})",
        list(french_words),
    )
    count_to_fix = cur.fetchone()[0]
    print(f"Palavras francesas marcadas como 'en': {count_to_fix}")

    if count_to_fix == 0:
        print("Nenhuma correção necessária.")
        return 0

    cur.execute(
        f"UPDATE vocabulary_words SET language = 'fr' WHERE language = 'en' AND word IN ({placeholders})",
        list(french_words),
    )
    updated = cur.rowcount
    conn.commit()
    return updated


def main() -> None:
    print(f"DB: {DB_PATH}")
    print(f"Coletando palavras dos JSONs em: {FR_DIR}\n")

    french_words = collect_french_words(FR_DIR)
    print(f"Total de palavras francesas nos JSONs: {len(french_words)}\n")

    if not french_words:
        print("Nenhuma palavra encontrada. Verifique o diretório scripts/fr/")
        return

    conn = sqlite3.connect(str(DB_PATH))
    try:
        # Estado antes
        cur = conn.cursor()
        cur.execute("SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY COUNT(*) DESC")
        print("Distribuição ANTES:")
        for row in cur.fetchall():
            lang = row[0] or "NULL"
            print(f"  {lang:<10}: {row[1]}")

        updated = fix_french_vocab(conn, french_words)
        print(f"\nRegistros atualizados para language='fr': {updated}")

        # Estado depois
        cur.execute("SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY COUNT(*) DESC")
        print("\nDistribuição DEPOIS:")
        for row in cur.fetchall():
            lang = row[0] or "NULL"
            print(f"  {lang:<10}: {row[1]}")

    finally:
        conn.close()

    print("\nConcluído.")


if __name__ == "__main__":
    main()
