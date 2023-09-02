import { browser } from "$app/environment";

import { auth } from "$lib/firebase";
import { redirect } from "@sveltejs/kit";

export const prerender = true;

export async function load({ url }) {
	if (!browser) {
		return {
			user: null,
		};
	}

	await auth.authStateReady();

	if (!auth.currentUser && url.pathname !== "/signin") throw redirect(302, "/signin");

	const user = auth.currentUser;

	return {
		user,
	};
}
