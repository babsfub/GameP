<script lang="ts">
  import { onMount } from 'svelte';
  import Connect from '$lib/components/wallet/Connect.svelte';
  import { getWalletClient } from '$lib/config/contract.js';
  import type { PageData } from '$lib/types.js';
  import '../app.css';
  import { writable } from 'svelte/store';
  let { data, children } = $props<{ data: PageData, children: any }>();
  let navContent: HTMLElement;
  
 
  let mounted = writable(false);

  

  onMount(async () => {
    try {
      const client = getWalletClient();
      const addresses = await client.getAddresses();
      mounted.set(true);
      if (addresses[0]) {
        $mounted = true;
      }
    } catch (error) {
      console.error('Failed to get addresses:', error);
    }
  });
</script>

<div class="app">
  <header class="header">
    <nav class="nav">
      <div class="nav-brand">
        <a href="/" class="logo">Retro Gaming</a>
        
        <!-- Bouton hamburger pour mobile -->
        <button class="menu-toggle" aria-label="Toggle menu" onclick={() => navContent.classList.toggle('active')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-16 6h16"/>
          </svg>
        </button>
      </div>

      <div class="nav-content" bind:this={navContent}>
        <div class="nav-links">
          <a href="/games/snake">Snake</a>
          <a href="/games/tetris">Tetris</a>
          {#if data.isAdmin}
            <a href="/admin">Admin</a>
          {/if}
        </div>

        {#if mounted}
          <div class="nav-auth">
            <Connect />
          </div>
        {/if}
      </div>
    </nav>
  </header>

  <main class="main">
    {@render children()}
  </main>

  <footer class="footer">
    <p>© 2024 Retro Gaming Platform</p>
  </footer>
</div>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--color-surface);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav {
    max-width: var(--max-width-game);
    margin: 0 auto;
    padding: 0 var(--spacing-screen-safe);
    height: 3.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
  }

  .menu-toggle {
    display: none; /* Caché par défaut, visible seulement sur mobile */
    background: none;
    border: none;
    color: var(--color-text);
    padding: 0.5rem;
    cursor: pointer;
  }

  .nav-content {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
  }

  .nav-links a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }

  .nav-links a:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.1);
  }

  /* Media queries pour le responsive */
  @media (max-width: 768px) {
    .nav {
      height: auto;
      flex-direction: column;
      padding: 1rem var(--spacing-screen-safe);
    }

    .nav-brand {
      width: 100%;
      justify-content: space-between;
    }

    .menu-toggle {
      display: block; /* Afficher le bouton hamburger */
    }

    .nav-content {
      display: none; /* Caché par défaut sur mobile */
      width: 100%;
      flex-direction: column;
      gap: 1rem;
      padding-top: 1rem;
    }

    

    .nav-links {
      flex-direction: column;
      width: 100%;
      gap: 0.5rem;
    }

    .nav-links a {
      display: block;
      padding: 0.75rem;
      text-align: center;
    }

    .nav-auth {
      width: 100%;
      display: flex;
      justify-content: center;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
</style>