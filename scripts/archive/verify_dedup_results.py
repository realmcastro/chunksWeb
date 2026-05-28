import sqlite3

conn = sqlite3.connect('chunks_v1.db')
cursor = conn.cursor()

print("=== DEDUPLICATION VERIFICATION REPORT ===\n")

# 1. Count of French chunks
cursor.execute("SELECT COUNT(*) FROM chunks WHERE language = 'fr';")
french_chunks_count = cursor.fetchone()[0]
print(f"1. French chunks count: {french_chunks_count}")
print(f"   Expected: 889")
print(f"   Status: {'✓ PASS' if french_chunks_count == 889 else '✗ FAIL'}\n")

# 2. Count of unique chunk_text among French chunks
cursor.execute("SELECT COUNT(DISTINCT chunk_text) FROM chunks WHERE language = 'fr';")
unique_text_count = cursor.fetchone()[0]
print(f"2. Unique chunk_text among French chunks: {unique_text_count}")
print(f"   Expected: 889")
print(f"   Status: {'✓ PASS' if unique_text_count == 889 else '✗ FAIL'}\n")

# 3. Count of examples linked to French chunks
cursor.execute("""
    SELECT COUNT(*) FROM examples 
    WHERE chunk_id IN (SELECT id FROM chunks WHERE language = 'fr');
""")
examples_count = cursor.fetchone()[0]
print(f"3. Examples linked to French chunks: {examples_count}")
print(f"   Expected: 2,808")
print(f"   Status: {'✓ PASS' if examples_count == 2808 else '✗ FAIL'}\n")

# 4. Count of unique chunk IDs that have examples
cursor.execute("""
    SELECT COUNT(DISTINCT chunk_id) FROM examples 
    WHERE chunk_id IN (SELECT id FROM chunks WHERE language = 'fr');
""")
unique_chunk_ids = cursor.fetchone()[0]
print(f"4. Unique chunk IDs with examples: {unique_chunk_ids}")
print(f"   (No specific expected value, informational)\n")

# 5. Orphaned examples (examples pointing to non-existent chunks)
cursor.execute("""
    SELECT COUNT(*) FROM examples 
    WHERE chunk_id NOT IN (SELECT id FROM chunks);
""")
orphaned_count = cursor.fetchone()[0]
print(f"5. Orphaned examples (invalid chunk_id references): {orphaned_count}")
print(f"   Expected: 0")
print(f"   Status: {'✓ PASS' if orphaned_count == 0 else '✗ FAIL'}\n")

# Additional: Check if all French chunks have unique text
cursor.execute("""
    SELECT chunk_text, COUNT(*) as cnt 
    FROM chunks 
    WHERE language = 'fr' 
    GROUP BY chunk_text 
    HAVING cnt > 1;
""")
duplicates = cursor.fetchall()
print(f"=== ADDITIONAL INFO ===\n")
print(f"French chunks with duplicate text: {len(duplicates)}")
if duplicates:
    for text, count in duplicates[:5]:  # Show first 5
        print(f"  - '{text}': {count} occurrences")
else:
    print("  None (all French chunk_text values are unique)\n")

# Summary
print("=== SUMMARY ===")
all_pass = (
    french_chunks_count == 889 and 
    unique_text_count == 889 and 
    examples_count == 2808 and 
    orphaned_count == 0
)
print(f"All checks passed: {'✓ YES' if all_pass else '✗ NO'}")

conn.close()