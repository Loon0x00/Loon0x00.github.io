import {unzipSync, zipSync, strToU8} from 'fflate';
import converter from './loon-plugin-converter.js';

export const LIMITS = {upload: 50 * 1024 * 1024, file: 10 * 1024 * 1024, total: 100 * 1024 * 1024, count: 1000};
export const isPluginFile = (name) => /\.(lpx|plugin|conf|txt)$/i.test(name);
export function safePath(name) {
  const parts = name.replace(/\\/g, '/').split('/');
  if (parts.some(part => part === '..' || /[\x00-\x1f:]/.test(part))) throw new Error('文件路径不合法');
  return parts.filter(part => part && part !== '.').join('/');
}
export function uniquePath(path, used) {
  let candidate = path, index = 2;
  while (used.has(candidate.toLowerCase())) {
    const dot = path.lastIndexOf('.');
    candidate = dot > path.lastIndexOf('/') ? `${path.slice(0, dot)} (${index++})${path.slice(dot)}` : `${path} (${index++})`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
function checkSize(size) {
  if (size > LIMITS.file) throw new Error('单个插件不能超过 10 MB');
}
export function convertEntry(path, bytes) {
  try {
    checkSize(bytes.length);
    const original = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes);
    const result = converter.convertPlugin(original);
    return {path, original, ...result};
  } catch (error) {
    return {path, status: 'failed', error: error.message, converted: 0, errors: 1, diagnostics: []};
  }
}
export async function importPlugins(files, {extractRar, onResult = () => {}, onProgress = () => {}} = {}) {
  const results = [], used = new Set();
  let total = 0, count = 0;
  const emit = (result) => { results.push(result); onResult(result); };
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress({file: file.name, current: i + 1, total: files.length});
    try {
      if (file.size > LIMITS.upload) throw new Error('单个导入文件不能超过 50 MB');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const archive = /\.(zip|rar)$/i.test(file.name);
      let entries;
      const accept = (name, size) => {
        if (!isPluginFile(name) || /(^|\/)__MACOSX\//.test(name) || /(^|\/)\._/.test(name)) return false;
        checkSize(size);
        total += size;
        if (total > LIMITS.total || ++count > LIMITS.count) throw new Error('单次最多解压 100 MB 或 1000 个插件，请分批导入');
        safePath(name);
        return true;
      };
      if (/\.zip$/i.test(file.name)) {
        entries = Object.entries(unzipSync(bytes, {filter: entry => accept(entry.name, entry.originalSize)}));
      } else if (/\.rar$/i.test(file.name)) {
        if (!extractRar) throw new Error('RAR 解压器未加载');
        entries = await extractRar(bytes.buffer, accept);
      } else {
        if (!isPluginFile(file.name)) throw new Error('请选择 .lpx、.plugin、.conf、.txt、.zip 或 .rar 文件');
        accept(file.name, bytes.length);
        entries = [[file.name, bytes]];
      }
      if (!entries.length) throw new Error('压缩包中未找到插件文件（.lpx / .plugin / .conf / .txt）');
      const folder = archive ? safePath(file.name.replace(/\.(zip|rar)$/i, '')) : '';
      for (const [name, content] of entries) {
        const path = uniquePath([folder, safePath(name)].filter(Boolean).join('/'), used);
        emit(convertEntry(path, content));
      }
    } catch (error) {
      emit({path: uniquePath(file.name, used), status: 'failed', error: error.message, converted: 0, errors: 1, diagnostics: []});
    }
  }
  return results;
}
export function createDownloadZip(results) {
  const contents = Object.create(null), used = new Set(['conversion-report.json']);
  for (const result of results) {
    if (typeof result.text !== 'string') continue;
    contents[uniquePath(safePath(result.path), used)] = strToU8(result.text);
  }
  contents['conversion-report.json'] = strToU8(JSON.stringify(results.map(({original, text, ...report}) => report), null, 2));
  return zipSync(contents);
}
