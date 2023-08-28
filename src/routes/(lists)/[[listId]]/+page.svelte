<script lang="ts">
	import TodoList_ from "$lib/components/TodoList_.svelte";

	export let data;
</script>

<TodoList_ user={data.user} todos={data.todos} meta={data.todoList} />
