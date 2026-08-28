import { createHash } from 'node:crypto';

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  TrainingContentStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { FileStorageService } from '../files/storage/file-storage.service';
import type { ListTrainingCatalogQueryDto } from './dto/training-catalog.dto';
import { TrainingEntitlementService } from './training-entitlement.service';

const catalogCourseSelect = {
  id: true,
  slug: true,
  title: true,
  titleTranslations: true,
  summary: true,
  summaryTranslations: true,
  publishedAt: true,
  coverImageAssetId: true,
  category: {
    select: {
      id: true,
      key: true,
      name: true,
      nameTranslations: true,
    },
  },
  _count: {
    select: {
      sections: { where: { status: TrainingContentStatus.PUBLISHED } },
      lessons: {
        where: {
          status: TrainingContentStatus.PUBLISHED,
          section: { status: TrainingContentStatus.PUBLISHED },
        },
      },
    },
  },
} satisfies Prisma.TrainingCourseSelect;

@Injectable()
export class TrainingCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly storage: FileStorageService,
  ) {}

  async status(principal: AuthenticatedPrincipal) {
    const context = await this.entitlements.resolveCustomerContext(principal);
    return { enabled: context.enabled };
  }

  async list(
    principal: AuthenticatedPrincipal,
    query: ListTrainingCatalogQueryDto,
  ) {
    const context = await this.entitlements.resolveCustomerContext(principal);

    if (!context.enabled) {
      return {
        enabled: false,
        items: [],
        categories: [],
        pagination: { limit: query.limit, offset: query.offset, total: 0 },
      };
    }

    const entitlementWhere = this.entitlements.customerCourseWhere(context);
    const filters: Prisma.TrainingCourseWhereInput[] = [entitlementWhere];
    const search = query.search?.trim();

    if (query.categoryId) {
      filters.push({ categoryId: query.categoryId });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.TrainingCourseWhereInput = { AND: filters };

    const [records, total, categories] = await this.prisma.$transaction([
      this.prisma.trainingCourse.findMany({
        where,
        select: catalogCourseSelect,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCourse.count({ where }),
      this.prisma.trainingCategory.findMany({
        where: {
          status: 'ACTIVE',
          courses: { some: entitlementWhere },
        },
        select: {
          id: true,
          key: true,
          name: true,
          nameTranslations: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      enabled: true,
      items: records.map((record) => {
        const { coverImageAssetId, _count, ...course } = record;
        return {
          ...course,
          hasCover: Boolean(coverImageAssetId),
          sectionCount: _count.sections,
          lessonCount: _count.lessons,
        };
      }),
      categories,
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async get(principal: AuthenticatedPrincipal, slug: string) {
    this.assertSlug(slug);
    const context = await this.entitlements.resolveCustomerContext(principal);

    if (!context.enabled) {
      throw new NotFoundException('Training course was not found.');
    }

    const course = await this.prisma.trainingCourse.findFirst({
      where: {
        AND: [this.entitlements.customerCourseWhere(context), { slug }],
      },
      select: {
        ...catalogCourseSelect,
        sections: {
          where: { status: TrainingContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            title: true,
            titleTranslations: true,
            description: true,
            descriptionTranslations: true,
            sortOrder: true,
            lessons: {
              where: { status: TrainingContentStatus.PUBLISHED },
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                title: true,
                titleTranslations: true,
                description: true,
                descriptionTranslations: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }

    const { coverImageAssetId, _count, ...visibleCourse } = course;

    return {
      ...visibleCourse,
      hasCover: Boolean(coverImageAssetId),
      sectionCount: _count.sections,
      lessonCount: _count.lessons,
    };
  }

  async openCover(principal: AuthenticatedPrincipal, slug: string) {
    this.assertSlug(slug);
    const context = await this.entitlements.resolveCustomerContext(principal);
    if (!context.enabled) {
      throw new NotFoundException('Training course cover was not found.');
    }

    const course = await this.prisma.trainingCourse.findFirst({
      where: {
        AND: [this.entitlements.customerCourseWhere(context), { slug }],
      },
      select: { coverImageAssetId: true },
    });

    if (!course?.coverImageAssetId) {
      throw new NotFoundException('Training course cover was not found.');
    }

    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: course.coverImageAssetId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.IMAGE,
        status: FileAssetStatus.READY,
      },
      select: {
        storageProvider: true,
        storageKey: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        sha256: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Training course cover was not found.');
    }

    const stream = await this.storage.open(
      asset.storageProvider,
      asset.storageKey,
    );
    const chunks: Buffer[] = [];

    try {
      for await (const chunk of stream as AsyncIterable<unknown>) {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
          continue;
        }
        throw new Error('Stored file stream returned an unsupported chunk.');
      }
    } catch {
      throw new InternalServerErrorException(
        'Training course cover could not be read.',
      );
    }

    const buffer = Buffer.concat(chunks);
    const checksum = createHash('sha256').update(buffer).digest('hex');

    if (buffer.length !== asset.sizeBytes || checksum !== asset.sha256) {
      throw new InternalServerErrorException(
        'Training course cover integrity check failed.',
      );
    }

    return {
      buffer,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      sha256: asset.sha256,
    };
  }

  private assertSlug(slug: string): void {
    if (slug.length > 150 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new NotFoundException('Training course was not found.');
    }
  }
}
