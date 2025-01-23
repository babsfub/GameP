<script lang="ts">
  import { getWalletClient, publicClient } from '$lib/config/contract.js'
  import { wallet } from '$lib/stores/wallet.js'
  import { retroGamingABI } from '$lib/contracts/abi.js'
  import { RETRO_GAMING_ADDRESS } from '$lib/config/index.js'

  async function connect() {
    try {
      wallet.setConnecting(true)
      const walletClient = await getWalletClient()
      const [address] = await walletClient.requestAddresses()

      const [verifierStats, owner] = await Promise.all([
        publicClient.readContract({
          address: RETRO_GAMING_ADDRESS,
          abi: retroGamingABI,
          functionName: 'getVerifierStats',
          args: [0n, 'tetris', address]
        }),
        publicClient.readContract({
          address: RETRO_GAMING_ADDRESS,
          abi: retroGamingABI,
          functionName: 'owner'
        })
      ])

      const isVerifier = verifierStats[2] // isActive est le troisième élément retourné

      console.log('owner', owner, 'isVerifier', isVerifier)

      wallet.setAddress(address)
      wallet.setVerifier(isVerifier)
      wallet.setAdmin(owner === address)

    } catch (error) {
      console.error('Connection error:', error)
      wallet.setError(error instanceof Error ? error : new Error('Failed to connect'))
    } finally {
      wallet.setConnecting(false)
    }
  }

  async function disconnect() {
    wallet.reset()
  }
</script>

<!-- Le reste du composant reste inchangé -->
<div class="wallet-connect">
  {#if $wallet.error}
    <p class="error">{$wallet.error.message}</p>
  {/if}

  {#if $wallet.address}
    <div class="connected">
      <span class="address">
        {$wallet.address.slice(0, 6)}...{$wallet.address.slice(-4)}
      </span>
      {#if $wallet.isAdmin}
        <span class="badge admin">Admin</span>
      {/if}
      {#if $wallet.isVerifier}
        <span class="badge verifier">Verifier</span>
      {/if}
      <button 
        class="disconnect" 
        on:click={disconnect}
      >
        Disconnect
      </button>
    </div>
  {:else}
    <button 
      class="connect"
      on:click={connect}
      disabled={$wallet.isConnecting}
    >
      {$wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  {/if}
</div>

<style>
  .wallet-connect {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .connected {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1a1a1a;
    border-radius: 9999px;
  }

  .address {
    font-family: monospace;
    font-size: 0.9rem;
    color: #e5e7eb;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge.admin {
    background: #dc2626;
    color: white;
  }

  .badge.verifier {
    background: #2563eb;
    color: white;
  }

  button {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 9999px;
    font-weight: 600;
    transition: all 0.2s;
  }

  button.connect {
    background: #4f46e5;
    color: white;
  }

  button.disconnect {
    background: #374151;
    color: white;
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>