<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { db, type WithRefAndId } from "$lib/firebase";
	import { createTodoList, type TodoList } from "$lib/models";
	import type { User } from "firebase/auth";
	import { doc, setDoc, updateDoc } from "firebase/firestore";
	import { PlusIcon, Trash2Icon } from "svelte-feather-icons";
	import { flip } from "svelte/animate";
	import Kbd from "./ui/Kbd.svelte";
	import { isShiftDown } from "$lib/stores";

	export let user: User | null;
	export let lists: WithRefAndId<TodoList>[] | undefined;

	$: listsWithTodos = lists ? [{ name: "Todos", id: undefined } as const, ...lists] : [];

	async function createNewList() {
		if (!user) return;
		// generate id client-side to take advatange of optimistic updates
		const id = crypto.randomUUID();
		await setDoc(doc(db, `lists/${id}`), createTodoList(user));
		goto(`/${id}`);
	}

	async function deleteList(list: (typeof listsWithTodos)[number]) {
		if (!("ownerId" in list) || user === null) return;

		await goto("/", { replaceState: true });

		const userId = user.uid;

		list.memberIds = list.memberIds.filter((id) => id !== userId);
		list.members = list.members.filter((member) => member.id !== userId);

		if (userId === list.ownerId) {
			if (list.memberIds[0]) {
				list.ownerId = list.memberIds[0];
			} else {
				// deleteDoc(list.ref);
				// deleteCollection(`lists/${list.id}/todos`);
			}
		}

		updateDoc(list.ref, {
			owner: list.ownerId,
			memberIds: list.memberIds,
			members: list.members,
		});
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
		if (!$isShiftDown || !event.code.startsWith("Digit") || event.code === "Digit0") {
			return;
		}

		const numPressed = +event.code.charAt(event.code.length - 1);

		const selectedList = listsWithTodos[numPressed - 1];
		if (!selectedList) return;
		const url = `/${selectedList.id ?? ""}`;
		goto(url);
	}

	function handleKeyup(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
		if (event.key == "Shift") $isShiftDown = false;
	}
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup} />

<aside class="w-96 overflow-y-scroll bg-gray-200 pb-32 pt-8 dark:bg-gray-950">
	<h2 class="my-4 ml-12 mt-8 font-extrabold uppercase tracking-wider text-gray-500/80">My Lists</h2>
	<div class="mr-8">
		{#if listsWithTodos.length > 0}
			{#each listsWithTodos as list, i (list.id)}
				{@const selected = $page.params.listId === list.id ?? ""}
				{@const hotkey = i + 1 < 10 ? `${i + 1}` : null}
				<!-- transition:fly={{ duration: 300, x: -200, delay: 100 * i }} -->
				<div animate:flip={{ duration: 300 }}>
					<div
						class="group flex items-center overflow-hidden whitespace-nowrap rounded-r-full
				{selected
							? 'z-10 bg-gray-600 text-gray-100 dark:bg-gray-400 dark:text-gray-900'
							: 'text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-900'}"
					>
						<a
							class="block flex-1 self-stretch overflow-hidden overflow-ellipsis py-2 pr-1 text-lg font-semibold"
							href="/{list.id ?? ''}"
						>
							<span class="inline-flex w-12 items-center justify-center">
								{#if hotkey && !selected && $isShiftDown}
									<Kbd>{hotkey}</Kbd>
								{/if}
							</span>
							{list.name}
						</a>
						{#if "ownerId" in list}
							<button
								on:click={() => deleteList(list)}
								class="mr-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full group-hover:visible
						{selected ? 'visible hover:bg-gray-200/20' : 'invisible hover:bg-gray-600/20'}"
							>
								<Trash2Icon class="p-0.5" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{:else}
			{@const n = 5}
			{#each { length: n } as _, i}
				<div style="opacity: {100 - (100 / n) * i}%">
					<div class="mx-4 my-6 h-5 rounded-full bg-gray-300 dark:bg-gray-800" />
				</div>
			{/each}
		{/if}
	</div>
	<button
		on:click={createNewList}
		class="fixed bottom-3 left-[13.5rem] z-10 rounded-full border-b-4 border-gray-800 bg-gray-700 py-3 pl-3 pr-6 text-xl font-bold text-gray-100 shadow-lg shadow-gray-900/60 transition-all duration-100 active:border-b-0 dark:border-gray-900 dark:bg-gray-800 dark:shadow-none"
	>
		<PlusIcon class="-trangray-y-0.5 inline w-9 text-gray-400 dark:text-gray-600" />New List
	</button>
</aside>
