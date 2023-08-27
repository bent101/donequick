<script lang="ts">
	import type { WithRefAndId } from "$lib/firebase";
	import type { Todo } from "$lib/models";
	import { deleteDoc, updateDoc } from "firebase/firestore";
	import { createEventDispatcher } from "svelte";
	import { CheckIcon, MoveIcon, PlusIcon, SquareIcon, Trash2Icon } from "svelte-feather-icons";
	import type { Writable } from "svelte/store";

	export let todo: WithRefAndId<Todo> | Todo;
	export let id: string;
	export let focusedTodoId: Writable<string | null>;

	let inputEl: HTMLInputElement | undefined;
	let checkButton: HTMLElement | undefined;

	let input = todo.content; // bound to <input>

	$: if ($focusedTodoId === id) {
		if (todo.done) {
			checkButton?.focus();
		} else {
			inputEl?.focus();
		}
	} else {
		inputEl?.blur();
	}

	let dispatch = createEventDispatcher();

	let inputIsFocused = false;

	function onExternallyEdited() {
		if (!inputIsFocused) input = todo.content;
	}
	$: todo.content, onExternallyEdited(); // will also call when you edit a todo, but won't change anything

	function onExternallyCompleted() {
		input = todo.content;
		inputEl?.blur();
	}
	$: if (todo.done) onExternallyCompleted(); // will also call when you complete a todo, but won't change anything

	function deleteTodo() {
		if ("ref" in todo) {
			deleteDoc(todo.ref);
			dispatch("updated");
		} else {
			input = "";
			todo.content = "";
		}
	}

	function onInputKeydown(event: KeyboardEvent) {
		const { key } = event;
		if (key === "Escape") {
			inputEl?.blur();
		}

		const justAdded = justAddedATodo();

		if (key === "Enter") {
			if (!("ref" in todo)) {
				submitTodo();
			}
		} else if (key === "Tab") {
			// TODO: handle tab and shift tab
			event.preventDefault();
		}
	}

	function onInputFocus() {
		inputIsFocused = true;
		$focusedTodoId = id;
	}

	function onInputBlur() {
		inputIsFocused = false;

		if ($focusedTodoId === id) {
			$focusedTodoId = null;
		}

		submitTodo();
	}

	function submitTodo() {
		input = input.trim();

		if (input === "") {
			if ("ref" in todo) {
				// dont allow empty todos (reverts to previous value)
				input = todo.content;
			}
		} else if (input !== todo.content) {
			if ("ref" in todo) {
				todo.content = input;
				updateDoc(todo.ref, { content: todo.content });
				dispatch("updated");
			} else {
				dispatch("newtodo", { content: input });
				dispatch("updated");

				input = "";
			}
		}
	}

	function justAddedATodo() {
		return !("ref" in todo) && input !== "";
	}
</script>

<button
	on:click={() => {
		if (!("ref" in todo)) {
			inputEl?.focus();
		}
	}}
	class="group flex h-8 w-full cursor-default items-stretch gap-2 rounded-full px-2 transition-shadow duration-100 [&:has(>.moveicon:enabled:active)]:bg-slate-200 [&:has(>.moveicon:enabled:active)]:shadow-md [&:has(>.moveicon:enabled:active)]:shadow-slate-900/30 [&:has(>input:focus)]:bg-slate-100"
>
	<button
		tabindex="-1"
		disabled={!("ref" in todo)}
		class="moveicon text-transparent enabled:cursor-grab enabled:group-hover:text-slate-400 enabled:group-hover:hover:text-slate-500 enabled:group-[&:has(>input:focus)]:text-slate-400"
	>
		<MoveIcon />
	</button>

	<button
		bind:this={checkButton}
		tabindex="-1"
		on:click={() => {
			if ("ref" in todo) {
				todo.done = !todo.done;
				updateDoc(todo.ref, { done: todo.done });
				dispatch("updated");
			}
		}}
	>
		{#if todo.done}
			<CheckIcon class="h-full text-slate-400 hover:text-slate-500" />
		{:else if "ref" in todo}
			<SquareIcon
				class="h-full text-slate-300 group-hover:text-slate-400 group-hover:hover:text-slate-500 group-[&:has(>input:focus)]:text-slate-400"
			/>
		{:else}
			<PlusIcon
				class="h-full cursor-default text-slate-300 group-[&:has(>input:focus)]:text-transparent"
			/>
		{/if}
	</button>

	<input
		spellcheck="false"
		bind:this={inputEl}
		bind:value={input}
		on:focus={onInputFocus}
		on:blur={onInputBlur}
		on:keydown={onInputKeydown}
		disabled={todo.done}
		class="mx-2 my-1 flex-1 border-b-2 {'ref' in todo
			? 'border-transparent'
			: 'border-slate-300'} bg-transparent outline-none enabled:text-slate-700 enabled:focus:border-slate-500 disabled:pointer-events-none disabled:text-slate-400 disabled:line-through group-hover:border-slate-300 enabled:group-hover:focus:border-slate-500"
	/>

	<!-- <div class="font-mono text-slate-400">{todo.rank}</div> -->

	<button
		tabindex="-1"
		disabled={!("ref" in todo)}
		on:click|stopPropagation={deleteTodo}
		class="text-transparent enabled:group-hover:text-slate-400 enabled:group-hover:hover:text-slate-500 enabled:group-[&:has(>input:focus)]:text-slate-400"
	>
		<Trash2Icon />
	</button>
</button>
