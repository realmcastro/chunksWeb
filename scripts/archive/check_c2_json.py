#!/usr/bin/env py
import json
from pathlib import Path
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

fr = Path('scripts/fr')
c2_files = sorted(fr.glob('french_vocab_c2_*.json'))

total = 0
missing_pos = 0
for f in c2_files:
    data = json.load(open(f, encoding='utf-8'))
    total += len(data)
    for w in data:
        if not w.get('part_of_speech'):
            missing_pos += 1

print(f'Total C2 words in JSON: {total}')
print(f'C2 words without part_of_speech in JSON: {missing_pos}')