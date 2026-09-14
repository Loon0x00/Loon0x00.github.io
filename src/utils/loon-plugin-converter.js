/* Loon 旧插件迁移入口。语法转换依赖同目录 loon-legacy-converter.js。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./loon-legacy-converter.js'));
  else root.LoonPluginConverter = factory(root.LoonLegacyConverter);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (converter) {
  'use strict';
  if (!converter) throw new Error('请先加载 loon-legacy-converter.js');
  const headingPattern = /^\[([^\]]+)\]\s*(?:[#;].*)?$/;

  /**
   * 转换完整 Loon 插件，仅处理 Rewrite、URL Rewrite、Script 分区中的有效规则行。
   * @param {string} text 原插件全文，支持 BOM、LF、CRLF、CR。
   * @returns {object} 转换文本、状态、分项计数及带原始行号的诊断，不包含插件规则全文日志。
   */
  function convertPlugin(text) {
    if (typeof text !== 'string') throw new TypeError('插件内容必须是字符串');
    const chunks = text.split(/(\r\n|\n|\r)/);
    if (!chunks.some((s, i) => i % 2 === 0 && (headingPattern.test(s.trim()) || /^#!name\s*=/i.test(s.trim())))) {
      throw new Error('输入不是完整 Loon 插件：缺少配置分区或 #!name 元信息');
    }
    const types = converter.argumentTypes(text), diagnostics = [];
    const counts = { rewrite: { total: 0, converted: 0, retained: 0 }, script: { total: 0, converted: 0, retained: 0 } };
    let kind = '', name = '', converted = 0, errors = 0;
    for (let i = 0; i < chunks.length; i += 2) {
      const source = chunks[i].trim(), heading = headingPattern.exec(source);
      if (heading) {
        const section = heading[1].trim().toLowerCase();
        kind = ['rewrite', 'url rewrite'].includes(section) ? 'rewrite' : section === 'script' ? 'script' : '';
        continue;
      }
      const title = /^#!name\s*=\s*(.*)$/i.exec(source);
      if (!name && title) name = title[1];
      if (!kind || !source || /^(?:[#;]|\/\/)/.test(source)) continue;
      counts[kind].total++;
      const result = converter.convertLine(chunks[i], { kind, argumentTypes: types });
      chunks[i] = result.text;
      if (result.status === 'converted') { counts[kind].converted++; converted++; }
      if (result.status === 'error') { counts[kind].retained++; errors++; }
      for (const diagnostic of result.diagnostics) diagnostics.push({ line: i / 2 + 1, kind, ...diagnostic });
    }
    return { text: chunks.join(''), name, status: errors ? 'partial' : converted ? 'converted' : 'unchanged', converted, errors, counts, diagnostics };
  }

  return { convertPlugin };
});
