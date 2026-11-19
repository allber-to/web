import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function violations(text) {
  return [
    [/127\.0\.0\.1|localhost:\d+/i, 'embedded local service address'],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/, 'secret signature'],
  ].filter(([pattern]) => pattern.test(text)).map(([, reason]) => reason);
}

if (process.argv[2] === '--self-test') {
  assert.deepEqual(violations('window.location.origin || "http://localhost"'), []);
  assert.deepEqual(violations('https://api.example.test'), []);
  for (const text of ['http://localhost:8000', 'http://127.0.0.1', '-----BEGIN PRIVATE KEY-----', `ghp_${'a'.repeat(24)}`]) {
    assert(violations(text).length > 0);
  }
  console.log('PASS bundle checker positive/negative self-checks');
} else {
  const root = process.argv[2];
  assert(root, 'Usage: node verify-bundle.mjs <dist directory>');
  const origin = process.env.VITE_API_URL;
  assert(origin, 'VITE_API_URL must identify the expected API origin');
  const occurrences = [];
  let originFound = false;
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    const text = readFileSync(file).toString('utf8');
    // Do not echo matched secret material on failure.
    assert.deepEqual(violations(text), [], `Bundle rejected: ${file}`);
    originFound ||= text.includes(origin);
    for (const match of text.matchAll(/localhost/gi)) {
      occurrences.push({ file: file.slice(root.length + 1), context: text.slice(Math.max(0, match.index - 90), match.index + 109) });
    }
  }
  assert(originFound, 'Expected API origin was not found in the served bundle');
  console.log(JSON.stringify({ expectedApiOrigin: origin, localServiceAddresses: 0, secretSignatures: 0, localhostOccurrencesForReview: occurrences }, null, 2));
  console.log('PASS automated E5 checks; review every listed localhost context against the CTO categories');
}
