chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.query({ url: ['https://secure.anz.co.nz/IBCS/service/home', 'https://secure.anz.co.nz/IBCS/service/home*'] }, function(tabs) {
    if (tabs.length) {
      chrome.tabs.highlight({ tabs: [tabs[0].index] });
      chrome.tabs.reload(tabs[0].tabId);
    } else {
      chrome.tabs.create({ url: 'https://secure.anz.co.nz/IBCS/service/home' });
    }
  });
});
