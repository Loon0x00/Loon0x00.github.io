import {convertConfiguration} from './legacyConverterAdapter.mjs';

export function convertLegacyRewrite(source, options) {
  return convertConfiguration(source, 'rewrite', options);
}

export const LEGACY_REWRITE_EXAMPLE = `[Argument]
region = select,CN,US
price = input,9.99,type=number

[Rewrite]
# 插件参数
^https://api.example.com header-add X-Region {region}
^https://api.example.com response-body-json-replace data.price {price}

# URL 替换与重定向
^https:\\/\\/old\\.example\\.com\\/(.*)$ header https://new.example.com/$1
^http:\\/\\/example\\.com 302 https://example.com

# 请求 Header
^https:\\/\\/api\\.example\\.com header-add X-Loon true
^https:\\/\\/api\\.example\\.com header-del Cookie
^https:\\/\\/api\\.example\\.com header-replace-regex User-Agent iPhone\\x20OS\\x20(\\d+) iPhone\\x20OS\\x20$1

# JSON 与 Mock
^https:\\/\\/api\\.example\\.com request-body-json-add data.enabled true
^https:\\/\\/api\\.example\\.com response-body-json-del data.ads
^https:\\/\\/api\\.example\\.com mock-response-body data-type=json data-path=response_body.json status-code=200`;
