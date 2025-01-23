<!-- src/routes/admin/+page.svelte -->
<script lang="ts">
  import { wallet } from '$lib/stores/wallet.js'
  import ConfigForm from '$lib/components/admin/ConfigForm.svelte'

  let { data } = $props<{ data: App.PageData }>()
</script>

{#if !$wallet.address}
  <div class="unauthorized">
    <h1>Admin Panel</h1>
    <p>Please connect your wallet to access admin features.</p>
  </div>
{:else if !data.isAdmin}
  <div class="unauthorized">
    <h1>Unauthorized</h1>
    <p>You do not have admin privileges.</p>
  </div>
{:else}
  <div class="admin">
    <h1>Admin Panel</h1>
    <ConfigForm account={$wallet.address} />
  </div>
{/if}

<style>
  .admin, .unauthorized {
    max-width: 48rem;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.25rem;
    font-weight: 600;
    color: white;
    margin-bottom: 2rem;
  }

  .unauthorized {
    text-align: center;
    padding: 4rem 1rem;
  }

  .unauthorized p {
    color: rgb(156 163 175);
  }
</style>