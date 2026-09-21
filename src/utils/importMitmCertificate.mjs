export class MitmImportError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function parseConfig(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(ca-passphrase|ca-p12)\s*=\s*(.*?)\s*$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (values.has(key)) throw new MitmImportError('duplicate-option');
    values.set(key, match[2]);
  }
  if (!values.has('ca-passphrase') || !values.get('ca-p12')) {
    throw new MitmImportError('missing-option');
  }
  return {password: values.get('ca-passphrase'), p12Base64: values.get('ca-p12')};
}

function decodeP12(base64) {
  const compact = base64.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact) || compact.length % 4 === 1) {
    throw new MitmImportError('invalid-base64');
  }
  let binary;
  try {
    binary = atob(compact);
  } catch {
    throw new MitmImportError('invalid-base64');
  }
  const canonical = btoa(binary);
  if (compact.replace(/=+$/, '') !== canonical.replace(/=+$/, '')) {
    throw new MitmImportError('invalid-base64');
  }
  return {binary, p12Base64: canonical};
}

export async function importMitmCertificate(configText) {
  const {password, p12Base64: pastedBase64} = parseConfig(configText);
  const {binary, p12Base64} = decodeP12(pastedBase64);
  const {default: forge} = await import('node-forge');

  let p12;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binary), false, password);
  } catch {
    throw new MitmImportError('invalid-p12-or-password');
  }

  const certBags = p12.getBags({bagType: forge.pki.oids.certBag})[forge.pki.oids.certBag] || [];
  const keyBags = [
    ...(p12.getBags({bagType: forge.pki.oids.keyBag})[forge.pki.oids.keyBag] || []),
    ...(p12.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag})[forge.pki.oids.pkcs8ShroudedKeyBag] || []),
  ];
  const caBag = certBags.find(({cert}) =>
    cert?.getExtension('basicConstraints')?.cA &&
    keyBags.some(({key}) => key?.n && cert.publicKey?.n &&
      key.n.compareTo(cert.publicKey.n) === 0 &&
      key.e.compareTo(cert.publicKey.e) === 0),
  );
  if (!caBag) throw new MitmImportError('missing-ca-key');

  return {
    certificatePem: forge.pki.certificateToPem(caBag.cert),
    p12Bytes: Uint8Array.from(binary, char => char.charCodeAt(0)),
    p12Base64,
    password,
  };
}
