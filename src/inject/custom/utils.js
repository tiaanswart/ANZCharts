// Utils
addEventListener = (event, callback, base = document.body) => base.addEventListener(event, callback, false);
removeEventListener = (event, callback, base = document.body) => base.removeEventListener(event, callback);
queryAll = (selector, base = document) => base.querySelectorAll(selector);
getValue = (selector, base = document) => base.querySelector(selector) ? base.querySelector(selector).value : '';
insertBefore = (base, newNode) => base.parentNode.insertBefore(newNode, base);
createElement = (type, classes, insertBeforeNode, appendTo) => {
    // Create elem
    const elem = document.createElement(type);
    // Add classes
    if (classes) elem.className = classes;
    // Insert elem
    if (insertBeforeNode) insertBefore(insertBeforeNode, elem);
    // Append elem
    if (appendTo) appendTo.appendChild(elem);
    // Return the elem for ref
    return elem;
};
removeElement = (elem) => elem.parentNode.removeChild(elem);
fetchData = (theURL, params) => {
    // Build the URL
    if (params) Object.keys(params).forEach(key => {
        if (params[key]) theURL += `${theURL.indexOf('?') === -1 ? '?' : '&'}${key}=${encodeURIComponent(params[key])}`;
    });
    // Fetch and return JSON
    return fetch(theURL).then((response) => { return response.json(); })
};
// Shared Constants
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const config = fetchData('/IBCS/service/account/initialise');
// Shared logic
// Remove charts on resize to redraw them
removeAllCharts = () => {
    queryAll(".chart-rendered").forEach((chartContainer) => {
        queryAll(".ct-chart", chartContainer.parentNode).forEach((chart) => {
            removeElement(chart);
        });
        chartContainer.className= chartContainer.className.replace('chart-rendered', '');
    });
    setTimeout(() => { run(); }, 1000);
};
document.body.onresize = removeAllCharts;
// Get account details
getAccountDetails = (accountId) => {
    if (!accountId) return null;
    return new Promise(resolve => {
        Promise.resolve(config).then((configData) => {
            // Get viewable accounts
            const { viewableAccounts } = configData;
            // Resolve with account details
            resolve(viewableAccounts.filter(a => a.accountUuid === accountId)[0]);
        });
    });
};
// Get transactions
getTransactionsData = ({ accountId, fDate, tDate }) => {
    if (!accountId) return null;
    return new Promise(resolve => {
        // Get account details
        getAccountDetails(accountId).then(accountDetails => {
            // We can only go on if we have account details
            if (accountDetails) {
                // Get the Account Balance
                let { accountBalance: { amount: accountBalance, indicator }, isCreditCard, isLoan } = accountDetails;
                accountBalance = Math.round(accountBalance * (indicator === 'overdrawn' || isCreditCard || isLoan ? -1 : 1));
                // Get the transactions
                fetchData('/IBCS/service/api/transactions', {
                    account: accountId,
                    from: fDate || '',
                    to: tDate || ''
                }).then((data) => {
                    // Add account balance to the data
                    data.accountBalance = accountBalance;
                    // Resolve with the transactions
                    resolve(data);
                });
            } else {
                // Resolve with the transaction series
                resolve(null);
            }
        });
    });
};
// Get transaction series for a line chart
getLineTransactionSeries = ({ accountId, fDate, tDate, transactionsData }) => {
    if (!transactionsData && !accountId) return null;
    const transactionSeries = {};
    return new Promise(resolve => {
        // If we have no transaction data yet
        if (!transactionsData) {
            transactionsData = getTransactionsData({ accountId, fDate, tDate });
        }
        Promise.resolve(transactionsData).then((data) => {
            // Get the data properties
            const { metadata, transactions } = data;
            let { accountBalance } = data;
            // If we have transactions
            if (metadata && transactions.length) {
                // Get metadata
                const { search: { daysSearched } } = metadata;
                // Build transaction series
                transactions.reverse().forEach((transaction) => {
                    // Get transaction details
                    const { postedDate, date, amount: { amount } } = transaction;
                    const transDate = postedDate ? new Date(postedDate) : new Date(date);
                    // Build series label
                    const label = (daysSearched > 31 ? '' : transDate.getDate() + ' ') + 
                                    months[transDate.getMonth()] + (daysSearched > 30 ? ' ' + transDate.getFullYear() : '');
                    // Update account balance
                    accountBalance += Math.round(amount);
                    // Add or update series data
                    transactionSeries[label] = accountBalance;
                });
            }
            // Resolve with the transaction series
            resolve(transactionSeries);
        });
    });
};
createLineChart = (className, series, chartContainer) => {
    // Create the chart block
    createElement('div', `${className} ${className}-line ct-chart ct-chart-line ct-double-octave`, chartContainer);
    // Create the chart
    new Chartist.Line(`.${className}-line`, {
        labels: Object.keys(series),
        series: [Object.values(series)]
    }, {
        showArea: true,
        axisY: {
            onlyInteger: true
        },
        fullWidth: true,
        chartPadding: {
            bottom: 0,
            left: 0
        },
        plugins: [
            Chartist.plugins.ctThreshold({
                threshold: 0
            }),
            Chartist.plugins.tooltip({
                currency: '$'
            })
        ]
    });
};
// Get transaction series for a pie chart
getPieTransactionSeries = ({ accountId, fDate, tDate, transactionsData }) => {
    if (!transactionsData && !accountId) return null;
    const transactionSeries = {};
    return new Promise(resolve => {
        // If we have no transaction data yet
        if (!transactionsData) {
            transactionsData = getTransactionsData({ accountId, fDate, tDate });
        }
        Promise.resolve(transactionsData).then((data) => {
            // Get the data properties
            const { transactions } = data;
            // If we have transactions
            if (transactions.length) {
                // Build transaction series
                transactions.forEach((transaction) => {
                    // Get transaction details
                    let { amount: { amount } } = transaction;
                    // Build series label
                    const label = amount < 0 ? 'Expense' : 'Income';
                    // Make amount positive
                    amount = amount < 0 ? amount * -1 : amount;
                    // Add or update series data
                    transactionSeries[label] = transactionSeries[label] ? transactionSeries[label] + Math.round(amount) : Math.round(amount);
                });
            }
            // Resolve with the transaction series
            resolve(transactionSeries);
        });
    });
};
createPieChart = (className, series, chartContainer) => {
    // Create the chart block
    createElement('div', `${className} ${className}-pie ct-chart ct-chart-pie ct-double-octave`, chartContainer);
    // Create the chart
    new Chartist.Pie(`.${className}-pie`, {
        labels: Object.keys(series),
        series: Object.values(series)
    }, {
        labelInterpolationFnc: (value) => {
            return `${value} - $${series[value]}`;
        }
    });
};