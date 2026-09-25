import { describe, it, expect } from "vitest";
import { isInMidnightWindow, wasAlreadyRemindedToday, shouldShowReminder, markRemindedToday } from "./midnight-policy.js";
import type { Clock, StateStore } from "./midnight-policy.js";

class FakeClock implements Clock {
	constructor(private readonly _date: Date) {}
	now(): Date {
		return new Date(this._date.getTime());
	}
}

class FakeStore implements StateStore {
	private _date: string | undefined = undefined;
	getLastRemindedDate(): string | undefined {
		return this._date;
	}
	setLastRemindedDate(date: string): void {
		this._date = date;
	}
}

function makeClock(hour: number, minute: number): Clock {
	return new FakeClock(new Date(2026, 0, 15, hour, minute, 0, 0));
}

describe("isInMidnightWindow", () => {
	it("returns false at 23:59", () => {
		expect(isInMidnightWindow(makeClock(23, 59))).toBe(false);
	});

	it("returns true at 00:00", () => {
		expect(isInMidnightWindow(makeClock(0, 0))).toBe(true);
	});

	it("returns true at 05:59", () => {
		expect(isInMidnightWindow(makeClock(5, 59))).toBe(true);
	});

	it("returns false at 06:00", () => {
		expect(isInMidnightWindow(makeClock(6, 0))).toBe(false);
	});

	it("returns false at 12:00", () => {
		expect(isInMidnightWindow(makeClock(12, 0))).toBe(false);
	});
});

describe("wasAlreadyRemindedToday", () => {
	it("returns false when store is empty", () => {
		const clock = makeClock(2, 0);
		const store = new FakeStore();
		expect(wasAlreadyRemindedToday(clock, store)).toBe(false);
	});

	it("returns true when store matches today", () => {
		const clock = makeClock(2, 0);
		const store = new FakeStore();
		store.setLastRemindedDate("2026-01-15");
		expect(wasAlreadyRemindedToday(clock, store)).toBe(true);
	});

	it("returns false when store matches a previous day", () => {
		const clock = makeClock(2, 0);
		const store = new FakeStore();
		store.setLastRemindedDate("2026-01-14");
		expect(wasAlreadyRemindedToday(clock, store)).toBe(false);
	});
});

describe("shouldShowReminder", () => {
	it("shows reminder at 00:00 when not yet reminded", () => {
		const clock = makeClock(0, 0);
		const store = new FakeStore();
		expect(shouldShowReminder(clock, store)).toBe(true);
	});

	it("shows reminder at 05:59 when not yet reminded", () => {
		const clock = makeClock(5, 59);
		const store = new FakeStore();
		expect(shouldShowReminder(clock, store)).toBe(true);
	});

	it("does NOT show reminder at 23:59", () => {
		const clock = makeClock(23, 59);
		const store = new FakeStore();
		expect(shouldShowReminder(clock, store)).toBe(false);
	});

	it("does NOT show reminder at 06:00", () => {
		const clock = makeClock(6, 0);
		const store = new FakeStore();
		expect(shouldShowReminder(clock, store)).toBe(false);
	});

	it("does NOT show duplicate at 02:00 when already reminded today", () => {
		const clock = makeClock(2, 0);
		const store = new FakeStore();
		store.setLastRemindedDate("2026-01-15");
		expect(shouldShowReminder(clock, store)).toBe(false);
	});

	it("does NOT show reminder at 12:00", () => {
		const clock = makeClock(12, 0);
		const store = new FakeStore();
		expect(shouldShowReminder(clock, store)).toBe(false);
	});
});

describe("markRemindedToday", () => {
	it("writes today's date to the store", () => {
		const clock = makeClock(3, 30);
		const store = new FakeStore();
		markRemindedToday(clock, store);
		expect(store.getLastRemindedDate()).toBe("2026-01-15");
	});
});
