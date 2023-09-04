<script lang="ts">
	import { browser } from "$app/environment";
	import { afterNavigate } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { lg } from "$lib/css-stores";
	import { MenuIcon } from "svelte-feather-icons";
	import { fade, fly } from "svelte/transition";

	export let data;
	$: ({ lists, user } = data);

	let showingSidebar = false;

	afterNavigate(() => {
		showingSidebar = false;
	});
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === "Escape") showingSidebar = false;
	}}
/>

<div
	class="flex h-screen max-h-screen items-stretch overflow-hidden selection:!bg-blue-500 selection:!text-white dark:bg-gray-900 dark:selection:!bg-blue-400 dark:selection:!text-gray-900"
>
	{#if showingSidebar && !$lg}
		<button
			in:fade={{ duration: 200 }}
			on:click={() => {
				showingSidebar = false;
			}}
			class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm focus:outline-none"
		/>
	{/if}
	{#if showingSidebar || $lg}
		<aside
			transition:fly={{ duration: 200, x: -150 }}
			class="fixed inset-y-0 left-0 z-50 w-80 overflow-y-scroll bg-gray-200 pb-64 dark:bg-gray-950 lg:relative {browser
				? ''
				: 'invisible lg:visible'}"
		>
			<Sidebar {user} lists={$lists} />
		</aside>
	{/if}

	<main class="relative flex-1 overflow-y-scroll p-8">
		<div class="max-w-4xl">
			<slot />
		</div>
	</main>
	{#if !$lg}
		<button
			class="fixed left-0 top-2 grid h-12 w-12 place-items-center rounded-r-full bg-gray-200 shadow-lg dark:bg-gray-950"
			on:click={(e) => {
				showingSidebar = true;
				e.currentTarget.blur();
			}}
		>
			<MenuIcon class="text-gray-500 dark:text-gray-400" />
		</button>
	{/if}
</div>
