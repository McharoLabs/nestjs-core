import type { ObjectLiteral } from 'typeorm';

export interface AuditContextStore {
  userId: string | null;
}

export interface AuthenticatedUser {
  readonly id: number | string;
}

export interface AuthenticatedRequest {
  readonly user?: AuthenticatedUser;
}

export interface AuditableEntity extends ObjectLiteral {
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
}

export function isAuditableEntity(
  entity: ObjectLiteral | undefined,
): entity is AuditableEntity {
  if (entity === undefined) {
    return false;
  }

  return (
    'createdBy' in entity ||
    'updatedBy' in entity ||
    'deletedBy' in entity
  );
}