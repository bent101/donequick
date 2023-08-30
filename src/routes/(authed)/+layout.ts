import { browser } from "$app/environment";
import { auth } from "$lib/firebase";
import { redirect } from "@sveltejs/kit";

export async function load() {
	if (!browser) {
		return {
			user: null,
		};
	}

	await auth.authStateReady();

	if (!auth.currentUser) throw redirect(301, "/signin");

	const user = auth.currentUser;

	return {
		user,
	};
}
