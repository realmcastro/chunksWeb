/*
! Repair broken JSON in FR vocab files where agent emitted mis-quoted common_collocations strings.
*/
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'fr', 'french_vocab_b2_batch2.json'),
  path.join(__dirname, 'fr', 'french_vocab_b2_batch3.json'),
];

function repairLine(line) {
  // Match: "common_collocations": "<content>",
  // Where <content> may contain mis-balanced ", ' delimiters.
  const m = line.match(/^(\s*"common_collocations":\s*)(.*?)(,\s*)$/);
  if (!m) return line;
  const prefix = m[1];
  let body = m[2];
  const suffix = m[3];
  // Strip leading/trailing quotes
  // Body example: "ontologie philosophique", "étude ontologique", "question ontologique"
  //   or: "collaboration entre', 'en collaboration avec', 'collaboration étroite'
  // Normalize: remove all " and ' (inside body), then re-wrap with double quotes
  // Don't touch escaped sequences for safety
  const cleaned = body
    .replace(/^["']|["']$/g, '')
    .replace(/["']\s*,\s*["']/g, ', ')
    .replace(/["']/g, '');
  return prefix + JSON.stringify(cleaned) + suffix;
}

for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  const lines = orig.split('\n');
  const fixed = lines.map(repairLine).join('\n');
  // Validate
  try {
    JSON.parse(fixed);
    fs.writeFileSync(f, fixed);
    console.log('OK:', path.basename(f));
  } catch (e) {
    console.log('STILL BROKEN:', path.basename(f), e.message);
    // Find offending line
    const pos = parseInt((e.message.match(/position (\d+)/) || [])[1] || '0');
    if (pos) {
      const before = fixed.slice(Math.max(0, pos - 100), pos + 100);
      console.log('  context:', JSON.stringify(before));
    }
  }
}
