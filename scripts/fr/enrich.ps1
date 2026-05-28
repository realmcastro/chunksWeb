param(
    [string]$InputFile
)

function Enrich-Chunk {
    param([hashtable]$chunk)

    # Ensure all required fields exist
    $requiredFields = @{
        'chunk_text' = ''
        'meaning' = ''
        'primary_function' = ''
        'communicative_purpose' = ''
        'trigger_situations' = ''
        'contexts' = ''
        'output_priority' = 'Both'
        'frequency' = 'High'
        'formulaicity' = 'Semi-fixed'
        'construction_type' = 'Phrase'
        'acquisition_priority' = 'Recognition first'
        'pattern' = ''
        'core_structure' = ''
        'substitution_slots' = ''
        'typical_collocates' = ''
        'common_substitutions' = ''
        'variations' = ''
        'common_mistakes' = ''
        'similar_contrasting' = ''
        'interference_warnings' = ''
        'nuance' = ''
        'pragmatic_effect' = ''
        'recall_cue' = ''
        'spacing_tag' = 'Short-term'
        'upgrade_path' = ''
        'chunk_family' = ''
        'is_idiom' = 0
        'level' = 'A1'
        'example_1' = ''
        'example_2' = ''
        'example_3' = ''
        'example_1_translation' = ''
        'example_2_translation' = ''
        'example_3_translation' = ''
    }

    # Merge existing with defaults
    foreach ($key in $requiredFields.Keys) {
        if (-not $chunk.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($chunk[$key])) {
            $chunk[$key] = $requiredFields[$key]
        }
    }

    # Rename patterns -> pattern if exists
    if ($chunk.ContainsKey('patterns') -and -not $chunk.ContainsKey('pattern')) {
        if ($chunk['patterns'] -is [array] -and $chunk['patterns'].Count -gt 0) {
            $chunk['pattern'] = $chunk['patterns'][0]
        }
        $chunk.Remove('patterns')
    }

    # Rename collocates -> typical_collocates
    if ($chunk.ContainsKey('collocates') -and -not $chunk.ContainsKey('typical_collocates')) {
        $chunk['typical_collocates'] = $chunk['collocates']
    }
    if ($chunk.ContainsKey('collocates')) {
        $chunk.Remove('collocates')
    }

    # Fix placeholder examples - replace patterns like "word + word" or "word est une expression"
    $placeholderPatterns = @(
        '^\w+\s*\+\s*\w+.*$',  # word + word patterns
        '^\w+\s*est\s*une\s*expression',  # "X est une expression"
        '^Je\s+connais\s+',  # "Je connais X"
        '^Tu\s+peux\s+dire\s+',  # "Tu peux dire X"
        '^On\s+utilise\s+',  # "On utilise X"
        '^\w+\s*\+\s*\w+\s*\+',  # multiple + signs
        '^pourquoi\s+',  # pourquoi patterns
        '^example_\d_translation'  # translation placeholders
    )

    # For each example field, check if it's a placeholder
    for ($i = 1; $i -le 3; $i++) {
        $exKey = "example_$i"
        $exValue = $chunk[$exKey]

        # Check if it matches any placeholder pattern
        $isPlaceholder = $false
        foreach ($pattern in $placeholderPatterns) {
            if ($exValue -match $pattern) {
                $isPlaceholder = $true
                break
            }
        }

        if ($isPlaceholder) {
            # Generate natural French example based on chunk_text
            $chunkText = $chunk['chunk_text']

            # Simple generation - can be enhanced
            switch ($i) {
                1 { $chunk[$exKey] = "Hier, je dis: `"$chunkText`"" }
                2 { $chunk[$exKey] = "On utilise `"$chunkText`" pour communiquer." }
                3 { $chunk[$exKey] = "Quand tu dis `"$chunkText`", les gens comprennent." }
            }
        }
    }

    # Ensure core_structure is filled from pattern if empty
    if ([string]::IsNullOrWhiteSpace($chunk['core_structure']) -and -not [string]::IsNullOrWhiteSpace($chunk['pattern'])) {
        $chunk['core_structure'] = $chunk['pattern'] -replace '\s*\+\s*', ' '
    }

    # Ensure substitution_slots is filled if empty
    if ([string]::IsNullOrWhiteSpace($chunk['substitution_slots'])) {
        $chunk['substitution_slots'] = "Contextual based on usage."
    }

    # Set common pragmatic defaults
    if ([string]::IsNullOrWhiteSpace($chunk['pragmatic_effect'])) {
        $primaryFunc = $chunk['primary_function']
        if ($primaryFunc -match 'greeting|farewell') {
            $chunk['pragmatic_effect'] = 'Establishes rapport and social presence.'
        } elseif ($primaryFunc -match 'polite|request') {
            $chunk['pragmatic_effect'] = 'Softens requests and shows respect.'
        } elseif ($primaryFunc -match 'opinion|agreement') {
            $chunk['pragmatic_effect'] = 'Facilitates discussion and consensus.'
        } else {
            $chunk['pragmatic_effect'] = 'Facilitates natural communication.'
        }
    }

    # Ensure recall_cue is set
    if ([string]::IsNullOrWhiteSpace($chunk['recall_cue'])) {
        $chunk['recall_cue'] = $chunk['primary_function']
    }

    return $chunk
}

# Read JSON
$json = Get-Content $InputFile -Raw | ConvertFrom-Json
$enriched = @()

foreach ($item in $json) {
    $chunk = @{}
    # Convert PSCustomObject to hashtable
    $item.PSObject.Properties | ForEach-Object {
        $chunk[$_.Name] = $_.Value
    }

    # Enrich the chunk
    $chunk = Enrich-Chunk $chunk
    $enriched += $chunk
}

# Write back
$enriched | ConvertTo-Json -Depth 10 | Set-Content $InputFile -Encoding UTF8
Write-Host "Enriched: $InputFile"
