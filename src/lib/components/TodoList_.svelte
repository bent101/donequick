<script lang="ts">
	import { newBatch, type CollectionStore, type DocStore, type WithRefAndId } from "$lib/firebase";
	import { createTodo, type Todo, type TodoList } from "$lib/todos";
	import { updateDoc } from "firebase/firestore";
	import { LexoRank } from "lexorank";
	import { persisted } from "svelte-local-storage-store";
	import { flip } from "svelte/animate";
	import { writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import Todo_ from "./Todo_.svelte";

	export let todos: CollectionStore<Todo>;
	export let meta: DocStore<TodoList> | null;

	let titleInputEl: HTMLInputElement | undefined;
	let titleInput = "";

	$: title = $meta?.name ?? "Todos";
	$: titleInput = title;

	const hideCompleted = persisted("hideCompleted", false);

	$: sortedTodos = [...$todos]
		.filter((todo) => ($hideCompleted ? !todo.done : true))
		.sort((a, b) => a.rank.localeCompare(b.rank));

	const fakeTodo = createTodo("", "");
	const fakeTodoIndex = writable($todos.length);

	$: todosWithFake = [
		...sortedTodos.slice(0, $fakeTodoIndex),
		fakeTodo,
		...sortedTodos.slice($fakeTodoIndex),
	] as (Todo | WithRefAndId<Todo>)[];

	$: len = todosWithFake.length;

	const focusedTodoIndex = writable(-1);

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

	function onTitleInputBlur() {
		if (!$meta) {
			throw new Error("this should never happen");
		}

		titleInput = titleInput.trim();

		if (titleInput === "") {
			titleInput = $meta.name;
		} else {
			updateDoc($meta.ref, { name: titleInput });
		}
	}

	function onTitleInputKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }
	) {
		const { key } = event;

		if (key === "Enter" || key === "Escape") {
			event.currentTarget.blur();
		}
	}
</script>

<svelte:window on:keydown={onWindowKeydown} />

<div class="mb-4 flex select-none items-center gap-4">
	<h2 class="flex-1">
		<input
			type="text"
			spellcheck="false"
			bind:value={titleInput}
			bind:this={titleInputEl}
			disabled={!meta}
			on:blur={onTitleInputBlur}
			on:keydown={onTitleInputKeydown}
			class="w-72 overflow-clip overflow-ellipsis rounded-md border-2 border-transparent bg-transparent px-3 py-1 text-lg font-bold text-slate-500 outline-0 enabled:border-slate-200 enabled:hover:border-slate-300 enabled:focus:border-blue-500"
		/>
	</h2>
	{#if !$hideCompleted}
		<button
			transition:fly={{ duration: 100, x: 20 }}
			on:click={clearCompleted}
			class="mx-4 rounded-full bg-slate-200 px-4 text-slate-500 hover:bg-slate-300 hover:text-slate-600"
			>Clear completed</button
		>
	{/if}
	<label class="cursor-pointer">
		<span class="mr-2 text-slate-400">Hide completed</span>
		<input bind:checked={$hideCompleted} type="checkbox" class="" />
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
