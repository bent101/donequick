<script lang="ts">
	import { db, getCollectionData, newBatch, type DocStore } from "$lib/firebase";
	import type { TodoList, UserSummary } from "$lib/models";
	import { isEmail } from "$lib/utils";
	import type { User } from "firebase/auth";
	import { arrayUnion, doc, limit, updateDoc, where } from "firebase/firestore";
	import { UserPlusIcon } from "svelte-feather-icons";
	import { fly } from "svelte/transition";

	export let meta: DocStore<TodoList> | null;
	export let user: User;

	let inviteInputEl: HTMLElement | undefined;
	let inviteInput = "";

	async function invite(email: string) {
		if (!meta || !$meta) throw new Error(`You can't invite people to this list`);

		if (!isEmail(email)) throw new Error(`Please enter a valid email`);

		// add invitee to user's contacts
		await updateDoc(doc(db, `users/${user.uid}`), { contacts: arrayUnion(email) });

		const q = await getCollectionData<UserSummary>("users", where("email", "==", email), limit(1));

		const invitee = q[0];

		if (!invitee) throw new Error(`${email} hasn't made an account yet`);
		if ($meta.memberIds.includes(invitee.id)) throw new Error(`${email} has already been invited`);

		// in one batch, add the invitee to the list, and add the user to the invitee's contacts
		const batch = newBatch();
		batch.update(meta.ref, {
			members: arrayUnion(invitee),
			memberIds: arrayUnion(invitee.id),
		});
		batch.update(doc(db, `users/${invitee.id}`), { contacts: arrayUnion(user.email) });

		batch.commit();
	}

	let inviteError = "";

	async function onInviteBtnClick() {
		if (inviteInput === "") return;
		try {
			await invite(inviteInput);
			inviteError = "";
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

<div class="relative mr-2 min-w-max">
	<button
		on:click={() => inviteInputEl?.focus()}
		transition:fly={{ duration: 150, x: -20 }}
		class="h-full rounded-full bg-slate-200 px-4 text-slate-500 hover:bg-slate-300 hover:text-slate-600"
	>
		<UserPlusIcon class="mr-2 inline" />Share
	</button>

	<div
		class="pointer-events-none absolute right-0 top-0 z-20 w-80 rounded-[1.25rem] bg-slate-300 p-2 opacity-0 shadow-lg focus-within:pointer-events-auto focus-within:opacity-100"
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
			class="ml-auto mt-2 block h-8 rounded-full bg-slate-600 px-4 py-1 font-semibold text-slate-100"
			>Invite</button
		>
	</div>
</div>
