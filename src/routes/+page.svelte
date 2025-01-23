<!-- src/routes/+page.svelte -->
<script lang="ts">
  import LeaderBoard from '$lib/components/LeaderBoard.svelte';
  import type { Game } from '$lib/types/games.js';

  let selectedGame = $state<Game | 'all'>('all');

  const games = [
    {
      id: 'snake',
      title: 'Snake',
      description: 'Race against time and collect power-ups in this modern twist on the classic.',
      path: '/games/snake',
      minStake: 10,
      maxScore: 100,
      currentPlayers: 123,
      prize: '0.1 ETH',
      gradient: 'from-emerald-400 to-cyan-500',
      imagePath: '/images/games/snake.webp'
    },
    {
      id: 'tetris',
      title: 'Tetris',
      description: 'Stack blocks strategically in this enhanced version with special pieces.',
      path: '/games/tetris',
      minStake: 20,
      maxScore: 200,
      currentPlayers: 245,
      prize: '0.2 ETH',
      gradient: 'from-purple-500 to-pink-500',
      imagePath: '/images/games/tetris.webp'
    }
  ] as const;
</script>

<div class="min-h-screen px-screen-safe py-game mx-auto max-w-game">
  <!-- Hero Section -->
  <section class="mb-16 text-center fade-in">
    <h1 class="text-gradient text-4xl md:text-6xl font-display font-bold mb-4">
      Play. Compete. Win.
    </h1>
    <p class="text-lg text-gray-400 max-w-2xl mx-auto">
      Classic arcade games reinvented for Web3. Compete for real prizes.
    </p>
  </section>

  <!-- Game Cards -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
    {#each games as game}
      <a href={game.path} class="game-card">
        <div class="game-card-gradient bg-gradient-to-br {game.gradient}"></div>
        
        <div class="game-card-content">
          <div class="game-card-badge">
            <span class="text-sm font-semibold text-game-primary">Prize: {game.prize}</span>
          </div>

          <h2 class="text-3xl font-display font-bold mb-3">{game.title}</h2>
          <p class="text-gray-400 mb-6 line-clamp-2">{game.description}</p>
          
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400">🎮</span>
              <span class="text-sm font-medium">{game.currentPlayers} playing</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400">💎</span>
              <span class="text-sm font-medium">{game.minStake} MATIC min</span>
            </div>
          </div>
        </div>
      </a>
    {/each}
  </section>

  <!-- Stats Section -->
  <section class="bg-glass rounded-game p-8 mb-16 slide-up">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {#each [
        { label: 'Active Players', value: '345', icon: '👥' },
        { label: 'Total Prize Pool', value: '2.5 ETH', icon: '🏆' },
        { label: 'Games Played', value: '1.2K', icon: '🎮' }
      ] as stat}
        <div class="text-center">
          <span class="block text-2xl mb-2">{stat.icon}</span>
          <div class="text-xl font-bold text-white">{stat.value}</div>
          <div class="text-sm text-gray-400">{stat.label}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Game Selection & Leaderboard -->
  <section class="mb-16">
    <div class="game-selector">
      <button 
        class="game-selector-button {selectedGame === 'all' ? 'active' : ''}"
        onclick={() => selectedGame = 'all'}
      >
        All Games
      </button>
      {#each games as game}
        <button 
          class="game-selector-button {selectedGame === game.id ? 'active' : ''}"
          onclick={() => selectedGame = game.id}
        >
          {game.title}
        </button>
      {/each}
    </div>
    <LeaderBoard {selectedGame} />
  </section>
</div>