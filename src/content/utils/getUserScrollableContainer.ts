const containersCache: Map<Element, HTMLElement> = new Map();

export function getUserScrollableContainer(element: Element): HTMLElement {
	const elementPosition = window.getComputedStyle(element).position;

	const checked = [];
	let current: Element | null = element;

	while (current) {
		const cached = containersCache.get(current);
		if (cached) return cached;

		const { position, overflowX, overflowY } = window.getComputedStyle(current);
		const { scrollWidth, clientWidth, scrollHeight, clientHeight } = current;

		// If the element is position: absolute we need to ignore any element with
		// position: static as our element won't scroll with that container
		if (elementPosition === "absolute" && position === "static") {
			current = current.parentElement;
			continue;
		}

		if (
			current instanceof HTMLElement &&
			((scrollWidth > clientWidth && /scroll|auto/.test(overflowX)) ||
				(scrollHeight > clientHeight && /scroll|auto/.test(overflowY)))
		) {
			checked.push(current);

			for (const element of checked) {
				containersCache.set(element, current);
			}

			return current;
		}

		checked.push(current);
		current = current.parentElement;
	}

	for (const element of checked) {
		containersCache.set(element, document.documentElement);
	}

	return document.documentElement;
}
