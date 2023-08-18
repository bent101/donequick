import { serverTimestamp, type FieldValue } from "firebase/firestore";
import { auth, getUserSummary, type UserSummary } from "./firebase";

/**
 * todo list metadata
 */
export type TodoList = {
	name: string;
	ownerId: string;
	memberIds: string[];
	members: UserSummary[];
	updatedAt: FieldValue;
};

export function createTodoList(): TodoList {
	const user = auth.currentUser;
	if (!user) throw new Error("sign in to create a list");
	return {
		name: "Untitled list",
		ownerId: user.uid,
		memberIds: [user.uid],
		members: [getUserSummary(user)],
		updatedAt: serverTimestamp(),
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
