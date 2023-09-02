<script lang="ts">
	import { goto } from "$app/navigation";
	import Header from "$lib/components/Header.svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth } from "$lib/firebase";

	export let data;

	$: ({ lists, user } = data);

	async function signOut() {
		await auth.signOut();
		goto("/signin", { invalidateAll: true });
	}
</script>

<div
	class="flex h-screen max-h-screen flex-col items-stretch overflow-hidden selection:!bg-blue-500 selection:!text-white dark:selection:!bg-blue-400 dark:selection:!text-gray-900"
>
	<Header>
		{#if user}
			<div class="flex h-full items-center gap-3">
				<div class="flex flex-col items-end justify-center">
					<div class="text-sm font-semibold text-gray-600 dark:text-gray-300">
						{user.email}
					</div>
					<div class="-mt-1">
						<button
							on:click={signOut}
							class="text-xs text-gray-400 hover:underline dark:text-gray-500"
						>
							Sign out
						</button>
					</div>
				</div>
				<img src={user.photoURL} alt="" class="h-full rounded-full" />
			</div>
		{:else}
			<div class="flex h-full animate-pulse items-center gap-3">
				<div class="flex flex-col items-end justify-center">
					<div class="h-3 w-36 rounded-full bg-gray-300 dark:bg-gray-700" />
					<div class="mt-1">
						<div class="h-3 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
					</div>
				</div>
				<div class="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
			</div>
		{/if}
	</Header>

	<div class="flex flex-1 items-stretch overflow-hidden">
		<Sidebar {user} lists={$lists} />
		<main class="flex-1 overflow-y-scroll p-8 dark:bg-gray-900">
			<div class="max-w-4xl">
				<slot />
			</div>
		</main>
	</div>
</div>
