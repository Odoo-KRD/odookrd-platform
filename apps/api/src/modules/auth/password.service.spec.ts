import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes a password using Argon2id', async () => {
    const password = 'Correct-Horse-Battery-Staple';

    const hash = await service.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toContain('$argon2id$');
  });

  it('verifies a correct password', async () => {
    const password = 'Correct-Horse-Battery-Staple';
    const hash = await service.hashPassword(password);

    await expect(service.verifyPassword(hash, password)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hashPassword('Correct-Horse-Battery-Staple');

    await expect(
      service.verifyPassword(hash, 'Incorrect-Password'),
    ).resolves.toBe(false);
  });

  it('rejects a malformed password hash safely', async () => {
    await expect(
      service.verifyPassword('not-a-valid-argon2-hash', 'password'),
    ).resolves.toBe(false);
  });

  it('produces different hashes for the same password', async () => {
    const password = 'Correct-Horse-Battery-Staple';

    const firstHash = await service.hashPassword(password);
    const secondHash = await service.hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
  });

  it('uses dummy verification when no password hash exists', async () => {
    await expect(
      service.verifyPasswordOrDummy(null, 'Unknown-Account-Password'),
    ).resolves.toBe(false);
  });

  it('verifies a real password through verifyPasswordOrDummy', async () => {
    const password = 'Correct-Horse-Battery-Staple';

    const hash = await service.hashPassword(password);

    await expect(service.verifyPasswordOrDummy(hash, password)).resolves.toBe(
      true,
    );

    await expect(
      service.verifyPasswordOrDummy(hash, 'Wrong-Password'),
    ).resolves.toBe(false);
  });
});
