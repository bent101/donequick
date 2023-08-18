<script lang="ts">
	import TodoList_ from "$lib/components/TodoList_.svelte";

	export let data;
</script>

<TodoList_ userId={data.user.uid} todos={data.todos} meta={data.todoList} />
