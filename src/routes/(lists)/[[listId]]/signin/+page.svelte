<script>
	import { signIn } from "$lib/firebase";
	import { UserIcon } from "svelte-feather-icons";
</script>

<div
	class="fixed inset-0 z-50 grid place-items-center bg-white/10 backdrop-blur-sm dark:bg-gray-950/10"
>
	<div class="flex flex-col items-center rounded-xl bg-gray-200 p-12 text-lg dark:bg-gray-800">
		<h1 class="mb-20 text-3xl font-bold text-gray-800 dark:text-gray-200">Sign in to donequick</h1>
		<button
			on:click={signIn}
			class="block rounded-lg bg-gray-300 px-6 py-3 font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200"
		>
			<UserIcon class="mr-1 inline" />
			Sign in with Google
		</button>
	</div>
</div>
