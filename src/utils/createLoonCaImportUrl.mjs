export function createLoonCaImportUrl({password, p12Base64}) {
  const p12Base64Url = p12Base64
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
  return `loon://import-ca?ca-passphrase=${encodeURIComponent(password)}&ca-p12=${p12Base64Url}`;
}
