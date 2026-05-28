#!/usr/bin/env python3
"""
Fix French chunks by adding English translations to example fields.

CRITICAL: French chunks have example_1/2/3 but MISSING example_1_translation/2_translation/3_translation.
This script adds the missing translation fields by translating French examples to English.

Target: scripts/fr/french_chunks_batch*.json (57+ batches, 855+ chunks)
"""

import json
import re
import sys
import time
from pathlib import Path
from typing import Optional

# Fix stdout encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Try to use deep-translator for accurate translations
try:
    from deep_translator import GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    print("Warning: deep-translator not available. Install with: pip install deep-translator")


def translate_text(text: str, max_retries: int = 3) -> Optional[str]:
    """
    Translate French text to English.
    
    ! Handles empty/short text, retries on failure.
    ? Uses Google Translate via deep-translator or falls back to pattern matching.
    """
    if not text or len(text.strip()) < 2:
        return text
    
    # Skip if it's just a pattern breakdown like "à + tout + à + l'heure"
    if re.match(r'^[\w\s\+\-]+$', text) and '+' in text:
        return text
    
    if not TRANSLATOR_AVAILABLE:
        return None
    
    for attempt in range(max_retries):
        try:
            result = GoogleTranslator(source='french', target='english').translate(text)
            if result and result != text:
                return result
            time.sleep(0.3)  # Rate limit
        except Exception as e:
            print(f"  Translation attempt {attempt + 1} failed: {e}")
            time.sleep(1)
    
    return None


def fix_chunk_examples(chunk: dict) -> dict:
    """
    Add English translations to French example fields.
    
    ! Modifies chunk in-place, returns same dict with new translation fields.
    ? Only adds translations for examples that exist and are not already translated.
    """
    translations_added = 0
    
    for i in [1, 2, 3]:
        example_key = f"example_{i}"
        translation_key = f"example_{i}_translation"
        
        # Skip if example doesn't exist or translation already present
        if example_key not in chunk:
            continue
        if translation_key in chunk:
            continue
        
        example_text = chunk[example_key]
        
        # Translate the example
        translation = translate_text(example_text)
        
        if translation:
            chunk[translation_key] = translation
            translations_added += 1
            safe_preview = translation[:50].encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            print(f"    {example_key} -> {safe_preview}...")
        else:
            safe_text = example_text[:40].encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            print(f"    {example_key} -> FAILED (text: {safe_text}...)")
    
    return chunk, translations_added


def process_batch_file(filepath: Path) -> tuple[int, int]:
    """
    Process a single batch file, adding translations to all chunks.
    
    Returns: (chunks_processed, translations_added)
    """
    print(f"\nProcessing: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    total_chunks = len(chunks)
    total_translations = 0
    
    for idx, chunk in enumerate(chunks):
        _, translations = fix_chunk_examples(chunk)
        total_translations += translations
        
        if (idx + 1) % 5 == 0:
            print(f"  Processed {idx + 1}/{total_chunks} chunks...")
    
    # Save the updated file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    
    print(f"  [OK] {total_chunks} chunks, {total_translations} translations added")
    return total_chunks, total_translations


def get_chunk_files() -> list[Path]:
    """Get all French chunk batch files sorted by batch number."""
    base_dir = Path("scripts/fr")
    files = list(base_dir.glob("french_chunks_batch*.json"))
    
    # Sort by batch number
    def get_batch_num(f: Path) -> int:
        match = re.search(r'batch(\d+)', f.name)
        return int(match.group(1)) if match else 0
    
    return sorted(files, key=get_batch_num)


def main():
    print("=" * 70)
    print("FRENCH CHUNKS TRANSLATION FIXER")
    print("Adding example_1_translation, example_2_translation, example_3_translation")
    print("=" * 70)
    
    if not TRANSLATOR_AVAILABLE:
        print("\nERROR: deep-translator library required!")
        print("Install with: pip install deep-translator")
        return
    
    files = get_chunk_files()
    print(f"\nFound {len(files)} batch files to process\n")
    
    grand_total_chunks = 0
    grand_total_translations = 0
    
    for filepath in files:
        chunks, translations = process_batch_file(filepath)
        grand_total_chunks += chunks
        grand_total_translations += translations
        
        # Rate limit between files
        time.sleep(0.5)
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Files processed:    {len(files)}")
    print(f"Chunks fixed:       {grand_total_chunks}")
    print(f"Translations added: {grand_total_translations}")
    print("=" * 70)


if __name__ == "__main__":
    main()