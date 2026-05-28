# Enrich French chunk JSON files to match English reference schema
# Schema: chunk_text, meaning, primary_function, communicative_purpose, trigger_situations, contexts,
# output_priority, frequency, formulaicity, construction_type, acquisition_priority,
# pattern, core_structure, substitution_slots, typical_collocates, common_substitutions,
# variations, common_mistakes, similar_contrasting, interference_warnings, nuance,
# pragmatic_effect, recall_cue, spacing_tag, upgrade_path, chunk_family, is_idiom,
# level, example_1, example_2, example_3, example_1_translation, example_2_translation, example_3_translation

$frenchFiles = @(
    'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch21.json',
    'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch22.json',
    'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch23.json',
    'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch24.json',
    'C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch25.json'
)

function Enrich-Chunk {
    param([hashtable]$chunk)

    # Map old field names to new ones
    if ($chunk.Contains('collocates')) {
        $chunk['typical_collocates'] = $chunk['collocates']
        $chunk.Remove('collocates')
    }

    if ($chunk.Contains('patterns')) {
        $chunk.Remove('patterns')
    }

    # Set defaults for missing fields
    $defaults = @{
        'output_priority' = 'Both'
        'frequency' = if ($chunk['level'] -eq 'A1' -or $chunk['level'] -eq 'A2') { 'High' } else { 'Medium' }
        'formulaicity' = 'Semi-fixed'
        'construction_type' = 'Phrase'
        'acquisition_priority' = 'Automatic production'
        'pattern' = $chunk['chunk_text']
        'core_structure' = $chunk['chunk_text']
        'substitution_slots' = 'Variable depending on context'
        'common_substitutions' = ''
        'variations' = ''
        'common_mistakes' = ''
        'similar_contrasting' = ''
        'interference_warnings' = ''
        'nuance' = ''
        'pragmatic_effect' = ''
        'recall_cue' = $chunk['communicative_purpose']
        'spacing_tag' = if ($chunk['level'] -eq 'A1') { 'Immediate' } elseif ($chunk['level'] -eq 'A2') { 'Short-term' } else { 'Long-term' }
        'upgrade_path' = ''
        'chunk_family' = $chunk['chunk_text']
        'is_idiom' = 0
    }

    foreach ($key in $defaults.Keys) {
        if (-not $chunk.Contains($key) -or [string]::IsNullOrEmpty($chunk[$key])) {
            $chunk[$key] = $defaults[$key]
        }
    }

    # Rename trigger_situations if missing
    if (-not $chunk.Contains('trigger_situations')) {
        $chunk['trigger_situations'] = $chunk['communicative_purpose']
    }

    # Ensure typical_collocates is array
    if ($chunk['typical_collocates'] -is [string]) {
        $chunk['typical_collocates'] = @($chunk['typical_collocates'])
    }

    # Ensure we have 3 examples with translations
    if (-not $chunk.Contains('example_1_translation')) {
        $chunk['example_1_translation'] = if ($chunk.Contains('example_1')) { "[Translation for: $($chunk['example_1'])]" } else { '' }
    }
    if (-not $chunk.Contains('example_2_translation')) {
        $chunk['example_2_translation'] = if ($chunk.Contains('example_2')) { "[Translation for: $($chunk['example_2'])]" } else { '' }
    }
    if (-not $chunk.Contains('example_3_translation')) {
        $chunk['example_3_translation'] = if ($chunk.Contains('example_3')) { "[Translation for: $($chunk['example_3'])]" } else { '' }
    }

    return $chunk
}

# Process each file
foreach ($filePath in $frenchFiles) {
    Write-Host "Processing: $filePath"

    # Create backup if it doesn't exist
    $bakPath = "$filePath.bak"
    if (-not (Test-Path $bakPath)) {
        Copy-Item $filePath $bakPath
        Write-Host "  Backup created: $bakPath"
    }

    # Read file
    $json = Get-Content $filePath -Raw | ConvertFrom-Json

    # Enrich each chunk
    $enriched = @()
    foreach ($chunk in $json) {
        $chunkHash = @{}
        $chunk.PSObject.Properties | ForEach-Object {
            $chunkHash[$_.Name] = $_.Value
        }
        $enriched += Enrich-Chunk $chunkHash
    }

    # Prepare output with ordered fields
    $fieldOrder = @(
        'chunk_text', 'meaning', 'primary_function', 'communicative_purpose', 'trigger_situations', 'contexts',
        'output_priority', 'frequency', 'formulaicity', 'construction_type', 'acquisition_priority',
        'pattern', 'core_structure', 'substitution_slots', 'typical_collocates', 'common_substitutions',
        'variations', 'common_mistakes', 'similar_contrasting', 'interference_warnings', 'nuance',
        'pragmatic_effect', 'recall_cue', 'spacing_tag', 'upgrade_path', 'chunk_family', 'is_idiom',
        'level', 'example_1', 'example_2', 'example_3', 'example_1_translation', 'example_2_translation', 'example_3_translation'
    )

    $output = @()
    foreach ($item in $enriched) {
        $orderedItem = [ordered]@{}
        foreach ($field in $fieldOrder) {
            if ($item.Contains($field)) {
                $orderedItem[$field] = $item[$field]
            }
        }
        $output += $orderedItem
    }

    # Convert to JSON and write
    $json_output = $output | ConvertTo-Json -Depth 10
    Set-Content $filePath $json_output -Encoding UTF8
    Write-Host "  Enriched and saved: $($output.Count) chunks"
}

Write-Host "Enrichment complete!"
