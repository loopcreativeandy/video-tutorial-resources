function main(payload) {
  const {
    data,
    metadata,
  } = payload;

  // logic to filter data
  
	payload.data.forEach(block => {

    const txToKeep = []

		// Process each transaction
		block.transactions.forEach(tx => {

			// Success/Failure count
			if (tx.meta.err === null) {


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
								// senders.push(sender);
                txToKeep.push(tx);
							}
							// metrics.solSenders[sender] = (metrics.solSenders[sender] || 0) + lamports
							// metrics.solReceivers[receiver] = (metrics.solReceivers[receiver] || 0) + lamports
						}
					}
				})

			}
		});
    block.transactions = txToKeep;
	});

  return payload;
}
