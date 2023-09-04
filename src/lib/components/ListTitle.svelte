<script lang="ts">
	import { afterNavigate } from "$app/navigation";
	import type { DocStore } from "$lib/firebase";
	import type { TodoList } from "$lib/models";
	import { updateDoc } from "firebase/firestore";

	export let meta: DocStore<TodoList> | null | undefined;

	let titleInputEl: HTMLInputElement | undefined;
	let titleInput = "";

	$: title = $meta?.name ?? "Todos";

	afterNavigate(() => {
		titleInput = title;
		if (title === "Untitled list") {
			setTimeout(() => {
				titleInputEl?.focus();
				titleInputEl?.select();
			}, 1);
		}
	});

	$: if ($meta === null) {
		titleInput = "Todos";
	}

	function onTitleInputBlur() {
		if (!$meta) {
			return;
		}

		titleInput = titleInput.trim();

		if (titleInput === "") {
			titleInput = $meta.name;
		} else {
			updateDoc($meta.ref, { name: titleInput });
		}
	}

	function onTitleInputKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }
	) {
		const { key } = event;

		if (key === "Enter" || key === "Escape") {
			event.currentTarget.blur();
		}
	}
</script>

{#if meta === undefined}
	<div class="w-80 px-4 py-2">
		<div class="h-full rounded-full bg-gray-200 dark:bg-gray-800" />
	</div>
{:else}
	<input
		type="text"
		name="title"
		autocomplete="off"
		spellcheck="false"
		bind:value={titleInput}
		bind:this={titleInputEl}
		disabled={!meta}
		on:blur={onTitleInputBlur}
		on:keydown={onTitleInputKeydown}
		class="w-80 overflow-clip overflow-ellipsis rounded-full border-2 border-transparent bg-transparent px-4 text-lg font-bold text-gray-500 outline-0 enabled:border-gray-200 enabled:hover:border-gray-300 enabled:focus:border-blue-500 dark:text-gray-400 dark:enabled:border-gray-700 dark:enabled:hover:border-gray-600 dark:enabled:focus:border-blue-400"
	/>
{/if}
