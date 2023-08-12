<script lang="ts">
	import { newBatch, type CollectionStore, type WithRefAndId } from "$lib/firebase";
	import { createTodo, type Todo } from "$lib/todos";
	import { LexoRank } from "lexorank";
	import { flip } from "svelte/animate";
	import { writable } from "svelte/store";
	import Todo_ from "./Todo_.svelte";
	import { writeBatch } from "firebase/firestore";

	export let name = "Todos";
	export let todos: CollectionStore<Todo>;

	let hideCompleted = false;

	$: sortedTodos = [...$todos]
		.filter((todo) => (hideCompleted ? !todo.done : true))
		.sort((a, b) => a.rank.localeCompare(b.rank));

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

	function clearCompleted() {
		const batch = newBatch();
		$todos.forEach((todo) => {
			if (todo.done) batch.delete(todo.ref);
		});
		batch.commit();
	}
</script>

<svelte:window on:keydown={onWindowKeydown} />

<div class="mb-4 flex items-center">
	<h2 class="flex-1 font-extrabold uppercase text-slate-500">{name}</h2>
	{#if !hideCompleted}
		<button
			on:click={clearCompleted}
			class="mx-4 rounded-full bg-slate-100 px-4 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
			>Clear completed</button
		>
	{/if}
	<label class="cursor-pointer">
		<span class="mr-2 text-slate-400">Hide completed</span>
		<input bind:checked={hideCompleted} type="checkbox" class="" />
	</label>
</div>

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
