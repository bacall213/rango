import { getElementCenter } from "./cssomUtils";
import { focusesOnclick } from "./focusesOnclick";

let lastClicked: Element | undefined;

export function dispatchClick(element: Element): boolean {
	let shouldFocusPage = false;

	if (lastClicked) dispatchUnhover(lastClicked);
	const { x: clientX, y: clientY } = getElementCenter(element);

	const mousedownEvent = new MouseEvent("mousedown", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});

	const mouseupEvent = new MouseEvent("mouseup", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const clickEvent = new MouseEvent("click", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(mousedownEvent);

	if (element instanceof HTMLElement && focusesOnclick(element)) {
		window.focus();
		element.focus();
		if (!document.hasFocus()) shouldFocusPage = true;
	}

	element.dispatchEvent(mouseupEvent);
	element.dispatchEvent(clickEvent);

	lastClicked = element;

	return shouldFocusPage;
}

export function dispatchHover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	const mouseenterEvent = new MouseEvent("mouseenter", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});
	const mouseoverEvent = new MouseEvent("mouseover", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const mousemoveEvent = new MouseEvent("mousemove", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(mouseenterEvent);
	element.dispatchEvent(mouseoverEvent);
	element.dispatchEvent(mousemoveEvent);
}

export function dispatchUnhover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	const mousemoveEvent = new MouseEvent("mousemove", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	const mouseleaveEvent = new MouseEvent("mouseleave", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const mouseoutEvent = new MouseEvent("mouseout", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(mousemoveEvent);
	element.dispatchEvent(mouseleaveEvent);
	element.dispatchEvent(mouseoutEvent);
}

export function dispatchKeyDown(element: Element, key: string) {
	const keydownEvent = new KeyboardEvent("keydown", {
		view: window,
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
		view: window,
		code: key,
		key,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(keyupEvent);
}
