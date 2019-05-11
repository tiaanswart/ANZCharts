// Need to run after ember is done... @TODO need better magic here as this runs every time the DOM is modified -_-
removeAllCharts();
// Add a block for the chart
run = () => {
    // Get all account id blocks
    queryAll(".account-id-overview:not(.chart-rendered)").forEach((accountBlock) => {
        // Get the account id
        const accountId = accountBlock.getAttribute('data-account-id');
        // Chart block identifier
        const chartClass = `ct-chart-${accountId}`;
        // Check that we don't have a chart block yet
        const charts = queryAll(`.${chartClass}`);
        if (!charts.length) {
            // Create the loader
            const loaderDiv = createElement('div', `${chartClass} ct-double-octave loader`, accountBlock);
            // Get the transactions
            const transactionSeriesPromise = getLineTransactionSeries({ accountId });
            if (transactionSeriesPromise) {
                transactionSeriesPromise.then(transactionSeries => {
                    // Add chart rendered class
                    accountBlock.className += ' chart-rendered';
                    // Remove the loader
                    removeElement(loaderDiv);
                    // If we have more than one label to render
                    if (Object.keys(transactionSeries).length > 1) {
                        // Create the chart
                        createLineChart(chartClass, transactionSeries, accountBlock);
                    }
                });
            } else {
                // Remove the loader
                removeElement(loaderDiv);
            }
        }
    });
};