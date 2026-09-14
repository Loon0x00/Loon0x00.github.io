import {convertConfiguration} from './legacyConverterAdapter.mjs';

export function convertLegacyScript(source, options) {
  return convertConfiguration(source, 'script', options);
}

export const LEGACY_SCRIPT_EXAMPLE = `[Argument]
region = select,CN,US
level = input,1,type=number
enabled = switch,true

[Script]
# Request Script
http-request ^https?:\\/\\/api\\.example\\.com script-path=request.js, requires-body=true, argument="mode=preview", timeout=20, tag=Request

# Response Script with plugin arguments
http-response ^https?:\\/\\/api\\.example\\.com script-path=response.js, argument={region,level}, enabled={enabled}, requires-body=true, binary-body-mode=true, tag=Response

# Other triggers
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300, tag=Daily
network-changed script-path=network.js, argument={region}, tag=Network
generic script-path=tool.js, argument="manual", img-url=tool.system, tag=Tool`;
