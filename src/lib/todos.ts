import { auth } from "./firebase";

export type TodoList = {
	name: string;
	owner: string;
	invitees: string[];
};

export function createTodoList(): TodoList {
	return {
		name: "Untitled list",
		owner: auth.currentUser!.uid,
		invitees: [],
	};
}

export type Todo = {
	content: string;
	rank: string;
	done: boolean;
};

export function createTodo(content: string, rank: string): Todo {
	return {
		content,
		rank,
		done: false,
	};
}
