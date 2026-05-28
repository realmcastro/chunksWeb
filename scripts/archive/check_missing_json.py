#!/usr/bin/env py
"""Check which fields are missing in French vocabulary JSON files."""
import json
from pathlib import Path
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

fr = Path('scripts/fr')
all_files = sorted(fr.glob('french_vocab_*.json'))

# Required fields for proper import
required_fields = ['word', 'part_of_speech', 'cefr_level', 'category', 'primary_meaning']

# Check missing fields by CEFR level
cefr_missing = {}
for f in all_files:
    cefr = 'unknown'
    for level in ['c2', 'c1', 'b2', 'b1', 'a2', 'a1']:
        if level in f.name.lower():
            cefr = level.upper()
            break
    
    data = json.load(open(f, encoding='utf-8'))
    for w in data:
        key = cefr
        if key not in cefr_missing:
            cefr_missing[key] = {field: 0 for field in required_fields}
            cefr_missing[key]['total'] = 0
        
        cefr_missing[key]['total'] += 1
        for field in required_fields:
            if not w.get(field):
                cefr_missing[key][field] += 1

print("Missing fields by CEFR level:")
for cefr in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
    if cefr in cefr_missing:
        d = cefr_missing[cefr]
        print(f"\n{cefr}: {d['total']} words")
        for field in required_fields:
            if d[field] > 0:
                print(f"  missing {field}: {d[field]}")