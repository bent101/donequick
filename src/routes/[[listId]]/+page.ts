import { getCollectionStore, getDocStore } from "$lib/firebase";
import type { Todo, TodoList } from "$lib/todos";

export async function load({ params, parent }) {
	const { user } = await parent();

	return {
		todoList: params.listId ? getDocStore<TodoList>(`lists/${params.listId}`) : null,
		todos: params.listId
			? getCollectionStore<Todo>(`lists/${params.listId}/todos`)
			: getCollectionStore<Todo>(`users/${user.uid}/todos`),
	};
}
