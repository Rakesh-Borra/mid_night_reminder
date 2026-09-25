// Pure time-policy functions for the midnight reminder.
// These accept injected dependencies (clock and state store) so they can be
// tested without touching the real system clock or filesystem.

export interface Clock {
	now(): Date;
}

export interface StateStore {
	getLastRemindedDate(): string | undefined;
	setLastRemindedDate(date: string): void;
}

function dateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Returns true when the hour is in [00, 06). */
export function isInMidnightWindow(clock: Clock): boolean {
	const hour = clock.now().getHours();
	return hour >= 0 && hour < 6;
}

/** Returns true if we have already reminded today according to the store. */
export function wasAlreadyRemindedToday(clock: Clock, store: StateStore): boolean {
	return store.getLastRemindedDate() === dateKey(clock.now());
}

/** Returns true if a reminder should be shown right now. */
export function shouldShowReminder(clock: Clock, store: StateStore): boolean {
	return isInMidnightWindow(clock) && !wasAlreadyRemindedToday(clock, store);
}

/** Records that a reminder was shown today. */
export function markRemindedToday(clock: Clock, store: StateStore): void {
	store.setLastRemindedDate(dateKey(clock.now()));
}
