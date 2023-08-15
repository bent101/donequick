import { auth, getCollectionStore, signIn } from "$lib/firebase";
import type { TodoList } from "$lib/todos";
import { where } from "firebase/firestore";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({ depends }) => {
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
		myLists: getCollectionStore<TodoList>("lists", where("owner", "==", user.uid)),
		sharedWithMe: getCollectionStore<TodoList>(
			"lists",
			where("invitees", "array-contains", user.uid)
		),
	};
};
