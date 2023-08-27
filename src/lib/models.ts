import { serverTimestamp, type FieldValue } from "firebase/firestore";
import { auth } from "./firebase";
import type { User } from "firebase/auth";
import anon from "$lib/assets/images/anon.jpeg";

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
