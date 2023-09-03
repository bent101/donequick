import { browser } from "$app/environment";
import { writable } from "svelte/store";

export const isTouchScreen = mql("(any-pointer: coarse)");

export const sm = minWidth(640);
export const md = minWidth(768);
export const lg = minWidth(1024);
export const xl = minWidth(1280);

function minWidth(px: number) {
	return mql(`(min-width: ${px}px)`, { ssrFallback: true });
}

function mql(query: string, { ssrFallback = false } = {}) {
	if (!browser) return writable(ssrFallback);
	const matcher = window.matchMedia(query);

	return writable(matcher.matches, (set) => {
		function onChange() {
			set(matcher.matches);
		}
		matcher.addEventListener("change", onChange);
		return () => matcher.removeEventListener("change", onChange);
	});
}
