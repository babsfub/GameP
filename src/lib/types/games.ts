//$lib/types/games.ts
export type GameConfig = {
  roundDuration: bigint;        // uint64
  minStake: bigint;            // uint64
  platformFee: number;         // uint8
  verifierFee: number;         // uint8
  maxScorePerGame: bigint;     // uint64
  active: boolean;             // bool
  saltKey: `0x${string}`;      // bytes32 
  currentRound: bigint;        // uint256
  lastRoundStartTime: bigint;  // uint64
}


export type RoundInfo = {
  roundId: bigint
  startTime: bigint
  endTime: bigint
  totalPrizePool: bigint
  rewardsDistributed: boolean
  active: boolean
}

export interface ScoreRecord {
  id: string;
  gameId: string;
  roundId: bigint;
  player: string;
  score: bigint;
  scoreHash: string;
  blockNumber: bigint;
  timestamp: number;
  gameState: {
    score: number;
    level: number;
    lines: number;
    movesCount: number;
    movesHash: string;
  };
  stake: bigint;
  verified: boolean;
  validationStatus?: 'pending' | 'valid' | 'invalid';
  validatedAt?: number;
  validatedBy?: string;
}



export type RoundBasicInfo = {
  startTime: bigint;
  endTime: bigint;
  totalPrizePool: bigint;
  rewardsDistributed: boolean;
}

export type GameRoundData = {
  basic: RoundBasicInfo;
  verifiersCount: bigint;
}

export type Score = {
  player: `0x${string}`;
  score: bigint;
  blockNumber: bigint;
  verified: boolean;
  stake: bigint;
  scoreHash: `0x${string}`;
  verifier: `0x${string}`;
}

export type Game = 'snake' | 'tetris'

