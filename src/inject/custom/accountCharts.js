// Page URL contains the Account Id
// Get the account id
let accountId = (new URL(window.location.href)).hash.split('/')[1];
// Need to run after ember is done... @TODO need better magic here as this runs every time the DOM is modified -_-
removeAllCharts();
// Add a block for the chart
run = () => {
    // Get all account id blocks
    queryAll(".transactions-action-panels:not(.chart-rendered)").forEach((accountBlock) => {
        // Chart block identifier
        const chartClass = `ct-chart-${accountId}`;
        // Check that we don't have a chart block yet
        if (!queryAll(`.${chartClass}`).length) {
            // Create the loader
            const loaderDiv = createElement('div', `${chartClass} ct-double-octave loader`, accountBlock);
            // Build params
            const params = {
                accountId, 
                fDate: getValue('.date-range-start-date').split('/').reverse().join('-'),
                tDate: getValue('.date-range-end-date').split('/').reverse().join('-')
            }
            // Get the transactions data
            const transactionsData = getTransactionsData(params);
            // Add transaction data to params
            params.transactionsData = transactionsData;
            // Get the transactions series for line chart
            const lineTransactionSeriesPromise = getLineTransactionSeries(params);
            // Get the transactions series for pie chart
            const pieTransactionSeriesPromise = getPieTransactionSeries(params);
            if (lineTransactionSeriesPromise || pieTransactionSeriesPromise) {
                lineTransactionSeriesPromise.then(transactionSeries => {
                    // If we have more than one label to render
                    if (Object.keys(transactionSeries).length > 1) {
                        // Create the line chart
                        createLineChart(chartClass, transactionSeries, accountBlock);
                    }
                });
                pieTransactionSeriesPromise.then(transactionSeries => {
                    // Create the pie chart
                    createPieChart(chartClass, transactionSeries, accountBlock);
                });
                Promise.all([lineTransactionSeriesPromise, pieTransactionSeriesPromise]).then(() => {
                    // Add chart rendered class
                    accountBlock.className += ' chart-rendered';
                    // Remove the loader
                    removeElement(loaderDiv);
                });
            } else {
                // Remove the loader
                removeElement(loaderDiv);
            }
        }
    });
    // Handle filter and clear filter
    queryAll("#transactions-filter-submit, #transactions-clear-submit").forEach((button) => {
        removeEventListener('click', removeAllCharts, button);
        addEventListener('click', removeAllCharts, button);
    });
}
// Switching between accounts
window.onhashchange = function() {
    accountId = (new URL(window.location.href)).hash.split('/')[1];
    removeAllCharts();
}