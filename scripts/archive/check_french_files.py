import json
import os
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

os.chdir(r'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr')

# Check vocabulary files
print('=== VOCABULARY FILES ===')
vocab_files = sorted([f for f in os.listdir('.') if 'vocab' in f and f.endswith('.json')])
for f in vocab_files:
    with open(f, 'r', encoding='utf-8') as fh:
        d = json.load(fh)
    has_freq = all('frequency' in item for item in d)
    levels = set(item.get('cefr_level', '?') for item in d)
    status = 'OK' if has_freq else 'MISSING'
    print(f'{f}: freq={status}, levels={levels}')

print()
print('=== CHUNKS FILES ===')
chunks_files = sorted([f for f in os.listdir('.') if 'chunks' in f and f.endswith('.json')])
for f in chunks_files:
    with open(f, 'r', encoding='utf-8') as fh:
        d = json.load(fh)
    has_level = all('level' in item for item in d)
    has_pattern = any('pattern' in item for item in d)
    has_patterns = any('patterns' in item for item in d)
    has_collocates = any('typical_collocates' in item for item in d)
    has_coll = any('collocates' in item for item in d)
    levels = set(item.get('level', item.get('cefr_level', '?')) for item in d)
    level_status = 'OK' if has_level else 'MISSING'
    print(f'{f}: level={level_status}, pattern={has_pattern}, patterns={has_patterns}, typical_collocates={has_collocates}, collocates={has_coll}, levels={levels}')

print()
print('=== GRAMMAR FILES ===')
grammar_files = sorted([f for f in os.listdir('.') if 'grammar' in f and f.endswith('.json')])
for f in grammar_files:
    with open(f, 'r', encoding='utf-8') as fh:
        d = json.load(fh)
    has_level = all('level' in item for item in d)
    status = 'OK' if has_level else 'MISSING'
    print(f'{f}: level={status}, count={len(d)}')