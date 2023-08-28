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

	// function justAddedATodo() {
	// 	return !("ref" in todo) && input !== "";
	// }
</script>

<div class="flex select-text justify-stretch">
	{#each { length: todo.indent ?? 0 } as _, i}
		<div
			class="-z-10 mr-5 h-8 w-[1.30rem] border-r-2 border-slate-200 text-transparent selection:!bg-transparent"
		>
			&nbsp; &nbsp; &nbsp; &nbsp;
		</div>
	{/each}
	<button
		bind:this={self}
		on:click={() => {
			inputEl?.focus();
		}}
		class="group flex h-8 flex-1 cursor-text scroll-m-32 items-stretch gap-2 rounded-full px-2 transition-shadow duration-100"
	>
		<!-- <button
			tabindex="-1"
			disabled={!("ref" in todo)}
			id="moveicon"
			class="text-transparent enabled:cursor-grab enabled:group-hover:text-slate-400 enabled:group-hover:hover:text-slate-500 enabled:group-[&:has(>input:focus)]:text-slate-400"
		>
			<MoveIcon />
		</button> -->

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
				<CheckIcon class="h-full text-slate-400 hover:text-slate-500" />
			{:else if "ref" in todo || inputIsFocused}
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
			placeholder={listName ? `Add to "${listName}"` : `Add a todo`}
			class="mx-2 my-1 flex-1 border-b-2 {'ref' in todo
				? 'border-transparent'
				: 'select-none border-slate-300'} bg-transparent outline-none placeholder:text-slate-400 focus:placeholder:text-transparent enabled:text-slate-700 enabled:focus:border-slate-500 disabled:pointer-events-none disabled:text-slate-400 disabled:line-through group-hover:border-slate-300 enabled:group-hover:focus:border-slate-500"
		/>

		<!-- <div class="font-mono text-slate-400">{todo.rank}</div> -->

		<button
			tabindex="-1"
			disabled={!("ref" in todo)}
			on:click|stopPropagation={deleteTodo}
			class="select-none text-transparent enabled:group-hover:text-slate-400 enabled:group-hover:hover:text-slate-500 enabled:group-[&:has(>input:focus)]:text-slate-400"
		>
			<Trash2Icon />
		</button>
	</button>
</div>
