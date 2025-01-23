<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import LeaderBoard from '$lib/components/LeaderBoard.svelte';
  import { readContract } from '$lib/contracts/actions.js';
  import { formatEther } from 'viem';
  import type { Game } from '$lib/types/games.js';

  let selectedGame = $state<Game | 'all'>('all');
  let stats = $state({
    activePlayers: 0,
    totalPrizePool: '0',
    gamesPlayed: 0
  });

  let games = $state([
    {
      id: 'snake',
      title: 'Snake',
      description: 'Race against time and collect power-ups in this modern twist on the classic.',
      path: '/games/snake',
      minStake: 0,
      maxScore: 100,
      currentPlayers: 0,
      prize: '0 POL',
      gradient: 'from-emerald-400 to-cyan-500',
      imagePath: '/images/games/snake.webp',
      active: false
    },
    {
      id: 'tetris',
      title: 'Tetris',
      description: 'Stack blocks strategically in this enhanced version with special pieces.',
      path: '/games/tetris',
      minStake: 0,
      maxScore: 200,
      currentPlayers: 0,
      prize: '0 POL',
      gradient: 'from-purple-500 to-pink-500',
      imagePath: '/images/games/tetris.webp',
      active: false
    }
  ]);

  async function updateGameStats() {
    let totalPrizePool = 0n;
    let totalPlayers = 0;
    let totalGames = 0;

    for (let game of games) {
      try {
        // Récupérer la config du jeu
        const config = await readContract.getGameConfig(game.id);
        const gameActive = config.active;
        
        // Si le jeu est actif, mettre à jour ses stats
        if (gameActive) {
          const round = await readContract.getGameRound(config.currentRound, game.id);
          const scores = await readContract.getScoresByRound(config.currentRound, game.id, false);
          
          // Calculer le prize pool après les frais de plateforme
          const totalPrizeWithoutFees = round.basic.totalPrizePool * BigInt(100 - Number(config.platformFee)) / 100n;
          
          // Mettre à jour les stats du jeu
          game.active = true;
          game.minStake = Number(formatEther(config.minStake));
          game.prize = `${formatEther(totalPrizeWithoutFees)} POL`;
          game.currentPlayers = scores.length;

          // Accumuler les totaux (prize pool après frais)
          totalPrizePool += totalPrizeWithoutFees;
          totalPlayers += scores.length;
          totalGames++;
        }
      } catch (err) {
        console.error(`Error fetching stats for ${game.id}:`, err);
      }
    }

    // Mettre à jour les stats globales
    stats = {
      activePlayers: totalPlayers,
      totalPrizePool: `${formatEther(totalPrizePool)} POL`,
      gamesPlayed: totalGames
    };

    // Forcer une mise à jour de l'état des jeux
    games = [...games];
  }

  // Mettre à jour les stats toutes les minutes
  $effect(() => {
    updateGameStats();
    const timer = setInterval(updateGameStats, 60000);
    return () => clearInterval(timer);
  });

  onMount(updateGameStats);
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

  <!-- Game Cards - Only show active games -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
    {#each games.filter(game => game.active) as game}
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
        { label: 'Active Players', value: stats.activePlayers, icon: '👥' },
        { label: 'Total Prize Pool', value: stats.totalPrizePool, icon: '🏆' },
        { label: 'Games Available', value: games.filter(g => g.active).length, icon: '🎮' }
      ] as stat}
        <div class="text-center">
          <span class="block text-2xl mb-2">{stat.icon}</span>
          <div class="text-xl font-bold text-white">{stat.value}</div>
          <div class="text-sm text-gray-400">{stat.label}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Game Selection & Leaderboard - Only show active games -->
  <section class="mb-16">
    <div class="game-selector">
      <button 
        class="game-selector-button {selectedGame === 'all' ? 'active' : ''}"
        onclick={() => selectedGame = 'all'}
      >
        All Games
      </button>
      {#each games.filter(game => game.active) as game}
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

