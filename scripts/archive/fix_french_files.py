import json
import os
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

os.chdir(r'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr')

# Mapping for frequency based on CEFR level
def cefr_to_frequency(cefr_level):
    if cefr_level in ('A1', 'A2'):
        return 'high'
    elif cefr_level in ('B1', 'B2'):
        return 'medium'
    else:  # C1, C2
        return 'low'

# ==============================================================================
# FIX VOCABULARY FILES - Add frequency field
# ==============================================================================
print('=== FIXING VOCABULARY FILES ===')
vocab_files = sorted([f for f in os.listdir('.') if 'vocab' in f and f.endswith('.json')])

for f in vocab_files:
    with open(f, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    
    if all('frequency' in item for item in data):
        print(f'{f}: already has frequency, skipping')
        continue
    
    modified = False
    for item in data:
        if 'frequency' not in item:
            cefr = item.get('cefr_level', '')
            item['frequency'] = cefr_to_frequency(cefr)
            modified = True
    
    if modified:
        with open(f, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        print(f'{f}: added frequency field')
    else:
        print(f'{f}: no changes needed')

# ==============================================================================
# FIX CHUNKS FILES 1-10 - Add level, rename fields
# ==============================================================================
print()
print('=== FIXING CHUNKS FILES 1-10 ===')
# First, determine level for batches 1-10 by analyzing content
# Based on manual inspection:
# Batch 1: A1 (basic greetings, common phrases)
# Batch 2: A1-A2 (simple everyday)
# Batch 3: A2 (more complex everyday)
# Batch 4: A2 (intermediate)
# Batch 5: A2-B1
# Batch 6: B1
# Batch 7: B1
# Batch 8: B1-B2
# Batch 9: B1-B2
# Batch 10: B2

batch_levels = {
    '1': 'A1',
    '2': 'A2', 
    '3': 'A2',
    '4': 'A2',
    '5': 'A2',
    '6': 'B1',
    '7': 'B1',
    '8': 'B1',
    '9': 'B1',
    '10': 'B2'
}

for batch_num in range(1, 11):
    fname = f'french_chunks_batch{batch_num}.json'
    if not os.path.exists(fname):
        print(f'{fname}: not found')
        continue
    
    with open(fname, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    
    if all('level' in item for item in data):
        print(f'{fname}: already has level, skipping')
        continue
    
    level = batch_levels.get(str(batch_num), 'A1')
    modified = False
    
    for item in data:
        # Add level if missing
        if 'level' not in item:
            item['level'] = level
            modified = True
        
        # Rename pattern to patterns (if it's a string, convert to list)
        if 'pattern' in item:
            old_pattern = item['pattern']
            if isinstance(old_pattern, str):
                item['patterns'] = [old_pattern]
            else:
                item['patterns'] = old_pattern
            del item['pattern']
            modified = True
        
        # Rename typical_collocates to collocates
        if 'typical_collocates' in item:
            item['collocates'] = item['typical_collocates']
            del item['typical_collocates']
            modified = True
    
    if modified:
        with open(fname, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        print(f'{fname}: added level={level}, renamed pattern->patterns, typical_collocates->collocates')
    else:
        print(f'{fname}: no changes needed')

# ==============================================================================
# FIX GRAMMAR FILES 1-7 - Add level field
# ==============================================================================
print()
print('=== FIXING GRAMMAR FILES 1-7 ===')
# Grammar batches level mapping based on content complexity
grammar_batch_levels = {
    '1': 'A1',  # Basic present tense conjugations
    '2': 'A1',  # Basic pronouns, question formation
    '3': 'A2',  # More complex tenses
    '4': 'A2',  
    '5': 'B1',  # Subjunctive introduction
    '6': 'B1',  
    '7': 'B1',  
}

for batch_num in range(1, 8):
    fname = f'french_grammar_batch{batch_num}.json'
    if not os.path.exists(fname):
        print(f'{fname}: not found')
        continue
    
    with open(fname, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    
    if all('level' in item for item in data):
        print(f'{fname}: already has level, skipping')
        continue
    
    level = grammar_batch_levels.get(str(batch_num), 'A1')
    modified = False
    
    for item in data:
        if 'level' not in item:
            item['level'] = level
            modified = True
    
    if modified:
        with open(fname, 'w', encoding='utf-8') as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        print(f'{fname}: added level={level}')
    else:
        print(f'{fname}: no changes needed')

print()
print('=== ALL FIXES COMPLETE ===')