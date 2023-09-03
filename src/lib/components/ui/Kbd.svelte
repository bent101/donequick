<script lang="ts">
	export let light = false;
</script>

<kbd
	class="inline-flex h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-md border border-b-2 font-mono font-bold {light
		? 'border-gray-500 bg-gray-400 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
		: 'border-gray-400 bg-gray-300 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600'}"
>
	<slot />
</kbd>
