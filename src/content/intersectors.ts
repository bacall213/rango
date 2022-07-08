import { HintedIntersector, Intersector } from "../typing/types";
import { isHintedIntersector } from "../typing/typing-utils";
import { getClickableType } from "./utils/clickable-type";
import { NoHintError } from "./classes/errors";
import { getScrollContainer } from "./utils/get-scroll-container";

export const intersectors: Intersector[] = [];
export const removedIntersectorsHints: Set<string> = new Set();

window.addEventListener("message", ({ data }) => {
	if (data.type === "elementHasClickListeners") {
		const elements = document.querySelectorAll(data.selector);
		const elementsIntersectors = intersectors.filter((intersector) =>
			Array.from(elements).includes(intersector.element)
		);
		for (const intersector of elementsIntersectors) {
			intersector.clickableType ||= "event:click";
		}
	}
});

function getIntersector(element: Element): Intersector | undefined {
	return intersectors.find((Intersector) => Intersector.element === element);
}

export function getIntersectorWithHint(hint: string): HintedIntersector {
	const intersector = intersectors.find(
		(Intersector) => Intersector.hintText === hint
	);

	if (intersector && isHintedIntersector(intersector)) {
		return intersector;
	}

	throw new NoHintError("No intersector found with that hint");
}

export function getIntersectorsWithHints(hints: string[]): HintedIntersector[] {
	return intersectors
		.filter(isHintedIntersector) // eslint-disable-line unicorn/no-array-callback-reference
		.filter((targetIntersector) => hints.includes(targetIntersector.hintText));
}

function removeIntersector(element: Element) {
	const intersectorIndex = intersectors.findIndex(
		(Intersector) => Intersector.element === element
	);
	if (intersectorIndex > -1) {
		const intersector = intersectors[intersectorIndex];
		if (intersector?.hintText) {
			intersector.hintElement?.remove();
			removedIntersectorsHints.add(intersector.hintText);
		}

		intersectors.splice(intersectorIndex, 1);
	}
}

export function onIntersection(
	element: Element,
	isIntersecting: boolean
): void {
	if (isIntersecting) {
		intersectors.push({
			element,
			clickableType: getClickableType(element),
			scrollContainer: getScrollContainer(element),
		});
	} else {
		removeIntersector(element);
	}
}

export function onAttributeMutation(element: Element): boolean {
	const intersector = getIntersector(element);
	let updateHints = false;
	if (intersector) {
		const clickableType = getClickableType(element);

		if (clickableType !== intersector.clickableType) {
			updateHints = true;
		}

		intersector.clickableType = clickableType;
	}

	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLButtonElement ||
		element instanceof HTMLSelectElement
	) {
		const elementLabels = element.labels;
		if (elementLabels) {
			for (const label of elementLabels) {
				const intersector = getIntersector(label);
				if (intersector) {
					intersector.clickableType = getClickableType(label);
				}
			}
		}
	}

	for (const intersector of intersectors) {
		if (
			intersector.backgroundColor &&
			intersector.backgroundColor.hex() !== "#FDA65D" &&
			element.contains(intersector.element)
		) {
			intersector.backgroundColor = undefined;
		}
	}

	for (const descendant of element.querySelectorAll("*")) {
		const observedDescendantElement = getIntersector(descendant);
		if (observedDescendantElement) {
			updateHints = true;
		}
	}

	return updateHints;
}
