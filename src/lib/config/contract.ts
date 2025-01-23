// src/lib/config/contract.ts
import { createPublicClient, createWalletClient, http, custom} from 'viem'
import { polygon } from 'viem/chains'

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Adresse du contrat déployé
export const RETRO_GAMING_ADDRESS = '0x14425c8f8b9b4524659cf25a762d3b741de0de44' as const 

// Configuration du contrat
export const CONTRACT_CONFIG = {
  roundDuration: 172800n, 
  minStake: '0.01', 
  platformFee: 30n, 
  maxScorePerGame: 100n,
  verifierFee: 10n,
  saltKey:0x0n,
  active: true
} as const


export const publicClient = createPublicClient({
  chain: polygon,
  transport: http('https://polygon.drpc.org')
})

// Fonction pour obtenir un wallet client
export function getWalletClient(transport = window?.ethereum ? custom(window.ethereum) : http()) {
  return createWalletClient({
    chain: polygon,
    transport: custom(window.ethereum!)
  })
}