<script lang="ts">
	import type { UserSummary } from "$lib/models";

	export let member: UserSummary;
</script>

<div class="group relative -mr-2 flex">
	<div
		class="pointer-events-none absolute -inset-y-1 -left-1 z-10 hidden items-center rounded-full bg-slate-300 pl-14 pr-6 text-sm font-semibold leading-4 group-hover:flex"
	>
		<div>
			<span class="text-slate-600">{member.name}</span>
			<span class="text-slate-500">{member.email}</span>
		</div>
	</div>
	<img src={member.photoURL} alt={member.name} class="rounded-full group-hover:z-10" />
</div>
