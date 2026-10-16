export interface BaseProjection {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const baseProjection = {
  id: true,
  createdAt: true,
  updatedAt: true,
} as const;
