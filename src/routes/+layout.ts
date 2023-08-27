import { auth, getCollectionStore, signIn } from "$lib/firebase";
import type { TodoList } from "$lib/models";
import { orderBy, where } from "firebase/firestore";

export const ssr = false;

export async function load({ depends }) {
	depends("firebase:auth");

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
		lists: getCollectionStore<TodoList>(
			"lists",
			where("memberIds", "array-contains", user.uid),
			orderBy("updatedAt", "desc")
		),
	};
}
