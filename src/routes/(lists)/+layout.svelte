<script lang="ts">
	import { goto } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth } from "$lib/firebase";

	export let data;

	$: ({ lists, user } = data);

	async function switchAccounts() {
		await auth.signOut();
		goto("/", { invalidateAll: true });
	}
</script>

<div class="flex h-screen flex-col items-stretch selection:!bg-blue-500 selection:!text-white">
	<header class="z-20 flex h-20 w-full items-center gap-4 bg-white p-4 px-12 shadow-lg">
		<h1 class="mr-auto font-serif text-3xl font-extrabold text-slate-700">
			<a href="/">donequick</a>
		</h1>

		{#if user}
			<div class="flex h-full items-center gap-3">
				<img src={user.photoURL} alt="" class="h-full rounded-full" />
				<div class="flex flex-col items-start justify-center">
					<div class="text-sm font-semibold text-slate-600">{user.email}</div>
					<button on:click={switchAccounts} class="text-xs text-slate-400 hover:underline">
						Switch accounts
					</button>
				</div>
			</div>
		{/if}
	</header>

	<div class="flex flex-1 overflow-clip">
		<Sidebar {user} lists={$lists ?? []} />
		<main class="flex-1 overflow-y-scroll p-8">
			<div class="max-w-4xl">
				<slot />
			</div>
		</main>
	</div>
</div>
