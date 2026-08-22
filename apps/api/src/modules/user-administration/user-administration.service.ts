import { createHash, randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccountScope,
  AuthTokenType,
  NotificationChannel,
  NotificationDeliveryStatus,
  Prisma,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { NotificationProviderError } from '../notifications/notification-provider.error';
import { EmailProviderService } from '../notifications/providers/email-provider.service';
import { WhatsAppProviderService } from '../notifications/providers/whatsapp-provider.service';
import { SettingsService } from '../settings/settings.service';
import { InvitationTemplateService } from './invitation-template.service';

const COMPANY_ADMIN = 'company_admin';
const PLATFORM_ADMIN = 'platform_admin';
const INVITATION_LIFETIME_MS = 24 * 60 * 60 * 1000;

const targetSelect = {
  id: true,
  email: true,
  accountScope: true,
  companyId: true,
  status: true,
  whatsappNumber: true,
  userRoles: {
    select: {
      role: {
        select: {
          id: true,
          key: true,
          scope: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type TargetUser = Prisma.UserGetPayload<{ select: typeof targetSelect }>;

const dispatchSelect = {
  id: true,
  expiresAt: true,
  createdAt: true,
  deliveries: {
    select: {
      channel: true,
      status: true,
      attemptCount: true,
      failureCode: true,
      lastAttemptAt: true,
      sentAt: true,
    },
    orderBy: { channel: 'asc' },
  },
} satisfies Prisma.UserInvitationDispatchSelect;

@Injectable()
export class UserAdministrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly emailProvider: EmailProviderService,
    private readonly whatsappProvider: WhatsAppProviderService,
    private readonly templates: InvitationTemplateService,
  ) {}

  async details(principal: AuthenticatedPrincipal, userId: string) {
    const target = await this.target(principal, userId);
    const [openInvitation, lastDispatch, canRemoveAdminRole] =
      await Promise.all([
        this.prisma.authToken.findFirst({
          where: {
            userId: target.id,
            type: AuthTokenType.INVITATION,
            usedAt: null,
          },
          select: { expiresAt: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        this.prisma.userInvitationDispatch.findFirst({
          where: { userId: target.id, companyId: target.companyId },
          select: dispatchSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        this.canRemoveAdministrativeRole(target),
      ]);

    return {
      userId: target.id,
      whatsappNumber: target.whatsappNumber,
      canRemoveAdminRole,
      invitation: openInvitation
        ? {
            active: openInvitation.expiresAt.getTime() > Date.now(),
            expiresAt: openInvitation.expiresAt,
            lastDispatch,
          }
        : null,
    };
  }

  async deliverExisting(
    principal: AuthenticatedPrincipal,
    userId: string,
    token: string,
    locale: ApiLocale,
    whatsappNumber?: string,
  ) {
    let target = await this.target(principal, userId);
    this.assertInvited(target);

    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.authToken.findFirst({
      where: {
        userId: target.id,
        type: AuthTokenType.INVITATION,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { expiresAt: true },
    });

    if (!invitation) {
      throw new ConflictException('The invitation is invalid or has expired.');
    }

    if (
      whatsappNumber !== undefined &&
      whatsappNumber !== target.whatsappNumber
    ) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: target.id },
          data: { whatsappNumber },
        }),
        this.prisma.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: target.companyId,
            action: 'user.whatsapp.updated',
            targetType: 'user',
            targetId: target.id,
            metadata: { configured: true },
          },
        }),
      ]);
      target = { ...target, whatsappNumber };
    }

    return this.deliverToken(
      principal,
      target,
      token,
      invitation.expiresAt,
      locale,
    );
  }

  async resend(
    principal: AuthenticatedPrincipal,
    userId: string,
    locale: ApiLocale,
    whatsappNumber?: string,
  ) {
    let target = await this.target(principal, userId);
    this.assertInvited(target);

    if (
      whatsappNumber !== undefined &&
      whatsappNumber !== target.whatsappNumber
    ) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: target.id },
          data: { whatsappNumber },
        }),
        this.prisma.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: target.companyId,
            action: 'user.whatsapp.updated',
            targetType: 'user',
            targetId: target.id,
            metadata: { configured: true },
          },
        }),
      ]);
      target = { ...target, whatsappNumber };
    }

    const invitation = await this.rotateInvitation(principal, target);
    return this.deliverToken(
      principal,
      target,
      invitation.token,
      invitation.expiresAt,
      locale,
    );
  }

  async regenerate(principal: AuthenticatedPrincipal, userId: string) {
    const target = await this.target(principal, userId);
    this.assertInvited(target);
    return this.rotateInvitation(principal, target);
  }

  async replaceRoles(
    principal: AuthenticatedPrincipal,
    userId: string,
    roleKeys: readonly string[],
  ) {
    const target = await this.target(principal, userId);
    const uniqueKeys = [...new Set(roleKeys)];

    if (uniqueKeys.length < 1 || uniqueKeys.length > 20) {
      throw new BadRequestException('Choose at least one valid role.');
    }

    const expectedScope =
      target.accountScope === AccountScope.PLATFORM
        ? RoleScope.PLATFORM
        : RoleScope.COMPANY;

    const roles = await this.prisma.role.findMany({
      where: { key: { in: uniqueKeys } },
      select: { id: true, key: true, scope: true },
    });

    if (
      roles.length !== uniqueKeys.length ||
      roles.some((role) => role.scope !== expectedScope)
    ) {
      throw new BadRequestException(
        'One or more selected roles are outside the permitted account scope.',
      );
    }

    const currentKeys = new Set(target.userRoles.map(({ role }) => role.key));
    const nextKeys = new Set(roles.map((role) => role.key));

    if (
      target.status === UserStatus.ACTIVE &&
      currentKeys.has(COMPANY_ADMIN) &&
      !nextKeys.has(COMPANY_ADMIN) &&
      !(await this.canRemoveAdministrativeRole(target))
    ) {
      throw new ConflictException(
        'The final active company administrator cannot have its administrative role removed.',
      );
    }

    if (
      target.status === UserStatus.ACTIVE &&
      currentKeys.has(PLATFORM_ADMIN) &&
      !nextKeys.has(PLATFORM_ADMIN) &&
      !(await this.canRemoveAdministrativeRole(target))
    ) {
      throw new ConflictException(
        'The final active platform administrator cannot have its administrative role removed.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userRole.deleteMany({ where: { userId: target.id } });
      await transaction.userRole.createMany({
        data: roles.map((role) => ({ userId: target.id, roleId: role.id })),
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: target.companyId,
          action: 'user.roles.updated',
          targetType: 'user',
          targetId: target.id,
          metadata: { roleKeys: [...nextKeys].sort() },
        },
      });
    });

    return { id: target.id, roles: [...nextKeys].sort() };
  }

  private async deliverToken(
    principal: AuthenticatedPrincipal,
    target: TargetUser,
    token: string,
    expiresAt: Date,
    locale: ApiLocale,
  ) {
    const [emailEnabled, whatsappEnabled] = await Promise.all([
      this.settingBoolean('notifications.email.enabled', target.companyId),
      this.settingBoolean('notifications.whatsapp.enabled', target.companyId),
    ]);

    const dispatch = await this.prisma.userInvitationDispatch.create({
      data: {
        userId: target.id,
        companyId: target.companyId,
        expiresAt,
        deliveries: {
          create: [
            emailEnabled
              ? {
                  channel: NotificationChannel.EMAIL,
                  status: NotificationDeliveryStatus.PENDING,
                }
              : {
                  channel: NotificationChannel.EMAIL,
                  status: NotificationDeliveryStatus.SKIPPED,
                  failureCode: 'CHANNEL_DISABLED',
                },
            whatsappEnabled && target.whatsappNumber
              ? {
                  channel: NotificationChannel.WHATSAPP,
                  status: NotificationDeliveryStatus.PENDING,
                }
              : {
                  channel: NotificationChannel.WHATSAPP,
                  status: NotificationDeliveryStatus.SKIPPED,
                  failureCode: whatsappEnabled
                    ? 'DESTINATION_MISSING'
                    : 'CHANNEL_DISABLED',
                },
          ],
        },
      },
      select: { id: true },
    });

    const rendered = this.templates.render(locale, token, expiresAt);
    const pending = await this.prisma.userInvitationDelivery.findMany({
      where: {
        dispatchId: dispatch.id,
        status: NotificationDeliveryStatus.PENDING,
      },
      select: { id: true, channel: true },
      orderBy: { channel: 'asc' },
    });

    for (const delivery of pending) {
      if (delivery.channel === NotificationChannel.EMAIL) {
        await this.attemptDelivery(delivery.id, async () =>
          this.emailProvider.send(
            target.companyId,
            target.email,
            rendered.subject,
            rendered.emailBody,
          ),
        );
        continue;
      }

      if (
        delivery.channel === NotificationChannel.WHATSAPP &&
        target.whatsappNumber
      ) {
        const whatsappNumber = target.whatsappNumber;
        await this.attemptDelivery(delivery.id, async () =>
          this.whatsappProvider.send(
            target.companyId,
            whatsappNumber,
            rendered.whatsappBody,
          ),
        );
      }
    }

    const finalDispatch = await this.prisma.userInvitationDispatch.findUnique({
      where: { id: dispatch.id },
      select: dispatchSelect,
    });

    if (!finalDispatch) {
      throw new NotFoundException('Invitation delivery record was not found.');
    }

    await this.prisma.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: target.companyId,
        action: 'user.invitation.dispatched',
        targetType: 'user',
        targetId: target.id,
        metadata: {
          dispatchId: finalDispatch.id,
          channels: finalDispatch.deliveries.map((delivery) => ({
            channel: delivery.channel,
            status: delivery.status,
          })),
        },
      },
    });

    return { expiresAt, dispatch: finalDispatch };
  }

  private async attemptDelivery(
    deliveryId: string,
    send: () => Promise<string | null>,
  ): Promise<void> {
    const now = new Date();
    const claim = await this.prisma.userInvitationDelivery.updateMany({
      where: {
        id: deliveryId,
        status: NotificationDeliveryStatus.PENDING,
        attemptCount: 0,
      },
      data: {
        status: NotificationDeliveryStatus.PROCESSING,
        attemptCount: 1,
        lastAttemptAt: now,
      },
    });

    if (claim.count !== 1) return;

    try {
      const providerMessageId = await send();
      await this.prisma.userInvitationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.SENT,
          providerMessageId,
          failureCode: null,
          sentAt: new Date(),
        },
      });
    } catch (error: unknown) {
      const code =
        error instanceof NotificationProviderError
          ? this.safeFailureCode(error.code)
          : 'DELIVERY_FAILED';

      await this.prisma.userInvitationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          providerMessageId: null,
          failureCode: code,
          sentAt: null,
        },
      });
    }
  }

  private async rotateInvitation(
    principal: AuthenticatedPrincipal,
    target: TargetUser,
  ) {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_LIFETIME_MS);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.authToken.updateMany({
        where: {
          userId: target.id,
          type: AuthTokenType.INVITATION,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      await transaction.authToken.create({
        data: {
          userId: target.id,
          type: AuthTokenType.INVITATION,
          tokenHash,
          expiresAt,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: target.companyId,
          action: 'user.invitation.rotated',
          targetType: 'user',
          targetId: target.id,
          metadata: { expiresAt: expiresAt.toISOString() },
        },
      });
    });

    return { token, expiresAt };
  }

  private async canRemoveAdministrativeRole(
    target: TargetUser,
  ): Promise<boolean> {
    if (target.status !== UserStatus.ACTIVE) return true;

    const roleKey =
      target.accountScope === AccountScope.COMPANY
        ? COMPANY_ADMIN
        : PLATFORM_ADMIN;

    if (!target.userRoles.some(({ role }) => role.key === roleKey)) return true;

    const alternatives = await this.prisma.user.count({
      where: {
        id: { not: target.id },
        accountScope: target.accountScope,
        companyId: target.companyId,
        status: UserStatus.ACTIVE,
        userRoles: { some: { role: { key: roleKey } } },
      },
    });

    return alternatives > 0;
  }

  private async target(
    principal: AuthenticatedPrincipal,
    userId: string,
  ): Promise<TargetUser> {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: targetSelect,
    });

    if (!target) throw new NotFoundException('User was not found.');
    this.assertTargetScope(principal, target);
    return target;
  }

  private assertTargetScope(
    principal: AuthenticatedPrincipal,
    target: TargetUser,
  ): void {
    if (principal.accountScope === AccountScope.PLATFORM) {
      if (principal.companyId !== null) {
        throw new ForbiddenException('Platform account scope is invalid.');
      }
      return;
    }

    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId ||
      target.accountScope !== AccountScope.COMPANY ||
      target.companyId !== principal.companyId
    ) {
      throw new ForbiddenException(
        'Access outside company scope is forbidden.',
      );
    }
  }

  private assertInvited(target: TargetUser): void {
    if (target.status !== UserStatus.INVITED) {
      throw new ConflictException(
        'Invitation controls are available only for invited accounts.',
      );
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async settingBoolean(
    key: string,
    companyId: string | null,
  ): Promise<boolean> {
    const value = await this.settings.resolveValue(key, companyId);
    if (typeof value !== 'boolean') {
      throw new BadRequestException(
        'Notification channel configuration is invalid.',
      );
    }
    return value;
  }

  private safeFailureCode(code: string): string {
    const normalized = code
      .toUpperCase()
      .replace(/[^A-Z0-9_]/gu, '_')
      .slice(0, 80);
    return normalized || 'DELIVERY_FAILED';
  }
}
