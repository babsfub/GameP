<!-- src/lib/components/LeaderBoard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { formatEther, type Address } from 'viem';
  import { readContract } from '$lib/contracts/actions.js';
  import type { Game, GameConfig } from '$lib/types/games.js';

  type Score = {
    player: Address;
    score: bigint;
    blockNumber: bigint;
    verified: boolean;
    stake: bigint;
    scoreHash: `0x${string}`;
    verifier: Address;
    game?: Game;
  };

  type RoundInfo = {
    roundId: bigint;
    startTime: bigint;
    endTime: bigint;
    active: boolean;
    totalPrizePool: bigint;
    minStake: bigint;
  };

  let { selectedGame = 'all' } = $props<{ selectedGame: Game | 'all' }>();

  let currentRound = $state<RoundInfo>({
    roundId: 0n,
    startTime: 0n,
    endTime: 0n,
    active: false,
    totalPrizePool: 0n,
    minStake: 0n
  });

  let gameScores = $state<Score[]>([]);
  let gameConfig = $state<GameConfig | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  function calculateTimeLeft(round: RoundInfo): string {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (!round.active || round.endTime <= now) return 'Round ended';

    const remaining = Number(round.endTime - now);
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  async function fetchGameScores() {
    if (selectedGame === 'all') {
      await fetchAllGamesScores();
      return;
    }

    try {
      loading = true;
      error = null;

      const config = await readContract.getGameConfig(selectedGame);
      gameConfig = config;
      
      if (!config.active) {
        error = 'Game is not active';
        return;
      }

      const round = await readContract.getGameRound(config.currentRound, selectedGame);

      currentRound = {
        roundId: config.currentRound,
        startTime: config.lastRoundStartTime,
        endTime: round.basic.endTime,
        active: config.active,
        totalPrizePool: round.basic.totalPrizePool,
        minStake: config.minStake
      };

      const scores = await readContract.getScoresByRound(
        config.currentRound,
        selectedGame,
        false
      );

      gameScores = scores
        .map(score => ({
          ...score,
          score: BigInt(score.score),
          stake: BigInt(score.stake),
          blockNumber: BigInt(score.blockNumber)
        }))
        .sort((a, b) => Number(b.score - a.score));

    } catch (err) {
      console.error('Error fetching game scores:', err);
      error = err instanceof Error ? err.message : 'Failed to load scores';
    } finally {
      loading = false;
    }
  }

  async function fetchAllGamesScores() {
    try {
      loading = true;
      error = null;
      const games: Game[] = ['tetris', 'snake'];
      let allScores: Score[] = [];

      for (const game of games) {
        const config = await readContract.getGameConfig(game);
        if (!config.active) continue;

        const scores = await readContract.getScoresByRound(
          config.currentRound,
          game,
          false
        );

        allScores = [...allScores, 
          ...scores.map(score => ({
            ...score,
            game,
            score: BigInt(score.score),
            stake: BigInt(score.stake),
            blockNumber: BigInt(score.blockNumber)
          }))
        ];
      }

      gameScores = allScores.sort((a, b) => Number(b.score - a.score));
    } catch (err) {
      console.error('Error fetching all games scores:', err);
      error = err instanceof Error ? err.message : 'Failed to load scores';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    fetchGameScores();
    const timer = setInterval(fetchGameScores, 60000);
    return () => clearInterval(timer);
  });

  onMount(fetchGameScores);
</script>

<div class="leaderboard-content">
  <div class="leaderboard-header">
    <h2>
      {#if selectedGame === 'all'}
        Global Leaderboard
      {:else}
        {selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1)} Leaderboard - Round {currentRound.roundId.toString()}
      {/if}
    </h2>
  </div>

  <div class="leaderboard-info-bar">
    <div class="leaderboard-info-grid">
      <div class="leaderboard-info-item">
        <span class="leaderboard-label">Prize Pool</span>
        <span class="leaderboard-value leaderboard-value-prize">
          {formatEther(currentRound.totalPrizePool * BigInt(100 - Number(gameConfig?.platformFee ?? 0)) / 100n)} ETH
        </span>
      </div>
      <div class="leaderboard-info-item">
        <span class="leaderboard-label">Min Stake</span>
        <span class="leaderboard-value">
          {formatEther(currentRound.minStake)} ETH
        </span>
      </div>
      <div class="leaderboard-info-item">
        <span class="leaderboard-label">Time Left</span>
        <span class="leaderboard-value">
          {calculateTimeLeft(currentRound)}
        </span>
      </div>
    </div>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="leaderboard-table-container">
    {#if loading}
      <div class="loading">
        <div class="loading-spinner" ></div>
        <span>Loading scores...</span>
      </div>
    {:else if gameScores.length === 0}
      <div class="empty">No scores submitted yet</div>
    {:else}
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            {#if selectedGame === 'all'}
              <th>Game</th>
            {/if}
            <th>Player</th>
            <th>Score</th>
            <th>Stake</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each gameScores as { player, score, stake, verified, game }, i}
            <tr>
              <td>{i + 1}</td>
              {#if selectedGame === 'all'}
                <td class="capitalize">{game}</td>
              {/if}
              <td class="player-address">{player.slice(0, 6)}...{player.slice(-4)}</td>
              <td>{score.toString()}</td>
              <td>{formatEther(stake)} ETH</td>
              <td>
                <span class="leaderboard-status {verified ? 'verified' : ''}">
                  {verified ? 'Verified' : 'Pending'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .leaderboard-content {
    padding: 1rem;
  }

  .leaderboard-header {
    margin-bottom: 1rem;
  }

  .leaderboard-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: white;
  }

  .leaderboard-info-bar {
    background: rgb(31 41 55);
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .leaderboard-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .leaderboard-info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .leaderboard-label {
    color: rgb(156 163 175);
    font-size: 0.875rem;
  }

  .leaderboard-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
  }

  .leaderboard-value-prize {
    color: rgb(34 197 94);
  }

  .leaderboard-table-container {
    background: rgb(31 41 55);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .loading, .empty {
    padding: 2rem;
    text-align: center;
    color: rgb(156 163 175);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgb(55 65 81);
    border-top-color: rgb(79 70 229);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .leaderboard-table {
    width: 100%;
    border-collapse: collapse;
  }

  .leaderboard-table th,
  .leaderboard-table td {
    padding: 0.75rem 1rem;
    text-align: left;
  }

  .leaderboard-table th {
    background: rgb(55 65 81);
    color: rgb(209 213 219);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .leaderboard-table td {
    border-bottom: 1px solid rgb(55 65 81);
    color: white;
  }

  .leaderboard-table tr:last-child td {
    border-bottom: none;
  }

  .player-address {
    font-family: monospace;
  }

  .capitalize {
    text-transform: capitalize;
  }

  .leaderboard-status {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    background: rgb(55 65 81);
    color: rgb(156 163 175);
  }

  .leaderboard-status.verified {
    background: rgb(34 197 94 / 0.1);
    color: rgb(34 197 94);
  }

  .error {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgb(239 68 68 / 0.1);
    color: rgb(239 68 68);
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.875rem;
  }
</style>