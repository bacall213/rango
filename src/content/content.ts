import browser from "webextension-polyfill";
// eslint-disable-next-line import/no-unassigned-import
import "requestidlecallback-polyfill";
import { ContentRequest } from "../typings/ContentRequest";
import { TalonAction } from "../typings/RequestFromTalon";
import { cacheHintOptions } from "./options/cacheHintOptions";
import { getClipboardManifestV3 } from "./utils/clipboardManifestV3";
import observe from "./observe";
import { addUrlToTitle } from "./utils/addUrlToTitle";
import {
	markHintsAsKeyboardReachable,
	initKeyboardClicking,
	restoreKeyboardReachableHints,
} from "./actions/keyboardClicking";
import { updateHintsInTab } from "./utils/getHintsInTab";
import { runRangoActionWithTarget } from "./actions/runRangoActionWithTarget";
import { runRangoActionWithoutTarget } from "./actions/runRangoActionWithoutTarget";
import { updateCustomSelectors } from "./hints/selectors";
import { getHintStringsInUse, reclaimHints } from "./wrappers/wrappers";
import { reclaimHintsFromCache } from "./hints/hintsCache";
import { loadDevtoolsUtils } from "./utils/devtoolsUtils";

cacheHintOptions()
	.then(addUrlToTitle)
	.then(updateCustomSelectors)
	.then(observe)
	.then(async () => {
		const { keyboardClicking } = await browser.storage.local.get(
			"keyboardClicking"
		);
		if (keyboardClicking) {
			await initKeyboardClicking();
		}
	})
	.catch((error) => {
		console.error(error);
	});

loadDevtoolsUtils();

browser.runtime.onMessage.addListener(
	async (
		request: ContentRequest
	): Promise<string | string[] | TalonAction[] | boolean | undefined> => {
		if ("target" in request) {
			return runRangoActionWithTarget(request);
		}

		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "getClipboardManifestV3":
					return getClipboardManifestV3();

				case "getHintStringsInUse":
					return getHintStringsInUse();

				case "reclaimHints": {
					const reclaimed = reclaimHintsFromCache(request.amount);
					if (reclaimed.length < request.amount) {
						reclaimed.push(...reclaimHints(request.amount - reclaimed.length));
					}

					return reclaimed;
				}

				case "getLocation":
					return [
						window.location.host,
						window.location.origin,
						window.location.pathname,
					];

				case "updateHintsInTab":
					updateHintsInTab(request.hints);
					break;

				case "markHintsAsKeyboardReachable":
					markHintsAsKeyboardReachable(request.letter);
					break;

				case "restoreKeyboardReachableHints":
					restoreKeyboardReachableHints();
					break;

				case "initKeyboardNavigation":
					await initKeyboardClicking();
					break;

				case "checkIfDocumentHasFocus":
					return document.hasFocus();

				default: {
					const result = await runRangoActionWithoutTarget(request);
					return result;
				}
			}
		} catch (error: unknown) {
			console.error(error);
		}

		return undefined;
	}
);
