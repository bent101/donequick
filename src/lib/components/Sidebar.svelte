<script lang="ts">
	import type { WithRefAndId } from "$lib/firebase";
	import type { TodoList } from "$lib/models";
	import type { User } from "firebase/auth";
	import MyLists from "./MyLists.svelte";
	import Profile from "./Profile.svelte";

	export let user: User | null;
	export let lists: WithRefAndId<TodoList>[] | undefined;
</script>

<div class="sticky inset-x-0 top-0 bg-gray-200/80 p-4 backdrop-blur-md dark:bg-gray-950/80">
	<Profile {user} />
</div>
<MyLists {user} {lists} />
