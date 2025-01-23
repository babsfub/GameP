// src/lib/config/contract.ts
import { createPublicClient, createWalletClient, http, custom} from 'viem'
import { sepolia } from 'viem/chains'

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Adresse du contrat déployé
export const RETRO_GAMING_ADDRESS = '0x301EcED82E34A33a77805E15fF972D9D073ab9EF' as const 

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
  chain: sepolia,
  transport: http('https://sepolia.drpc.org')
})

// Fonction pour obtenir un wallet client
export function getWalletClient(transport = window?.ethereum ? custom(window.ethereum) : http()) {
  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum!)
  })
}