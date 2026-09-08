import type { Prisma } from '../../generated/prisma/client';

export const serviceSelect = {
  id: true,
  key: true,
  name: true,
  nameTranslations: true,
  category: true,
  description: true,
  descriptionTranslations: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignments: true, features: true } },
} satisfies Prisma.ServiceSelect;

export const featureDefinitionSelect = {
  id: true,
  key: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  category: true,
  valueType: true,
  parameterLabel: true,
  parameterLabelTranslations: true,
  defaultValue: true,
  valueTranslations: true,
  unit: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { serviceFeatures: true } },
} satisfies Prisma.ServiceFeatureDefinitionSelect;

export const serviceFeatureSelect = {
  id: true,
  serviceId: true,
  definitionId: true,
  key: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  valueType: true,
  parameterLabel: true,
  parameterLabelTranslations: true,
  defaultValue: true,
  valueTranslations: true,
  unit: true,
  status: true,
  customerVisible: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceFeatureSelect;

export const assignmentFeatureSelect = {
  id: true,
  companyServiceId: true,
  serviceFeatureId: true,
  value: true,
  valueTranslations: true,
  source: true,
  customerVisibleOverride: true,
  sortOrderOverride: true,
  createdAt: true,
  updatedAt: true,
  serviceFeature: {
    select: {
      id: true,
      serviceId: true,
      key: true,
      name: true,
      nameTranslations: true,
      description: true,
      descriptionTranslations: true,
      valueType: true,
      parameterLabel: true,
      parameterLabelTranslations: true,
      defaultValue: true,
      valueTranslations: true,
      unit: true,
      status: true,
      customerVisible: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.CompanyServiceFeatureSelect;

export const lifecycleSelect = {
  id: true,
  companyServiceId: true,
  companyId: true,
  fromStatus: true,
  toStatus: true,
  source: true,
  reasonCode: true,
  reason: true,
  actorUserId: true,
  actorEmailSnapshot: true,
  effectiveAt: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.CompanyServiceLifecycleEventSelect;

export const assignmentSelect = {
  id: true,
  companyId: true,
  serviceId: true,
  displayName: true,
  displayNameTranslations: true,
  status: true,
  serviceUrl: true,
  startsAt: true,
  expiresAt: true,
  notes: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  company: {
    select: { id: true, name: true, nameTranslations: true, status: true },
  },
  service: {
    select: {
      id: true,
      key: true,
      name: true,
      nameTranslations: true,
      description: true,
      descriptionTranslations: true,
      category: true,
      status: true,
    },
  },
} satisfies Prisma.CompanyServiceSelect;

export type ServiceRecord = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect;
}>;

export type FeatureDefinitionRecord =
  Prisma.ServiceFeatureDefinitionGetPayload<{
    select: typeof featureDefinitionSelect;
  }>;

export type AssignmentRecord = Prisma.CompanyServiceGetPayload<{
  select: typeof assignmentSelect;
}>;

export type AssignmentFeatureRecord = Prisma.CompanyServiceFeatureGetPayload<{
  select: typeof assignmentFeatureSelect;
}>;

export type LifecycleRecord = Prisma.CompanyServiceLifecycleEventGetPayload<{
  select: typeof lifecycleSelect;
}>;

export type VisibleAssignment = Omit<AssignmentRecord, 'internalNotes'> & {
  internalNotes?: string | null;
};
