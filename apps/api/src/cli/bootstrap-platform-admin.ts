import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

import { AppModule } from '../app.module';
import { PlatformAdminBootstrapService } from '../modules/auth/platform-admin-bootstrap.service';

class PromptOutput extends Writable {
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  override _write(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (!this.muted) {
      if (typeof chunk === 'string') {
        process.stdout.write(chunk, encoding);
      } else if (Buffer.isBuffer(chunk)) {
        process.stdout.write(chunk);
      } else {
        process.stdout.write(String(chunk));
      }
    }

    callback();
  }
}

async function askHidden(
  readline: ReturnType<typeof createInterface>,
  output: PromptOutput,
  question: string,
): Promise<string> {
  process.stdout.write(question);
  output.setMuted(true);

  try {
    return await readline.question('');
  } finally {
    output.setMuted(false);
    process.stdout.write('\n');
  }
}

async function main(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Platform administrator bootstrap requires an interactive terminal.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
    abortOnError: false,
  });

  try {
    const bootstrapService = app.get(PlatformAdminBootstrapService);

    const output = new PromptOutput();

    const readline = createInterface({
      input: process.stdin,
      output,
      terminal: true,
    });

    try {
      const email = (await readline.question('Platform admin email: ')).trim();

      const password = await askHidden(readline, output, 'Password: ');

      const passwordConfirmation = await askHidden(
        readline,
        output,
        'Confirm password: ',
      );

      if (password !== passwordConfirmation) {
        throw new Error('Password confirmation does not match.');
      }

      const administrator = await bootstrapService.createFirstPlatformAdmin(
        email,
        password,
      );

      console.log(
        `Platform administrator created successfully: ${administrator.email}`,
      );
    } finally {
      readline.close();
    }
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : 'Unknown platform administrator bootstrap error.';

  console.error(`Platform administrator bootstrap failed: ${message}`);

  process.exitCode = 1;
});
