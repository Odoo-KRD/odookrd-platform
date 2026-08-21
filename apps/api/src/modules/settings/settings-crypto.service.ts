import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class SettingsCryptoService {
  private readonly encryptionKey: Buffer;

  constructor(configService: ConfigService) {
    const encodedKey = configService.getOrThrow<string>(
      'SETTINGS_ENCRYPTION_KEY',
    );
    const decodedKey = Buffer.from(encodedKey, 'base64');

    if (
      encodedKey.length !== 44 ||
      decodedKey.length !== 32 ||
      decodedKey.toString('base64') !== encodedKey
    ) {
      throw new Error(
        'SETTINGS_ENCRYPTION_KEY must contain exactly 32 random bytes encoded as base64.',
      );
    }

    this.encryptionKey = decodedKey;
  }

  encrypt(value: string, context: string): string {
    const initializationVector = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      initializationVector,
    );

    cipher.setAAD(Buffer.from(context, 'utf8'));
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authenticationTag = cipher.getAuthTag();

    return [
      'v1',
      initializationVector.toString('base64url'),
      authenticationTag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join(':');
  }

  decrypt(payload: string, context: string): string {
    const parts = payload.split(':');

    if (
      parts.length !== 4 ||
      parts[0] !== 'v1' ||
      parts[1].length === 0 ||
      parts[2].length === 0 ||
      parts[3].length === 0
    ) {
      throw new Error('Encrypted setting has an unsupported format.');
    }

    try {
      const initializationVector = Buffer.from(parts[1], 'base64url');
      const authenticationTag = Buffer.from(parts[2], 'base64url');
      const ciphertext = Buffer.from(parts[3], 'base64url');

      if (
        initializationVector.length !== 12 ||
        authenticationTag.length !== 16 ||
        ciphertext.length === 0
      ) {
        throw new Error('Invalid encrypted-setting component length.');
      }

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        initializationVector,
      );
      decipher.setAAD(Buffer.from(context, 'utf8'));
      decipher.setAuthTag(authenticationTag);

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('Encrypted setting cannot be decrypted.');
    }
  }
}
