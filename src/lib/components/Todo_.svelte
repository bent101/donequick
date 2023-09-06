<script lang="ts">
	import type { WithRefAndId } from "$lib/firebase";
	import type { Todo } from "$lib/models";
	import { isShiftDown } from "$lib/stores";
	import { updateDoc } from "firebase/firestore";
	import { createEventDispatcher } from "svelte";
	import { CheckIcon, PlusIcon, SquareIcon } from "svelte-feather-icons";
	import type { Writable } from "svelte/store";
	import Kbd from "./ui/Kbd.svelte";

	export let todo: WithRefAndId<Todo> | Todo;
	export let id: string;
	export let focusHotkey: string | null;
	export let focusedTodoId: Writable<string | null>;
	export let listName: string | undefined;

	let inputEl: HTMLInputElement | undefined;
	let checkButton: HTMLElement | undefined;
	let self: HTMLElement | undefined;

	let input = todo.content; // bound to <input>

	$: input, dispatch("edited");

	$: if ($focusedTodoId === id) {
		if (todo.done) {
			checkButton?.focus();
		} else {
			inputEl?.focus();
		}
	} else {
		inputEl?.blur();
		checkButton?.blur();
	}

	let dispatch = createEventDispatcher();

	let inputIsFocused = false;

	function onExternallyEdited() {
		if (!inputIsFocused) input = todo.content;
	}
	$: todo.content, onExternallyEdited(); // will also call when you edit a todo, but won't change anything

	function onExternallyCompleted() {
		input = todo.content;
		$focusedTodoId = null;
	}
	$: if (todo.done) onExternallyCompleted(); // will also call when you complete a todo, but won't change anything

	function onInputKeydown(event: KeyboardEvent) {
		const { key } = event;

		if (key === "Escape") {
			$focusedTodoId = null;
		} else if (key === "Enter") {
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
		} else if (event.altKey) {
			if (key === "ArrowUp" || key === "ArrowDown") {
				event.preventDefault();
				event.stopPropagation();
				dispatch("swap", { id, dir: key === "ArrowUp" ? -1 : 1 });
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
			setTimeout(() => {
				if ($focusedTodoId === id && !inputIsFocused) {
					$focusedTodoId = null;
				}
			}, 1);
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

	function onCheckBtnClicked() {
		if ("ref" in todo) {
			todo.done = !todo.done;
			updateDoc(todo.ref, { done: todo.done });
			dispatch("updated");
		}
	}

	function handleKeypress(event: KeyboardEvent & { currentTarget: EventTarget & Window }) {
		if (document.activeElement !== document.body) return;
		event.preventDefault();
		if (event.key === focusHotkey) {
			inputEl?.focus();
		}
	}
</script>

<svelte:window on:keypress={handleKeypress} />

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
		<button class="select-none" bind:this={checkButton} tabindex="-1" on:click={onCheckBtnClicked}>
			{#if $isShiftDown && focusHotkey && "ref" in todo}
				<div class="w-6">
					<Kbd light>{focusHotkey}</Kbd>
				</div>
			{:else if todo.done}
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

		<div class="relative mx-2 my-1 flex-1">
			<input
				spellcheck="false"
				bind:this={inputEl}
				bind:value={input}
				on:focus={onInputFocus}
				on:blur={onInputBlur}
				on:keydown={onInputKeydown}
				disabled={todo.done}
				class="w-full appearance-none rounded-none border-b-2 {'ref' in todo
					? 'border-transparent'
					: 'select-none border-gray-300 dark:border-gray-700'} bg-transparent outline-none enabled:text-gray-700 enabled:focus:border-gray-500 disabled:pointer-events-none disabled:text-gray-400 disabled:line-through group-hover:border-gray-300 enabled:group-hover:focus:border-gray-500 dark:enabled:text-gray-300 dark:disabled:text-gray-600 dark:group-hover:border-gray-700 dark:enabled:group-hover:focus:border-gray-500"
			/>
			<div
				class="absolute inset-y-0 left-0 select-none text-gray-400 dark:text-gray-600 {!inputIsFocused &&
				input === ''
					? 'visible'
					: 'invisible'}"
			>
				<span class="inline-block">
					{listName ? `Add to "${listName}"` : `Add a todo`}
				</span>
				<span class="ml-1 inline-block -translate-y-1">
					{#if !("ref" in todo)}
						<Kbd light>↵</Kbd>
					{/if}
				</span>
			</div>
		</div>
	</button>
</div>
