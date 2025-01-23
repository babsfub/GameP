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
          {formatEther(currentRound.totalPrizePool)} ETH
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