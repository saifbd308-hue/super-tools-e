const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

function loadToolsHelpers() {
  const filePath = path.join(__dirname, '..', 'tools.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const exportSnippet = [
    '  window.__TOOLS_TEST_EXPORTS__ = {',
    '    safeTextToBase64: safeTextToBase64,',
    '    safeBase64ToText: safeBase64ToText,',
    '    decodeBase64Url: decodeBase64Url,',
    '    toTitleCase: toTitleCase,',
    '    toSentenceCase: toSentenceCase,',
    '    getWordCount: getWordCount,',
    '    createPassword: createPassword,',
    '    evaluatePasswordStrength: evaluatePasswordStrength,',
    '    formatFileSize: formatFileSize,',
    '    parseCsv: parseCsv,',
    '    stringifyCsv: stringifyCsv',
    '  };',
    ''
  ].join('\n');

  const instrumented = source.replace('  window.ToolsSuperAppData = {', `${exportSnippet}  window.ToolsSuperAppData = {`);

  const sandbox = {
    window: {
      crypto: {
        getRandomValues(values) {
          return crypto.randomFillSync(values);
        }
      },
      luxon: null
    },
    btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    atob: (value) => Buffer.from(value, 'base64').toString('binary'),
    unescape,
    escape,
    Intl,
    Uint32Array
  };

  vm.runInNewContext(instrumented, sandbox, { filename: filePath });
  return sandbox.window.__TOOLS_TEST_EXPORTS__;
}

const tools = loadToolsHelpers();

test('base64 helpers encode, decode and support URL-safe payloads', () => {
  const original = 'Hello ✅ World';
  const encoded = tools.safeTextToBase64(original);
  assert.equal(tools.safeBase64ToText(encoded), original);

  const urlSafe = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  assert.equal(tools.decodeBase64Url(urlSafe), original);
});

test('case conversion and word count helpers normalize text', () => {
  assert.equal(tools.toTitleCase('hELLO wORLD'), 'Hello World');
  assert.equal(tools.toSentenceCase('mULTI WORD TEXT'), 'Multi word text');
  assert.equal(tools.toSentenceCase('   '), '   ');
  assert.equal(tools.getWordCount('  one   two\nthree  '), 3);
  assert.equal(tools.getWordCount('   '), 0);
});

test('password generator respects enabled character pools', () => {
  assert.equal(tools.createPassword(8, { uppercase: false, lowercase: false, numbers: false, symbols: false }), '');

  const onlyNumbers = tools.createPassword(5, { uppercase: false, lowercase: false, numbers: true, symbols: false });
  assert.match(onlyNumbers, /^\d{5}$/);

  const mixed = tools.createPassword(6, { uppercase: true, lowercase: true, numbers: true, symbols: true });
  assert.equal(mixed.length, 6);
});

test('password strength scoring and guidance are returned correctly', () => {
  const weak = tools.evaluatePasswordStrength('abc');
  assert.equal(weak.label, 'Weak');
  assert.ok(weak.tips.length > 0);

  const strong = tools.evaluatePasswordStrength('VeryStrongPass123!');
  assert.equal(strong.label, 'Strong');
  assert.equal(strong.score, 6);
  assert.equal(strong.tips.length, 0);
});

test('file-size formatter handles unit and precision boundaries', () => {
  assert.equal(tools.formatFileSize(NaN), '0 B');
  assert.equal(tools.formatFileSize(0), '0 B');
  assert.equal(tools.formatFileSize(1536), '1.5 KB');
  assert.equal(tools.formatFileSize(10 * 1024), '10 KB');
});

test('CSV parser handles quotes, commas, escaped quotes, CRLF and empty lines', () => {
  const csv = 'name,quote\r\nAlice,"hello, world"\r\nBob,"He said ""Hi"""\n\n';
  assert.deepEqual(JSON.parse(JSON.stringify(tools.parseCsv(csv))), [
    ['name', 'quote'],
    ['Alice', 'hello, world'],
    ['Bob', 'He said "Hi"']
  ]);
});

test('CSV stringifier escapes values and can round-trip parse output', () => {
  const records = [
    ['a', 'b,c', 'x"y', null],
    ['line1\nline2', 'plain', 42, '']
  ];

  const csv = tools.stringifyCsv(records);
  assert.equal(csv, 'a,"b,c","x""y",\n"line1\nline2",plain,42,');

  assert.deepEqual(JSON.parse(JSON.stringify(tools.parseCsv(csv))), [
    ['a', 'b,c', 'x"y', ''],
    ['line1\nline2', 'plain', '42', '']
  ]);
});
