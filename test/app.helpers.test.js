const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class MemoryStorage {
  constructor({ throwOnGet = false, throwOnSet = false } = {}) {
    this.throwOnGet = throwOnGet;
    this.throwOnSet = throwOnSet;
    this.data = new Map();
  }

  getItem(key) {
    if (this.throwOnGet) {
      throw new Error('read blocked');
    }
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    if (this.throwOnSet) {
      throw new Error('write blocked');
    }
    this.data.set(key, String(value));
  }
}

function loadAppHelpers(localStorage) {
  const filePath = path.join(__dirname, '..', 'app.js');
  const source = fs.readFileSync(filePath, 'utf8');

  const withoutInit = source.replace(
    '  if (!toolIndex.size) {\n    return;\n  }\n\n  init();',
    '  if (!toolIndex.size) {\n    // skipped in tests\n  }'
  );

  const instrumented = withoutInit.replace(
    /\}\)\(\);\s*$/,
    [
      '  window.__APP_TEST_EXPORTS__ = {',
      '    escapeHtml: escapeHtml,',
      '    highlightText: highlightText,',
      '    formatNumber: formatNumber,',
      '    loadStoredValue: loadStoredValue,',
      '    loadStoredArray: loadStoredArray,',
      '    persistState: persistState',
      '  };',
      '})();'
    ].join('\n')
  );

  const sandbox = {
    window: {
      ToolsSuperAppData: { tools: [], featuredIds: [], categories: {} },
      localStorage,
      matchMedia: () => ({ matches: false })
    },
    Intl
  };

  vm.runInNewContext(instrumented, sandbox, { filename: filePath });
  return sandbox.window.__APP_TEST_EXPORTS__;
}

test('escapeHtml and highlightText sanitize and mark matching text', () => {
  const app = loadAppHelpers(new MemoryStorage());

  assert.equal(app.escapeHtml('<a "x">&\''), '&lt;a &quot;x&quot;&gt;&amp;&#39;');
  assert.equal(
    app.highlightText('<script>alert(1)</script>', 'alert'),
    '&lt;script&gt;<mark class="search-hl">alert</mark>(1)&lt;/script&gt;'
  );
  assert.equal(app.highlightText('Hello', 'missing'), 'Hello');
});

test('formatNumber respects provided precision', () => {
  const app = loadAppHelpers(new MemoryStorage());

  assert.equal(app.formatNumber(1234.567), '1,234.57');
  assert.equal(app.formatNumber(1234.567, 1), '1,234.6');
});

test('storage helpers handle normal and failure scenarios', () => {
  const storage = new MemoryStorage();
  storage.setItem('theme', 'dark');
  storage.setItem('favorites', JSON.stringify(['a', 1, 'b', null]));

  const app = loadAppHelpers(storage);
  assert.equal(app.loadStoredValue('theme', 'light'), 'dark');
  assert.equal(app.loadStoredValue('missing', 'fallback'), 'fallback');
  assert.deepEqual(JSON.parse(JSON.stringify(app.loadStoredArray('favorites'))), ['a', 'b']);

  storage.setItem('broken', 'not-json');
  assert.deepEqual(JSON.parse(JSON.stringify(app.loadStoredArray('broken'))), []);

  app.persistState('recent', ['x', 'y']);
  app.persistState('mode', 'grid');
  assert.equal(storage.getItem('recent'), JSON.stringify(['x', 'y']));
  assert.equal(storage.getItem('mode'), 'grid');

  const unreadable = loadAppHelpers(new MemoryStorage({ throwOnGet: true }));
  assert.equal(unreadable.loadStoredValue('k', 'fallback'), 'fallback');
  assert.deepEqual(JSON.parse(JSON.stringify(unreadable.loadStoredArray('k'))), []);

  const unwritableStorage = new MemoryStorage({ throwOnSet: true });
  const unwritable = loadAppHelpers(unwritableStorage);
  assert.doesNotThrow(() => unwritable.persistState('k', ['v']));
});
