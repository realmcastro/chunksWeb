# French Chunks Enrichment Script
# Enriches French chunk files to match English reference schema

$files = @(
    "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch41.json",
    "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch42.json",
    "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch43.json",
    "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch44.json",
    "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_chunks_batch45.json"
)

function Enrich-Chunk {
    param([PSCustomObject]$chunk)

    # Build enriched object with all required fields
    $enriched = [PSCustomObject]@{
        chunk_text = $chunk.chunk_text
        meaning = $chunk.meaning
        primary_function = $chunk.primary_function ?? "Expression"
        communicative_purpose = $chunk.communicative_purpose ?? ""
        trigger_situations = $chunk.trigger_situations ?? ""
        contexts = $chunk.contexts ?? ""
        output_priority = $chunk.output_priority ?? "Both"
        frequency = $chunk.frequency ?? "Medium"
        formulaicity = $chunk.formulaicity ?? "Flexible"
        construction_type = $chunk.construction_type ?? "Phrase"
        acquisition_priority = $chunk.acquisition_priority ?? "Recognition first"
        pattern = ($chunk.patterns -join " / ") ?? ($chunk.pattern ?? "")
        core_structure = $chunk.core_structure ?? $chunk.chunk_text
        substitution_slots = $chunk.substitution_slots ?? ""
        typical_collocates = ($chunk.collocates -join ", ") ?? ""
        common_substitutions = $chunk.common_substitutions ?? ""
        variations = $chunk.variations ?? ""
        common_mistakes = $chunk.common_mistakes ?? ""
        similar_contrasting = $chunk.similar_contrasting ?? ""
        interference_warnings = $chunk.interference_warnings ?? ""
        nuance = $chunk.nuance ?? ""
        pragmatic_effect = $chunk.pragmatic_effect ?? ""
        recall_cue = $chunk.recall_cue ?? ""
        spacing_tag = $chunk.spacing_tag ?? "Short-term"
        upgrade_path = $chunk.upgrade_path ?? ""
        chunk_family = $chunk.chunk_family ?? ""
        is_idiom = $chunk.is_idiom ?? 0
        level = $chunk.level ?? "A2"
        example_1 = $chunk.example_1 ?? ""
        example_2 = $chunk.example_2 ?? ""
        example_3 = $chunk.example_3 ?? ""
        example_1_translation = $chunk.example_1_translation ?? ""
        example_2_translation = $chunk.example_2_translation ?? ""
        example_3_translation = $chunk.example_3_translation ?? ""
    }

    return $enriched
}

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "Skipping missing file: $file"
        continue
    }

    # Create backup if doesn't exist
    $backup = "$file.bak"
    if (-not (Test-Path $backup)) {
        Copy-Item $file $backup
        Write-Host "Backed up: $backup"
    }

    # Read, enrich, write
    $json = Get-Content $file -Raw | ConvertFrom-Json
    $enriched = @()

    foreach ($chunk in $json) {
        $enriched += Enrich-Chunk $chunk
    }

    $enriched | ConvertTo-Json -Depth 10 | Set-Content $file -Encoding UTF8
    Write-Host "Enriched: $file ($($enriched.Count) chunks)"
}

Write-Host "Complete!"
