// Shared by the browser worker and extraction tests; always consume generators.
export async function extractRarArchive(data, {createExtractor, wasmBinary, accept}) {
  const extractor = await createExtractor({data, wasmBinary});
  const entries = [];
  const archive = extractor.extract({files: header => !header.flags.directory && accept(header.name, header.unpSize)});
  if (archive.arcHeader.flags.volume) throw new Error('分卷 RAR 请先解压再导入');
  for (const file of archive.files) {
    if (file.extraction) entries.push([file.fileHeader.name, file.extraction]);
  }
  return entries;
}
