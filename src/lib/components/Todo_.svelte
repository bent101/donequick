<script lang="ts">
	import type { WithRefAndId } from "$lib/firebase";
	import type { Todo } from "$lib/models";
	import { deleteDoc, updateDoc } from "firebase/firestore";
	import { createEventDispatcher } from "svelte";
	import { CheckIcon, PlusIcon, SquareIcon, Trash2Icon } from "svelte-feather-icons";
	import type { Writable } from "svelte/store";

	export let todo: WithRefAndId<Todo> | Todo;
	export let id: string;
	export let focusedTodoId: Writable<string | null>;
	export let listName: string | undefined;

	let inputEl: HTMLInputElement | undefined;
	let checkButton: HTMLElement | undefined;
	let self: HTMLElement | undefined;

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

		if (key === "Enter") {
			if (!("ref" in todo)) {
				submitTodo();
			}
		} else if (key === "Tab") {
			event.preventDefault();
			let nextIndent = todo.indent + (event.shiftKey ? -1 : 1);
			nextIndent = Math.max(nextIndent, 0);
			if (nextIndent !== todo.indent) {
				todo.indent = nextIndent;
				if ("ref" in todo) {
					updateDoc(todo.ref, { indent: todo.indent });
					dispatch("updated");
				}
			}
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
				dispatch("newtodo", { content: input, indent: todo.indent });
				dispatch("updated");

				input = "";
			}
		}
	}
</script>

<div class="flex min-w-max select-text justify-stretch">
	{#each { length: todo.indent ?? 0 } as _, i}
		<div class="mr-5 h-8 w-[1.30rem] border-r-2 border-gray-200 dark:border-gray-800" />
	{/each}
	<button
		bind:this={self}
		on:click={() => {
			inputEl?.focus();
		}}
		class="group flex h-8 flex-1 cursor-text scroll-m-32 items-stretch gap-2 rounded-full px-2 transition-shadow duration-100"
	>
		<button
			class="select-none"
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
				<CheckIcon class="h-full text-gray-400 hover:text-gray-500 dark:text-gray-600" />
			{:else if "ref" in todo || inputIsFocused}
				<SquareIcon
					class="h-full text-gray-300 group-hover:text-gray-400 group-hover:hover:text-gray-500  group-[&:has(>input:focus)]:text-gray-400 dark:text-gray-700 dark:group-hover:text-gray-600 dark:group-[&:has(>input:focus)]:text-gray-600 "
				/>
			{:else}
				<PlusIcon
					class="h-full cursor-default text-gray-300 group-[&:has(>input:focus)]:text-transparent dark:text-gray-700"
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
			placeholder={listName ? `Add to "${listName}"` : `Add a todo`}
			class="mx-2 my-1 flex-1 border-b-2 {'ref' in todo
				? 'border-transparent'
				: 'select-none border-gray-300 dark:border-gray-700'} bg-transparent outline-none placeholder:text-gray-400 focus:placeholder:text-transparent enabled:text-gray-700 enabled:focus:border-gray-500 disabled:pointer-events-none disabled:text-gray-400 disabled:line-through group-hover:border-gray-300 enabled:group-hover:focus:border-gray-500 dark:placeholder:text-gray-600 dark:enabled:text-gray-300 dark:disabled:text-gray-600 dark:group-hover:border-gray-700 dark:enabled:group-hover:focus:border-gray-500"
		/>

		<!-- <div class="font-mono text-gray-400">{todo.rank}</div> -->

		<button
			tabindex="-1"
			disabled={!("ref" in todo)}
			on:click|stopPropagation={deleteTodo}
			class="select-none text-transparent enabled:group-hover:text-gray-400 enabled:group-hover:hover:text-gray-500 enabled:group-[&:has(>input:focus)]:text-gray-400 dark:enabled:group-hover:text-gray-600 dark:enabled:group-hover:hover:text-gray-500 dark:enabled:group-[&:has(>input:focus)]:text-gray-600"
		>
			<Trash2Icon />
		</button>
	</button>
</div>
