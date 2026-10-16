import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BaseAuditableEntity } from './base-auditable.entity';

export abstract class BaseEntity extends BaseAuditableEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn({
    type: 'timestamp with time zone',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
  })
  public updatedAt: Date;

  @Column({
    type: 'boolean',
    default: false,
  })
  public deleted = false;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
  })
  public deletedAt: Date | null = null;
}
