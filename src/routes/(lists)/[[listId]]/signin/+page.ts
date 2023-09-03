import { browser } from "$app/environment";
import { invalidateAll } from "$app/navigation";
import { auth } from "$lib/firebase";

export async function load() {
	if (browser) {
		await auth.authStateReady();
		if (auth.currentUser) {
			await auth.signOut();
			invalidateAll();
		}
	}
}
