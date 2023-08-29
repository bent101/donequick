import { browser } from "$app/environment";
import { auth, signIn } from "$lib/firebase";

export async function load() {
	if (!browser) {
		return {
			user: null,
		};
	}

	await auth.authStateReady();

	if (!auth.currentUser) {
		await signIn();
	}

	if (!auth.currentUser) {
		throw new Error("failed to sign in");
	}

	const user = auth.currentUser;

	return {
		user,
	};
}
