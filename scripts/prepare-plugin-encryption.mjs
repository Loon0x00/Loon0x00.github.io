import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const names = ['pluginEncryption.mjs', 'pluginUrlImport.mjs', 'pluginEncryptionWorker.mjs'];
const manifestPath = resolve(root, 'src/config/pluginEncryptionBuild.json');
const banner = '/* Generated LPXE module. Edit drafts/plugin-encryption and run npm run encryptor:obfuscate. */\n';
const options = {
  compact: true,
  target: 'browser-no-eval',
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: true,
  renameProperties: false,
  ignoreImports: true,
  reservedStrings: ['^\\.{1,2}/', '^fflate$'],
  stringArray: true,
  stringArrayThreshold: 0.85,
  stringArrayEncoding: ['base64'],
  stringArrayCallsTransform: false,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  selfDefending: false,
  sourceMap: false,
  seed: 20261025,
};
const fingerprint = hash(JSON.stringify({version: 'javascript-obfuscator@4.1.1', options}));
const privateFiles = names.map(name => resolve(root, 'drafts/plugin-encryption', name));
const force = process.argv.includes('--force');
const check = process.argv.includes('--check');
const publicOnly = process.argv.includes('--public');
const foundSources = privateFiles.filter(existsSync).length;
if (!publicOnly && foundSources !== 0 && foundSources !== names.length) {
  throw new Error('加密核心源码不完整，请恢复 drafts/plugin-encryption 后再构建。');
}
const hasSources = !publicOnly && foundSources === names.length;
const sources = hasSources ? privateFiles.map(path => readFileSync(path, 'utf8')) : null;
const sourceHash = sources ? hash(sources.join('\0')) : null;
let manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;

/** 计算构建一致性摘要，不包含任何私钥或插件内容。 */
function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** 校验公开产物，确保没有私有源码时仍能构建，缺失或损坏则明确失败。 */
function verify() {
  if (!manifest || manifest.version !== 1 || manifest.optionsHash !== fingerprint) {
    throw new Error('混淆产物清单缺失或配置已变化，请在持有 drafts 源码的环境运行 npm run encryptor:obfuscate。');
  }
  for (const name of names) {
    const path = resolve(root, 'src/utils', name);
    if (!existsSync(path)) {
      throw new Error(`缺少混淆产物：${name}`);
    }
    const code = readFileSync(path, 'utf8');
    if (!code.startsWith(banner) || hash(code) !== manifest.outputs[name] || /sourceMappingURL|sourcesContent/.test(code)) {
      throw new Error(`混淆产物校验失败：${name}，请重新生成。`);
    }
  }
  if (sourceHash && manifest.sourceHash !== sourceHash) {
    throw new Error('混淆产物与本地 drafts 源码不一致，请重新生成。');
  }
}

if (force && !hasSources) {
  throw new Error('重新混淆需要本地 drafts/plugin-encryption 源码；公开仓库可直接使用已生成产物。');
}
if (!check && hasSources && (force || manifest?.sourceHash !== sourceHash || manifest?.optionsHash !== fingerprint)) {
  const outputs = {};
  const generated = sources.map((original, index) => {
    // drafts 源码依赖公开转换器和公钥；输出回 src/utils 后恢复对应相对路径。
    const source = original
      .replaceAll("from '../../src/utils/loon-legacy-converter.js'", "from './loon-legacy-converter.js'")
      .replaceAll("from '../../src/config/pluginEncryptionPublicKey.json'", "from '../config/pluginEncryptionPublicKey.json'");
    // 保留模块导出接口，内部标识符、字符串与函数体参与混淆。
    const exports = Array.from(source.matchAll(/export\s+(?:(?:async\s+)?function|const|let|var)\s+(\w+)/g), match => `^${match[1]}$`);
    const result = JavaScriptObfuscator.obfuscate(source, {...options, reservedNames: exports, identifiersPrefix: `lpx${index}_`});
    return banner + result.getObfuscatedCode() + '\n';
  });
  for (let index = 0; index < names.length; index++) {
    writeFileSync(resolve(root, 'src/utils', names[index]), generated[index]);
    outputs[names[index]] = hash(generated[index]);
  }
  manifest = {version: 1, optionsHash: fingerprint, sourceHash, outputs};
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('已生成三个 LPXE 混淆模块。');
}
verify();
console.log(hasSources ? 'LPXE 混淆产物与本地源码一致。' : 'LPXE 公开产物校验通过；构建不依赖 drafts 源码。');
