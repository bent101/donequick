import { getUserCollectionStore } from "$lib/firebase";
import type { Todo } from "$lib/todos";

export async function load({ parent }) {
	await parent();
	return {
		todos: getUserCollectionStore<Todo>("todos"),
	};
}
