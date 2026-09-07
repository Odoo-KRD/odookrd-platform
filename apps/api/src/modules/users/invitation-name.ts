import { BadRequestException } from '@nestjs/common';

/** Normalize an individual user's profile name before consuming an invitation. */
export function normalizeInvitationName(value: string): string {
  if (
    typeof value !== 'string' ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    throw new BadRequestException('Enter a valid full name.');
  }
  const name = value.trim().replace(/\s+/gu, ' ');
  if (name.length < 2 || name.length > 160) {
    throw new BadRequestException(
      'Full name must contain 2 to 160 characters.',
    );
  }
  return name;
}
