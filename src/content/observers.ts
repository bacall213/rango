import { hasTextNodesChildren } from "./utils/nodes-utils";
import { getClickableType } from "./utils/clickable-type";
import { triggerHintsUpdate } from "./hints/display-hints";
import { onIntersection, onAttributeMutation } from "./intersectors";
import { checkIfElementHasClickListeners } from "./utils/check-if-element-has-click-listeners";

// *** INTERSECTION OBSERVER ***

const options = {
	root: null,
	rootMargin: "0px",
	threshold: 0,
};

export const intersectionObserver = new IntersectionObserver(
	async (entries) => {
		for (const entry of entries) {
			onIntersection(entry.target, entry.isIntersecting);
		}

		await triggerHintsUpdate();
	},
	options
);

// *** MUTATION OBSERVER ***

const mutationCallback: MutationCallback = async (mutationList) => {
	let updateHints = false;
	for (const mutationRecord of mutationList) {
		if (mutationRecord.type === "childList") {
			for (const node of mutationRecord.addedNodes) {
				if (
					node instanceof Element &&
					!node.id.includes("rango-hints-container") &&
					!node.parentElement?.id.includes("rango-hints-container")
				) {
					maybeObserveIntersection(node);
					updateHints = true;
				}
			}
			// We don't care too much about removed nodes. I think it's going to be more expensive
			// to remove them from our list of our observed elements than to do nothing
		}

		if (mutationRecord.type === "attributes") {
			const hintsContainer = document.querySelector("#rango-hints-container");
			if (
				mutationRecord.target instanceof Element &&
				!hintsContainer?.contains(mutationRecord.target)
			) {
				// The function onAttributeMutation returns true if there is a change to
				// the visibility or clickability of elements
				updateHints = onAttributeMutation(mutationRecord.target);
			}
		}
	}

	if (updateHints) {
		await triggerHintsUpdate();
	}
};

const config = { attributes: true, childList: true, subtree: true };
const mutationObserver = new MutationObserver(mutationCallback);

function maybeObserveIntersection(element: Element) {
	let descendants = element.querySelectorAll("*");
	if (element.shadowRoot) {
		// We need to create a new mutation observer for each shadow root because
		// the main mutation observer doesn't register changes in those
		const mutationObserver = new MutationObserver(mutationCallback);
		mutationObserver.observe(element.shadowRoot, config);
		descendants = element.shadowRoot.querySelectorAll("*");
	}

	const elements = [element, ...descendants];

	const shadowOutputs = [...descendants].filter(
		(element) => element.shadowRoot
	);
	for (const shadowOutput of shadowOutputs) {
		maybeObserveIntersection(shadowOutput);
	}

	for (const element of elements) {
		const clickableType = getClickableType(element);
		if (clickableType || hasTextNodesChildren(element)) {
			intersectionObserver.observe(element);
		}

		if (
			!clickableType &&
			window.getComputedStyle(element).cursor === "pointer"
		) {
			checkIfElementHasClickListeners(element);
		}
	}
}

export default function observe() {
	// We observe all the initial elements before any mutation
	maybeObserveIntersection(document.body);
	triggerHintsUpdate().catch((error) => {
		console.error(error);
	});

	// We observe document instead of document.body in case the body gets replaced
	mutationObserver.observe(document, config);
}
