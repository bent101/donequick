<script lang="ts">
	import type { CollectionStore, WithRefAndId } from "$lib/firebase";
	import { createTodo, type Todo } from "$lib/todos";
	import { flip } from "svelte/animate";
	import Todo_ from "./Todo_.svelte";
	import { writable } from "svelte/store";
	import { LexoRank } from "lexorank";

	export let todos: CollectionStore<Todo>;

	$: sortedTodos = [...$todos].sort((a, b) => a.rank.localeCompare(b.rank));

	const fakeTodo = createTodo("", "");
	let fakeTodoIndex = writable($todos.length);

	$: todosWithFake = [
		...sortedTodos.slice(0, $fakeTodoIndex),
		fakeTodo,
		...sortedTodos.slice($fakeTodoIndex),
	] as (Todo | WithRefAndId<Todo>)[];

	$: len = todosWithFake.length;

	let focusedTodoIndex = writable(-1);

	function onWindowKeydown(event: KeyboardEvent) {
		const { key } = event;
		if (key === "ArrowUp") {
			if (event.metaKey) {
				$focusedTodoIndex = 0;
			} else {
				$focusedTodoIndex--;
				$focusedTodoIndex += len;
				$focusedTodoIndex %= len;
			}
		}
		if (key === "ArrowDown") {
			if (event.metaKey) {
				$focusedTodoIndex = len - 1;
			} else {
				$focusedTodoIndex++;
				$focusedTodoIndex %= len;
			}
		}
	}

	function onNewTodo(event: { detail: { content: string; index: number } }) {
		const { content, index } = event.detail;

		const rankAt = (i: number) => LexoRank.parse(sortedTodos[i].rank);

		let rank: LexoRank;
		const first = index === 0;
		const last = index === len - 1;

		if (first && last) {
			rank = LexoRank.middle();
		} else if (first) {
			rank = rankAt(index).genPrev();
		} else if (last) {
			rank = rankAt(index - 1).genNext();
		} else {
			rank = rankAt(index - 1).between(rankAt(index));
		}

		todos.add(createTodo(content, rank.format()));
	}
</script>

<svelte:window on:keydown={onWindowKeydown} />

<ul>
	{#each todosWithFake as todo, index ("id" in todo ? todo.id : -1)}
		<li animate:flip={{ duration: 100 }}>
			<Todo_
				{index}
				{focusedTodoIndex}
				{fakeTodoIndex}
				todoListLen={len}
				{todo}
				on:newtodo={onNewTodo}
			/>
		</li>
	{/each}
</ul>
