
// Import dependencies, learn more at: https://www.quicknode.com/docs/functions/runtimes/node-js-20-runtime
const https = require('https');

/**
 * main(params) is invoked when your Function is called from Streams or API.
 * 
 * @param {Object} params - May contain a dataset (params.data), params.metadata, and params.user_data
 * 
 * @returns {Object} - A message that will be logged and returned when a Function is called via API.
 *           Tip: You can chain Functions together by calling them inside each other.
 * Learn more at: https://www.quicknode.com/docs/functions/getting-started#overview
 */
async function main(params) {
    // Extract dataset and network from metadata in params
    const dataset = params.metadata.dataset;
    const network = params.metadata.network;

    // Extract user data from params, if any
    const userData = params.user_data;

    const returnData = params;
    const block = returnData.data[0];

    let metrics = {
		message: `Analysis from the ${dataset} dataset on the ${network} network.`,
		blockHeight: block.blockHeight,
		blockTime: block.blockTime,

		// Compute units
		totalComputeUnits: 0,
		avgComputeUnitsPerTx: 0,

		// Fee metrics
		totalFees: 0,
		avgFeePerTx: 0,

		// Balance changes
		totalBalanceChange: 0,

		// Program invocations
		programInvocations: {},
		programInvocationsBackup: {},

        // system program invocations
        systemProgramInvocation: [],
        solSenders: {},
        solReceivers: {},

		// Transaction metrics
		successfulTxCount: 0,
		failedTxCount: 0,

		// Account activity
		uniqueAccounts: new Set(),
		uniqueSigners: new Set(),

		// Write set size
		totalWritableAccounts: 0,
		avgWritableAccountsPerTx: 0,
	}

	// Process each transaction
	block.transactions.forEach(tx => {
		// Compute units
		metrics.totalComputeUnits += tx.meta.computeUnitsConsumed

		// Fees
		metrics.totalFees += tx.meta.fee

		// Success/Failure count
		if (tx.meta.err === null) {
			metrics.successfulTxCount++


            // Program invocations from log messages
            tx.meta.logMessages?.forEach(log => {
                if (log.includes('invoke [1]')) {
                    const program = log.split(' ')[1]
                    metrics.programInvocations[program] =
                        (metrics.programInvocations[program] || 0) + 1
                }
            })

            tx.transaction.message.instructions?.forEach(ix =>{
                const program = ix.programId;
                metrics.programInvocationsBackup[program] =
                        (metrics.programInvocationsBackup[program] || 0) + 1

                if (program === '11111111111111111111111111111111') {
                    // metrics.systemProgramInvocation.push(ix);
                    if (ix.parsed?.type === "transfer") {
                        const sender = ix.parsed.info.source;
                        const receiver = ix.parsed.info.destination;
                        const lamports = ix.parsed.info.lamports;
                        metrics.solSenders[sender] = (metrics.solSenders[sender] || 0) + lamports
                        metrics.solReceivers[receiver] = (metrics.solReceivers[receiver] || 0) + lamports
                    }
                }
            })

		} else {
			metrics.failedTxCount++
		}

		// Balance changes
		const preBalances = tx.meta.preBalances
		const postBalances = tx.meta.postBalances
		metrics.totalBalanceChange += postBalances.reduce(
			(sum, bal, i) => sum + (bal - preBalances[i]),
			0
		)

		// Account activity
		tx.transaction.message.accountKeys.forEach(acc => {
			metrics.uniqueAccounts.add(acc.pubkey)
			if (acc.signer) {
				metrics.uniqueSigners.add(acc.pubkey)
			}
			if (acc.writable) {
				metrics.totalWritableAccounts++
			}
		})
	})

	// Calculate averages
	const txCount = metrics.successfulTxCount + metrics.failedTxCount
	metrics.avgComputeUnitsPerTx = metrics.totalComputeUnits / txCount
	metrics.avgFeePerTx = metrics.totalFees / txCount
	metrics.avgWritableAccountsPerTx = metrics.totalWritableAccounts / txCount

	// // Convert Sets to counts
	// metrics.uniqueAccountCount = metrics.uniqueAccounts.size
	// metrics.uniqueSignerCount = metrics.uniqueSigners.size

	// // Clean up intermediate Set objects
	// delete metrics.uniqueAccounts
	// delete metrics.uniqueSigners

    const sortByValue = (obj) => {
        return Object.fromEntries(
            Object.entries(obj)
                .sort(([, a], [, b]) => b - a)
            );
    }
    metrics.programInvocations = sortByValue(metrics.programInvocations)
    metrics.programInvocationsBackup = sortByValue(metrics.programInvocationsBackup)
    metrics.solSenders = sortByValue(metrics.solSenders)
    metrics.solReceivers = sortByValue(metrics.solReceivers)

	return metrics
    
}
