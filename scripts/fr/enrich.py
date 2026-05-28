#!/usr/bin/env python3
"""Enrich French chunk JSON files to match English reference schema."""

import json
import os
import shutil
from pathlib import Path


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def enrich_chunk(chunk):
    """Add missing fields to French chunk using sensible defaults."""
    enriched = {
        'chunk_text': chunk.get('chunk_text', ''),
        'meaning': chunk.get('meaning', ''),
        'primary_function': chunk.get('primary_function', 'Phrase'),
        'communicative_purpose': chunk.get('communicative_purpose', ''),
        'trigger_situations': chunk.get('trigger_situations', 'Daily conversation'),
        'contexts': chunk.get('contexts', 'Everyday use'),
        'output_priority': 'Both',
        'frequency': chunk.get('frequency', 'High'),
        'formulaicity': 'Semi-fixed',
        'construction_type': 'Phrase',
        'acquisition_priority': 'Recognition first',
        'pattern': chunk.get('patterns', [''])[0] if chunk.get('patterns') else '',
        'core_structure': chunk.get('chunk_text', ''),
        'substitution_slots': 'Variable based on context',
        'typical_collocates': ', '.join(chunk.get('collocates', [])[:5]) if chunk.get('collocates') else '',
        'common_substitutions': '',
        'variations': '',
        'common_mistakes': '',
        'similar_contrasting': '',
        'interference_warnings': '',
        'nuance': '',
        'pragmatic_effect': chunk.get('communicative_purpose', ''),
        'recall_cue': chunk.get('communicative_purpose', ''),
        'spacing_tag': 'Short-term',
        'upgrade_path': '',
        'chunk_family': chunk.get('chunk_text', ''),
        'is_idiom': 0,
        'level': chunk.get('level', 'A1'),
        'example_1': chunk.get('example_1', '').replace('Je connais ', '').replace('On utilise ', ''),
        'example_2': chunk.get('example_2', '').replace('On utilise ', ''),
        'example_3': chunk.get('example_3', '').replace('Je connais ', '').replace('On utilise ', ''),
        'example_1_translation': chunk.get('example_1_translation', ''),
        'example_2_translation': chunk.get('example_2_translation', ''),
        'example_3_translation': chunk.get('example_3_translation', '')
    }
    return enriched


def process_file(input_path):
    """Process a single French chunk file."""
    # Create backup
    backup_path = str(input_path) + '.bak'
    if not os.path.exists(backup_path):
        shutil.copy2(input_path, backup_path)
        print(f"Backed up to {backup_path}")

    # Load and enrich
    chunks = load_json(input_path)
    enriched_chunks = [enrich_chunk(chunk) for chunk in chunks]

    # Write back
    with open(input_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_chunks, f, indent=2, ensure_ascii=False)

    print(f"Enriched {input_path}: {len(enriched_chunks)} chunks")


# Process target files
batches = [26, 27, 28, 29, 30]
base_dir = Path('C:/Users/mathe/OneDrive/Documentos/ChunksWeb/scripts/fr')

for batch_num in batches:
    file_path = base_dir / f'french_chunks_batch{batch_num}.json'
    if file_path.exists():
        process_file(file_path)
    else:
        print(f"File not found: {file_path}")

print("\nDone!")
