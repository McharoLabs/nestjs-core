import type { SelectQueryBuilder } from 'typeorm';

import type { BaseFilterDto } from '../../response/dto/base-filter.dto';
import type { AppBaseEntity } from '../entities/base.entity';

type AllowedKeys<T> = Exclude<
  keyof T,
  'createdAt' | 'deletedAt' | 'updatedAt' | symbol | number
>;

type Prev = [never, 0, 1, 2, 3, 4];

type NestedPaths<T extends AppBaseEntity, D extends number = 3> = D extends 0
  ? never
  : {
      [K in AllowedKeys<T>]: T[K] extends (infer U)[]
        ? U extends AppBaseEntity
          ? K | `${K & string}.${NestedPaths<U, Prev[D]> & string}`
          : K
        : T[K] extends AppBaseEntity
          ? K | `${K & string}.${NestedPaths<T[K], Prev[D]> & string}`
          : K;
    }[AllowedKeys<T>];

export type FilterField<T extends AppBaseEntity> = NestedPaths<T>;

export interface FilterOptions<T extends AppBaseEntity, S = string> {
  qb: SelectQueryBuilder<T>;
  alias: string;

  query?: BaseFilterDto & {
    query?: string;
    status?: S;
  };

  orSearchFields?: FilterField<T>[];

  statusField?: FilterField<T>;
}

/**
 * Resolves an entity property/relation path to the SQL alias
 * registered in the TypeORM QueryBuilder.
 *
 * Examples:
 *
 *   name
 *   -> permission.name
 *
 *   rolePermissions.role.name
 *   -> role.name
 *
 * This relies on the joins already registered on the QueryBuilder.
 */
function resolveFieldPath<T extends AppBaseEntity>(
  qb: SelectQueryBuilder<T>,
  rootAlias: string,
  field: string,
): string {
  const parts = field.split('.');

  /*
   * Simple field.
   *
   * Example:
   *
   *   name
   *
   * becomes:
   *
   *   permission.name
   */
  if (parts.length === 1) {
    const property = parts[0];

    if (property === undefined) {
      throw new Error(`Invalid field path "${field}".`);
    }

    return `${rootAlias}.${property}`;
  }

  /*
   * Everything except the last part is the relation path.
   *
   * Example:
   *
   *   rolePermissions.role.name
   *
   * relationPath:
   *
   *   rolePermissions.role
   *
   * property:
   *
   *   name
   */
  const relationPath = parts.slice(0, -1).join('.');
  const property = parts[parts.length - 1];

  if (!property) {
    throw new Error(`Invalid field path "${field}".`);
  }

  /*
   * Find the QueryBuilder join corresponding to the relation path.
   *
   * For:
   *
   *   permission.rolePermissions
   *
   * TypeORM has:
   *
   *   parentAlias = permission
   *   relation = rolePermissions
   *   alias = rolePermissions
   *
   * Then for:
   *
   *   rolePermissions.role
   *
   * TypeORM has:
   *
   *   parentAlias = rolePermissions
   *   relation = role
   *   alias = role
   */
  const join = qb.expressionMap.joinAttributes.find((joinAttribute) => {
    const relation = joinAttribute.relation;

    if (!relation) {
      return false;
    }

    const joinAlias = joinAttribute.alias.name;

    if (!joinAlias) {
      return false;
    }

    const parentAlias = joinAttribute.parentAlias;

    if (!parentAlias) {
      return false;
    }

    const fullRelationPath = `${parentAlias}.${relation.propertyPath}`;

    return fullRelationPath === relationPath;
  });

  /*
   * We found the corresponding SQL alias.
   *
   * Example:
   *
   *   rolePermissions.role.name
   *
   * becomes:
   *
   *   role.name
   */
  if (join) {
    return `${join.alias.name}.${property}`;
  }

  /*
   * The caller may have supplied an already-resolved SQL alias.
   *
   * Example:
   *
   *   role.name
   *
   * If TypeORM has no matching relation path, leave it untouched.
   */
  return `${relationPath}.${property}`;
}

/**
 * Applies reusable filtering and global search conditions.
 *
 * Global search:
 *
 *   field1 ILIKE '%term%'
 *   OR field2 ILIKE '%term%'
 *   OR relation.field ILIKE '%term%'
 *
 * Status and date filters use AND.
 *
 * NOTE FOR FUTURE:
 * If AND-based search fields are ever required, reintroduce
 * an `andSearchFields` option and create a separate grouped
 * AND condition before combining it with the OR search group.
 */
export function applySearchFilters<T extends AppBaseEntity, S = string>(
  options: FilterOptions<T, S>,
): SelectQueryBuilder<T> {
  const {
    qb,
    alias,
    query,
    orSearchFields = [],
    statusField = 'status',
  } = options;

  if (!query) {
    return qb;
  }

  /*
   * ============================================================
   * GLOBAL SEARCH
   * ============================================================
   *
   * All search fields are OR'ed together.
   *
   * Example:
   *
   *   permission.name ILIKE :searchTerm
   *   OR permission.description ILIKE :searchTerm
   *   OR role.name ILIKE :searchTerm
   */
  const searchTerm = query.query?.trim();

  if (searchTerm && orSearchFields.length > 0) {
    const augmentedQuery = `%${searchTerm}%`;

    qb.andWhere((subQb) => {
      orSearchFields.forEach((field, index) => {
        const fieldPath = resolveFieldPath(qb, alias, field);

        const condition = `${fieldPath} ILIKE :searchTerm`;

        if (index === 0) {
          subQb.where(condition);
        } else {
          subQb.orWhere(condition);
        }
      });
    });

    qb.setParameter('searchTerm', augmentedQuery);
  }

  /*
   * ============================================================
   * STATUS FILTER
   * ============================================================
   *
   * Status is an additional AND condition.
   */
  if (query.status !== undefined && query.status !== null && statusField) {
    const statusPath = resolveFieldPath(qb, alias, statusField);

    qb.andWhere(`${statusPath} = :status`, {
      status: query.status,
    });
  }

  /*
   * ============================================================
   * CREATED DATE FROM
   * ============================================================
   */
  if (query.createdAtFrom) {
    qb.andWhere(`${alias}.createdAt >= :createdAtFrom`, {
      createdAtFrom: query.createdAtFrom,
    });
  }

  /*
   * ============================================================
   * CREATED DATE TO
   * ============================================================
   */
  if (query.createdAtTo) {
    qb.andWhere(`${alias}.createdAt <= :createdAtTo`, {
      createdAtTo: query.createdAtTo,
    });
  }

  return qb;
}
