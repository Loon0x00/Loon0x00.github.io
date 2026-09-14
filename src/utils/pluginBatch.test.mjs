import assert from 'node:assert/strict';
import fs from 'node:fs';
import {unzipSync, zipSync, strToU8, strFromU8} from 'fflate';
import unrar from 'node-unrar-js';
import converter from './loon-plugin-converter.js';
import {importPlugins, createDownloadZip, safePath, LIMITS} from './pluginBatch.mjs';
import {extractRarArchive} from './rarArchive.mjs';

const source = '#!name = Test\r\n[Argument]\r\n555_enable = switch,true\r\n[URL Rewrite]\r\n // keep comment  \r\n^https://example.com _ reject-dict\r\n[Script]\r\ngeneric script-path=tool.js, enable={555_enable}\r\n[MITM]\r\nhostname = example.com';
const file = (name, bytes) => ({name, size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer});
const direct = converter.convertPlugin(source);
assert.equal(direct.converted, 2);
assert.equal(direct.errors, 0);
assert.ok(direct.text.includes(' // keep comment  \r\n'));
assert.ok(direct.text.includes('enable=${555_enable}'));
assert.ok(direct.text.endsWith('[MITM]\r\nhostname = example.com'));
assert.equal(converter.convertPlugin(direct.text).status, 'unchanged');
const partial = converter.convertPlugin(source + '\r\n[Rewrite]\r\n^https://example.com nonsense');
assert.equal(partial.status, 'partial');
assert.equal(partial.diagnostics[0].line, 12);

const archive = zipSync({'a/same.lpx': strToU8(source), 'b/same.lpx': strToU8(source), 'image.png': new Uint8Array([1]), 'bad.lpx': strToU8('not a plugin')});
const seen = [];
const results = await importPlugins([
  file('direct.lpx', strToU8(source)), file('bundle.zip', archive), file('direct.lpx', strToU8(source)),
  file('broken.rar', strToU8('broken')), file('after.lpx', strToU8(source)),
], {onResult: result => seen.push(result)});
assert.equal(results.length, 7);
assert.equal(seen.length, 7);
assert.equal(results.filter(result => result.status === 'converted').length, 5);
assert.equal(results.filter(result => result.status === 'failed').length, 2);
assert.ok(results.some(result => result.path === 'direct (2).lpx'));
assert.ok(results.some(result => result.path === 'bundle/a/same.lpx'));
const zip = unzipSync(createDownloadZip(results));
assert.equal(Object.keys(zip).length, 6);
assert.equal(strFromU8(zip['direct.lpx']), direct.text);
const report = JSON.parse(strFromU8(zip['conversion-report.json']));
assert.equal(report.length, 7);
assert.equal(report.some(item => 'original' in item || 'text' in item), false);
assert.throws(() => safePath('../unsafe.lpx'));
const badEncoding = await importPlugins([file('invalid.lpx', new Uint8Array([255, 255]))]);
assert.equal(badEncoding[0].status, 'failed');
const oversized = await importPlugins([{name: 'huge.zip', size: LIMITS.upload + 1, arrayBuffer: () => { throw Error('must not read'); }}]);
assert.match(oversized[0].error, /50 MB/);
const traversal = await importPlugins([file('bad.zip', zipSync({'../unsafe.lpx': strToU8(source)}))]);
assert.equal(traversal[0].status, 'failed');

const wasmBinary = fs.readFileSync(new URL('../../node_modules/node-unrar-js/esm/js/unrar.wasm', import.meta.url));
const extractRar = (data, accept) => extractRarArchive(data, {createExtractor: unrar.createExtractorFromData, wasmBinary, accept});
const rarBytes = fs.readFileSync(new URL('./fixtures/plugin-stored.rar', import.meta.url));
const rar = await importPlugins([file('plugins.rar', rarBytes)], {extractRar});
assert.equal(rar.length, 1);
assert.equal(rar[0].path, 'plugins/folder/plugin.lpx');
assert.equal(rar[0].status, 'converted');
assert.equal(rar[0].converted, 2);
assert.ok(rar[0].text.includes('reject_dict(200)'));
const mixed = await importPlugins([file('bad.rar', new Uint8Array([1, 2, 3])), file('good.rar', rarBytes)], {extractRar});
assert.equal(mixed[0].status, 'failed');
assert.equal(mixed[1].status, 'converted');
console.log('plugin batch, ZIP, real RAR/WASM and download tests passed');
