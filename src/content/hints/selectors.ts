import { retrieve, store } from "../../common/storage";

const defaultSelector =
	// Elements
	"button, a, input, summary, textarea, select, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable='']";

const hintableSelector = `:is(${defaultSelector}):not([aria-hidden='true'], .Toastify__close-button)`;

export const extraSelector = `:is(${defaultSelector}, [aria-hidden='true'], div, span, i, li, td, h1, h2, h3, h4, h5, h6):not(#rango-toast *)`;

let includeSelectorAll = "";
let excludeSelectorAll = "";

/**
 * Updates the variables `includeSelectorAll` and `excludeSelectorAll` that are
 * used when checking if an element should be hinted.
 */
export async function updateCustomSelectors() {
	const customSelectors = await retrieve("customSelectors");

	// This is stored when the extension first runs, so it shouldn't be undefined.
	// But it is undefined when running tests. This way we also make extra sure.
	if (!customSelectors) {
		await store("customSelectors", new Map());
	}

	let include: string[] = [];
	let exclude: string[] = [];

	for (const [
		pattern,
		customSelectorsForPattern,
	] of customSelectors.entries()) {
		const patternRe = new RegExp(pattern);

		if (patternRe.test(window.location.href)) {
			({ include, exclude } = customSelectorsForPattern);
		}
	}

	includeSelectorAll = include.join(", ");
	excludeSelectorAll = exclude.join(", ");
}

export function getExcludeSelectorAll() {
	return excludeSelectorAll;
}

export function matchesCustomInclude(target: Element) {
	return includeSelectorAll && target.matches(includeSelectorAll);
}

export function matchesCustomExclude(target: Element) {
	return excludeSelectorAll && target.matches(excludeSelectorAll);
}

export function matchesHintableSelector(target: Element) {
	return target.matches(hintableSelector);
}

export function matchesExtraSelector(target: Element) {
	return target.matches(extraSelector);
}
