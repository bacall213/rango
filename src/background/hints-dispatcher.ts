import { HintsStack } from "../types/types";
import { fullHintsStack } from "../lib/hint-stack";

const hintsStacks: HintsStack[] = [];

function getHintsStack(tabId: number): HintsStack | undefined {
	return hintsStacks.find((hintStack) => hintStack.tabId === tabId);
}

export function getHintFrameId(tabId: number, hintText: string): number {
	return getHintsStack(tabId)?.assigned.get(hintText) ?? 0;
}

export function initTabHintsStack(tabId: number, frameId: number) {
	const hintsStack = getHintsStack(tabId);
	if (frameId === 0) {
		if (hintsStack) {
			hintsStack.free = [...fullHintsStack];
			hintsStack.assigned = new Map<string, number>();
		} else {
			hintsStacks.push({
				tabId,
				free: [...fullHintsStack],
				assigned: new Map<string, number>(),
			});
		}
	}
}

export function claimHintText(
	tabId: number,
	frameId: number
): string | undefined {
	const hintsStack = getHintsStack(tabId);
	const hintText = hintsStack?.free.pop();
	if (hintText) {
		hintsStack?.assigned.set(hintText, frameId);
	}

	return hintText ?? undefined;
}

export function releaseHintText(tabId: number, hintText: string) {
	const hintsStack = getHintsStack(tabId);
	hintsStack?.free.push(hintText);
	hintsStack?.free.sort((a, b) => b.length - a.length || b.localeCompare(a));
	hintsStack?.assigned.delete(hintText);
}
