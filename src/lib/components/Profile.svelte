<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/firebase";
	import type { User } from "firebase/auth";

	async function signOut() {
		await auth.signOut();
		goto("/signin", { invalidateAll: true });
	}

	export let user: User | null;
</script>

{#if user}
	<div class="flex h-12 items-center gap-3">
		<div class="h-12 w-12">
			<img src={user.photoURL} alt="" class="inset-0 rounded-full" />
		</div>

		<div class="flex flex-col justify-center">
			<div class="text-sm font-semibold text-gray-600 dark:text-gray-300">
				{user.email}
			</div>
			<div class="-mt-1">
				<button on:click={signOut} class="text-xs text-gray-400 hover:underline dark:text-gray-500">
					Sign out
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-12 items-center gap-3">
		<div class="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
		<div class="flex flex-col justify-center">
			<div class="h-3 w-36 rounded-full bg-gray-300 dark:bg-gray-700" />
			<div class="mt-1">
				<div class="h-3 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
			</div>
		</div>
	</div>
{/if}
