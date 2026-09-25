import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	shouldShowReminder,
	markRemindedToday,
} from "../../src/midnight-policy.js";
import type { Clock, StateStore } from "../../src/midnight-policy.js";

const STATE_FILE = join(homedir(), ".pi", "agent", "midnight-reminder-state.json");

const systemClock: Clock = {
	now() {
		return new Date();
	},
};

const fileStateStore: StateStore = {
	getLastRemindedDate() {
		try {
			if (!existsSync(STATE_FILE)) return undefined;
			const raw = readFileSync(STATE_FILE, "utf-8");
			const state = JSON.parse(raw) as { lastRemindedDate?: string };
			return state.lastRemindedDate;
		} catch {
			return undefined;
		}
	},
	setLastRemindedDate(date: string) {
		try {
			writeFileSync(
				STATE_FILE,
				JSON.stringify({ lastRemindedDate: date }, null, 2),
			);
		} catch {
			// Best-effort persistence
		}
	},
};

function maybeShowReminder(ctx: ExtensionContext): void {
	if (!ctx.hasUI) return;
	if (!shouldShowReminder(systemClock, fileStateStore)) return;

	markRemindedToday(systemClock, fileStateStore);
	ctx.ui.notify("Midnight reminder", "info");
}

export default function (pi: ExtensionAPI) {
	let intervalId: ReturnType<typeof setInterval> | null = null;

	pi.on("session_start", async (_event, ctx) => {
		// Check immediately in case Pi starts inside the window
		maybeShowReminder(ctx);

		// Then check every minute
		intervalId = setInterval(() => {
			maybeShowReminder(ctx);
		}, 60_000);
	});

	pi.on("session_shutdown", () => {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	});
}
