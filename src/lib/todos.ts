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
