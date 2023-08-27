<script>
	import { invalidate } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth, signIn } from "$lib/firebase";
	import { onAuthStateChanged } from "firebase/auth";
	import { onDestroy } from "svelte";
	import "../app.postcss";
	export let data;

	$: ({ lists, user } = data);

	// if the user changes, reload everything that depends on it
	const unsub = onAuthStateChanged(auth, () => {
		invalidate("firebase:auth");
	});

	onDestroy(unsub);
</script>

<div class="flex h-screen select-none flex-col selection:!bg-blue-500 selection:!text-white">
	<header class="z-20 flex h-20 w-full items-center gap-4 bg-white p-4 shadow-lg">
		<h1 class="ml-6 mr-auto font-serif text-3xl font-extrabold text-slate-700">
			<a href="/">donequick</a>
		</h1>
		<img src={user.photoURL} alt="" class="h-full rounded-full" />
		<button
			on:click={signIn}
			class="h-full rounded-md border-2 border-slate-200 px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
		>
			Switch accounts
		</button>
	</header>

	<div class="flex flex-1 overflow-clip">
		<Sidebar userId={user.uid} {lists} />
		<main class="max-w-4xl flex-1 p-8">
			<slot />
		</main>
	</div>
</div>
