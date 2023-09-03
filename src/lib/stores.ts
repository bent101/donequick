import { browser } from "$app/environment";
import { writable } from "svelte/store";

export const isShiftDown = writable(false, (set) => {
	if (!browser) return;

	function onKeypress(event: KeyboardEvent) {
		if (document.activeElement !== document.body) return;
		if (event.key === "Shift") set(true);
	}

	function onKeyup(event: KeyboardEvent) {
		if (event.key === "Shift") set(false);
	}

	document.addEventListener("keydown", onKeypress);
	document.addEventListener("keyup", onKeyup);
	return () => {
		document.removeEventListener("keydown", onKeypress);
		document.removeEventListener("keyup", onKeyup);
	};
});
