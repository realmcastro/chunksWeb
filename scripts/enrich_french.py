#!/usr/bin/env python3
import json
import os
from pathlib import Path

def get_article(word, pos):
    """Extract French article from word if included."""
    articles = ['le', 'la', 'l\'', 'les']
    for art in articles:
        if word.lower().startswith(art + ' '):
            return art
    if pos != 'noun':
        return ''
    return ''

def map_frequency_to_rank(freq_str):
    """Map frequency string to rank number."""
    if freq_str == 'high':
        return 250  # Middle of 1-500
    elif freq_str == 'medium':
        return 1250  # Middle of 500-2000
    elif freq_str == 'low':
        return 3500  # Middle of 2000-5000
    else:
        return 2500  # Default

def get_countability(pos):
    """Infer countability from part of speech."""
    if pos == 'noun':
        return 'C'  # Assume countable unless marked otherwise
    return ''

def enrich_entry(entry):
    """Enrich a single vocabulary entry."""
    enriched = {}

    # Define the full schema
    schema = [
        'word', 'phonetic', 'part_of_speech', 'cefr_level', 'category',
        'subcategory', 'article', 'plural_form', 'countability',
        'regional_variant', 'frequency_rank', 'primary_meaning',
        'secondary_meaning', 'usage_notes', 'common_collocations',
        'synonyms', 'antonyms', 'image_search_query', 'image_context',
        'image_tags', 'example_1', 'example_1_translation', 'example_2',
        'example_2_translation', 'example_3', 'example_3_translation',
        'pronunciation_tips', 'memory_hook', 'related_words',
        'common_mistakes', 'learning_priority'
    ]

    for field in schema:
        if field in entry:
            # Preserve existing value
            enriched[field] = entry[field]
        else:
            # Fill missing field
            if field == 'subcategory':
                enriched[field] = entry.get('category', '')
            elif field == 'article':
                enriched[field] = get_article(entry.get('word', ''), entry.get('part_of_speech', ''))
            elif field == 'plural_form':
                enriched[field] = ''
            elif field == 'countability':
                enriched[field] = get_countability(entry.get('part_of_speech', ''))
            elif field == 'regional_variant':
                enriched[field] = 'Both'
            elif field == 'frequency_rank':
                freq = entry.get('frequency', '')
                enriched[field] = map_frequency_to_rank(freq)
            elif field == 'secondary_meaning':
                enriched[field] = ''
            elif field == 'usage_notes':
                enriched[field] = ''
            elif field == 'common_collocations':
                enriched[field] = ''
            elif field == 'synonyms':
                enriched[field] = ''
            elif field == 'antonyms':
                enriched[field] = ''
            elif field == 'example_3':
                enriched[field] = ''
            elif field == 'example_3_translation':
                enriched[field] = ''
            elif field == 'pronunciation_tips':
                enriched[field] = ''
            elif field == 'memory_hook':
                enriched[field] = ''
            elif field == 'related_words':
                enriched[field] = ''
            elif field == 'common_mistakes':
                enriched[field] = ''
            elif field == 'learning_priority':
                enriched[field] = 'high'
            else:
                enriched[field] = entry.get(field, '')

    return enriched

def process_file(filepath):
    """Process a single French vocabulary file."""
    # Create backup
    backup_path = filepath + '.bak'
    if not os.path.exists(backup_path):
        with open(filepath, 'r', encoding='utf-8') as f:
            backup_content = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(backup_content)

    # Read and enrich
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    enriched_data = [enrich_entry(entry) for entry in data]

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(enriched_data, f, ensure_ascii=False, indent=2)

    return len(enriched_data)

# Process all three files
files = [
    'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_a1_batch3.json',
    'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_a1_batch4.json',
    'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_a1_batch5.json',
]

total = 0
for fp in files:
    count = process_file(fp)
    total += count
    print(f"{Path(fp).name}: {count} entries enriched")

print(f"\nTotal: {total} entries processed. All files enriched successfully.")
