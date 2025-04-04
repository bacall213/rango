import { setSelectionAtEdge } from "../actions/setSelection";
import { getElementCenter } from "./getElementCenter";
import { getFocusable, isEditable } from "./utils";

// At the moment this only works in Firefox but it seems it's going to be
// implemented in the other browsers.
// https://github.com/whatwg/html/pull/8087
declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface FocusOptions {
		focusVisible?: boolean;
	}
}

let lastClicked: Element | undefined;

function mouseEvent(type: string, clientX: number, clientY: number) {
	return new MouseEvent(type, {
		clientX,
		clientY,
		composed: true,
		button: 0,
		buttons: 0,
		bubbles: true,
		cancelable: true,
	});
}

function pointerEvent(type: string, clientX: number, clientY: number) {
	return new PointerEvent(type, {
		pointerId: 1,
		isPrimary: true,
		pointerType: "mouse",
		clientX,
		clientY,
		composed: true,
		button: -1,
		buttons: 0,
		bubbles: true,
		cancelable: true,
	});
}

export function dispatchClick(element: Element) {
	if (lastClicked) dispatchUnhover(lastClicked);
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointerdown", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousedown", clientX, clientY));

	const focusable = getFocusable(element);
	if (focusable instanceof HTMLElement) {
		focusable.focus({ focusVisible: isEditable(focusable) });
	}

	if (element instanceof HTMLElement && isEditable(element)) {
		window.focus();
		const selection = getSelection();

		// This handles an issue where the element doesn't focus (Notion)
		if (selection && !element.contains(selection.anchorNode)) {
			setSelectionAtEdge(element, true);
		}
	}

	element.dispatchEvent(pointerEvent("pointerup", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseup", clientX, clientY));

	element.dispatchEvent(mouseEvent("click", clientX, clientY));

	lastClicked = element;
}

export function dispatchHover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointerover", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointerenter", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointermove", clientX, clientY));

	element.dispatchEvent(mouseEvent("mouseover", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseenter", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousemove", clientX, clientY));
}

export function dispatchUnhover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointermove", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousemove", clientX, clientY));

	element.dispatchEvent(pointerEvent("pointerout", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointerleave", clientX, clientY));

	element.dispatchEvent(mouseEvent("mouseout", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseleave", clientX, clientY));
}

export function dispatchKeyDown(element: Element, key: string) {
	const keydownEvent = new KeyboardEvent("keydown", {
		code: key,
		key,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(keydownEvent);
}

export function dispatchKeyUp(element: Element, key: string) {
	const keyupEvent = new KeyboardEvent("keyup", {
		code: key,
		key,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(keyupEvent);
}
