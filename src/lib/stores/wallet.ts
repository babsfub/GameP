// src/lib/stores/wallet.ts
import { writable, derived } from 'svelte/store'
import type { Address } from 'viem'

type WalletState = {
  address: Address | null
  isConnecting: boolean
  error: Error | null
  isVerifier: boolean
  isAdmin: boolean
  pendingWithdrawal: bigint
}

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
    isVerifier: false,
    isAdmin: false,
    pendingWithdrawal: 0n
  })

  return {
    subscribe,
    setAddress: (address: Address | null) => 
      update(state => ({ ...state, address })),
    
    setConnecting: (isConnecting: boolean) => 
      update(state => ({ ...state, isConnecting })),
    
    setError: (error: Error | null) => 
      update(state => ({ ...state, error })),
    
    setVerifier: (isVerifier: boolean) => 
      update(state => ({ ...state, isVerifier })),
    
    setAdmin: (isAdmin: boolean) => 
      update(state => ({ ...state, isAdmin })),
    
    setPendingWithdrawal: (pendingWithdrawal: bigint) => 
      update(state => ({ ...state, pendingWithdrawal })),
    
    reset: () => set({
      address: null,
      isConnecting: false,
      error: null,
      isVerifier: false,
      isAdmin: false,
      pendingWithdrawal: 0n
    })
  }
}

export const wallet = createWalletStore()

// Store dérivé pour l'état de connexion
export const isConnected = derived(
  wallet,
  $wallet => $wallet.address !== null
)