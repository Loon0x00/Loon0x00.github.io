const PASSWORD_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PASSWORD_NUMBERS = '0123456789';

function bytesToBinary(bytes) {
  let result = '';
  for (const byte of bytes) result += String.fromCharCode(byte);
  return result;
}

function randomIndex(webCrypto, length) {
  const limit = 256 - (256 % length);
  let value;
  do {
    value = webCrypto.getRandomValues(new Uint8Array(1))[0];
  } while (value >= limit);
  return value % length;
}

function randomPassword(webCrypto) {
  let password = '';
  for (let i = 0; i < 8; i += 1) {
    const chars = randomIndex(webCrypto, 2) === 0 ? PASSWORD_LETTERS : PASSWORD_NUMBERS;
    password += chars[randomIndex(webCrypto, chars.length)];
  }
  return password;
}

function createCaName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `LOON CA(${year}-${month}-${day}) ${date.getTime()}`;
}

export async function createMitmCertificate(webCrypto = globalThis.crypto) {
  if (!webCrypto?.subtle || !webCrypto?.getRandomValues) {
    throw new Error('此浏览器不支持安全的本地证书生成，请使用 HTTPS 或 localhost 打开页面。');
  }

  const {default: forge} = await import('node-forge');
  const keyPair = await webCrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const privateKeyDer = await webCrypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKey = forge.pki.privateKeyFromAsn1(
    forge.asn1.fromDer(bytesToBinary(new Uint8Array(privateKeyDer))),
  );

  const serialBytes = webCrypto.getRandomValues(new Uint8Array(20));
  if (serialBytes.every(byte => byte === 0)) serialBytes[19] = 1;
  const serialHex = [...serialBytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const certificate = forge.pki.createCertificate();
  certificate.publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  certificate.serialNumber = serialBytes[0] & 0x80 ? `00${serialHex}` : serialHex;
  certificate.validity.notBefore = new Date();
  certificate.validity.notAfter = new Date(certificate.validity.notBefore.getTime() + 1825 * 24 * 60 * 60 * 1000);
  const caName = createCaName(certificate.validity.notBefore);
  const name = [{name: 'organizationName', value: 'Loon'}, {name: 'commonName', value: caName}];
  certificate.setSubject(name);
  certificate.setIssuer(name);
  certificate.setExtensions([
    {name: 'basicConstraints', cA: true},
    {name: 'subjectKeyIdentifier'},
  ]);
  certificate.sign(privateKey, forge.md.sha256.create());

  const password = randomPassword(webCrypto);
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [certificate], password, {
    algorithm: 'aes256',
    count: 2048,
    prfAlgorithm: 'sha256',
    generateLocalKeyId: true,
  });
  const p12Binary = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Base64 = btoa(p12Binary);

  return {
    certificatePem: forge.pki.certificateToPem(certificate),
    p12Bytes: Uint8Array.from(p12Binary, char => char.charCodeAt(0)),
    p12Base64,
    password,
  };
}
