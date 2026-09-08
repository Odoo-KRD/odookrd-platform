import { AccountScope } from '../../generated/prisma/enums';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { resolveEntitlement } from '../subscriptions/subscription-entitlement';
import type {
  AssignmentFeatureRecord,
  AssignmentRecord,
  FeatureDefinitionRecord,
  LifecycleRecord,
  ServiceRecord,
  VisibleAssignment,
} from './services.selectors';

export function presentService(record: ServiceRecord) {
  const { _count, ...service } = record;
  return {
    ...service,
    assignmentCount: _count.assignments,
    featureCount: _count.features,
  };
}

export function presentFeatureDefinition(record: FeatureDefinitionRecord) {
  const { _count, ...definition } = record;

  return {
    ...definition,
    serviceCount: _count.serviceFeatures,
  };
}

export function presentAssignmentFeature(
  record: AssignmentFeatureRecord,
  principal: AuthenticatedPrincipal,
) {
  const { serviceFeature, ...assignment } = record;
  const {
    defaultValue,
    valueTranslations: catalogValueTranslations,
    serviceId,
    ...feature
  } = serviceFeature;
  void defaultValue;
  void catalogValueTranslations;
  void serviceId;

  const customerVisible =
    record.customerVisibleOverride ?? serviceFeature.customerVisible;
  const sortOrder = record.sortOrderOverride ?? serviceFeature.sortOrder;

  if (principal.accountScope === AccountScope.PLATFORM) {
    return { ...assignment, customerVisible, sortOrder, feature };
  }

  const {
    source,
    customerVisibleOverride,
    sortOrderOverride,
    ...visibleAssignment
  } = assignment;
  void source;
  void customerVisibleOverride;
  void sortOrderOverride;

  return { ...visibleAssignment, customerVisible, sortOrder, feature };
}

export function presentLifecycleEvent(
  record: LifecycleRecord,
  principal: AuthenticatedPrincipal,
) {
  if (principal.accountScope === AccountScope.PLATFORM) {
    return record;
  }

  return {
    id: record.id,
    fromStatus: record.fromStatus,
    toStatus: record.toStatus,
    source: record.source,
    effectiveAt: record.effectiveAt,
    createdAt: record.createdAt,
  };
}

/**
 * Presents one assignment, attaching its derived entitlement.
 *
 * The entitlement is computed rather than stored, so an expired subscription is
 * reported accurately even before the Stage 4C sweep has run. Feature rows,
 * notes and configuration are returned unchanged whatever the entitlement says:
 * the data remains, tagged expired.
 */
export function presentAssignment(
  record: AssignmentRecord,
  principal: AuthenticatedPrincipal,
  now: Date = new Date(),
): VisibleAssignment {
  const { internalNotes, subscription, ...visible } = record;

  const entitlement = resolveEntitlement(
    {
      billingModel: record.service.billingModel,
      assignmentStatus: record.status,
      subscription,
    },
    now,
  );

  if (principal.accountScope === AccountScope.PLATFORM) {
    return { ...visible, internalNotes, entitlement };
  }

  return { ...visible, entitlement };
}
