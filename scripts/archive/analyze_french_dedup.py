import sqlite3

conn = sqlite3.connect('chunks_v1.db')
cursor = conn.cursor()

print("=" * 60)
print("FRENCH CHUNKS DEDUPLICATION STATISTICS")
print("=" * 60)

# 1. Total count of French chunks
cursor.execute("SELECT COUNT(*) FROM chunks WHERE source_file LIKE 'french_chunks%'")
total_chunks = cursor.fetchone()[0]
print(f"\n1. Total French chunks: {total_chunks}")

# 2. Count of unique chunk_text values
cursor.execute("SELECT COUNT(DISTINCT chunk_text) FROM chunks WHERE source_file LIKE 'french_chunks%'")
unique_chunks = cursor.fetchone()[0]
print(f"2. Unique chunk_text values: {unique_chunks}")
print(f"   Duplicate ratio: {(total_chunks - unique_chunks)} chunks are duplicates")

# 3. Top 20 most duplicated chunk_text values
print("\n3. Top 20 most duplicated chunk_text values:")
print("-" * 40)
cursor.execute("""
    SELECT chunk_text, COUNT(*) as cnt 
    FROM chunks 
    WHERE source_file LIKE 'french_chunks%' 
    GROUP BY chunk_text 
    HAVING cnt > 1 
    ORDER BY cnt DESC 
    LIMIT 20
""")
results = cursor.fetchall()
for i, (text, count) in enumerate(results, 1):
    display_text = text[:50] + "..." if len(text) > 50 else text
    print(f"   {i:2d}. Count: {count:3d} | Text: {display_text}")

# 4. Analysis of chunks with duplicates - which have examples linked
print("\n4. Duplicate chunks - examples linked status:")
print("-" * 40)

# Get all chunk_text values that appear more than once
cursor.execute("""
    SELECT chunk_text, COUNT(*) as cnt 
    FROM chunks 
    WHERE source_file LIKE 'french_chunks%' 
    GROUP BY chunk_text 
    HAVING cnt > 1
""")
duplicate_texts = cursor.fetchall()

with_examples = []
without_examples = []

for text, count in duplicate_texts:
    # Get the IDs of chunks with this text
    cursor.execute("""
        SELECT c.id, 
               (SELECT COUNT(*) FROM examples e WHERE e.item_id = c.id AND e.item_type = 'chunk') as ex_count
        FROM chunks c
        WHERE c.chunk_text = ? AND c.source_file LIKE 'french_chunks%'
    """, (text,))
    chunk_ids = cursor.fetchall()
    
    has_linked_examples = any(ex_count > 0 for _, ex_count in chunk_ids)
    
    if has_linked_examples:
        with_examples.append((text, count, [cid for cid, _ in chunk_ids]))
    else:
        without_examples.append((text, count, [cid for cid, _ in chunk_ids]))

print(f"   Chunks WITH linked examples: {len(with_examples)}")
print(f"   Chunks WITHOUT linked examples: {len(without_examples)}")

print("\n   --- Chunks WITH examples linked ---")
for text, count, ids in with_examples[:10]:
    display_text = text[:40] + "..." if len(text) > 40 else text
    print(f"   Text: {display_text} | Count: {count} | IDs: {ids}")

print("\n   --- Chunks WITHOUT examples linked ---")
for text, count, ids in without_examples[:10]:
    display_text = text[:40] + "..." if len(text) > 40 else text
    print(f"   Text: {display_text} | Count: {count} | IDs: {ids}")

# 5. Count examples for French chunks (item_type='chunk')
cursor.execute("""
    SELECT COUNT(*) 
    FROM examples e
    JOIN chunks c ON e.item_id = c.id
    WHERE e.item_type = 'chunk' AND c.source_file LIKE 'french_chunks%'
""")
french_chunk_examples = cursor.fetchone()[0]
print(f"\n5. Examples linked to French chunks (item_type='chunk'): {french_chunk_examples}")

# Check distinct chunk IDs that have examples
cursor.execute("""
    SELECT COUNT(DISTINCT e.item_id)
    FROM examples e
    JOIN chunks c ON e.item_id = c.id
    WHERE e.item_type = 'chunk' AND c.source_file LIKE 'french_chunks%'
""")
chunks_with_examples = cursor.fetchone()[0]
print(f"   Unique chunk IDs with examples: {chunks_with_examples}")

# 6. User progress for French chunks
cursor.execute("""
    SELECT COUNT(*) 
    FROM user_progress up
    JOIN chunks c ON up.chunk_id = c.id
    WHERE c.source_file LIKE 'french_chunks%'
""")
french_chunk_progress = cursor.fetchone()[0]
print(f"\n6. User progress records for French chunks: {french_chunk_progress}")

# Distinct chunk IDs with progress
cursor.execute("""
    SELECT COUNT(DISTINCT up.chunk_id)
    FROM user_progress up
    JOIN chunks c ON up.chunk_id = c.id
    WHERE c.source_file LIKE 'french_chunks%'
""")
chunks_with_progress = cursor.fetchone()[0]
print(f"   Unique chunk IDs with progress: {chunks_with_progress}")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Total French chunks: {total_chunks}")
print(f"Unique chunk_text values: {unique_chunks}")
print(f"Duplicate groups: {len(duplicate_texts)}")
print(f"Chairs needing dedup: {len(without_examples)} (no examples)")
print(f"  and: {len(with_examples)} (with examples)")

conn.close()