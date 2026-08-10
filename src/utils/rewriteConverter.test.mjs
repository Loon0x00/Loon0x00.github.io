import assert from 'node:assert/strict';

import {convertLegacyRewrite} from './rewriteConverter.mjs';

const source = `[Argument]
urlMatch = input,"reserved"

[Rewrite]
^https:\\/\\/example\\.com\\/(\\d+)$ header https://new.example.com/$1
^https:\\/\\/example\\.com header-add X-A 1 X-B 2
^https:\\/\\/example\\.com header-del Cookie Referer
^https:\\/\\/example\\.com header-replace-regex User-Agent (iPhone) $1
^https:\\/\\/example\\.com request-body-replace-regex price=(\\d+) amount=$1
^https:\\/\\/example\\.com response-body-replace-regex false true disabled enabled
^https:\\/\\/example\\.com request-body-json-add data.item {"name":"Loon"} data.enabled true
^https:\\/\\/example\\.com response-body-json-replace data.a 1 data.b true
^https:\\/\\/example\\.com request-body-json-jq 'del(.data.ads)'
^https:\\/\\/example\\.com mock-request-body data-type=json data="{\\"ok\\":true}"
^https:\\/\\/example\\.com mock-response-body data-type=png data-path=response.raw mock-data-is-base64=true status-code=201
^https:\\/\\/example\\.com reject-video`;

const converted = convertLegacyRewrite(source);

assert.equal(converted.stats.converted, 12);
assert.equal(converted.stats.failed, 0);
assert.deepEqual(converted.issues, []);
assert.match(converted.output, /as urlMatch2/);
assert.match(
  converted.output,
  /url\.replace\("https:\/\/new\.example\.com\/\$\{urlMatch2\.1\}"\)/,
);
assert.match(
  converted.output,
  /request\.header\.add\(\["X-A", "X-B"\], \["1", "2"\]\)/,
);
assert.match(
  converted.output,
  /request\.header\.del\(\["Cookie", "Referer"\]\)/,
);
assert.match(
  converted.output,
  /request\.header\.replace\("User-Agent", \/\(iPhone\)\//,
);
assert.match(converted.output, /"amount=\$1"/);
assert.match(
  converted.output,
  /response\.body\.replace\(\[\/false\/, \/disabled\/\], \["true", "enabled"\]\)/,
);
assert.match(
  converted.output,
  /request\.json\.add\(\["data\.item", "data\.enabled"\], \[`\{"name":"Loon"\}`, true\]\)/,
);
assert.match(
  converted.output,
  /response\.json\.replace\(\["data\.a", "data\.b"\], \[1, true\]\)/,
);
assert.match(converted.output, /request\.json\.jq\("del\(\.data\.ads\)"\)/);
assert.match(
  converted.output,
  /request\.body\.mock\("json", "\{\\"ok\\":true\}"\)/,
);
assert.match(
  converted.output,
  /response\.body\.mock_file\("png", "response\.raw", 201, true\)/,
);
assert.match(converted.output, /reject_video\(200\)/);

const regexWithLiteralQuotes = convertLegacyRewrite(
  String.raw`^https?:\/\/ddgksf2013.top\/$ response-body-replace-regex Lock\s*=\s*\d Lock=4 (jqEnabled=true") $1+"&icon="+item.icon <\/i>\s*QuantumultX </i>\x20Loon`,
);
assert.equal(regexWithLiteralQuotes.stats.converted, 1);
assert.equal(regexWithLiteralQuotes.stats.failed, 0);
assert.deepEqual(regexWithLiteralQuotes.issues, []);
assert.ok(regexWithLiteralQuotes.output.includes('/(jqEnabled=true")/'));
assert.match(
  regexWithLiteralQuotes.output,
  /"\$1\+\\"&icon=\\"\+item\.icon"/,
);
assert.ok(regexWithLiteralQuotes.output.includes('"</i> Loon"'));

const mockDataWithLiteralJsonQuotes = convertLegacyRewrite(
  String.raw`^https:\/\/api\.bilibili\.com\/pgc\/activity\/deliver\/material\/receive\? mock-response-body data-type=text status-code=200 data="{"code":0,"data":{"closeType":"close_win","container":[],"showTime":""},"message":"success"}"`,
);
assert.equal(mockDataWithLiteralJsonQuotes.stats.converted, 1);
assert.equal(mockDataWithLiteralJsonQuotes.stats.failed, 0);
assert.deepEqual(mockDataWithLiteralJsonQuotes.issues, []);
assert.ok(
  mockDataWithLiteralJsonQuotes.output.includes(
    String.raw`response.body.mock("text", "{\"code\":0,\"data\":{\"closeType\":\"close_win\",\"container\":[],\"showTime\":\"\"},\"message\":\"success\"}", 200)`,
  ),
);

const invalidCapture = convertLegacyRewrite(
  '^https:\\/\\/example\\.com\\/(\\d+)$ header https://new.example.com/$2',
);
assert.equal(invalidCapture.stats.failed, 1);
assert.equal(invalidCapture.issues[0].level, 'error');
assert.match(invalidCapture.output, /header https:\/\/new\.example\.com\/\$2/);

const alreadyNew = convertLegacyRewrite(
  'request if ${url} ~= /^https:\\/\\/example\\.com/ then reject(404)',
  {includeSection: false},
);
assert.equal(alreadyNew.stats.unchanged, 1);
assert.equal(
  alreadyNew.output,
  'request if ${url} ~= /^https:\\/\\/example\\.com/ then reject(404)',
);

console.log('rewriteConverter tests passed');
