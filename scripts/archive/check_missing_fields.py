#!/usr/bin/env py
"""
Check for records with missing or null required fields.
Checks vocabulary_words, chunks, and grammar_structures tables.
"""
import sqlite3
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

DB_PATH = "chunks_v1.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

def check_vocabulary():
    print("=== vocabulary_words CHECK ===")
    
    # Check essential fields
    essential_fields = ['word', 'primary_meaning']
    nullable_fields = ['phonetic', 'part_of_speech', 'cefr_level', 'category', 'subcategory',
                      'secondary_meaning', 'usage_notes', 'article', 'plural_form', 'countability',
                      'regional_variant', 'frequency_rank', 'common_collocations', 'synonyms',
                      'antonyms', 'image_search_query', 'image_context', 'image_tags',
                      'example_1', 'example_1_translation', 'example_2', 'example_2_translation',
                      'example_3', 'example_3_translation', 'pronunciation_tips', 'memory_hook',
                      'related_words', 'common_mistakes', 'learning_priority']
    
    for field in essential_fields:
        cur.execute(f'SELECT COUNT(*) FROM vocabulary_words WHERE {field} IS NULL OR {field} = ""')
        count = cur.fetchone()[0]
        if count > 0:
            print(f"  NULL/empty {field}: {count}")
            # Show sample
            cur.execute(f'SELECT id, word, {field} FROM vocabulary_words WHERE {field} IS NULL OR {field} = "" LIMIT 3')
            for row in cur.fetchall():
                print(f"    id={row[0]}, word={row[1]}, {field}={row[2]}")

def check_chunks():
    print("\n=== chunks CHECK ===")
    
    essential_fields = ['chunk_text', 'meaning']
    nullable_fields = ['primary_function', 'communicative_purpose', 'trigger_situations', 'contexts',
                       'register_id', 'cefr_level_id', 'output_priority', 'frequency', 'formulaicity',
                       'construction_type', 'acquisition_priority', 'pattern', 'core_structure',
                       'substitution_slots', 'typical_collocates', 'common_substitutions', 'variations',
                       'common_mistakes', 'similar_contrasting', 'interference_warnings', 'nuance',
                       'pragmatic_effect', 'note', 'recall_cue', 'spacing_tag', 'upgrade_path',
                       'chunk_family', 'slug', 'content_hash', 'display_order', 'is_idiom', 'language']
    
    for field in essential_fields:
        cur.execute(f'SELECT COUNT(*) FROM chunks WHERE {field} IS NULL OR {field} = ""')
        count = cur.fetchone()[0]
        if count > 0:
            print(f"  NULL/empty {field}: {count}")
            cur.execute(f'SELECT id, chunk_text, {field} FROM chunks WHERE {field} IS NULL OR {field} = "" LIMIT 3')
            for row in cur.fetchall():
                print(f"    id={row[0]}, text={row[1][:40]}, {field}={row[2]}")

def check_grammar():
    print("\n=== grammar_structures CHECK ===")
    
    essential_fields = ['structure_label', 'core_meaning']
    nullable_fields = ['primary_communicative_fn', 'when_to_use', 'pattern', 'key_variations',
                       'essential_vocabulary_slots', 'common_learner_mistakes', 'chunk_compatibility',
                       'primary_function', 'key_forms', 'essential_vocabulary', 'why_it_matters',
                       'common_mistakes', 'slug', 'content_hash', 'display_order', 'language']
    
    for field in essential_fields:
        cur.execute(f'SELECT COUNT(*) FROM grammar_structures WHERE {field} IS NULL OR {field} = ""')
        count = cur.fetchone()[0]
        if count > 0:
            print(f"  NULL/empty {field}: {count}")
            cur.execute(f'SELECT id, structure_label, {field} FROM grammar_structures WHERE {field} IS NULL OR {field} = "" LIMIT 3')
            for row in cur.fetchall():
                print(f"    id={row[0]}, label={row[1][:40]}, {field}={row[2]}")

check_vocabulary()
check_chunks()
check_grammar()

conn.close()
print("\n=== DONE ===")