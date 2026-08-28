import assert from 'node:assert/strict';

import {convertLegacyScript} from './scriptConverter.mjs';

const source = `[Argument]
enabled = switch,true
region = select,"CN","US"

[Script]
http-request ^https?:\\/\\/api\\.example\\.com script-path=request.js, requires-body=true, argument="hello", timeout=20, tag=Request
http-response ^https?:\\/\\/api\\.example\\.com script-path=response.js, argument={region,enabled}, enabled={enabled}, binary-body-mode=true
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300
cron {cron} script-path=plugin-cron.js, argument={region}
network-changed script-path=network.js, tag=Network
generic script-path=tool.js, img-url=tool.system, debug=true`;

const converted = convertLegacyScript(source);
assert.equal(converted.stats.converted, 6);
assert.equal(converted.stats.failed, 0);
assert.deepEqual(converted.issues, []);
assert.match(
  converted.output,
  /request if \$\{url\} ~= \/\^https\?:\\\/\\\/api\\\.example\\\.com\/i then script\("request\.js", "hello"\) with tag="Request", timeout=20, requires_body=true/,
);
assert.match(
  converted.output,
  /response if \$\{url\} ~= .* then script\("response\.js", \{\$\{region\}, \$\{enabled\}\}\) with enable=\$\{enabled\}, binary_body_mode=true/,
);
assert.match(converted.output, /cron "0 8 \* \* \*" then script\("cron\.js", "daily"\) with timeout=300/);
assert.match(converted.output, /cron \$\{cron\} then script\("plugin-cron\.js", \{\$\{region\}\}\)/);
assert.match(converted.output, /network-changed then script\("network\.js"\) with tag="Network"/);
assert.match(converted.output, /generic then script\("tool\.js"\) with img_url="tool\.system", debug=true/);

const legacyPluginArgument = convertLegacyScript(
  String.raw`http-request ^https:\/\/(grpc\.biliapi\.net|app\.bilibili\.com)\/bilibili\.(app\.viewunite\.v1\.View\/View|main\.community\.reply\.v1\.Reply\/MainList)$ script-path=https://raw.githubusercontent.com/kokoryh/Sparkle/refs/heads/master/dist/bilibili.protobuf.request.js, argument=[{purifyComment}, {logLevel}], requires-body=true, binary-body-mode=true, timeout=10, enable={optimizeRequest}, tag=bilibili.request`,
  {includeSection: false},
);
assert.equal(legacyPluginArgument.stats.converted, 1);
assert.equal(legacyPluginArgument.stats.failed, 0);
assert.deepEqual(legacyPluginArgument.issues, []);
assert.equal(
  legacyPluginArgument.output,
  'request if ${url} ~= /^https:\\/\\/(grpc\\.biliapi\\.net|app\\.bilibili\\.com)\\/bilibili\\.(app\\.viewunite\\.v1\\.View\\/View|main\\.community\\.reply\\.v1\\.Reply\\/MainList)$/i then script("https://raw.githubusercontent.com/kokoryh/Sparkle/refs/heads/master/dist/bilibili.protobuf.request.js", {${purifyComment}, ${logLevel}}) with enable=${optimizeRequest}, tag="bilibili.request", timeout=10, requires_body=true, binary_body_mode=true',
);

const singleLegacyPluginArgument = convertLegacyScript(
  'generic script-path=tool.js, argument=[{region}]',
  {includeSection: false},
);
assert.equal(singleLegacyPluginArgument.stats.converted, 1);
assert.equal(singleLegacyPluginArgument.stats.failed, 0);
assert.equal(
  singleLegacyPluginArgument.output,
  'generic then script("tool.js", {${region}})',
);

const dottedPluginArguments = convertLegacyScript(
  'http-response ^https?:\\/\\/weatherkit\\.apple\\.com\\/ script-path=weather.js, argument=[{Weather.Provider},{AirQuality.Calculate.Algorithm}]',
  {includeSection: false},
);
assert.equal(dottedPluginArguments.stats.converted, 1);
assert.equal(dottedPluginArguments.stats.failed, 0);
assert.match(
  dottedPluginArguments.output,
  /script\("weather\.js", \{\$\{Weather\.Provider\}, \$\{AirQuality\.Calculate\.Algorithm\}\}\)/,
);

const redundantOptions = convertLegacyScript(
  'http-request ^https?:\\/\\/script\\.hub\\/ script-path=hub.js, timeout=300, , timeout=300, tag=Hub',
  {includeSection: false},
);
assert.equal(redundantOptions.stats.converted, 1);
assert.equal(redundantOptions.stats.failed, 0);
assert.match(redundantOptions.output, /with tag="Hub", timeout=300$/);

const conflictingOptions = convertLegacyScript(
  'generic script-path=tool.js, timeout=10, timeout=20',
  {includeSection: false},
);
assert.equal(conflictingOptions.stats.failed, 1);
assert.match(conflictingOptions.issues[0].message, /参数 timeout 重复/);

const emptyLegacyArgument = convertLegacyScript(
  'http-response ^https?:\\/\\/example\\.com script-path=response.js, argument=, requires-body=true',
  {includeSection: false},
);
assert.equal(emptyLegacyArgument.stats.converted, 1);
assert.equal(emptyLegacyArgument.stats.failed, 0);
assert.equal(
  emptyLegacyArgument.output,
  'response if ${url} ~= /^https?:\\/\\/example\\.com/i then script("response.js") with requires_body=true',
);

const invalid = convertLegacyScript(
  'generic script-path=tool.js, requires-body=true',
  {includeSection: false},
);
assert.equal(invalid.stats.failed, 1);
assert.match(invalid.issues[0].message, /只能用于 HTTP Script/);

const alreadyNew = convertLegacyScript(
  'generic then script("tool.js") with tag="Tool"',
  {includeSection: false},
);
assert.equal(alreadyNew.stats.unchanged, 1);
assert.equal(alreadyNew.output, 'generic then script("tool.js") with tag="Tool"');

console.log('scriptConverter tests passed');
