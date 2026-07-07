import type { SlotView } from '@/types';

export type SlotCellState =
  | 'FREE'
  | 'FREE_LARGEST_GAP'
  | 'BOOKED'
  | 'MINE'
  | 'PAST'
  | 'NOW_FREE'
  | 'NOW_MINE'
  | 'NOW_BOOKED'
  | 'PENDING'
  | 'CONFLICT';

export interface SlotViewModel {
  key: string; // = startTime (stabiler Schlüssel, auch für FREE-Slots ohne slotId)
  slotId: string | null;
  startTime: string;
  endTime: string;
  isMine: boolean;
  userName: string | null;
  status: 'FREE' | 'BOOKED';
  isNight: boolean;
  isLargestGap: boolean;
  state: SlotCellState;
}

export interface DerivationContext {
  now: number; // Date.now()
  projectTz: string;
  largestGapKeys: Set<string>;
  pendingKeys: Set<string>;
  conflictKey: string | null;
}

export type RawSlot = Pick<SlotView, 'slotId' | 'startTime' | 'endTime' | 'status' | 'isMine'> & {
  userName?: string | null;
};
