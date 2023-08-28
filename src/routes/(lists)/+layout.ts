import { auth, getCollectionStore, signIn } from "$lib/firebase";
import type { TodoList } from "$lib/models";
import { orderBy, where } from "firebase/firestore";

export const ssr = false;

export async function load({ parent }) {
	const { user } = await parent();

	return {
		lists: getCollectionStore<TodoList>(
			"lists",
			where("memberIds", "array-contains", user.uid),
			orderBy("updatedAt", "desc")
		),
	};
}
