import assert from 'node:assert/strict';
import {convertLegacyRewrite, LEGACY_REWRITE_EXAMPLE} from './rewriteConverter.mjs';

const comments = '\uFEFF# > 游戏时光  \r\n\t//build 729  \r\n ; 保留注释\r\n\r\n';
const rule = String.raw`^(http:\/\/www\.vgtime\.com\/app\/topic\/\d+\.jhtml\?.*?&close_ad=)false(&page=\d&sign=\w+&timestamp=\d+&font_size=\d$) $1true$2 302`;
const result = convertLegacyRewrite(comments + '  ' + rule + '  ', {includeSection: false});
assert.equal(result.stats.converted, 1);
assert.deepEqual(result.issues, []);
assert.ok(result.output.startsWith(comments + '  request if ${url} ~= '));
assert.ok(result.output.endsWith('as urlMatch then redirect(302, "${urlMatch.1}true${urlMatch.2}")  '));
assert.equal(convertLegacyRewrite(result.output, {includeSection: false}).output, result.output);

const actions = [
  'header http://www.google.com', 'http://www.google.com header',
  '302 https://example.com', 'https://example.com 302',
  '307 https://example.com', 'https://example.com 307',
  ...['reject', 'reject-200', 'reject-img', 'reject-dict', 'reject-array', 'reject-video'].flatMap(action => [action, `_ ${action}`]),
  'header-add Connection keep-alive', 'header-del Cookie', 'header-replace User-Agent Unknown',
  'header-replace-regex key regex replacement', 'request-body-replace-regex regex replacement',
  'mock-request-body data-type=text data=""', 'mock-request-body data-type=json data-path="request.json"',
  'response-header-add Connection keep-alive', 'response-header-del Cookie',
  'response-header-replace User-Agent Unknown', 'response-header-replace-regex key regex replacement',
  'response-body-replace-regex regex replacement', 'mock-response-body data-type=text data="" status-code=200',
  'mock-response-body data-type=json data-path="response.json" status-code=200',
  'request-body-json-add item true', 'request-body-json-del item', 'response-body-json-replace item 1',
  "response-body-json-jq 'del(.ads)'",
];
const matrix = convertLegacyRewrite(actions.map(action => `^http://example.com ${action}`).join('\n'));
assert.equal(matrix.stats.converted, actions.length);
assert.deepEqual(matrix.issues, []);
assert.ok(matrix.output.includes(String.raw`/^http:\/\/example.com/i`));
assert.ok(matrix.output.includes('request.body.mock("text", "")'));
assert.ok(matrix.output.includes('response.body.mock_file("json", "response.json", 200)'));

const sectioned = '[Argument]\r\nurlMatch = input,reserved\r\n[Script]\r\ngeneric script-path=tool.js\r\n[Rewrite] # rules\r\n^http://example.com/(.*) $1 302\r\n[MITM]\r\nhostname = example.com';
const plugin = convertLegacyRewrite(sectioned);
assert.equal(plugin.stats.converted, 1);
assert.ok(plugin.output.includes('[Script]\r\ngeneric script-path=tool.js\r\n'));
assert.ok(plugin.output.endsWith('[MITM]\r\nhostname = example.com'));
assert.ok(plugin.output.includes('as urlMatch1'));

// Diagnostics must retain the engine's validation and original document line.
const invalid = '# comment\n //build 729\n^https://example.com response-body-replace-regex a b c';
const failed = convertLegacyRewrite(invalid, {includeSection: false});
assert.equal(failed.output, invalid);
assert.equal(failed.stats.failed, 1);
assert.equal(failed.issues[0].line, 3);
assert.equal(failed.issues[0].code, 'legacy-parameters');
assert.equal(failed.issues[0].level, 'error');
const unsupported = convertLegacyRewrite('^https://example.com mock-response-body data-type=base64 data-path=file.raw');
assert.equal(unsupported.issues[0].code, 'invalid-mock-type');
assert.equal(convertLegacyRewrite(LEGACY_REWRITE_EXAMPLE).stats.failed, 0);
assert.equal(convertLegacyRewrite('').output, '');
assert.equal(convertLegacyRewrite('\uFEFF# comment\r\n^http://example.com reject').output.startsWith('\uFEFF[Rewrite]\r\n# comment\r\n'), true);
const declarations = `[Argument]
region = input,CN
555_enable = switch,true
price = input,9.99,type=number
status = input,201,type=number
encoded = switch,false
pattern = input,^https://example.com
Weather.Provider = input,CN
mime = input,json
field = input,data.price
urlMatch = input,reserved
[Rewrite]
`;
const pluginCases = [
  ['^https://example.com header-add X-Region {region}', 'request.header.add("X-Region", "${region}")'],
  ['^https://example.com header-add X-Info {region}-{Weather.Provider}-{price}', 'request.header.add("X-Info", "${region}-${Weather.Provider}-${price}")'],
  ['^https://example.com header-del {field}', 'request.header.del("${field}")'],
  ['^https://example.com response-body-json-replace enabled {555_enable}', 'response.json.replace("enabled", ${555_enable})'],
  ['^https://example.com response-body-json-replace {field} {price}', 'response.json.replace("${field}", ${price})'],
  ['^https://example.com response-body-json-replace data "{price}"', 'response.json.replace("data", "${price}")'],
  ['^https://example.com request-body-json-del {field}', 'request.json.delete("${field}")'],
  ["^https://example.com response-body-json-jq 'del(.{field})'", 'response.json.jq("del(.${field})")'],
  ['^https://example.com/(.*) https://new.example.com/{region}/$1 302', 'as urlMatch1 then redirect(302, "https://new.example.com/${region}/${urlMatch1.1}")'],
  ['{pattern} reject-dict', 'if ${url} ~= ${pattern} then reject_dict(200)'],
  ['^https://example.com response-body-replace-regex {pattern} $1-{region}', 'response.body.replace(${pattern}, "$1-${region}")'],
  ['^https://example.com header-replace-regex {field} {pattern} {region}', 'request.header.replace("${field}", ${pattern}, "${region}")'],
  ['^https://example.com mock-response-body data-type={mime} data="{region}" status-code={status} mock-data-is-base64={encoded}', 'response.body.mock("${mime}", "${region}", ${status}, ${encoded})'],
  ['^https://example.com mock-response-body data-type=json data-path={region}.json data-is-base64={encoded}', 'response.body.mock_file("json", "${region}.json", 200, ${encoded})'],
  ['^https://example.com mock-request-body data-type=json data="{"region":"{region}"}"', 'request.body.mock("json", ' + JSON.stringify('{"region":"${region}"}') + ')'],
];
const pluginResult = convertLegacyRewrite(declarations + pluginCases.map(([line]) => line).join('\n'));
assert.deepEqual(pluginResult.issues, []);
assert.equal(pluginResult.stats.converted, pluginCases.length);
assert.ok(pluginResult.output.startsWith(declarations));
for (const [, expected] of pluginCases) assert.ok(pluginResult.output.includes(expected), expected);
assert.equal(convertLegacyRewrite(pluginResult.output).output, pluginResult.output);
for (const [line, code] of [
  ['^https://{region}.example.com reject', 'embedded-plugin-regex'],
  ['^https://example.com response-body-replace-regex a{region} b', 'embedded-plugin-regex'],
  ['{price} reject', 'plugin-type'],
  ['^https://example.com mock-response-body data-type=json data=ok status-code={region}', 'plugin-type'],
  ['^https://example.com mock-request-body data-type=json data=ok mock-data-is-base64={region}', 'plugin-type'],
]) {
  const input = declarations + ' // 保留注释  \n' + line;
  const failed = convertLegacyRewrite(input);
  assert.equal(failed.output, input);
  assert.equal(failed.stats.failed, 1);
  assert.equal(failed.issues[0].code, code);
  assert.equal(failed.issues[0].line, input.split('\n').length);
}
const literals = convertLegacyRewrite(declarations + String.raw`^https://example.com/\d{1,3} header-add A {unknown} B \{region} C ` + '${region}');
assert.deepEqual(literals.issues, []);
assert.ok(literals.output.includes(String.raw`/\d{1,3}/i`));
assert.ok(literals.output.includes('"{unknown}"'));
assert.ok(literals.output.includes(String.raw`"\\{region}"`));
assert.ok(literals.output.includes('"' + '\\' + '${region}' + '"'));

console.log('rewriteConverter tests passed');
