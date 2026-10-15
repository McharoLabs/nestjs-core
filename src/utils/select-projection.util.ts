import type { EntityMetadata, SelectQueryBuilder } from 'typeorm';

import type { BaseEntity } from '../entities/base.entity';

export type Projection<T extends BaseEntity> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U extends BaseEntity
      ? Projection<U>
      : boolean
    : T[K] extends BaseEntity
      ? Projection<T[K]>
      : boolean;
};

export function selectProjection<T extends BaseEntity>(
  qb: SelectQueryBuilder<T>,
  rootAlias: string,
  projection: Projection<T>,
): SelectQueryBuilder<T> {
  const mainAlias = qb.expressionMap.mainAlias;

  if (!mainAlias?.metadata) {
    throw new Error(`Unable to resolve metadata for "${rootAlias}".`);
  }

  const selections = new Set<string>();

  // Always include the root primary key.
  for (const column of mainAlias.metadata.primaryColumns) {
    selections.add(`${rootAlias}.${column.propertyName}`);
  }

  processProjection(
    qb,
    mainAlias.metadata,
    rootAlias,
    projection as Record<string, unknown>,
    selections,
  );

  return qb.select([...selections]);
}

function processProjection<T extends BaseEntity>(
  qb: SelectQueryBuilder<T>,
  metadata: EntityMetadata,
  alias: string,
  projection: Record<string, unknown>,
  selections: Set<string>,
): void {
  for (const [property, value] of Object.entries(projection)) {
    if (value === false || value === undefined) {
      continue;
    }

    // Resolve entity columns.
    const column = metadata.columns.find(
      (item) => item.propertyName === property,
    );

    if (column) {
      selections.add(`${alias}.${column.propertyName}`);
      continue;
    }

    // Resolve entity relations.
    const relation = metadata.relations.find(
      (item) => item.propertyName === property,
    );

    if (!relation) {
      throw new Error(
        `Property "${property}" was not found on entity "${metadata.name}".`,
      );
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      continue;
    }

    const relationPath = `${alias}.${property}`;

    const join = qb.expressionMap.joinAttributes.find(
      (joinAttribute) => joinAttribute.entityOrProperty === relationPath,
    );

    if (!join?.alias) {
      throw new Error(
        `Relation "${relationPath}" is not joined in the QueryBuilder. ` +
          `Join "${relationPath}" before using it in the projection.`,
      );
    }

    processProjection(
      qb,
      relation.inverseEntityMetadata,
      join.alias.name,
      value as Record<string, unknown>,
      selections,
    );
  }
}
