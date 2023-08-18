<script lang="ts">
	import {
		auth,
		getCollectionStore,
		newBatch,
		type CollectionStore,
		type DocStore,
		type UserSummary,
		type WithRefAndId,
	} from "$lib/firebase";
	import { createTodo, type Todo, type TodoList } from "$lib/todos";
	import { limit, serverTimestamp, updateDoc, where } from "firebase/firestore";
	import { LexoRank } from "lexorank";
	import { UserPlusIcon } from "svelte-feather-icons";
	import { persisted } from "svelte-local-storage-store";
	import { flip } from "svelte/animate";
	import { get, writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import Todo_ from "./Todo_.svelte";
	import { isEmail } from "$lib/utils";

	export let todos: CollectionStore<Todo>;
	export let meta: DocStore<TodoList> | null;
	export let userId: string;

	// only show share button if its not the default list and the user is the owner
	$: showShareBtn = $meta && $meta.ownerId === userId;
	$: members = $meta?.members ?? [];
	$: displayedMembers = members.filter((member) => member.id !== userId);
	$: membersWithShareBtn = [
		...(showShareBtn ? [{ id: "sharebtn" as const }] : []),
		...displayedMembers,
	];

	function onListUpdated() {
		if ($meta) {
			updateDoc($meta.ref, { updatedAt: serverTimestamp() });
		}
	}

	let titleInputEl: HTMLInputElement | undefined;
	let titleInput = "";

	let inviteInputEl: HTMLElement | undefined;
	let inviteInput = "";

	$: title = $meta?.name ?? "Todos";
	$: titleInput = title;

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

	async function invite(email: string) {
		if (!meta || !$meta) {
			console.error("should never happen");
			return;
		}

		if (!isEmail(email)) throw new Error(`Please enter a valid email`);

		const q = get(
			await getCollectionStore<UserSummary>("users", where("email", "==", email), limit(1))
		);

		if (!q[0]) throw new Error(`${email} hasn't made an account yet`);

		updateDoc(meta.ref, {
			members: [...$meta.members, q[0]],
			memberIds: [...$meta.memberIds, q[0].id],
		});
	}

	let inviteError = "";

	async function onInviteBtnClick() {
		if (inviteInput === "") return;
		try {
			await invite(inviteInput);
		} catch (error: any) {
			inviteError = error?.message ?? "";
		}
		inviteInput = "";
		inviteInputEl?.focus();
	}

	function onInviteInputKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }
	) {
		const { key } = event;
		if (key === "Escape") {
			event.currentTarget.blur();
		}
		if (key === "Enter") {
			onInviteBtnClick();
		}
	}
</script>

<svelte:window on:keydown={onWindowKeydown} />

<div class="mb-4 flex h-8 items-stretch gap-2">
	<input
		type="text"
		spellcheck="false"
		bind:value={titleInput}
		bind:this={titleInputEl}
		disabled={!meta}
		on:blur={onTitleInputBlur}
		on:keydown={onTitleInputKeydown}
		class="w-80 overflow-clip overflow-ellipsis rounded-full border-2 border-transparent bg-transparent px-4 text-lg font-bold text-slate-500 outline-0 enabled:border-slate-200 enabled:hover:border-slate-300 enabled:focus:border-blue-500"
	/>

	<div transition:fly={{ duration: 150, x: -20 }} class="flex">
		{#each [...membersWithShareBtn] as participant (participant.id)}
			<div class="flex" animate:flip={{ duration: 200 }}>
				{#if participant.id === "sharebtn"}
					<div class="relative mr-2">
						<button
							on:click={() => inviteInputEl?.focus()}
							transition:fly={{ duration: 150, x: -20 }}
							class="h-full rounded-full bg-slate-200 px-4 text-slate-500 hover:bg-slate-300 hover:text-slate-600"
						>
							<UserPlusIcon class="mr-2 inline" />Share
						</button>

						<div
							class="pointer-events-none absolute right-0 top-0 z-20 w-80 rounded-2xl bg-slate-200 p-2 opacity-0 shadow-lg focus-within:pointer-events-auto focus-within:opacity-100"
						>
							<input
								bind:this={inviteInputEl}
								bind:value={inviteInput}
								on:keydown={onInviteInputKeydown}
								on:focus={() => {
									inviteInput = "";
								}}
								on:blur={() => {
									inviteError = "";
								}}
								type="email"
								placeholder="Invite people by email"
								class="w-full rounded-full bg-white px-4 py-0.5 text-slate-600 outline-none placeholder:text-slate-400"
							/>

							<div class="m-2 h-4 text-xs font-semibold text-red-800">
								{inviteError}
							</div>

							<button
								on:click={onInviteBtnClick}
								class="ml-auto mt-2 block rounded-full bg-slate-600 px-4 py-1 font-semibold text-slate-100"
								>Invite</button
							>
						</div>
					</div>
				{:else}
					<div class="group relative -mr-2 flex">
						<img src={participant.photoURL} alt={participant.name} class="rounded-full" />
					</div>
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
