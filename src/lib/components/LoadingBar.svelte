<script lang="ts">
	import { navigating } from "$app/stores";
	import { spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import { afterNavigate } from "$app/navigation";

	/** how long to wait (in ms) before showing the loading bar */
	const DELAY = 350;

	let progress = spring(0, { stiffness: 0.03, damping: 1 });

	function animate() {
		if ($navigating) {
			$progress += (80 - $progress) / 1.3;
			requestAnimationFrame(animate);
		} else {
			$progress = 100;
		}
	}

	$: if ($progress >= 100) {
		progress = spring(0, { stiffness: 0.03, damping: 1 });
	}

	let timeout: ReturnType<typeof setTimeout> | undefined;

	function beforeNavigationStart() {
		if ($navigating) {
			timeout = setTimeout(() => {
				progress.stiffness = 0.03;
				$progress = 80;
				timeout = undefined;
			}, DELAY);
		}
	}

	$: isNavigating = $navigating !== null;

	$: if (isNavigating) {
		beforeNavigationStart();
	}

	afterNavigate(() => {
		if (timeout === undefined) {
			progress.stiffness = 0.35;
			$progress = 100;
		} else {
			clearTimeout(timeout);
			timeout = undefined;
		}
	});
</script>

<div class="fixed inset-x-0 top-0 z-50 h-1">
	{#if $progress > 0}
		<div
			transition:fade={{ duration: 100 }}
			style="width: {$progress}%"
			class="h-full bg-gray-300 dark:bg-gray-700"
		/>
	{/if}
</div>
