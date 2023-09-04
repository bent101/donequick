<script lang="ts">
	import ListTitle from "./ListTitle.svelte";

	import MemberAvatar from "./MemberAvatar.svelte";

	import ShareBtn from "./ShareBtn.svelte";

	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { newBatch, type CollectionStore, type DocStore } from "$lib/firebase";
	import { createTodo, type Todo, type TodoList } from "$lib/models";
	import { randomNums } from "$lib/random-nums";
	import type { User } from "firebase/auth";
	import { serverTimestamp, updateDoc } from "firebase/firestore";
	import { LexoRank } from "lexorank";
	import { PlusIcon, SquareIcon } from "svelte-feather-icons";
	import { persisted } from "svelte-local-storage-store";
	import { flip } from "svelte/animate";
	import { writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import Todo_ from "./Todo_.svelte";

	export let todos: CollectionStore<Todo> | undefined;
	export let meta: DocStore<TodoList> | null | undefined;
	export let user: User | null;

	let state: "idle" | "focused" | "focusedNew" | "editing" = "idle";

	function getHint() {
		switch (state) {
			case "idle":
				return "Hold Shift for keyboard shortcuts";
			case "focused":
				return "⌘ Enter to mark as done • Arrow keys to move";
			case "focusedNew":
				return "Alt + Arrow keys to swap • Tab to indent";
			case "editing":
				return "Enter, Shift-Enter, or Esc to finish editing";
		}
	}

	let hint = "";
	$: state, (hint = getHint());

	// only show share button if its not the default list and the user is the owner
	$: showShareBtn = $meta && $meta.ownerId === user?.uid;
	$: members = $meta?.members ?? [];
	$: displayedMembers = members.filter((member) => member.id !== user?.uid);
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

	let filteredTodos = $todos?.filter((todo) => !($hideCompleted && todo.done));
	$: filteredTodos = $todos?.filter((todo) => !($hideCompleted && todo.done));

	function getFirstRank() {
		if (!filteredTodos) return "";
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
		id: "blank" as const,
		indent: 0,
	};

	$: todosWithBlank = filteredTodos
		? [...filteredTodos, blankTodo].sort((a, b) => (a.rank < b.rank ? -1 : 1))
		: [];
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
			if (document.activeElement !== document.body && $focusedTodoId === null) return;
			if (!user) return;
			// move the blank todo above/below the focused todo, then focus it
			// (or if there isn't a focused todo, focus the blank todo)

			/** focused todo index */
			const i = todosWithBlank.findIndex((todo) => todo.id === $focusedTodoId);

			if (i === -1) {
				$focusedTodoId = blankTodo.id;
				return;
			}

			const focusedTodo = todosWithBlank[i]!;

			if (event.metaKey && "ref" in focusedTodo) {
				updateDoc(focusedTodo.ref, { done: true });
				if (event.shiftKey) {
					focusPrevTodo();
				} else {
					focusNextTodo();
				}
				onListUpdated();
				return;
			}

			try {
				const neighbor = todosWithBlank[i + (event.shiftKey ? -1 : 1)];
				const newRank = neighbor
					? LexoRank.parse(focusedTodo.rank).between(LexoRank.parse(neighbor.rank))
					: i === todosWithBlank.length - 1
					? LexoRank.parse(focusedTodo.rank).genNext()
					: LexoRank.parse(focusedTodo.rank).genPrev();

				blankTodo.rank = newRank.toString();
				blankTodo.indent = focusedTodo.indent;

				$focusedTodoId = blankTodo.id;
			} catch (error) {
				console.error(error);
			}
		}
	}

	$: if ($focusedTodoId === null) {
		state = "idle";
	} else {
		state = $focusedTodoId === blankTodo.id ? "focusedNew" : "focused";
	}

	function onNewTodo(event: { detail: { content: string; indent: number } }) {
		if (!todos) return;
		const { content, indent } = event.detail;

		todos.add(createTodo(content, blankTodo.rank, indent));
	}

	function clearCompleted() {
		if (!$todos) return;
		const batch = newBatch();
		$todos.forEach((todo) => {
			if (todo.done) batch.delete(todo.ref);
		});
		batch.commit();
	}

	beforeNavigate(() => {
		blankTodo.rank = LexoRank.min().toString();
	});

	afterNavigate(() => {
		blankTodo.rank = getFirstRank();
		blankTodo.indent = 0;
	});

	function handleSwap({ detail }: { detail: { id: string; dir: -1 | 1 } }) {
		// swaps the positions (lexoranks) of `a` and `b` (at indices `i` and `j`)
		const { id, dir } = detail;
		const i = todosWithBlank.findIndex((todo) => todo.id === id);
		if (i === -1) return;
		const j = i + dir;
		const a = todosWithBlank[i]!;
		const b = todosWithBlank[j];
		if (!b) return;

		const temp = a.rank;
		a.rank = b.rank;
		b.rank = temp;

		if ("ref" in a) {
			updateDoc(a.ref, { rank: a.rank });
		}
		if ("ref" in b) {
			updateDoc(b.ref, { rank: b.rank });
		}
	}
</script>

<svelte:window on:keydown={onWindowKeydown} />
<svelte:body on:focus={() => (state = "idle")} />

<div class="mb-4 mt-8 flex h-10 select-text items-stretch gap-2">
	<ListTitle {meta} />

	<div class="flex select-none">
		{#each membersWithShareBtn as member (member.id)}
			<div class="flex">
				{#if member.id === "sharebtn" && meta && user}
					<ShareBtn {meta} {user} />
				{:else if "photoURL" in member}
					<MemberAvatar {member} />
				{/if}
			</div>
		{/each}
	</div>
</div>

<div class="ml-auto w-max">
	{#if user}
		{#if !$hideCompleted}
			<button
				transition:fly={{ duration: 150, x: 20 }}
				on:click={clearCompleted}
				class="mr-4 rounded-full bg-gray-200 px-4 text-gray-500 hover:bg-gray-300 hover:text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-400"
			>
				Clear completed
			</button>
		{/if}
		<label class="cursor-pointer">
			<span class="mr-2 text-gray-400 marker:bg-gray-950 dark:text-gray-600">Hide completed</span>
			<input
				bind:checked={$hideCompleted}
				on:click={(event) => event.currentTarget.blur()}
				type="checkbox"
			/>
		</label>
	{:else}
		<div class="mb-[29px] h-3 w-32 rounded-full bg-gray-200 dark:bg-gray-800" />
	{/if}
</div>

<ul class="mb-[60vh] mt-4">
	{#if todosWithBlank.length > 0}
		{#each todosWithBlank as todo, i (todo.id)}
			<li class="flex flex-col" animate:flip={{ duration: 100 }}>
				<Todo_
					{todo}
					listName={$meta?.name}
					id={todo.id}
					{focusedTodoId}
					focusHotkey={"ASDFGHJKLQWERTYUIOPZXCVBNM"[i] ?? null}
					on:newtodo={onNewTodo}
					on:updated={onListUpdated}
					on:edited={() => (state = "editing")}
					on:swap={handleSwap}
				/>
			</li>
		{/each}
	{:else}
		{@const n = 10}
		{#each { length: n } as _, i}
			<div style="opacity: {100 - (100 / n) * i}%">
				<div class="ml-2 flex h-8 items-center gap-2">
					{#if i === 0}
						<PlusIcon class="h-full text-gray-200 dark:text-gray-800" />
					{:else}
						<SquareIcon class="h-full text-gray-200 dark:text-gray-800" />
						<div class="h-4 flex-1">
							<div
								style="width: {randomNums[i] * 40 + 20}%"
								class="h-full rounded-full bg-gray-200 dark:bg-gray-800"
							/>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</ul>

{#if user}
	<div
		class="fixed inset-x-0 bottom-2 mx-auto w-max rounded-full bg-white/80 px-6 py-2 text-sm font-semibold text-gray-400 backdrop-blur-md dark:bg-gray-900/80 dark:text-gray-500"
	>
		{hint}
	</div>
{/if}
