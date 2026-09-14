import assert from 'node:assert/strict';
import {convertLegacyScript, LEGACY_SCRIPT_EXAMPLE} from './scriptConverter.mjs';

const source = String.raw`[Argument]
555_enable = switch,true,false,tag=555影视广告_enable

[Script]
http-response ^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/movie\/index_recommend script-path=https://raw.githubusercontent.com/fmz200/wool_scripts/main/Scripts/555Ad.js, requires-body=true, timeout=60, tag=555影视广告, enable={555_enable}`;
const result = convertLegacyScript(source);
assert.equal(result.stats.converted, 1);
assert.deepEqual(result.issues, []);
assert.ok(result.output.startsWith(source.split('[Script]')[0]));
assert.ok(result.output.endsWith('with enable=${555_enable}, tag="555影视广告", timeout=60, requires_body=true'));
assert.equal(convertLegacyScript(result.output).output, result.output);

const plugin = '[Argument]\r\nWeather.Provider = input,CN\r\nwait = input,20\r\nverbose = switch,true\r\ncron = input,"0 8 * * *"\r\n[Rewrite]\r\n^https://example.com reject\r\n[Script]\r\n // comment  \r\ncron {cron} script-path=tool.js, argument=[{Weather.Provider}], timeout={wait}, debug={verbose}\r\n[MITM]\r\nhostname = example.com';
const converted = convertLegacyScript(plugin);
assert.equal(converted.stats.converted, 1);
assert.deepEqual(converted.issues, []);
assert.ok(converted.output.includes('[Rewrite]\r\n^https://example.com reject\r\n'));
assert.ok(converted.output.includes(' // comment  \r\ncron ${cron} then script("tool.js", {${Weather.Provider}}) with timeout=${wait}, debug=${verbose}\r\n'));
assert.ok(converted.output.endsWith('[MITM]\r\nhostname = example.com'));

const plain = convertLegacyScript('  generic script-path=tool.js  ', {includeSection: false});
assert.equal(plain.output, '  generic then script("tool.js")  ');
assert.equal(convertLegacyScript('generic script-path=tool.js').output, '[Script]\ngeneric then script("tool.js")');
const badSource = '# comment\n// comment\ngeneric script-path=tool.js, argument=[{missing}]';
const invalid = convertLegacyScript(badSource, {includeSection: false});
assert.equal(invalid.output, badSource);
assert.equal(invalid.stats.failed, 1);
assert.equal(invalid.issues[0].line, 3);
assert.equal(invalid.issues[0].code, 'undefined-plugin-argument');
assert.equal(invalid.issues[0].level, 'error');
const argumentOnly = '[Argument]\ncron = input,0 8 * * *\ngeneric = input,hello';
assert.equal(convertLegacyScript(argumentOnly).output, argumentOnly);
assert.equal(convertLegacyScript(argumentOnly).stats.failed, 0);
assert.deepEqual(convertLegacyScript(LEGACY_SCRIPT_EXAMPLE).issues, []);
assert.equal(convertLegacyScript(null).output, '');
console.log('scriptConverter tests passed');
