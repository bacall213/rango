import { getFirstCharacterRect } from "../utils/nodeUtils";

// Minimum space that needs to be available so that we can place the hint in the
// current element
const ENOUGH_LEFT = 15;
const ENOUGH_TOP = 10;

function getPaddingRect(element: Element): DOMRect {
	const {
		borderLeftWidth,
		borderRightWidth,
		borderTopWidth,
		borderBottomWidth,
	} = window.getComputedStyle(element);

	const borderLeft = Number.parseInt(borderLeftWidth, 10);
	const borderRight = Number.parseInt(borderRightWidth, 10);
	const borderTop = Number.parseInt(borderTopWidth, 10);
	const borderBottom = Number.parseInt(borderBottomWidth, 10);

	const { x, y, width, height } = element.getBoundingClientRect();

	return new DOMRect(
		x + borderLeft,
		y + borderTop,
		width - borderLeft - borderRight,
		height - borderTop - borderBottom
	);
}

function isUserScrollable(element: Element) {
	const { clientWidth, scrollWidth, clientHeight, scrollHeight } = element;
	const { overflowX, overflowY } = window.getComputedStyle(element);

	return (
		element === document.documentElement ||
		(scrollWidth > clientWidth && /scroll|auto/.test(overflowX)) ||
		(scrollHeight > clientHeight && /scroll|auto/.test(overflowY))
	);
}

function getSpaceAvailable(
	container: Element,
	elementToPositionHint: Element | Text
) {
	const targetRect =
		elementToPositionHint instanceof Text
			? getFirstCharacterRect(elementToPositionHint)
			: elementToPositionHint.getBoundingClientRect();

	// To use when overflow: visible;
	const borderRect = container.getBoundingClientRect();
	const borderInnerLeft = targetRect.left - borderRect.left;
	const borderInnerTop = targetRect.top - borderRect.top;

	// To use when overflow: hidden|clip|scroll|auto;
	const paddingRect = getPaddingRect(container);
	const paddingInnerLeft = targetRect.left - paddingRect.left;
	const paddingInnerTop = targetRect.top - paddingRect.top;

	const {
		position,
		overflow,
		clipPath,
		left: styleLeft,
		top: styleTop,
	} = window.getComputedStyle(container);

	// We make sure to return 0 if any of the values are negative. This could
	// happen if the element to position hint is not within the container. For example,
	// if the element is hidden by making it unreachable

	if (isUserScrollable(container)) {
		// We do Math.max to handle hidden elements that are unreachable (they remain
		// outside of the bounds of the container no matter how much we scroll)
		// We could return a negative value of available space but that messes up
		// calculations when positioning the hint
		return {
			left: Math.max(container.scrollLeft + paddingInnerLeft, 0),
			top: Math.max(container.scrollTop + paddingInnerTop, 0),
		};
	}

	// We don't need to worry about scroll containers here because that is
	// handled in the previous if block
	// We treat elements with clip-path the same as if it was overflow: hidden.
	// Calculating exactly what is the visible area of the element would be a nightmare
	if (overflow !== "visible" || clipPath !== "none") {
		return {
			left: Math.max(paddingInnerLeft, 0),
			top: Math.max(paddingInnerTop, 0),
		};
	}

	if (position === "fixed") {
		// There is a possibility that these values are wrong if the fixed
		// positioning containing block is not the viewport, although it's a
		// rare case and I don't think it's worth it to worry too much about it
		// https://.github.io/csswg-drafts/css-position/#fixed-positioning-containing-block
		return {
			left: Math.max(borderInnerLeft, 0),
			top: Math.max(borderInnerTop, 0),
		};
	}

	if (position === "sticky") {
		const stickyLeft = Number.parseInt(styleLeft, 10);
		const stickyTop = Number.parseInt(styleTop, 10);

		// These values are the minimum space available that we are going to have.
		// It could be greater if, for example, the sticky element hasn't sticked yet
		// or if the scroll container for the sticky has overflow: hidden un thus
		// does doesn't scroll
		const left = Number.isNaN(stickyLeft)
			? borderInnerLeft
			: stickyLeft + borderInnerLeft;
		const top = Number.isNaN(stickyTop)
			? borderInnerTop
			: stickyTop + borderInnerTop;

		return { left: Math.max(left, 0), top: Math.max(top, 0) };
	}

	return {
		left: Math.max(targetRect.left, 0),
		top: Math.max(targetRect.top, 0),
	};
}

function getAptContainer(origin: Element) {
	let current: Element | null =
		window.getComputedStyle(origin).position === "sticky"
			? origin
			: origin.parentElement;

	while (current) {
		const { display } = window.getComputedStyle(current);

		if (current.tagName !== "DETAILS" && display !== "contents") {
			return current;
		}

		current = current.parentElement;
	}

	// It shouldn't get here
	return document.body;
}

//
function getFirstNonShadow(element: Element) {
	let current: Node | null = element;
	let lastNonShadow: Element = element;
	let goneThroughShadow = false;

	while (current) {
		if (
			current instanceof HTMLElement &&
			goneThroughShadow &&
			!(current instanceof ShadowRoot) &&
			!current.shadowRoot
		) {
			lastNonShadow = current;
			goneThroughShadow = false;
		}

		if (current instanceof ShadowRoot) {
			goneThroughShadow = true;
		}

		current = current instanceof ShadowRoot ? current.host : current.parentNode;
	}

	return lastNonShadow;
}

interface HintContext {
	container: Element;
	limitParent: Element;
	firstNonShadow: Element;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
}

export function getContextForHint(
	element: Element,
	elementToPositionHint: Element | Text
): HintContext {
	// Last possible ancestor to place the hint;
	let limitParent;

	// Ancestors that have a clipping mechanism (overflow: clip|hidden|scroll|auto,
	// clip-path other than "none", contain: paint|content|strict) or can limit the
	// visibility of inner elements moved outside of its bounds, for example, with
	// position: fixed|sticky.
	const clipAncestors: Element[] = [];

	const firstNonShadow = getFirstNonShadow(element);

	// If the hintable itself is sticky we need to place the hint inside it or it
	// will jump up and down when scrolling
	let current =
		window.getComputedStyle(element).position === "sticky"
			? firstNonShadow
			: firstNonShadow.parentElement;

	while (current) {
		const { overflow, contain, clipPath, position, transform, willChange } =
			window.getComputedStyle(current);

		if (
			current === document.body ||
			position === "fixed" ||
			position === "sticky" ||
			transform !== "none" ||
			willChange === "transform" ||
			isUserScrollable(current)
		) {
			limitParent ??= current;
		}

		// There can be several clipAncestors but only the last one can be an
		// ancestor of limitParent. That last clipAncestor is use to calculate the
		// available space of limitParent.
		if (
			current === document.body ||
			overflow !== "visible" ||
			/paint|content|strict/.test(contain) ||
			clipPath !== "none" ||
			position === "fixed" ||
			position === "sticky"
		) {
			clipAncestors.push(current);
			if (limitParent) {
				break;
			}
		}

		current = current.parentElement;
	}

	let previousClipAncestor: Element | undefined;
	let container: Element;
	let candidate = getAptContainer(firstNonShadow);
	let previousSpaceLeft;
	let previousSpaceTop;

	// Here we go through the clipAncestors to find a container where the space
	// available to place the hint is at least (ENOUGH_LEFT, ENOUGH_TOP). We keep
	// going until we make sure the space available is at least (PLENTY_LEFT, PLENTY_TOP).
	//
	for (const clipAncestor of clipAncestors) {
		const spaceAvailable = getSpaceAvailable(
			clipAncestor,
			elementToPositionHint
		);
		const spaceLeft = spaceAvailable.left;
		const spaceTop = spaceAvailable.top;

		// Initial calculation of space available for the first clipAncestor
		if (previousSpaceLeft === undefined) {
			previousSpaceLeft = spaceLeft;
			previousSpaceTop = spaceTop;
		}

		if (spaceLeft > ENOUGH_LEFT && spaceTop > ENOUGH_TOP) {
			// For example, with the following clipAncestors:
			// clipAncestor[n]: (spaceLeft, spaceTop)
			// -----------------------
			// clipAncestor[0]: (3, 7)
			// clipAncestor[1]: (3, 7)
			// clipAncestor[2]: (20, 50)
			// Once we get to clipAncestor[2] the candidate is still
			// clipAncestor[0].parentElement. We can't use that candidate as it
			// doesn't have the necessary space available, and would get clipped by
			// clipAncestor[1] so we need to use the previous clipAncestor
			// (clipAncestor[1]) to get the candidate.
			container =
				spaceLeft > previousSpaceLeft || spaceTop > previousSpaceTop
					? // We know there's got to be a previousClipAncestor as for
					  // clipAncestor[0] the spaces and candidate spaces are the same
					  getAptContainer(previousClipAncestor!)
					: candidate;

			previousSpaceLeft = spaceLeft;
			previousSpaceTop = spaceTop;
			break;
		}

		// We only change the candidate if that results in having more space for
		// the hint than with the previous candidate.
		// Once we have enough space in that direction there is no need to change
		// the candidate
		if (
			(spaceLeft > previousSpaceLeft && previousSpaceLeft < ENOUGH_LEFT) ||
			(spaceTop > previousSpaceTop && previousSpaceTop < ENOUGH_TOP)
		) {
			// We know there's got to be a previousClipAncestor as for
			// clipAncestor[0] the spaces and previous spaces are the same
			const nextCandidate = getAptContainer(previousClipAncestor!);

			if (limitParent.contains(nextCandidate)) {
				candidate = nextCandidate;
				// We use the word "previous" here because these values are to be used in
				// the next iteration of the loop
				previousSpaceLeft = spaceLeft;
				previousSpaceTop = spaceTop;
			} else {
				break;
			}
		}

		previousClipAncestor = clipAncestor;
	}

	container ??= candidate;

	return {
		container,
		limitParent,
		firstNonShadow: firstNonShadow ?? element,
		availableSpaceLeft: previousSpaceLeft,
		availableSpaceTop: previousSpaceTop,
	};
}
