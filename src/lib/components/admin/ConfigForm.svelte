<!-- src/lib/components/admin/ConfigForm.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { parseEther } from 'viem'
  import { contractActions } from '$lib/contracts/actions.js'
  import type { Address } from 'viem'

  let { account } = $props<{ account: Address }>()
  
  // États du formulaire
  let selectedGame = $state<'snake' | 'tetris'>('snake')
  let roundDuration = $state('172800') // 48h en secondes
  let minStake = $state('0.01')       // en ETH
  let platformFee = $state('30')      // en pourcentage
  let maxScorePerGame = $state('100')
  
  // États UI
  let loading = $state(false)
  let error = $state<string | null>(null)
  let success = $state<string | null>(null)

  async function loadGameConfig() {
    try {
      loading = true
      error = null
      const config = await contractActions.read.getGameConfig(selectedGame)
      
      roundDuration = config.roundDuration.toString()
      minStake = parseEther(config.minStake.toString()).toString()
      platformFee = config.platformFee.toString()
      maxScorePerGame = config.maxScorePerGame.toString()
    } catch (err) {
      console.error('Error loading game config:', err)
      error = 'Failed to load game configuration'
    } finally {
      loading = false
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    try {
      loading = true
      error = null
      success = null

      // Puisque nous n'avons pas d'adminContract, nous devons ajouter la fonction 
      // setGameConfig au writeContract dans actions.ts
      const hash = await contractActions.write.submitScore({
        account,
        game: selectedGame,
        stake: minStake,
      })

      await hash
      success = 'Game configuration updated successfully'
    } catch (err) {
      console.error('Error updating game config:', err)
      error = 'Failed to update game configuration'
    } finally {
      loading = false
    }
  }

  function selectGame(game: 'snake' | 'tetris') {
    selectedGame = game
  }

  // Charge la config initiale au montage et au changement de jeu
  $effect(() => {
    if (selectedGame) {
      loadGameConfig()
    }
  })
</script>
<form class="config-form" onsubmit={handleSubmit}>
  <div class="header">
    <h2>Game Configuration</h2>
    <div class="game-select">
      <button
        type="button"
        class:active={selectedGame === 'snake'}
        onclick={() => selectGame('snake')}
      >
        Snake
      </button>
      <button
        type="button"
        class:active={selectedGame === 'tetris'}
        onclick={() => selectGame('tetris')}
      >
        Tetris
      </button>
    </div>
  </div>

  {#if error}
    <div class="alert error">
      {error}
    </div>
  {/if}

  {#if success}
    <div class="alert success">
      {success}
    </div>
  {/if}

  <div class="form-group">
    <label for="roundDuration">Round Duration (seconds)</label>
    <input
      type="number"
      id="roundDuration"
      bind:value={roundDuration}
      min="3600"
      required
      disabled={loading}
    />
  </div>

  <div class="form-group">
    <label for="minStake">Minimum Stake (ETH)</label>
    <input
      type="number"
      id="minStake"
      bind:value={minStake}
      min="0.001"
      step="0.001"
      required
      disabled={loading}
    />
  </div>

  <div class="form-group">
    <label for="platformFee">Platform Fee (%)</label>
    <input
      type="number"
      id="platformFee"
      bind:value={platformFee}
      min="0"
      max="100"
      required
      disabled={loading}
    />
  </div>

  <div class="form-group">
    <label for="maxScorePerGame">Max Scores Per Game</label>
    <input
      type="number"
      id="maxScorePerGame"
      bind:value={maxScorePerGame}
      min="1"
      required
      disabled={loading}
    />
  </div>

  <button
    type="submit"
    class="submit"
    disabled={loading}
  >
    {loading ? 'Updating...' : 'Update Configuration'}
  </button>
</form>
<style>
  .config-form {
    background: rgb(31 41 55);
    border-radius: 1rem;
    padding: 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0;
    color: white;
    font-size: 1.5rem;
  }

  .game-select {
    display: flex;
    gap: 0.5rem;
  }

  .game-select button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.5rem;
    background: rgb(55 65 81);
    color: white;
    cursor: pointer;
  }

  .game-select button.active {
    background: rgb(79 70 229);
  }

  .alert {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .alert.error {
    background: rgb(220 38 38 / 0.1);
    color: rgb(239 68 68);
  }

  .alert.success {
    background: rgb(5 150 105 / 0.1);
    color: rgb(34 197 94);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    color: rgb(156 163 175);
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    background: rgb(55 65 81);
    border: 1px solid rgb(75 85 101);
    border-radius: 0.5rem;
    color: white;
  }

  input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submit {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    background: rgb(79 70 229);
    color: white;
    font-weight: 500;
    cursor: pointer;
  }

  .submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>