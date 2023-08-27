<script lang="ts">
	import ListTitle from "./ListTitle.svelte";

	import MemberAvatar from "./MemberAvatar.svelte";

	import ShareBtn from "./ShareBtn.svelte";

	import { afterNavigate } from "$app/navigation";
	import { newBatch, type CollectionStore, type DocStore } from "$lib/firebase";
	import { createTodo, type Todo, type TodoList } from "$lib/models";
	import type { User } from "firebase/auth";
	import { serverTimestamp, updateDoc } from "firebase/firestore";
	import { LexoRank } from "lexorank";
	import { persisted } from "svelte-local-storage-store";
	import { flip } from "svelte/animate";
	import { writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import Todo_ from "./Todo_.svelte";
	import { sleep } from "$lib/utils";

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
	let filteredTodos = [...$todos].filter((todo) => !($hideCompleted && todo.done));
	$: filteredTodos = [...$todos].filter((todo) => !($hideCompleted && todo.done));

	function getFirstRank() {
		if (filteredTodos.length === 0) {
			return LexoRank.middle().toString();
		}
		const first = filteredTodos[0]!.rank;
		return LexoRank.parse(first).genPrev().toString();
	}

	const blankTodo = {
		content: "",
		rank: getFirstRank(),
		done: false,
		id: "blank",
		indent: 0,
	};

	afterNavigate(() => {
		blankTodo.rank = getFirstRank();
		blankTodo.indent = 0;
	});

	$: todosWithBlank = [...filteredTodos, blankTodo].sort((a, b) => (a.rank < b.rank ? -1 : 1));
	$: len = todosWithBlank.length;

	const focusedTodoId = writable<string | null>(null);

	function focusTopTodo() {
		$focusedTodoId = todosWithBlank[0]!.id;
	}

	function focusBottomTodo() {
		$focusedTodoId = todosWithBlank[len - 1]!.id;
	}

	function focusPrevTodo() {
		if ($focusedTodoId === null) {
			focusBottomTodo();
		} else {
			let i = todosWithBlank.findIndex((todo) => todo.id === $focusedTodoId) - 1;
			i = Math.max(i, 0);
			$focusedTodoId = todosWithBlank[i]!.id;
		}
	}

	function focusNextTodo() {
		if ($focusedTodoId === null) {
			focusTopTodo();
		} else {
			let i = todosWithBlank.findIndex((todo) => todo.id === $focusedTodoId) + 1;
			i = Math.min(i, len - 1);
			$focusedTodoId = todosWithBlank[i]!.id;
		}
	}

	function onWindowKeydown(event: KeyboardEvent) {
		const { key } = event;

		if (key === "ArrowUp") {
			if (event.metaKey) {
				focusTopTodo();
			} else {
				focusPrevTodo();
			}
		} else if (key === "ArrowDown") {
			if (event.metaKey) {
				focusBottomTodo();
			} else {
				focusNextTodo();
			}
		} else if (key === "Enter") {
			if (document.activeElement !== document.body) return;
			// move the blank todo above/below the focused todo, then focus it
			// (or if there isn't a focused todo, focus the blank todo)

			/** focused todo index */
			const i = todosWithBlank.findIndex((todo) => todo.id === $focusedTodoId);

			if (i === -1) {
				$focusedTodoId = blankTodo.id;
				return;
			}

			const focusedTodo = todosWithBlank[i]!;

			const neighbor = todosWithBlank[i + (event.shiftKey ? -1 : 1)];
			const newRank = neighbor
				? LexoRank.parse(focusedTodo.rank).between(LexoRank.parse(neighbor.rank))
				: i === todosWithBlank.length - 1
				? LexoRank.parse(focusedTodo.rank).genNext()
				: LexoRank.parse(focusedTodo.rank).genPrev();

			blankTodo.rank = newRank.toString();
			blankTodo.indent = focusedTodo.indent;

			$focusedTodoId = blankTodo.id;
		}
	}

	function onNewTodo(event: { detail: { content: string; indent: number } }) {
		const { content, indent } = event.detail;

		todos.add(createTodo(content, blankTodo.rank, indent));
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

<ul class="mb-[60vh] mt-4">
	{#each todosWithBlank as todo (todo.id)}
		<li class="flex flex-col" animate:flip={{ duration: todo.id === $focusedTodoId ? 0 : 100 }}>
			<Todo_
				{todo}
				listName={$meta?.name}
				id={todo.id}
				{focusedTodoId}
				on:newtodo={onNewTodo}
				on:updated={onListUpdated}
			/>
		</li>
	{/each}
</ul>
