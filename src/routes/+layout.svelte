<script lang="ts">
	import LoadingBar from "$lib/components/LoadingBar.svelte";

	import "../app.postcss";
</script>

<svelte:head>
	<title>donequick</title>
	<meta name="darkreader-lock" />
</svelte:head>

<slot />

<LoadingBar />
