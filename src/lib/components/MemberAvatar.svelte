<script lang="ts">
	import type { UserSummary } from "$lib/models";

	export let member: UserSummary;
</script>

<div class="group relative -mr-2 h-10 w-10">
	<div
		class="pointer-events-none absolute -inset-y-1 -left-1 z-10 hidden items-center rounded-full bg-gray-300 pl-14 pr-6 text-sm font-semibold leading-4 group-hover:flex dark:bg-gray-800"
	>
		<div>
			<span class="text-gray-600 dark:text-gray-400">{member.name}</span>
			<span class="text-gray-500 dark:text-gray-500">{member.email}</span>
		</div>
	</div>
	<img
		src={member.photoURL}
		alt={member.name}
		class="absolute inset-0 rounded-full group-hover:z-50"
	/>
</div>
