(() => {
  // build/storage.js
  function getStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (storage2) => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(storage2);
        }
      });
    });
  }
  function setStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(key, () => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // build/options.js
  var ENTER_KEY_CODE = 13;
  document.addEventListener("DOMContentLoaded", () => {
    drawFilterListTable();
    drawIntentListTable();
    setAddButtonListener();
    getStorage().then((storage2) => {
      var _a;
      getElementFromForm("whitelistTime").value = storage2.whitelistTime;
      getElementFromForm("numIntentEntries").value = storage2.numIntentEntries;
      getElementFromForm("enable-blobs").checked = (_a = storage2.enableBlobs, _a !== null && _a !== void 0 ? _a : true);
    });
    document.getElementById("save").addEventListener("click", saveCurrentOptions);
  });
  function getElementFromForm(id) {
    return document.getElementById(id);
  }
  function saveCurrentOptions() {
    const whitelistTime = getElementFromForm("whitelistTime").value;
    const numIntentEntries = getElementFromForm("numIntentEntries").value;
    const enableBlobs = getElementFromForm("enable-blobs").checked;
    setStorage({
      numIntentEntries,
      whitelistTime,
      enableBlobs
    }).then(() => {
      const status = document.getElementById("statusContent");
      status.textContent = "options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    });
  }
  function updateButtonListeners() {
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
      button.addEventListener("click", () => {
        var _a;
        const id = parseInt(button.id[0]);
        const url = (_a = document.getElementById(button.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
        chrome.storage.sync.get(null, (storage2) => {
          const blockedSites = storage2.blockedSites;
          blockedSites.splice(id, 1);
          chrome.storage.sync.set({blockedSites}, () => {
            console.log(`removed ${url} from blocked list`);
            drawFilterListTable();
          });
        });
      });
    }
  }
  function generateWebsiteDiv(id, site) {
    return `<tr><td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td><td style="width: 5%"><button id=${id}>&times;</button></td></tr>`;
  }
  function generateIntentDiv(id, intent, date, url) {
    const formattedDate = date.toLocaleDateString("default", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
    return `<tr><td style="width: 40%"><p class="intentDisplay" id=${id}>${url}</p></td><td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td><td style="width: 20%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td></tr>`;
  }
  function drawFilterListTable() {
    chrome.storage.sync.get(null, (storage2) => {
      const blockedSites = storage2.blockedSites;
      let table = '<table class="hover shadow styled">';
      let cur_id = 0;
      blockedSites.forEach((site) => {
        table += generateWebsiteDiv(cur_id, site);
        cur_id++;
      });
      table += "</table>";
      const filterList = document.getElementById("filterList");
      if (filterList != null) {
        filterList.innerHTML = table;
      }
      updateButtonListeners();
    });
  }
  function drawIntentListTable() {
    chrome.storage.sync.get(null, (storage2) => {
      const intentList = storage2.intentList;
      let table = '<table id="intentList" class="hover shadow styled"><tr><th id="urlHeader" style="width: 40%">url</th><th style="width: 40%">intent</th><th style="width: 20%">date</th></tr>';
      let cur_id = 0;
      for (const rawDate in intentList) {
        if (cur_id < storage2.numIntentEntries) {
          const date = new Date(rawDate);
          const intent = intentList[rawDate]["intent"];
          const url = intentList[rawDate]["url"];
          table += generateIntentDiv(cur_id, intent, date, url);
          cur_id++;
        }
      }
      table += "</table>";
      const previousIntents = document.getElementById("previousIntents");
      if (previousIntents != null) {
        previousIntents.innerHTML = table;
      }
    });
  }
  function setAddButtonListener() {
    const urlInputElement = document.getElementById("urlInput");
    urlInputElement.addEventListener("keypress", (event) => {
      if (event.keyCode === ENTER_KEY_CODE) {
        addUrlToFilterList();
      }
    });
    const addButton = document.getElementById("add");
    addButton.addEventListener("click", () => {
      addUrlToFilterList();
    });
  }
  function addUrlToFilterList() {
    const urlInput = document.getElementById("urlInput");
    if (urlInput.value !== "") {
      chrome.storage.sync.get(null, (storage2) => {
        const blockedSites = storage2.blockedSites;
        blockedSites.push(urlInput.value);
        chrome.storage.sync.set({blockedSites}, () => {
          console.log(`added ${urlInput} from blocked list`);
          urlInput.value = "";
          drawFilterListTable();
        });
      });
    }
  }
})();
//# sourceMappingURL=options.js.map
