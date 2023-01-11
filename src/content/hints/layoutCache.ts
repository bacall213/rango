import { ElementWrapper } from "../../typings/ElementWrapper";

const boundingClientRects: Map<Element, DOMRect> = new Map();
const offsetParents: Map<Element, Element | null> = new Map();
const firstCharacterRects: Map<Text, DOMRect> = new Map();
const textRects: Map<Text, DOMRect> = new Map();
const clientDimensions: Map<
	Element,
	{
		clientWidth: number;
		scrollWidth: number;
		clientHeight: number;
		scrollHeight: number;
		offsetWidth?: number;
		offsetHeight?: number;
	}
> = new Map();
const styles: Map<Element, CSSStyleDeclaration> = new Map();

export function clearLayoutCache() {
	boundingClientRects.clear();
	offsetParents.clear();
	firstCharacterRects.clear();
	textRects.clear();
	clientDimensions.clear();
	styles.clear();
}

export function getFirstTextNodes(element: Element) {
	const nodes = [];

	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

	while (nodes.length < 2 && walker.nextNode()) {
		if (
			walker.currentNode instanceof Text &&
			walker.currentNode.parentElement?.matches(
				":not(.rango-hint, script, style)"
			) &&
			walker.currentNode.textContent &&
			/\S/.test(walker.currentNode.textContent)
		) {
			nodes.push(walker.currentNode);
		}
	}

	return nodes;
}

function textNodeRect(textNode: Text): DOMRect {
	const range = document.createRange();
	range.setStart(textNode, 0);
	range.setEnd(textNode, textNode.length);
	return range.getBoundingClientRect();
}

function firstCharacterRect(textNode: Text): DOMRect {
	const firstNonWhiteSpaceCharacter = textNode.textContent?.search(/\S/) ?? 0;

	const range = document.createRange();
	range.setStart(textNode, firstNonWhiteSpaceCharacter);
	range.setEnd(textNode, firstNonWhiteSpaceCharacter + 1);
	const rect = range.getBoundingClientRect();
	return rect;
}

function isElementWrapperArray(
	targets: ElementWrapper[] | Array<Element | SVGElement | Text>
): targets is ElementWrapper[] {
	if (targets[0] && "isHintable" in targets[0]) return true;
	return false;
}

export function cacheLayout(
	targets: ElementWrapper[] | Array<Element | SVGElement | Text>,
	includeTextRect = true
) {
	const elements = isElementWrapperArray(targets)
		? targets.map((wrapper) => wrapper.element)
		: targets;
	const toCache: Set<Element> = new Set();

	const firstTextNodes: Map<Element, Text[]> = new Map();

	for (const element of elements) {
		if (element instanceof Element && includeTextRect) {
			firstTextNodes.set(element, getFirstTextNodes(element));
		}
	}

	for (const element of elements) {
		if (element instanceof Element && includeTextRect) {
			const textNodes = firstTextNodes.get(element);

			if (!textNodes) continue;

			for (const node of textNodes) {
				firstCharacterRects.set(node, firstCharacterRect(node));
				textRects.set(node, textNodeRect(node));
			}
		}

		const descendants =
			element instanceof Element ? element.querySelectorAll("*") : [];

		for (const descendant of descendants) toCache.add(descendant);

		let current: Element | null = element instanceof Element ? element : null;
		let counter = 0;

		while (current && counter < 10) {
			if (toCache.has(current)) break;

			toCache.add(current);

			current = current.parentElement;
			counter++;
		}
	}

	for (const element of toCache) {
		boundingClientRects.set(element, element.getBoundingClientRect());
		const { clientWidth, scrollWidth, clientHeight, scrollHeight } = element;
		clientDimensions.set(element, {
			clientWidth,
			scrollWidth,
			clientHeight,
			scrollHeight,
			offsetWidth:
				element instanceof HTMLElement ? element.offsetWidth : undefined,
			offsetHeight:
				element instanceof HTMLElement ? element.offsetHeight : undefined,
		});
		styles.set(element, window.getComputedStyle(element));

		if (element instanceof HTMLElement) {
			offsetParents.set(element, element.offsetParent);
		}
	}
}

export function getBoundingClientRect(element: Element) {
	return boundingClientRects.get(element) ?? element.getBoundingClientRect();
}

export function getOffsetParent(target: HTMLElement) {
	return offsetParents.get(target) ?? target.offsetParent;
}

export function getFirstCharacterRect(text: Text) {
	return firstCharacterRects.get(text) ?? firstCharacterRect(text);
}

export function getClientDimensions(element: Element) {
	const { clientWidth, scrollWidth, clientHeight, scrollHeight } =
		clientDimensions.get(element) ?? element;

	const offsetWidth =
		element instanceof HTMLElement
			? clientDimensions.get(element)?.offsetWidth ?? element.offsetWidth
			: undefined;
	const offsetHeight =
		element instanceof HTMLElement
			? clientDimensions.get(element)?.offsetHeight ?? element.offsetHeight
			: undefined;

	return {
		clientWidth,
		scrollWidth,
		clientHeight,
		scrollHeight,
		offsetWidth,
		offsetHeight,
	};
}

export function getTextNodeRect(text: Text) {
	return textRects.get(text) ?? textNodeRect(text);
}

export function getCachedStyle(element: Element) {
	return styles.get(element) ?? window.getComputedStyle(element);
}
