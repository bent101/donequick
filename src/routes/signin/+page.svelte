<script>
	import Header from "$lib/components/Header.svelte";
	import { signIn } from "$lib/firebase";
	import { UserIcon } from "svelte-feather-icons";
</script>

<div class="flex h-screen flex-col items-stretch">
	<Header />
	<div class="flex flex-1 flex-col items-center justify-center text-lg dark:bg-gray-900">
		<h1 class="mb-12 text-3xl font-bold text-gray-800 dark:text-gray-200">Sign in to donequick</h1>
		<button
			on:click={signIn}
			class="block rounded-lg bg-gray-300 px-6 py-3 font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200"
		>
			<UserIcon class="mr-1 inline" />
			Sign in with Google
		</button>
	</div>
</div>
