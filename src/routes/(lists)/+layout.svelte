<script lang="ts">
	import { goto } from "$app/navigation";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { auth } from "$lib/firebase";

	export let data;

	$: ({ lists, user } = data);

	// // if the user changes, reload everything that depends on it
	// const unsub = onAuthStateChanged(auth, (next: User | null) => {
	// 	if (next === null) {
	// 		invalidate("firebase:auth");
	// 	}
	// });

	// onDestroy(unsub);
</script>

<div class="flex h-screen flex-col items-stretch selection:!bg-blue-500 selection:!text-white">
	<header class="z-20 flex h-20 w-full items-center gap-4 bg-white p-4 shadow-lg">
		<h1 class="ml-6 mr-auto font-serif text-3xl font-extrabold text-slate-700">
			<a href="/">donequick</a>
		</h1>
		<img src={user.photoURL} alt="" class="h-full rounded-full" />
		<button
			on:click={async () => {
				await auth.signOut();
				goto("/", { invalidateAll: true });
			}}
			class="h-full rounded-md border-2 border-slate-200 px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
		>
			Switch accounts
		</button>
	</header>

	<div class="flex flex-1 overflow-clip">
		<Sidebar {user} {lists} />
		<main class="flex-1 overflow-y-scroll p-8">
			<div class="max-w-4xl">
				<slot />
			</div>
		</main>
	</div>
</div>
