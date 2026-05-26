<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<h1>Ping localhost:3005/v1/ping</h1>
<p>Status: {data.status} ({data.ok ? 'ok' : 'fail'})</p>
<pre>{typeof data.body === 'string' ? data.body : JSON.stringify(data.body, null, 2)}</pre>
