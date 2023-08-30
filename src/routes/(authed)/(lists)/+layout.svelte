<script lang="ts">
	import { goto } from "$app/navigation";
	import Header from "$lib/components/Header.svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth } from "$lib/firebase";

	export let data;

	$: ({ lists, user } = data);

	async function signOut() {
		await auth.signOut();
		goto("/signin");
	}
</script>

<div
	class="flex h-screen flex-col items-stretch selection:!bg-blue-500 selection:!text-white dark:selection:!bg-blue-400 dark:selection:!text-gray-900"
>
	<Header>
		{#if user}
			<div class="flex h-full items-center gap-3">
				<img src={user.photoURL} alt="" class="h-full rounded-full" />
				<div class="flex flex-col items-start justify-center">
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
			</div>
		{/if}
	</Header>

	<div class="flex flex-1 overflow-clip">
		<Sidebar {user} lists={$lists ?? []} />
		<main class="flex-1 overflow-y-scroll p-8 dark:bg-gray-900">
			<div class="max-w-4xl">
				<slot />
			</div>
		</main>
	</div>
</div>
