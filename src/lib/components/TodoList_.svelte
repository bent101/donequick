<script lang="ts">
	import ListTitle from "./ListTitle.svelte";

	import MemberAvatar from "./MemberAvatar.svelte";

	import ShareBtn from "./ShareBtn.svelte";

	import { newBatch, type CollectionStore, type DocStore, type WithRefAndId } from "$lib/firebase";
	import { createTodo, type Todo, type TodoList } from "$lib/todos";
	import type { User } from "firebase/auth";
	import { serverTimestamp, updateDoc } from "firebase/firestore";
	import { LexoRank } from "lexorank";
	import { persisted } from "svelte-local-storage-store";
	import { flip } from "svelte/animate";
	import { writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import Todo_ from "./Todo_.svelte";

	export let todos: CollectionStore<Todo>;
	export let meta: DocStore<TodoList> | null;
	export let user: User;

	// only show share button if its not the default list and the user is the owner
	$: showShareBtn = $meta && $meta.ownerId === user.uid;
	$: members = $meta?.members ?? [];
	$: displayedMembers = members.filter((member) => member.id !== user.uid);
	$: membersWithShareBtn = [
		...(showShareBtn ? [{ id: "sharebtn" as const }] : []),
		...displayedMembers,
	];

	function onListUpdated() {
		if ($meta) {
			updateDoc($meta.ref, { updatedAt: serverTimestamp() });
		}
	}

	const hideCompleted = persisted("hideCompleted", true);
	$: filteredTodos = [...$todos].filter((todo) => !($hideCompleted && todo.done));

	const blankTodo = createTodo("", "");
	const blankTodoIndex = writable($todos.length);

	$: todosWithBlank = [
		...filteredTodos.slice(0, $blankTodoIndex),
		blankTodo,
		...filteredTodos.slice($blankTodoIndex),
	] as (Todo | WithRefAndId<Todo>)[];

	$: len = todosWithBlank.length;

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

		const rankAt = (i: number) => LexoRank.parse(filteredTodos[i].rank);

		let rank: LexoRank;
		const isFirst = index === 0;
		const isLast = index === len - 1;

		if (isFirst && isLast) {
			rank = LexoRank.middle();
		} else if (isFirst) {
			rank = rankAt(index).genPrev();
		} else if (isLast) {
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

<div class="mb-4 flex h-10 items-stretch gap-2">
	<ListTitle {meta} />

	<div class="flex">
		{#each membersWithShareBtn as member (member.id)}
			<div class="flex">
				{#if member.id === "sharebtn"}
					<ShareBtn {meta} {user} />
				{:else if "photoURL" in member}
					<MemberAvatar {member} />
				{/if}
			</div>
		{/each}
	</div>
</div>

<div class="ml-auto w-max">
	{#if !$hideCompleted}
		<button
			transition:fly={{ duration: 150, x: 20 }}
			on:click={clearCompleted}
			class="mr-4 rounded-full bg-slate-200 px-4 text-slate-500 hover:bg-slate-300 hover:text-slate-600"
		>
			Clear completed
		</button>
	{/if}
	<label class="cursor-pointer">
		<span class="mr-2 text-slate-400">Hide completed</span>
		<input bind:checked={$hideCompleted} type="checkbox" />
	</label>
</div>

<ul class="mt-4">
	{#each todosWithBlank as todo, index ("id" in todo ? todo.id : -1)}
		<li animate:flip={{ duration: 100 }}>
			<Todo_
				{index}
				{focusedTodoIndex}
				{blankTodoIndex}
				todoListLen={len}
				{todo}
				on:newtodo={onNewTodo}
				on:updated={onListUpdated}
			/>
		</li>
	{/each}
</ul>
