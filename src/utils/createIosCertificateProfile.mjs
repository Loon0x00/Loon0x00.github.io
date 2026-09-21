export function createIosCertificateProfile(certificatePem, webCrypto = globalThis.crypto) {
  const certificateBase64 = certificatePem
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\s/g, '');
  if (!certificateBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(certificateBase64)) {
    throw new Error('CA 证书格式不正确。');
  }
  if (!webCrypto?.randomUUID) {
    throw new Error('此浏览器不支持安全的描述文件生成。');
  }

  const profileUuid = webCrypto.randomUUID().toUpperCase();
  const certificateUuid = webCrypto.randomUUID().toUpperCase();
  const identifier = `com.loon.mitm.ca.${profileUuid.toLowerCase()}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadCertificateFileName</key><string>loon-ca.crt</string>
      <key>PayloadContent</key><data>${certificateBase64}</data>
      <key>PayloadDescription</key><string>Loon MitM CA public certificate</string>
      <key>PayloadDisplayName</key><string>Loon MitM CA</string>
      <key>PayloadIdentifier</key><string>${identifier}.certificate</string>
      <key>PayloadType</key><string>com.apple.security.root</string>
      <key>PayloadUUID</key><string>${certificateUuid}</string>
      <key>PayloadVersion</key><integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key><string>Installs the public Loon MitM CA certificate. Enable full trust separately in Settings.</string>
  <key>PayloadDisplayName</key><string>Loon MitM CA</string>
  <key>PayloadIdentifier</key><string>${identifier}</string>
  <key>PayloadOrganization</key><string>Loon</string>
  <key>PayloadType</key><string>Configuration</string>
  <key>PayloadUUID</key><string>${profileUuid}</string>
  <key>PayloadVersion</key><integer>1</integer>
</dict>
</plist>`;
}
