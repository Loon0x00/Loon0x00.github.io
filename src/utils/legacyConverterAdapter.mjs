import converter from './loon-legacy-converter.js';

// The conversion engine comes from drafts/loon-legacy-converter.js (without its
// Node CLI). This adapter only handles the existing pages' document/UI contract.
export function convertConfiguration(source, kind, {includeSection = true} = {}) {
  const input = String(source ?? '');
  const stats = {converted: 0, unchanged: 0, failed: 0};
  if (!input.trim()) return {output: input, issues: [], stats};

  const chunks = input.split(/(\r\n|\n|\r)/);
  const heading = /^\s*\[([^\]]+)\]\s*(?:[#;].*)?$/;
  const hasSections = chunks.some((line, index) => index % 2 === 0 && heading.test(line));
  const argumentTypes = converter.argumentTypes(input);
  const issues = [];
  let section = hasSections ? '' : kind;

  for (let index = 0; index < chunks.length; index += 2) {
    const line = chunks[index];
    const match = heading.exec(line);
    if (match) section = match[1].toLowerCase();
    if (match || section !== kind || /^\s*(?:$|#|;|\/\/)/.test(line)) {
      stats.unchanged += 1;
      continue;
    }
    const result = converter.convertLine(line, {kind, argumentTypes});
    chunks[index] = result.text;
    stats[result.status === 'error' ? 'failed' : result.status] += 1;
    issues.push(...result.diagnostics.map((diagnostic) => ({
      line: index / 2 + 1,
      level: diagnostic.severity,
      code: diagnostic.code,
      message: `${diagnostic.message}，已保留原文`,
    })));
  }

  let output = chunks.join('');
  if (includeSection && !hasSections) {
    const newline = input.match(/\r\n|\n|\r/)?.[0] || '\n';
    const bom = output.startsWith('\uFEFF') ? '\uFEFF' : '';
    output = `${bom}[${kind === 'rewrite' ? 'Rewrite' : 'Script'}]${newline}${output.slice(bom.length)}`;
  }
  return {output, issues, stats};
}
