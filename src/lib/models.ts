import anon from "$lib/assets/images/anon.jpeg";
import type { User } from "firebase/auth";
import { serverTimestamp, type FieldValue } from "firebase/firestore";

export type UserSummary = {
	name: string;
	email: string;
	photoURL: string;
	id: string;
};

export function getUserSummary(user: User): UserSummary {
	const { displayName, uid, photoURL, email } = user;

	return {
		name: displayName ?? "[anonymous user]",
		email: email ?? "",
		photoURL: photoURL ?? anon,
		id: uid,
	};
}

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

export function createTodoList(owner: User): TodoList {
	return {
		name: "Untitled list",
		ownerId: owner.uid,
		memberIds: [owner.uid],
		members: [getUserSummary(owner)],
		updatedAt: serverTimestamp(),
	};
}

export type Todo = {
	content: string;
	rank: string;
	indent: number;
	done: boolean;
};

export function createTodo(content: string, rank: string, indent: number): Todo {
	return {
		content,
		rank,
		indent,
		done: false,
	};
}
