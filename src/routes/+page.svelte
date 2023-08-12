<script lang="ts">
	import TodoList from "$lib/components/TodoList.svelte";

	export let data;

	$: ({ todos } = data);
</script>

<TodoList {todos} />
