<script>
	import "../app.postcss";
	import { signIn } from "$lib/firebase";
	export let data;

	$: user = data.user;
</script>

<header class="sticky top-0 z-10 flex h-20 w-full items-center gap-4 bg-white p-4 shadow-lg">
	<h1 class="ml-4 mr-auto font-serif text-3xl font-extrabold text-slate-800">
		<a href="/">donequick</a>
	</h1>
	<img src={user.photoURL} alt="" class="h-full rounded-full" />
	<button
		on:click={signIn}
		class="h-full rounded-md border-2 border-slate-200 px-6 py-3 font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
		>Switch accounts</button
	>
</header>

<main class="mx-auto max-w-2xl p-4">
	<slot />
</main>
