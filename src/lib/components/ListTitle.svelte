<script lang="ts">
	import { afterNavigate } from "$app/navigation";
	import type { DocStore } from "$lib/firebase";
	import type { TodoList } from "$lib/models";
	import { sleep } from "$lib/utils";
	import { updateDoc } from "firebase/firestore";

	export let meta: DocStore<TodoList> | null;

	let titleInputEl: HTMLInputElement | undefined;
	let titleInput = "";

	$: title = $meta?.name ?? "Todos";

	async function onTitleChanged() {
		titleInput = title;
		if (title === "Untitled list") {
			await sleep(0);
			titleInputEl?.focus();
			titleInputEl?.select();
		}
	}

	$: title, onTitleChanged();

	$: if (!$meta) {
		titleInput = "Todos";
	}

	function onTitleInputBlur() {
		if (!$meta) {
			throw new Error("this should never happen");
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

<input
	type="text"
	name=""
	spellcheck="false"
	bind:value={titleInput}
	bind:this={titleInputEl}
	disabled={!meta}
	on:blur={onTitleInputBlur}
	on:keydown={onTitleInputKeydown}
	class="w-80 overflow-clip overflow-ellipsis rounded-full border-2 border-transparent bg-transparent px-4 text-lg font-bold text-slate-500 outline-0 enabled:border-slate-200 enabled:hover:border-slate-300 enabled:focus:border-blue-500"
/>
