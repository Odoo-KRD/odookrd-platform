import { BadRequestException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { AccountScope, TicketStatus } from '../../generated/prisma/enums';
import {
  assertAttachableFiles,
  CUSTOMER_VISIBLE_MESSAGE_WHERE,
  formatTicketReference,
  MAX_ATTACHMENTS_PER_MESSAGE,
  normalizeMessageBody,
  statusAfterCustomerReply,
  ticketYear,
} from './helpdesk.rules';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const FILE_A = '0b6f2b1e-6f5a-4d7e-9f3c-1a2b3c4d5e01';
const FILE_B = '0b6f2b1e-6f5a-4d7e-9f3c-1a2b3c4d5e02';

function transactionWith(eligibleIds: string[], alreadyAttached = 0) {
  let capturedWhere: unknown;

  const transaction = {
    fileAsset: {
      findMany: jest.fn((args: { where: unknown }) => {
        capturedWhere = args.where;
        return Promise.resolve(eligibleIds.map((id) => ({ id })));
      }),
    },
    ticketAttachment: {
      count: jest.fn().mockResolvedValue(alreadyAttached),
    },
  } as unknown as Prisma.TransactionClient;

  return { transaction, where: () => capturedWhere };
}

describe('helpdesk rules', () => {
  it('keeps internal notes out of the customer message filter', () => {
    expect(CUSTOMER_VISIBLE_MESSAGE_WHERE).toEqual({ isInternal: false });
  });

  it('formats references with a zero-padded yearly sequence', () => {
    expect(formatTicketReference(2026, 41)).toBe('TKT-2026-00041');
    expect(formatTicketReference(2026, 123456)).toBe('TKT-2026-123456');
  });

  it('numbers by the platform-local year, not the UTC year', () => {
    // 22:30 UTC on 31 Dec is 01:30 on 1 Jan in Asia/Baghdad.
    expect(ticketYear(new Date('2025-12-31T22:30:00Z'))).toBe(2026);
    expect(ticketYear(new Date('2025-12-31T20:30:00Z'))).toBe(2025);
  });

  it('reopens waiting and resolved tickets on a customer reply', () => {
    expect(statusAfterCustomerReply(TicketStatus.WAITING_ON_CUSTOMER)).toBe(
      TicketStatus.OPEN,
    );
    expect(statusAfterCustomerReply(TicketStatus.RESOLVED)).toBe(
      TicketStatus.OPEN,
    );
    expect(statusAfterCustomerReply(TicketStatus.IN_PROGRESS)).toBe(
      TicketStatus.IN_PROGRESS,
    );
  });

  it('rejects an empty message body', () => {
    expect(() => normalizeMessageBody('   ')).toThrow(BadRequestException);
    expect(normalizeMessageBody('  hello ')).toBe('hello');
  });

  describe('assertAttachableFiles', () => {
    const input = { companyId: COMPANY_ID, uploaderUserId: 'user-1' };

    it('returns no ids and skips queries when nothing is attached', async () => {
      const { transaction } = transactionWith([]);

      await expect(
        assertAttachableFiles(transaction, { ...input, fileAssetIds: [] }),
      ).resolves.toEqual([]);
    });

    it('only accepts live company files uploaded by the same user', async () => {
      const { transaction, where } = transactionWith([FILE_A]);

      await expect(
        assertAttachableFiles(transaction, {
          ...input,
          fileAssetIds: [FILE_A, FILE_A],
        }),
      ).resolves.toEqual([FILE_A]);

      expect(where()).toMatchObject({
        id: { in: [FILE_A] },
        accountScope: AccountScope.COMPANY,
        companyId: COMPANY_ID,
        uploadedByUserId: 'user-1',
        deletedAt: null,
        mimeType: { notIn: ['image/svg+xml'] },
      });
    });

    it('rejects when any file is not eligible', async () => {
      const { transaction } = transactionWith([FILE_A]);

      await expect(
        assertAttachableFiles(transaction, {
          ...input,
          fileAssetIds: [FILE_A, FILE_B],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a file already attached to a ticket', async () => {
      const { transaction } = transactionWith([FILE_A], 1);

      await expect(
        assertAttachableFiles(transaction, {
          ...input,
          fileAssetIds: [FILE_A],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects more than the per-message limit', async () => {
      const { transaction } = transactionWith([]);
      const ids = Array.from(
        { length: MAX_ATTACHMENTS_PER_MESSAGE + 1 },
        (_, index) =>
          `0b6f2b1e-6f5a-4d7e-9f3c-1a2b3c4d5f${String(index).padStart(2, '0')}`,
      );

      await expect(
        assertAttachableFiles(transaction, { ...input, fileAssetIds: ids }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
