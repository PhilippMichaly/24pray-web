import { isNightHour, dayKey, formatSlotRange } from '@/lib/time';
import type { SlotView } from '@/types';
import type { DerivationContext, RawSlot, SlotCellState, SlotViewModel } from './types';

/** Zustands-Matrix (Spec §3.2). Reine Ableitung — testbar ohne React. */
export function deriveSlotState(slot: RawSlot, ctx: DerivationContext): SlotCellState {
  const key = slot.startTime;
  if (ctx.conflictKey === key) return 'CONFLICT';
  if (ctx.pendingKeys.has(key)) return 'PENDING';

  const start = Date.parse(slot.startTime);
  const end = Date.parse(slot.endTime);
  const booked = slot.status === 'BOOKED';

  if (end <= ctx.now) return 'PAST';

  const isNow = start <= ctx.now && ctx.now < end;
  if (isNow) {
    if (slot.isMine) return 'NOW_MINE';
    if (booked) return 'NOW_BOOKED';
    return 'NOW_FREE';
  }

  if (slot.isMine) return 'MINE';
  if (booked) return 'BOOKED';
  if (ctx.largestGapKeys.has(key)) return 'FREE_LARGEST_GAP';
  return 'FREE';
}

/**
 * Größte zusammenhängende Lücke: längster Lauf aufeinanderfolgender FREE-Slots,
 * die noch in der Zukunft liegen. Liefert die Keys + ein Label „Di 03–06 Uhr".
 */
export function computeLargestGap(
  slots: SlotView[],
  now: number,
  projectTz: string,
): { keys: Set<string>; label: string | null; startTime: string | null } {
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  const flush = (endIdx: number) => {
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
    }
    void endIdx;
  };

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const future = Date.parse(s.endTime) > now;
    if (s.status === 'FREE' && future) {
      if (curLen === 0) curStart = i;
      curLen++;
    } else {
      flush(i);
      curLen = 0;
    }
  }
  flush(slots.length);

  if (bestLen === 0 || bestStart < 0) {
    return { keys: new Set(), label: null, startTime: null };
  }

  const keys = new Set<string>();
  for (let i = bestStart; i < bestStart + bestLen; i++) keys.add(slots[i].startTime);
  const first = slots[bestStart];
  const last = slots[bestStart + bestLen - 1];
  const weekday = new Intl.DateTimeFormat('de-DE', { timeZone: projectTz, weekday: 'short' }).format(
    new Date(first.startTime),
  );
  // Innerhalb eines Projekt-Tages: „Mi 03–06 Uhr". Über Tage hinweg: „ab Mi 14 Uhr"
  // (ein tagesübergreifender „14–13"-Bereich wäre missverständlich).
  const sameDay = dayKey(first.startTime, projectTz) === dayKey(last.startTime, projectTz);
  const startHH = formatSlotRange(first.startTime, first.endTime, projectTz).split('–')[0];
  const label = sameDay
    ? `${weekday} ${formatSlotRange(first.startTime, last.endTime, projectTz)} Uhr`
    : `ab ${weekday} ${startHH} Uhr`;
  return { keys, label, startTime: first.startTime };
}

/** SlotView[] → SlotViewModel[] inkl. Zustand, Nacht-Flag, Lücken-Flag. */
export function buildViewModels(
  slots: SlotView[],
  opts: { now: number; projectTz: string; pendingKeys: Set<string>; conflictKey: string | null },
): { models: SlotViewModel[]; gap: ReturnType<typeof computeLargestGap> } {
  const gap = computeLargestGap(slots, opts.now, opts.projectTz);
  const ctx: DerivationContext = {
    now: opts.now,
    projectTz: opts.projectTz,
    largestGapKeys: gap.keys,
    pendingKeys: opts.pendingKeys,
    conflictKey: opts.conflictKey,
  };
  const models = slots.map((s) => ({
    key: s.startTime,
    slotId: s.slotId,
    startTime: s.startTime,
    endTime: s.endTime,
    isMine: s.isMine,
    userName: s.userName ?? null,
    status: s.status,
    isNight: isNightHour(s.startTime, opts.projectTz),
    isLargestGap: gap.keys.has(s.startTime),
    state: deriveSlotState(s, ctx),
  }));
  return { models, gap };
}

/**
 * Wer darf einen fremden gebuchten Slot stornieren (SlotSheet info-Modus)?
 * Gast über seinen localStorage-Token, Organisator über seine Rolle (API erlaubt beides, §6.3).
 * Eigene Slots (MINE/NOW_MINE) laufen über den mine-Modus, nicht hierüber.
 */
export function cancelAbility(
  slot: Pick<SlotViewModel, 'slotId' | 'state'>,
  opts: { isOrganizer: boolean; hasGuestToken: boolean },
): 'guest' | 'organizer' | null {
  if (!slot.slotId) return null;
  if (slot.state !== 'BOOKED' && slot.state !== 'NOW_BOOKED') return null;
  if (opts.hasGuestToken) return 'guest';
  if (opts.isOrganizer) return 'organizer';
  return null;
}

/** Nach Projekt-Kalendertag gruppieren (für DaySection). */
export function groupByDay(
  models: SlotViewModel[],
  projectTz: string,
): { key: string; slots: SlotViewModel[] }[] {
  const map = new Map<string, SlotViewModel[]>();
  for (const m of models) {
    const k = dayKey(m.startTime, projectTz);
    const arr = map.get(k);
    if (arr) arr.push(m);
    else map.set(k, [m]);
  }
  return [...map.entries()].map(([key, slots]) => ({ key, slots }));
}

/** Aggregiertes Band für ChainBand/ChainProgress (je Tag 24 Zellen bei 60-min-Slots). */
export function bookedCount(models: SlotViewModel[]): number {
  return models.filter((m) => m.status === 'BOOKED').length;
}
