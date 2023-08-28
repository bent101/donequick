<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { db, type WithRefAndId } from "$lib/firebase";
	import type { TodoList } from "$lib/models";
	import type { User } from "firebase/auth";
	import { doc, setDoc, updateDoc } from "firebase/firestore";
	import { PlusIcon, Trash2Icon } from "svelte-feather-icons";
	import { flip } from "svelte/animate";

	export let user: User | null;
	export let lists: WithRefAndId<TodoList>[];

	$: listsWithTodos = [{ name: "Todos", id: undefined } as const, ...lists];

	async function createNewList() {
		// generate id client-side to take advatange of optimistic updates
		const id = crypto.randomUUID();
		await setDoc(doc(db, `lists/${id}`), user);
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

	// let mounted = false;
	// onMount(() => (mounted = true));
</script>

<aside class="w-96 overflow-y-scroll bg-slate-200 pb-32 pt-8">
	<h2 class="my-4 ml-12 mt-8 font-extrabold uppercase tracking-wider text-slate-500/80">
		My Lists
	</h2>
	<div class="mr-8">
		{#each listsWithTodos as list (list.id)}
			{@const selected = $page.params.listId === list.id ?? ""}
			<!-- transition:fly={{ duration: 300, x: -200, delay: 100 * i }} -->
			<div animate:flip={{ duration: 300 }}>
				{#if list.name === "Shared"}
					<h2 class="my-4 ml-12 mt-8 font-extrabold uppercase tracking-wider text-slate-500/80">
						Shared
					</h2>
				{:else}
					<div
						class="group flex items-center overflow-clip whitespace-nowrap rounded-r-full
				{selected ? 'z-10 bg-slate-600 text-slate-100' : 'text-slate-600 hover:bg-slate-300'}"
					>
						<a
							class="block flex-1 self-stretch overflow-clip overflow-ellipsis py-2 pl-12 pr-1 text-lg font-semibold"
							href="/{list.id ?? ''}"
						>
							{list.name}
						</a>
						{#if "ownerId" in list}
							<button
								on:click={() => deleteList(list)}
								class="invisible mr-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full group-hover:visible
						{selected ? 'hover:bg-slate-200/20' : 'hover:bg-slate-600/20'}"
							>
								<Trash2Icon class="p-0.5" />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<button
		on:click={createNewList}
		class="fixed bottom-3 left-[13.5rem] z-10 rounded-full border-b-4 border-slate-800 bg-slate-700 py-3 pl-3 pr-6 text-xl font-bold text-slate-100 shadow-lg shadow-slate-900/60 transition-all duration-100 active:border-b-0"
	>
		<PlusIcon class="inline w-9 -translate-y-0.5 text-slate-400" />New List
	</button>
</aside>
