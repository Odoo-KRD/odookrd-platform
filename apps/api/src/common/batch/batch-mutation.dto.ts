import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class BatchMutationIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids!: string[];
}

export interface BatchMutationItem {
  id: string;
  outcome: 'CHANGED' | 'UNCHANGED';
  updatedAt: Date;
}

export interface BatchMutationResult {
  requested: number;
  changed: number;
  unchanged: number;
  items: BatchMutationItem[];
}

export function batchMutationResult(
  items: BatchMutationItem[],
): BatchMutationResult {
  const changed = items.filter((item) => item.outcome === 'CHANGED').length;

  return {
    requested: items.length,
    changed,
    unchanged: items.length - changed,
    items,
  };
}
