// src/lib/contracts/actions.ts
import type { Address, Hash } from 'viem'
import { parseEther } from 'viem'
import { publicClient, getWalletClient } from '$lib/config/contract.js'
import { retroGamingABI } from './abi.js'
import { RETRO_GAMING_ADDRESS } from '$lib/config/index.js'
import type { Score, GameConfig, VerifierStats } from './types.js'
import type { GameRoundData} from '$lib/types/games.js'  

/**
 * Actions de lecture du contrat
 */
export const readContract = {

  async getCurrentRoundId(): Promise<bigint> {
    try {
      const result = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'currentGlobalRoundId'
      }) as bigint
      
      return result
    } catch (error) {
      console.error('Error getting current round:', error)
      throw error
    }
  },

  async getGameConfig(game: string): Promise<GameConfig> {
    try {
      const result = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getGameConfig',
        args: [game]
      });
  
      return {
        roundDuration: result.roundDuration,
        minStake: result.minStake,
        platformFee: result.platformFee,
        verifierFee: result.verifierFee,
        maxScorePerGame: result.maxScorePerGame,
        active: result.active,
        saltKey: result.saltKey,
        currentRound: result.currentRound,
        lastRoundStartTime: result.lastRoundStartTime
      };
    } catch (error) {
      console.error('Error getting game config:', error);
      throw error;
    }
  },
  

  async getGameRound(roundId: bigint, game: string): Promise<GameRoundData> {
    try {
      const result = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getGameRound',
        args: [roundId, game]
      });
  
      return {
        basic: {
          startTime: result[0].startTime,
          endTime: result[0].endTime,
          totalPrizePool: result[0].totalPrizePool,
          rewardsDistributed: result[0].rewardsDistributed
        },
        verifiersCount: result[1]
      };
    } catch (error) {
      console.error('Error getting game round:', error);
      throw error;
    }
  },
  
  async verifyScoresBatch(params: {
    roundId: bigint;
    game: string;
    scoreIndexes: bigint[];
    validations: boolean[];
    account: Address;
  }): Promise<Hash> {
    try {
      const { roundId, game, scoreIndexes, validations, account } = params;
      const walletClient = await getWalletClient();
  
      console.log('Verifying scores:', {
        roundId: roundId.toString(),
        game,
        scoreIndexes: scoreIndexes.map(i => i.toString()),
        validations
      });
  
      const hash = await walletClient.writeContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'verifyScoresBatch',
        args: [roundId, game, scoreIndexes, validations],
        account
      });
  
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error('Error verifying scores batch:', error);
      throw error;
    }
  },
  
  
  

  async getGameScores(roundId: bigint, game: string): Promise<Score[]> {
    try {
      const scores = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getGameScores',
        args: [roundId, game]
      }) as Score[]

      return scores
    } catch (error) {
      console.error('Error getting game scores:', error)
      throw error
    }
  },

  async getScoresByRound(roundId: bigint, game: string, verifiedOnly: boolean): Promise<Score[]> {
    try {
      const scores = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getScoresByRound',
        args: [roundId, game, verifiedOnly]
      }) as Score[]
      return scores
    } catch (error) {
      console.error('Error getting scores by round:', error)
      throw error
    }
  },

  async getPlayerScores(roundId: bigint, game: string, player: Address): Promise<Score[]> {
    try {
      const scores = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getPlayerScores',
        args: [roundId, game, player]
      }) as Score[]
      return scores
    } catch (error) {
      console.error('Error getting player scores:', error)
      throw error
    }
  },

  async getPlayerGameStake(roundId: bigint, game: string, player: Address): Promise<bigint> {
    try {
      return await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getPlayerGameStake',
        args: [roundId, game, player]
      }) as bigint
    } catch (error) {
      console.error('Error getting player game stake:', error)
      throw error
    }
  },

  async getGamePrizePool(roundId: bigint, game: string): Promise<bigint> {
    try {
      return await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getGamePrizePool',
        args: [roundId, game]
      }) as bigint
    } catch (error) {
      console.error('Error getting game prize pool:', error)
      throw error
    }
  },
  

  async getVerifierStats(
    roundId: bigint,
    game: string,
    verifier: Address
  ): Promise<VerifierStats> {
    try {
      const result = await publicClient.readContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'getVerifierStats',
        args: [roundId, game, verifier]
      }) as [bigint, bigint, boolean]

      return {
        actions: result[0],
        rewards: result[1],
        isActive: result[2]
      }
    } catch (error) {
      console.error('Error getting verifier stats:', error)
      throw error
    }
  }
}

/**
 * Actions d'écriture du contrat
 */
export const writeContract = {
  async submitScore(params: {
    game: string
    score: bigint
    scoreHash: `0x${string}`
    stake: string
    account: Address
  }): Promise<Hash> {
    try {
      const { game, score, scoreHash, stake, account } = params
      const walletClient = await getWalletClient()
      const stakeInWei = parseEther(stake)

      const hash = await walletClient.writeContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'submitScore',
        args: [game, score, scoreHash],
        value: stakeInWei,
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (error) {
      console.error('Error submitting score:', error)
      throw error
    }
  },

  async verifyScoresBatch(params: {
    roundId: bigint
    game: string
    scoreIndexes: bigint[]
    validations: boolean[]
    account: Address
  }): Promise<Hash> {
    try {
      const { roundId, game, scoreIndexes, validations, account } = params
      const walletClient = await getWalletClient()

      const hash = await walletClient.writeContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'verifyScoresBatch',
        args: [roundId, game, scoreIndexes, validations],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (error) {
      console.error('Error verifying scores batch:', error)
      throw error
    }
  },

  async distributeRewards(params: {
    roundId: bigint
    game: string
    account: Address
  }): Promise<Hash> {
    try {
      const { roundId, game, account } = params
      const walletClient = await getWalletClient()

      const hash = await walletClient.writeContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'distributeRewards',
        args: [roundId, game],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (error) {
      console.error('Error distributing rewards:', error)
      throw error
    }
  },

  async withdraw(account: Address): Promise<Hash> {
    try {
      const walletClient = await getWalletClient()

      const hash = await walletClient.writeContract({
        address: RETRO_GAMING_ADDRESS,
        abi: retroGamingABI,
        functionName: 'withdraw',
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (error) {
      console.error('Error withdrawing:', error)
      throw error
    }
  }
}

export const contractActions = {
  read: readContract,
  write: writeContract
}