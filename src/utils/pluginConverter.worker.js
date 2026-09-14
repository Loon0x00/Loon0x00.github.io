import {createExtractorFromData} from 'node-unrar-js/esm/index.esm.js';
import {extractRarArchive} from './rarArchive.mjs';
import {importPlugins, createDownloadZip} from './pluginBatch.mjs';

let wasmBinary;
async function extractRar(data, accept) {
  if (!wasmBinary) {
    const response = await fetch(new URL('node-unrar-js/esm/js/unrar.wasm', import.meta.url));
    if (!response.ok) throw new Error('RAR 解压器加载失败，请重试');
    wasmBinary = await response.arrayBuffer();
  }
  return extractRarArchive(data, {createExtractor: createExtractorFromData, wasmBinary, accept});
}
self.onmessage = async ({data}) => {
  try {
    if (data.type === 'zip') {
      const bytes = createDownloadZip(data.results);
      self.postMessage({type: 'zip', bytes}, [bytes.buffer]);
      return;
    }
    await importPlugins(data.files, {
      extractRar,
      onResult: result => self.postMessage({type: 'result', result}),
      onProgress: progress => self.postMessage({type: 'progress', progress}),
    });
    self.postMessage({type: 'done'});
  } catch (error) {
    self.postMessage({type: 'error', message: error.message});
  }
};
