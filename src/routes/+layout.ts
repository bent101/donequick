import { auth, signIn } from "$lib/firebase";

export const ssr = false;

export async function load() {
	await auth.authStateReady();
	if (!auth.currentUser) {
		await signIn();
	}

	return {
		user: auth.currentUser!,
	};
}
