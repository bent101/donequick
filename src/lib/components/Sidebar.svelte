<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { db, type CollectionStore } from "$lib/firebase";
	import { createTodoList, type TodoList } from "$lib/todos";
	import { removeDuplicatesBy } from "$lib/utils";
	import { doc, setDoc, updateDoc } from "firebase/firestore";
	import { list } from "postcss";
	import { PlusIcon, Trash2Icon } from "svelte-feather-icons";
	import { flip } from "svelte/animate";

	export let myLists: CollectionStore<TodoList>;
	export let sharedWithMe: CollectionStore<TodoList>;
	export let currentUserUid: string;

	$: listsWithFakeAndHeader = [
		{ name: "Todos", id: undefined } as const,
		...$myLists,
		{ name: "Shared with me", id: "1" } as const,
		...$sharedWithMe,
	];

	$: filteredLists = removeDuplicatesBy(listsWithFakeAndHeader, (list) => list.id);

	async function createNewList() {
		const id = crypto.randomUUID();
		await goto(`/${id}`);
		setDoc(doc(db, `lists/${id}`), createTodoList());
	}

	// let mounted = false;
	// onMount(() => (mounted = true));
</script>

<aside class="w-96 select-none overflow-y-scroll bg-slate-200 pb-32 pt-8">
	<h2 class="my-4 ml-12 mt-8 font-extrabold uppercase tracking-wider text-slate-500/80">
		My Lists
	</h2>
	<div class="mr-8">
		{#each filteredLists as list (list.id)}
			{@const selected = $page.params.listId === list.id ?? ""}
			<!-- transition:fly={{ duration: 300, x: -200, delay: 100 * i }} -->
			<div animate:flip={{ duration: 300 }}>
				{#if list.name === "Shared with me"}
					<h2 class="my-4 ml-12 mt-8 font-extrabold uppercase tracking-wider text-slate-500/80">
						Shared with me
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
						{#if "owner" in list}
							<button
								on:click={async function deleteList() {
									if (!("owner" in list)) return; // tell typescript about the {#if}

									await goto("/");

									if (currentUserUid === list.owner) {
										if (list.invitees.length === 0) {
											list.owner = "";
										} else {
											list.owner = list.invitees[0];
											list.invitees = list.invitees.slice(1);
										}
									} else {
										list.invitees = list.invitees.filter((invitee) => invitee !== currentUserUid);
									}

									updateDoc(list.ref, {
										owner: list.owner,
										invitees: list.invitees,
									});
								}}
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
