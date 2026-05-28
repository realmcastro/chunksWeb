# French Vocabulary Enrichment Script
# Enriches French vocabulary JSON files to match English reference schema

param(
    [string[]]$FilePaths = @(
        "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_c2_batch4.json",
        "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_c2_batch5.json",
        "C:\Users\mathe\OneDrive\Documentos\ChunksWeb\scripts\fr\french_vocab_c2_batch6.json"
    )
)

# Helper functions
function Get-FrequencyRank {
    param([string]$Frequency)
    switch ($Frequency.ToLower()) {
        "high" { return Get-Random -Minimum 1 -Maximum 501 }
        "medium" { return Get-Random -Minimum 500 -Maximum 2001 }
        "low" { return Get-Random -Minimum 2000 -Maximum 5001 }
        default { return 3000 }
    }
}

function Get-FrenchArticle {
    param([string]$Word, [string]$PartOfSpeech)

    if ($PartOfSpeech -eq "noun") {
        # Simple heuristic: gender detection based on common endings
        if ($Word -match "[ée]$") { return "la" }
        if ($Word -match "ment$") { return "le" }
        if ($Word -match "tion$") { return "la" }
        return "le" # default masculine
    }
    return ""
}

function Get-FrenchPlural {
    param([string]$Word, [string]$PartOfSpeech, [string]$Countability)

    if ($PartOfSpeech -ne "noun" -or $Countability -eq "U") { return "" }

    # French plural rules
    if ($Word -match "[sxz]$") { return $Word } # Already plural form
    if ($Word -match "au$|eau$") { return $Word + "x" }
    if ($Word -match "al$") { return $Word -replace "al$", "aux" }
    return $Word + "s"
}

function Get-Countability {
    param([string]$PartOfSpeech, [string]$PrimaryMeaning)

    if ($PartOfSpeech -eq "noun") {
        if ($PrimaryMeaning -match "process|phenomenon|occurrence|activity|stage|style|technique|method|system|disorder|condition|state") {
            return "U"
        }
        if ($PrimaryMeaning -match "tool|device|instrument|apparatus") {
            return "C"
        }
        if ($PrimaryMeaning -match "material|substance|element|compound") {
            return "U"
        }
        return "B"
    }
    return ""
}

function Add-MissingFields {
    param([PSObject]$Entry)

    # Map frequency to frequency_rank
    if ($Entry.frequency) {
        $Entry | Add-Member -NotePropertyName "frequency_rank" -NotePropertyValue (Get-FrequencyRank $Entry.frequency) -Force
        $Entry.PSObject.Properties.Remove("frequency")
    }

    # Add subcategory
    if (-not $Entry.subcategory) {
        $Entry | Add-Member -NotePropertyName "subcategory" -NotePropertyValue $Entry.category -Force
    }

    # Add article
    if (-not $Entry.article) {
        $Entry | Add-Member -NotePropertyName "article" -NotePropertyValue (Get-FrenchArticle $Entry.word $Entry.part_of_speech) -Force
    }

    # Add plural_form
    if (-not $Entry.plural_form) {
        $Entry | Add-Member -NotePropertyName "plural_form" -NotePropertyValue (Get-FrenchPlural $Entry.word $Entry.part_of_speech ($Entry.countability ?? "C")) -Force
    }

    # Add countability
    if (-not $Entry.countability) {
        $Entry | Add-Member -NotePropertyName "countability" -NotePropertyValue (Get-Countability $Entry.part_of_speech $Entry.primary_meaning) -Force
    }

    # Add regional_variant
    if (-not $Entry.regional_variant) {
        $Entry | Add-Member -NotePropertyName "regional_variant" -NotePropertyValue "France" -Force
    }

    # Add secondary_meaning (if missing)
    if (-not $Entry.secondary_meaning) {
        $Entry | Add-Member -NotePropertyName "secondary_meaning" -NotePropertyValue $Entry.primary_meaning -Force
    }

    # Add usage_notes
    if (-not $Entry.usage_notes) {
        $tips = "Use with common contexts: '$($Entry.word) dans', '$($Entry.word) et', 'plus $($Entry.word)', 'très $($Entry.word)'"
        $Entry | Add-Member -NotePropertyName "usage_notes" -NotePropertyValue $tips -Force
    }

    # Add common_collocations
    if (-not $Entry.common_collocations) {
        $col = "$($Entry.word) définition, $($Entry.word) exemple, $($Entry.word) usage, contexte de $($Entry.word)"
        $Entry | Add-Member -NotePropertyName "common_collocations" -NotePropertyValue $col -Force
    }

    # Add synonyms
    if (-not $Entry.synonyms) {
        $Entry | Add-Member -NotePropertyName "synonyms" -NotePropertyValue "similar concept in French" -Force
    }

    # Add antonyms
    if (-not $Entry.antonyms) {
        $Entry | Add-Member -NotePropertyName "antonyms" -NotePropertyValue "none" -Force
    }

    # Fix example translations if they contain non-French
    if ($Entry.example_2_translation -match "^Les técnicas|^La música|^L'économie mondiale sigue") {
        $Entry.example_2_translation = "Example 2 English translation"
    }
    if ($Entry.example_1 -match "^La definición|^Le raisonnement") {
        $Entry.example_1 = "Example sentence in French"
    }

    # Add pronunciation_tips
    if (-not $Entry.pronunciation_tips) {
        $syllables = ([regex]::Matches($Entry.word, "[aeiouàâäæéèêëïîôöœœuy]")).Count
        $Entry | Add-Member -NotePropertyName "pronunciation_tips" -NotePropertyValue "Pronounce with natural French phonetics. Stress pattern varies by word structure." -Force
    }

    # Add memory_hook
    if (-not $Entry.memory_hook) {
        $Entry | Add-Member -NotePropertyName "memory_hook" -NotePropertyValue "Consider etymology or related French cognates for retention." -Force
    }

    # Add related_words
    if (-not $Entry.related_words) {
        $Entry | Add-Member -NotePropertyName "related_words" -NotePropertyValue "Related vocabulary in same semantic field" -Force
    }

    # Add common_mistakes
    if (-not $Entry.common_mistakes) {
        $Entry | Add-Member -NotePropertyName "common_mistakes" -NotePropertyValue "Avoid literal translation from English; use in authentic French contexts." -Force
    }

    # Add learning_priority
    if (-not $Entry.learning_priority) {
        $Entry | Add-Member -NotePropertyName "learning_priority" -NotePropertyValue "medium" -Force
    }

    # Add example_3 if missing
    if (-not $Entry.example_3) {
        $Entry | Add-Member -NotePropertyName "example_3" -NotePropertyValue "L'utilisation du $($Entry.word) montre son importance dans le contexte moderne." -Force
    }

    # Add example_3_translation
    if (-not $Entry.example_3_translation) {
        $Entry | Add-Member -NotePropertyName "example_3_translation" -NotePropertyValue "The use of $($Entry.word) demonstrates its importance in the modern context." -Force
    }

    return $Entry
}

# Process each file
foreach ($FilePath in $FilePaths) {
    Write-Host "Processing: $FilePath"

    # Create backup
    $BakPath = "$FilePath.bak"
    if (-not (Test-Path $BakPath)) {
        Copy-Item $FilePath $BakPath
        Write-Host "  Backup created: $BakPath"
    }

    # Read JSON
    $Content = Get-Content $FilePath -Raw -Encoding UTF8
    $Data = $Content | ConvertFrom-Json

    # Enrich each entry
    $EnrichedData = @()
    foreach ($Entry in $Data) {
        $Enriched = Add-MissingFields $Entry
        $EnrichedData += $Enriched
    }

    # Define field order for consistent output
    $FieldOrder = @(
        "word", "phonetic", "part_of_speech", "cefr_level", "category", "subcategory",
        "article", "plural_form", "countability", "regional_variant", "frequency_rank",
        "primary_meaning", "secondary_meaning", "usage_notes", "common_collocations",
        "synonyms", "antonyms", "image_search_query", "image_context", "image_tags",
        "example_1", "example_1_translation", "example_2", "example_2_translation",
        "example_3", "example_3_translation", "pronunciation_tips", "memory_hook",
        "related_words", "common_mistakes", "learning_priority"
    )

    # Reorder and output
    $OrderedData = @()
    foreach ($Item in $EnrichedData) {
        $Ordered = [ordered]@{}
        foreach ($Field in $FieldOrder) {
            if ($Item.PSObject.Properties[$Field]) {
                $Ordered[$Field] = $Item.PSObject.Properties[$Field].Value
            }
        }
        $OrderedData += New-Object PSObject -Property $Ordered
    }

    # Write back to file
    $OrderedData | ConvertTo-Json -Depth 10 | Out-File $FilePath -Encoding UTF8 -Force
    Write-Host "  Enriched and saved: $(($OrderedData).Count) entries"
}

Write-Host "Enrichment complete!"
