import { getTabId } from "../setup/contentScriptContext";
import { getAllSettings } from "./settingsManager";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(enable: boolean | undefined) {
	navigationToggle = enable;
}

export function getToggles() {
	const {
		hintsToggleGlobal,
		hintsToggleHosts,
		hintsTogglePaths,
		hintsToggleTabs,
	} = getAllSettings();

	const tabSwitch = hintsToggleTabs.get(getTabId());
	const hostSwitch = hintsToggleHosts.get(globalThis.location.host);
	const pathSwitch = hintsTogglePaths.get(
		globalThis.location.origin + globalThis.location.pathname
	);

	return {
		computed:
			navigationToggle ??
			pathSwitch ??
			hostSwitch ??
			tabSwitch ??
			hintsToggleGlobal,
		navigation: navigationToggle,
		path: pathSwitch,
		host: hostSwitch,
		tab: tabSwitch,
		global: hintsToggleGlobal,
	};
}
