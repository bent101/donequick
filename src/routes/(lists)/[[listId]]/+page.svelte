<script lang="ts">
	import TodoList_ from "$lib/components/TodoList_.svelte";

	export let data;

	$: ({ todoList } = data);
</script>

<svelte:head>
	<title>{$todoList?.name ?? "Todos"} | donequick</title>
</svelte:head>

{#if data.user}
	<TodoList_ user={data.user} todos={data.todos} meta={data.todoList} />
{/if}
