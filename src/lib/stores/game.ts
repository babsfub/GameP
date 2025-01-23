// src/lib/stores/game.ts
import { writable, derived } from 'svelte/store'
import type { Address } from 'viem'
import type { GameId } from '$lib/config/index.js'

type Score = {
  player: Address
  score: bigint
  timestamp: bigint
  verified: boolean
}

type RoundInfo = {
  id: bigint
  startTime: bigint
  endTime: bigint
  totalPrizePool: bigint
  rewardsDistributed: boolean
}

type GameState = {
  currentRound: RoundInfo | null
  scores: {
    [key in GameId]?: Score[]
  }
  activePlayers: {
    [key in GameId]?: number
  }
  loading: boolean
  error: Error | null
}

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>({
    currentRound: null,
    scores: {},
    activePlayers: {},
    loading: false,
    error: null
  })

  return {
    subscribe,
    
    // Met à jour les informations du round en cours
    setCurrentRound: (round: RoundInfo) => 
      update(state => ({ ...state, currentRound: round })),
    
    // Ajoute un nouveau score pour un jeu
    addScore: (gameId: GameId, score: Score) => 
      update(state => ({
        ...state,
        scores: {
          ...state.scores,
          [gameId]: [...(state.scores[gameId] || []), score]
        }
      })),
    
    // Met à jour tous les scores d'un jeu
    setScores: (gameId: GameId, scores: Score[]) => 
      update(state => ({
        ...state,
        scores: {
          ...state.scores,
          [gameId]: scores
        }
      })),
    
    // Met à jour le nombre de joueurs actifs
    setActivePlayers: (gameId: GameId, count: number) => 
      update(state => ({
        ...state,
        activePlayers: {
          ...state.activePlayers,
          [gameId]: count
        }
      })),
    
    // Gestion de l'état de chargement
    setLoading: (loading: boolean) => 
      update(state => ({ ...state, loading })),
    
    // Gestion des erreurs
    setError: (error: Error | null) => 
      update(state => ({ ...state, error })),
    
    // Réinitialise le store
    reset: () => set({
      currentRound: null,
      scores: {},
      activePlayers: {},
      loading: false,
      error: null
    })
  }
}

export const game = createGameStore()

// Stores dérivés utiles
export const currentRoundTimeLeft = derived(
  game,
  $game => {
    if (!$game.currentRound) return null
    const now = BigInt(Math.floor(Date.now() / 1000))
    const timeLeft = $game.currentRound.endTime - now
    return timeLeft > 0n ? timeLeft : 0n
  }
)

export const isRoundActive = derived(
  currentRoundTimeLeft,
  $timeLeft => $timeLeft !== null && $timeLeft > 0n
)

export const sortedScores = derived(
  game,
  $game => (gameId: GameId) => {
    const scores = $game.scores[gameId] || []
    return [...scores].sort((a, b) => {
      // Trie d'abord par score (décroissant)
      if (b.score !== a.score) return Number(b.score - a.score)
      // Puis par timestamp (croissant)
      return Number(a.timestamp - b.timestamp)
    })
  }
)