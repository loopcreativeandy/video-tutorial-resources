
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
const FUNCTION_INVOCATIONS_SET_NAME = "functionInvocations"
const SENDER_ACCOUNTS_LIST_NAME = "sendersList"

async function main(params) {
    // Extract dataset and network from metadata in params
    const dataset = params.metadata.dataset;
    const network = params.metadata.network;

    // Extract user data from params, if any
    const userData = params.user_data;

	if (userData?.admin && userData?.resetAll == "yes"){
		await qnLib.qnDeleteList(SENDER_ACCOUNTS_LIST_NAME);
    	await qnLib.qnDeleteSet(FUNCTION_INVOCATIONS_SET_NAME);
	}

    const previousNumberOfInvocations = await qnLib.qnGetSet(FUNCTION_INVOCATIONS_SET_NAME, params);
    const numberOfInvocations = (+previousNumberOfInvocations || 0) +1;
    let returnData = {
        numberOfInvocations
    }
    const createResult = await qnLib.qnAddSet(FUNCTION_INVOCATIONS_SET_NAME, numberOfInvocations);
    // returnData = {...returnData, createResult};


	const senders = [];

	params.data.forEach(block => {

		// Process each transaction
		block.transactions.forEach(tx => {

			// Success/Failure count
			if (tx.meta.err === null) {
				// metrics.successfulTxCount++


				tx.transaction.message.instructions?.forEach(ix =>{
					const program = ix.programId;
					// metrics.programInvocationsBackup[program] =
					// 		(metrics.programInvocationsBackup[program] || 0) + 1

					if (program === '11111111111111111111111111111111') {
						// metrics.systemProgramInvocation.push(ix);
						if (ix.parsed?.type === "transfer") {
							const sender = ix.parsed.info.source;
							const receiver = ix.parsed.info.destination;
							const lamports = ix.parsed.info.lamports;
							if (receiver === 'AndyrXa4K5mAPAUuRQdJ3d9TmxsvcS9zLqb7ZpHuK8de') {
								senders.push(sender);
							}
							// metrics.solSenders[sender] = (metrics.solSenders[sender] || 0) + lamports
							// metrics.solReceivers[receiver] = (metrics.solReceivers[receiver] || 0) + lamports
						}
					}
				})

			}
		});
	});
	// const listItemAdded = await qnLib.qnAddListItem(SENDER_ACCOUNTS_LIST_NAME, sender);
	// returnData = {...returnData, listItemAdded};

	const listItemsAdded = await qnLib.qnUpsertList(SENDER_ACCOUNTS_LIST_NAME, { add_items: senders});
	returnData = {...returnData, listItemsAdded};

	const allSenders = await qnLib.qnGetList(SENDER_ACCOUNTS_LIST_NAME);
	returnData = {...returnData, allSenders};
    
    // Return anything that you will consume on API side or helping you check your execution later
    return { 
        message: `This is data from the ${dataset} dataset on the ${network} network.`,
        user_data: userData,
        returnData 
    };
}
