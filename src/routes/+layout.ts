import { auth, signIn } from "$lib/firebase";

export const ssr = false;

export async function load() {
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
