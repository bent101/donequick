import { getCollectionStore, getDocStore } from "$lib/firebase";
import type { Todo, TodoList } from "$lib/models";
import { orderBy } from "firebase/firestore";

export const prerender = false;

export async function load({ params, parent }) {
	const { user } = await parent();
	if (!user) return { user };

	return {
		user,
		todoList: params.listId ? getDocStore<TodoList>(`lists/${params.listId}`) : null,
		todos: params.listId
			? getCollectionStore<Todo>(`lists/${params.listId}/todos`, orderBy("rank"))
			: getCollectionStore<Todo>(`users/${user.uid}/todos`, orderBy("rank")),
	};
}
