<!-- src/lib/components/admin/Validate.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { writeContract, readContract } from '$lib/contracts/actions.js';
    import { formatEther, type Address } from 'viem';
    import type { Game } from '$lib/types/games.js';
    import { addToast } from '$lib/stores/toasts.js';
    import { wallet, isConnected } from '$lib/stores/wallet.js';
    import { gamePool } from '$lib/stores/scores.js';
    import { TetrisEngine } from '$lib/games/tetris/pkg/tetris_engine.js';
    import { Buffer } from 'buffer';
    

    const { selectedGame } = $props();


    interface Score {
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

    type RoundInfo = {
        roundId: bigint;
        startTime: bigint;
        endTime: bigint;
        active: boolean;
        totalPrizePool: bigint;
    };

    // État local
    let loading = $state(true);
    let verifying = $state(false);
    let error = $state<string | null>(null);
    let currentRound = $state<RoundInfo | null>(null);
    let pendingScores = $state<Score[]>([]);
    let selectedScores = $state<Set<number>>(new Set());
    let generatedHashes = $state<{ [key: number]: string }>({});
    
    // État pour la validation en batch
    let batchValidation = $state<{ [key: number]: boolean }>({});

    // Vérifie l'accès au composant
    $effect(() => {
        if (!$isConnected) {
            error = 'Please connect your wallet first.';
            return;
        }
        if (!$wallet.isVerifier) {
            error = 'Access denied. You must be a verifier.';
            return;
        }
        error = null;
    });

    // Charge les scores et met à jour le pool
    async function loadPendingScores() {
        if (!$isConnected || !$wallet.isVerifier) return;

        try {
            loading = true;
            error = null;

            const roundId = await readContract.getCurrentRoundId();
            const round = await readContract.getGameRound(roundId, selectedGame);
            
            currentRound = {
                roundId: roundId, 
                startTime: round.basic.startTime,
                endTime: round.basic.endTime,
                active: !round.basic.rewardsDistributed,
                totalPrizePool: round.basic.totalPrizePool
            };

            gamePool.set(round.basic.totalPrizePool);
            
            const scores = await readContract.getScoresByRound(
                roundId, 
                selectedGame,
                false
            );

            pendingScores = scores.filter((score: any) => !score.verified);
            selectedScores = new Set();
            batchValidation = {};

        } catch (err) {
            console.error('Error loading pending scores:', err);
            error = err instanceof Error ? err.message : 'Failed to load scores';
        } finally {
            loading = false;
        }
    }

    async function generateHash() {
    const game = selectedGame;
    const gameConfig = await readContract.getGameConfig(game);

    for (const [index, score] of pendingScores.entries()) {
        if (!selectedScores.has(index)) continue;

        try {
            const engine = new TetrisEngine(10, 20);
            
            // Convertir le hash stocké directement
            const storedHashHex = score.scoreHash.slice(2);
            const storedHashBytes = new Uint8Array(
                (storedHashHex.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16))
            );

        
            console.log('Verifying score with:', {
                storedHash: score.scoreHash,
                storedHashBytes,
                player: score.player,
                score: score.score.toString(),
                blockNumber: score.blockNumber.toString(),
                saltKey: gameConfig.saltKey
            });

            // Vérifier directement
            const isValid = engine.verify_score(
                storedHashBytes,
                score.player,
                score.blockNumber,
                gameConfig.saltKey
            );

            // Mettre à jour la validation
            setValidation(index, isValid);
            engine.free();

        } catch (error) {
            console.error('Error details:', {
                score: score,
                error: error 
            });
            setValidation(index, false);
        }
    }
}
    
async function validateScoreHash() {
    for (const [index, score] of pendingScores.entries()) {
        if (!selectedScores.has(index) || !generatedHashes[index]) continue;
        
        const isValid = score.scoreHash === generatedHashes[index];
        setValidation(index, isValid);
        
        console.log(
            'Hash comparison for score', score.score.toString(), ':',
            isValid ? 'MATCH' : 'NO MATCH',
            '\nStored:', score.scoreHash,
            '\nGenerated:', generatedHashes[index]
        );
    }
}
   
async function verifyAndValidateScores() {
    if (!currentRound || !$wallet.address || !$wallet.isVerifier || selectedScores.size === 0) return;

    try {
        verifying = true;
   
        await generateHash(); 
        
        const indexes = [...selectedScores];
        const validations = indexes.map(index => batchValidation[index] ?? false);

        // Envoyer les validations au contrat
        await writeContract.verifyScoresBatch({
            roundId: currentRound.roundId,
            game: selectedGame,
            scoreIndexes: indexes.map(index => BigInt(index)),
            validations,
            account: $wallet.address
        });

        addToast({
            type: 'success',
            message: `Successfully processed ${selectedScores.size} scores`
        });

        await loadPendingScores();

    } catch (err) {
        console.error('Error validating scores:', err);
        addToast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to validate scores'
        });
    } finally {
        verifying = false;
        selectedScores.clear();
        batchValidation = {};
    }
}

    function toggleScoreSelection(index: number) {
        if (selectedScores.has(index)) {
            selectedScores.delete(index);
            delete batchValidation[index];
        } else {
            selectedScores.add(index);
        }
    }

    function toggleAllScores() {
        if (selectedScores.size === pendingScores.length) {
            selectedScores.clear();
        } else {
            pendingScores.forEach((_, index) => selectedScores.add(index));
        }
    }

    function setValidation(index: number, isValid: boolean) {
        batchValidation[index] = isValid;
        if (!selectedScores.has(index)) {
            selectedScores.add(index);
        }
    }

    // Initialisation
    onMount(() => {
        if ($isConnected && $wallet.isVerifier) {
            loadPendingScores();
        }
    });
</script>
<div class="validator-container">
    <div class="header">
        <h2>Score Validation</h2>
        {#if !$wallet.isVerifier}
            <div class="warning">
                {$isConnected ? 'You must be a verifier to validate scores' : 'Please connect your wallet'}
            </div>
        {/if}
    </div>

    {#if error}
        <div class="error">{error}</div>
    {:else}
        <div class="info-panel">
            <div class="info-item">Round #{currentRound?.roundId.toString() ?? '...'}</div>
            <div class="info-item">Prize Pool: {currentRound ? formatEther(currentRound.totalPrizePool) : '0'} ETH</div>
            <div class="info-item">Status: {currentRound?.active ? 'Active' : 'Ended'}</div>
        </div>

        <div class="actions-panel">
            <span class="selected-count">
                {selectedScores.size > 0 ? `${selectedScores.size} scores selected` : 'No scores selected'}
            </span>
            <div class="action-buttons">
                <button 
                    class="button verify"
                    disabled={verifying}
                    onclick={generateHash}
                >
                    Verify Selected Scores
                </button>
                <button
                    class="button validate"
                    disabled={verifying || selectedScores.size === 0 || Object.keys(batchValidation).length === 0}
                    onclick={verifyAndValidateScores}
                >
                    Submit Validations
                </button>
            </div>
        </div>

        <div class="scores-section">
            {#if loading}
                <div class="status-message">Loading pending scores...</div>
            {:else if pendingScores.length === 0}
                <div class="status-message">No pending scores to validate</div>
            {:else}
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input 
                                        type="checkbox" 
                                        onclick={toggleAllScores}
                                    />
                                </th>
                                <th>Player</th>
                                <th>Score</th>
                                <th class="hide-mobile">Stake</th>
                                <th class="hide-mobile">Block</th>
                                <th>Stored Hash</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each pendingScores as score, i}
                                <tr class={selectedScores.has(i) ? 'selected' : ''}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedScores.has(i)}
                                            onclick={() => toggleScoreSelection(i)}
                                        />
                                    </td>
                                    <td>{score.player.slice(0, 6)}...{score.player.slice(-4)}</td>
                                    <td>{score.score.toString()}</td>
                                    <td class="hide-mobile">{formatEther(score.stake)} ETH</td>
                                    <td class="hide-mobile">{score.blockNumber.toString()}</td>
                                    <td title={score.scoreHash}>{score.scoreHash.slice(0, 10)}...</td>
                                    <td>
                                        {#if batchValidation[i] !== undefined}
                                            <span class={batchValidation[i] ? 'valid' : 'invalid'}>
                                                {batchValidation[i] ? '✅ Valid' : '❌ Invalid'}
                                            </span>
                                        {:else}
                                            <span class="pending">Pending verification</span>
                                        {/if}
                                    </td>
                                    <td class="actions">
                                        <button
                                            class="icon-button approve"
                                            disabled={!$wallet.isVerifier || verifying}
                                            onclick={() => setValidation(i, true)}
                                            title="Approve Score"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            class="icon-button reject"
                                            disabled={!$wallet.isVerifier || verifying}
                                            onclick={() => setValidation(i, false)}
                                            title="Reject Score"
                                        >
                                            ✗
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
  

    .valid {
        color: #16a34a;
        font-weight: 500;
    }

    .invalid {
        color: #dc2626;
        font-weight: 500;
    }

    .pending {
        color: #9ca3af;
        font-style: italic;
    }

    .validator-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header { margin-bottom: 1.5rem; }

    .info-panel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
    }

    .actions-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 1.5rem;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 0.5rem;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        font-weight: 500;
        cursor: pointer;
    }

    .button:disabled { opacity: 0.5; cursor: not-allowed; }

    
    .verify { background: #7c3aed; color: white; }
    .validate { background: #16a34a; color: white; }

    .table-container {
        width: 100%;
        overflow-x: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .icon-button {
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
    }

    .icon-button.approve { background: #16a34a; color: white; }
    .icon-button.reject { background: #dc2626; color: white; }

    .status-message {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
    }

    @media (max-width: 768px) {
        .hide-mobile { display: none; }
        
        .actions-panel {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }
        
        .action-buttons {
            flex-direction: column;
            width: 100%;
        }
        
        .button {
            width: 100%;
            margin: 0.25rem 0;
        }
    }
</style>