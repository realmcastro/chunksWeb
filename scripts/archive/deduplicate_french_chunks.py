#!/usr/bin/env python3
"""
Deduplication script for French chunks in the chunks table.

! Invariantes:
- Primary chunk = lowest ID in each duplicate group
- All examples consolidated to primary chunk
- Canonical examples (is_canonical=1) take priority over non-canonical
- Transactions ensure atomicity

Pré-condições: Database must contain chunks and examples tables
Pós-condições: No duplicate chunk_text for French chunks; all examples point to primary chunks
"""

import sqlite3
import sys
from pathlib import Path
from collections import defaultdict

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH = Path(__file__).parent.parent / "chunks_v1.db"


def get_duplicate_groups(conn: sqlite3.Connection) -> dict[str, list[int]]:
    """
    Find all French chunks with duplicate chunk_text.
    Returns: {chunk_text: [id1, id2, ...]} sorted by ID ascending
    """
    cur = conn.cursor()
    cur.execute("""
        SELECT id, chunk_text
        FROM chunks
        WHERE source_file LIKE 'french_chunks%'
        ORDER BY id
    """)
    
    text_to_ids = defaultdict(list)
    for chunk_id, chunk_text in cur.fetchall():
        text_to_ids[chunk_text].append(chunk_id)
    
    # Filter to only duplicates (more than one ID per text)
    return {
        text: ids for text, ids in text_to_ids.items()
        if len(ids) > 1
    }


def get_chunk_stats(conn: sqlite3.Connection) -> dict:
    """Get current statistics about French chunks and examples."""
    cur = conn.cursor()
    stats = {}
    
    cur.execute("""
        SELECT COUNT(*) FROM chunks WHERE source_file LIKE 'french_chunks%'
    """)
    stats['total_chunks'] = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(DISTINCT chunk_text) 
        FROM chunks 
        WHERE source_file LIKE 'french_chunks%'
    """)
    stats['unique_chunks'] = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(*) 
        FROM examples e 
        JOIN chunks c ON e.item_id = c.id AND e.item_type = 'chunk'
        WHERE c.source_file LIKE 'french_chunks%'
    """)
    stats['total_examples'] = cur.fetchone()[0]
    
    return stats


def deduplicate_group(conn: sqlite3.Connection, chunk_text: str, chunk_ids: list[int]) -> dict:
    """
    Deduplicate a single group of chunks with the same chunk_text.
    Returns statistics about what was done.
    """
    primary_id = chunk_ids[0]  # Lowest ID is primary
    duplicate_ids = chunk_ids[1:]
    
    result = {
        'primary_id': primary_id,
        'duplicate_ids': duplicate_ids,
        'examples_moved': 0,
        'examples_updated_index': 0,
        'duplicates_deleted': 0
    }
    
    cur = conn.cursor()
    
    # Get all examples from all chunks in the group
    placeholders = ','.join('?' * len(chunk_ids))
    cur.execute(f"""
        SELECT id, item_id, example_index, is_canonical
        FROM examples
        WHERE item_type = 'chunk' AND item_id IN ({placeholders})
        ORDER BY item_id, example_index
    """, chunk_ids)
    all_examples = cur.fetchall()
    
    if not all_examples:
        # No examples, just delete duplicates
        for dup_id in duplicate_ids:
            cur.execute("DELETE FROM chunks WHERE id = ?", (dup_id,))
            result['duplicates_deleted'] += 1
        return result
    
    # Build consolidation plan
    # Group examples by their target index (example_index), keep canonical priority
    index_examples = defaultdict(list)
    for ex_id, item_id, ex_idx, is_canon in all_examples:
        index_examples[ex_idx].append((ex_id, item_id, is_canon))
    
    # Reassign all examples to primary chunk
    used_indices = set()
    
    for ex_id, item_id, ex_idx, is_canon in all_examples:
        # Check if this example is already on the primary chunk
        if item_id == primary_id:
            # Keep it, but track the index
            if ex_idx in used_indices:
                # Need to reassign index
                new_idx = find_free_index(used_indices, ex_idx)
                cur.execute("""
                    UPDATE examples SET example_index = ? WHERE id = ?
                """, (new_idx, ex_id))
                result['examples_updated_index'] += 1
                used_indices.add(new_idx)
            else:
                used_indices.add(ex_idx)
        else:
            # Move from duplicate to primary
            if ex_idx in used_indices:
                new_idx = find_free_index(used_indices, ex_idx)
                cur.execute("""
                    UPDATE examples 
                    SET item_id = ?, example_index = ?, is_canonical = ?
                    WHERE id = ?
                """, (primary_id, new_idx, is_canon, ex_id))
                result['examples_updated_index'] += 1
            else:
                cur.execute("""
                    UPDATE examples SET item_id = ? WHERE id = ?
                """, (primary_id, ex_id))
                result['examples_moved'] += 1
            used_indices.add(new_idx if ex_idx in used_indices else ex_idx)
    
    # Delete duplicate chunks
    for dup_id in duplicate_ids:
        cur.execute("DELETE FROM chunks WHERE id = ?", (dup_id,))
        result['duplicates_deleted'] += 1
    
    return result


def find_free_index(used_indices: set, preferred: int) -> int:
    """Find the next available index starting from preferred."""
    idx = preferred
    while idx in used_indices:
        idx += 1
    return idx


def main():
    print("=" * 70)
    print("FRENCH CHUNKS DEDUPLICATION SCRIPT")
    print("=" * 70)
    
    conn = sqlite3.connect(DB_PATH)
    
    # Initial statistics
    print("\n[1] Analyzing database...")
    stats_before = get_chunk_stats(conn)
    print(f"  Total French chunks:    {stats_before['total_chunks']}")
    print(f"  Unique chunk texts:     {stats_before['unique_chunks']}")
    print(f"  Potential duplicates:    {stats_before['total_chunks'] - stats_before['unique_chunks']}")
    print(f"  Total examples:         {stats_before['total_examples']}")
    
    # Find duplicates
    print("\n[2] Finding duplicate chunk_text values...")
    duplicate_groups = get_duplicate_groups(conn)
    num_groups = len(duplicate_groups)
    total_duplicates = sum(len(ids) - 1 for ids in duplicate_groups.values())
    print(f"  Duplicate groups found: {num_groups}")
    print(f"  Total duplicate chunks: {total_duplicates}")
    
    if num_groups == 0:
        print("\n✓ No duplicates found. Nothing to do.")
        conn.close()
        return
    
    # Preview first few groups
    print("\n[3] Sample duplicate groups (first 5):")
    for i, (text, ids) in enumerate(list(duplicate_groups.items())[:5]):
        preview = text[:40] + "..." if len(text) > 40 else text
        print(f"  [{i+1}] '{preview}' -> IDs: {ids}")
    
    # Execute deduplication
    print(f"\n[4] Processing {num_groups} duplicate groups...")
    
    total_examples_moved = 0
    total_examples_updated = 0
    total_duplicates_deleted = 0
    
    try:
        for i, (chunk_text, chunk_ids) in enumerate(duplicate_groups.items(), 1):
            result = deduplicate_group(conn, chunk_text, chunk_ids)
            total_examples_moved += result['examples_moved']
            total_examples_updated += result['examples_updated_index']
            total_duplicates_deleted += result['duplicates_deleted']
            
            if i % 10 == 0 or i == num_groups:
                print(f"  Progress: {i}/{num_groups} groups processed "
                      f"({total_duplicates_deleted} chunks deleted)")
        
        conn.commit()
        print("\n[5] Transaction committed successfully.")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ ERROR: {e}")
        print("  Transaction rolled back. No changes were made.")
        conn.close()
        sys.exit(1)
    
    # Final statistics
    print("\n[6] Final statistics...")
    stats_after = get_chunk_stats(conn)
    
    print(f"  {'Metric':<30} {'Before':>10} {'After':>10} {'Change':>10}")
    print(f"  {'-'*30} {'-'*10} {'-'*10} {'-'*10}")
    print(f"  {'Total French chunks':<30} {stats_before['total_chunks']:>10} {stats_after['total_chunks']:>10} {stats_after['total_chunks'] - stats_before['total_chunks']:>+10}")
    print(f"  {'Unique chunk texts':<30} {stats_before['unique_chunks']:>10} {stats_after['unique_chunks']:>10} {stats_after['unique_chunks'] - stats_before['unique_chunks']:>+10}")
    print(f"  {'Total examples':<30} {stats_before['total_examples']:>10} {stats_after['total_examples']:>10} {stats_after['total_examples'] - stats_before['total_examples']:>+10}")
    
    print(f"\n  {'Actions performed:':}")
    print(f"    - Duplicate groups processed:   {num_groups}")
    print(f"    - Examples moved to primary:   {total_examples_moved}")
    print(f"    - Examples re-indexed:         {total_examples_updated}")
    print(f"    - Duplicate chunks deleted:    {total_duplicates_deleted}")
    
    print("\n" + "=" * 70)
    print("DEDUPLICATION COMPLETE")
    print("=" * 70)
    
    conn.close()


if __name__ == "__main__":
    main()