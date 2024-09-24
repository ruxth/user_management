<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {toast, Toaster} from 'svelte-sonner';

  onMount(() => {
    goto('/login');
  });
</script>