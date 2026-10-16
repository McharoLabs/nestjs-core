import { Inject, Injectable } from '@nestjs/common';
import Hashids from 'hashids';
import { CORE_CONFIG } from '../../constants/core.constants';
import type { ICore } from '../../interfaces/core.interface';
import { setMaskerService } from '../masker.registry';

type HashidsConstructorType = new (
  salt: string,
  minLength: number,
) => HashidsInstanceType;

interface HashidsInstanceType {
  encode(id: number): string;
  decode(value: string): (string | number)[];
}

@Injectable()
export class MaskerService {
  private readonly hashids: HashidsInstanceType;

  public constructor(
    @Inject(CORE_CONFIG)
    config: ICore,
  ) {
    const HashidsConstructor = Hashids as unknown as HashidsConstructorType;

    this.hashids = new HashidsConstructor(config.salt, 32);

    setMaskerService(this);
  }

  public mask(id: number): string {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('Invalid ID provided');
    }

    return this.hashids.encode(id);
  }

  public unmask(maskedId: string): number {
    if (typeof maskedId !== 'string' || !maskedId) {
      throw new Error('Invalid ID provided');
    }

    let decoded: (string | number)[];

    try {
      decoded = this.hashids.decode(maskedId);
    } catch {
      throw new Error('Invalid ID provided');
    }

    if (decoded.length !== 1) {
      throw new Error('Invalid ID provided');
    }

    const id = Number(decoded[0]);

    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error('Invalid ID provided');
    }

    return id;
  }

  public maskNullable(id?: number | null): string | null {
    if (id === null || id === undefined) {
      return null;
    }

    return this.mask(id);
  }

  public unmaskNullable(maskedId?: string | null): number | null {
    if (maskedId === null || maskedId === undefined) {
      return null;
    }

    return this.unmask(maskedId);
  }
}
