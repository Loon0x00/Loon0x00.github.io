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
