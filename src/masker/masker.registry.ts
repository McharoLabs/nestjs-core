import type { MaskerService } from './services/masker.service';

let maskerService: MaskerService | undefined;

export function resetMaskerService(): void {
  maskerService = undefined;
}

export function setMaskerService(service: MaskerService): void {
  maskerService = service;
}

export function getMaskerService(): MaskerService {
  if (!maskerService) {
    throw new Error('MaskerService has not been initialized');
  }

  return maskerService;
}
