import type { ConfigService } from '@nestjs/config';

import { SettingsCryptoService } from './settings-crypto.service';

describe('SettingsCryptoService', () => {
  const validKey = Buffer.alloc(32, 19).toString('base64');

  function createService(encodedKey: string = validKey): SettingsCryptoService {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(encodedKey),
    } as unknown as ConfigService;

    return new SettingsCryptoService(configService);
  }

  it('encrypts and decrypts secrets with their exact setting context', () => {
    const service = createService();
    const context = 'platform:notifications.email.amazon_ses.secret_access_key';
    const encrypted = service.encrypt('sensitive-ses-secret', context);

    expect(encrypted).toMatch(/^v1:[^:]+:[^:]+:[^:]+$/);
    expect(encrypted).not.toContain('sensitive-ses-secret');
    expect(service.decrypt(encrypted, context)).toBe('sensitive-ses-secret');
  });

  it('uses a fresh authenticated nonce for every encryption', () => {
    const service = createService();
    const context = 'platform:notifications.whatsapp.access_token';

    expect(service.encrypt('same-token', context)).not.toBe(
      service.encrypt('same-token', context),
    );
  });

  it('rejects moving encrypted secrets into a different setting scope', () => {
    const service = createService();
    const encrypted = service.encrypt(
      'sensitive-token',
      'platform:notifications.whatsapp.access_token',
    );

    expect(() =>
      service.decrypt(
        encrypted,
        'company:other:notifications.whatsapp.access_token',
      ),
    ).toThrow('Encrypted setting cannot be decrypted.');
  });

  it('rejects modified encrypted payloads', () => {
    const service = createService();
    const context = 'platform:notifications.email.amazon_ses.access_key_id';
    const encrypted = service.encrypt('credential', context);
    const parts = encrypted.split(':');
    const ciphertext = Buffer.from(parts[3], 'base64url');
    ciphertext[0] ^= 1;
    parts[3] = ciphertext.toString('base64url');

    expect(() => service.decrypt(parts.join(':'), context)).toThrow(
      'Encrypted setting cannot be decrypted.',
    );
  });

  it('refuses an encryption key that does not contain 32 bytes', () => {
    const invalidKey = Buffer.alloc(16, 1).toString('base64');

    expect(() => createService(invalidKey)).toThrow('SETTINGS_ENCRYPTION_KEY');
  });
});
