import { auth, getCollectionStore, getDocStore } from "$lib/firebase";
import type { Todo, TodoList } from "$lib/todos";
import { orderBy } from "firebase/firestore";

export async function load({ params, parent }) {
	const { user } = await parent();

	return {
		todoList: params.listId ? getDocStore<TodoList>(`lists/${params.listId}`) : null,
		todos: params.listId
			? getCollectionStore<Todo>(`lists/${params.listId}/todos`, orderBy("rank"))
			: getCollectionStore<Todo>(`users/${user.uid}/todos`, orderBy("rank")),
	};
}
