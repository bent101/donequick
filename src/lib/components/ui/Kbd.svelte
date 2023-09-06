<script lang="ts">
	import { hasKeyboard } from "$lib/css-stores";

	export let light = false;
</script>

<kbd
	class="inline-flex h-6 select-none items-center justify-center rounded-md border border-b-2 px-2 font-mono font-bold {light
		? 'border-gray-400 bg-gray-200 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
		: 'border-gray-400 bg-gray-300 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600'} 
		{$hasKeyboard ? '' : 'invisible'}"
>
	<slot />
</kbd>
