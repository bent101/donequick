import { getCollectionStore, getDocStore } from "$lib/firebase";
import type { Todo, TodoList } from "$lib/models";
import { redirect } from "@sveltejs/kit";
import { orderBy } from "firebase/firestore";

export const prerender = false;

export async function load({ params, parent }) {
	const { user } = await parent();
	if (!user) return { user };

	try {
		const [todoList, todos] = await Promise.all([
			params.listId ? getDocStore<TodoList>(`lists/${params.listId}`) : Promise.resolve(null),
			params.listId
				? getCollectionStore<Todo>(`lists/${params.listId}/todos`, orderBy("rank"))
				: getCollectionStore<Todo>(`users/${user.uid}/todos`, orderBy("rank")),
		]);

		return {
			user,
			todoList,
			todos,
		};
	} catch (error) {
		throw redirect(302, "/");
	}
}
