import { Column } from 'typeorm';

export abstract class BaseAuditableEntity {
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  public createdBy: string | null = null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  public updatedBy: string | null = null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  public deletedBy: string | null = null;
}
