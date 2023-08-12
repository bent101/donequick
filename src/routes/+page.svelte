<script lang="ts">
	import TodoList from "$lib/components/TodoList.svelte";

	export let data;

	$: ({ todos } = data);
</script>

<h2 class="mb-4 font-extrabold uppercase text-slate-500">Todos</h2>

<TodoList {todos} />
