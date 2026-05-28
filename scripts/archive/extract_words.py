import json
import re
import sys
from docx import Document

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

doc = Document(r"C:\Users\mathe\OneDrive\Documentos\chunks\WordN1.docx")
full_text = "\n".join(p.text for p in doc.paragraphs)

match = re.search(r'\[\s*\{.*\}\s*\]', full_text, re.DOTALL)
if not match:
    print("No JSON array found")
    sys.exit(1)

raw = match.group(0)

# Fix unescaped quotes inside JSON string values
# Pattern: replace " that appear inside string values (not at key/value boundaries)
# Strategy: use json_repair or manual fix
# The issue is phonetic fields like: "/veɪs/ or "/vɑːz/"
# These need the inner quotes escaped

def fix_json_string_quotes(s):
    """Fix unescaped double quotes inside JSON string values."""
    result = []
    i = 0
    in_string = False
    escape_next = False

    while i < len(s):
        c = s[i]

        if escape_next:
            result.append(c)
            escape_next = False
            i += 1
            continue

        if c == '\\':
            result.append(c)
            escape_next = True
            i += 1
            continue

        if c == '"' and not in_string:
            in_string = True
            result.append(c)
            i += 1
            continue

        if c == '"' and in_string:
            # Check if this is the end of a string value
            # Look ahead to see if next non-space char is :, ,, }, ]
            j = i + 1
            while j < len(s) and s[j] in ' \t\n\r':
                j += 1

            if j < len(s) and s[j] in ':,}]':
                # This is a valid string terminator
                in_string = False
                result.append(c)
            else:
                # This is an unescaped quote inside a string - escape it
                result.append('\\"')
            i += 1
            continue

        result.append(c)
        i += 1

    return ''.join(result)

fixed = fix_json_string_quotes(raw)

try:
    data = json.loads(fixed)
    with open("scripts/words_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"SUCCESS: {len(data)} words extracted")
    print(f"Sample: {data[0]['word']} - {data[0]['primary_meaning'][:50]}")
except json.JSONDecodeError as e:
    print(f"JSON error at {e.pos}: {e.msg}")
    ctx_start = max(0, e.pos - 150)
    ctx_end = min(len(fixed), e.pos + 150)
    print(repr(fixed[ctx_start:ctx_end]))
