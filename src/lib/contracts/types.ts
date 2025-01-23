// src/lib/contracts/types.ts
import type { Address } from 'viem'

export interface Score {
  player: Address;
  score: bigint;
  blockNumber: bigint;
  verified: boolean;
  stake: bigint;
  scoreHash: `0x${string}`;
  verifier: Address;
  level?: bigint;       
  lines?: number;     
  moves_count?: number; 
  moves_hash?: string;  
}

export interface GameConfig {
  roundDuration: bigint
  minStake: bigint
  platformFee: number
  verifierFee: number
  maxScorePerGame: bigint
  active: boolean
  saltKey: `0x${string}`
  currentRound: bigint
  lastRoundStartTime: bigint
}

export interface RoundInfo {
  basic: {
    startTime: bigint
    endTime: bigint
    totalPrizePool: bigint
    rewardsDistributed: boolean
  }
  verifiersCount: bigint
}

export interface VerifierStats {
  actions: bigint
  rewards: bigint
  isActive: boolean
}