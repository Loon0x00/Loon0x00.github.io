import assert from 'node:assert/strict';
import test from 'node:test';
import {createIosCertificateProfile} from './createIosCertificateProfile.mjs';
import {createMitmCertificate} from './createMitmCertificate.mjs';
import {importMitmCertificate, MitmImportError} from './importMitmCertificate.mjs';

test('imports a generated Loon CA configuration and preserves its export data', async () => {
  const generated = await createMitmCertificate();
  const imported = await importMitmCertificate(
    `[MitM]\nca-passphrase = ${generated.password}\nca-p12 = ${generated.p12Base64}\n`,
  );
  assert.equal(imported.certificatePem, generated.certificatePem);
  assert.equal(imported.p12Base64, generated.p12Base64);
  assert.deepEqual(imported.p12Bytes, generated.p12Bytes);
  assert.equal(imported.password, generated.password);
  const profile = createIosCertificateProfile(imported.certificatePem);
  assert.match(profile, /<key>PayloadType<\/key><string>com\.apple\.security\.root<\/string>/);
  assert.match(profile, /<key>PayloadContent<\/key><data>[A-Za-z0-9+/=]+<\/data>/);

  await assert.rejects(
    importMitmCertificate(`ca-passphrase = wrong\nca-p12 = ${generated.p12Base64}`),
    error => error instanceof MitmImportError && error.code === 'invalid-p12-or-password',
  );
});

test('rejects missing and malformed configuration values', async () => {
  await assert.rejects(importMitmCertificate('ca-passphrase = secret'), {
    code: 'missing-option',
  });
  await assert.rejects(importMitmCertificate('ca-passphrase = secret\nca-p12 = not-base64!'), {
    code: 'invalid-base64',
  });
});
