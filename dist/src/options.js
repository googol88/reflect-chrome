(() => {
  // build/util.js
  function getElementFromForm(id) {
    return document.getElementById(id);
  }

  // build/storage.js
  function getStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (storage) => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(storage);
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
  function addToBlocked(url, callback) {
    getStorage().then((storage) => {
      if (!storage.blockedSites.includes(url)) {
        storage.blockedSites.push(url);
        setStorage({blockedSites: storage.blockedSites}).then(() => {
          console.log(`${url} added to blocked sites`);
          callback ? callback() : () => {
          };
        });
      }
    });
  }

  // build/options.js
  var ENTER_KEY_CODE = 13;
  document.addEventListener("DOMContentLoaded", () => {
    drawFilterListTable();
    drawIntentListTable();
    setAddButtonListener();
    const slider = document.getElementById("thresholdSlider");
    const display = document.getElementById("thresholdSliderValue");
    const sliderToValue = (slider2) => `${Math.round(+slider2.value * 100)}%`;
    slider.oninput = () => {
      display.innerHTML = sliderToValue(slider);
    };
    getStorage().then((storage) => {
      var _a, _b, _c;
      getElementFromForm("whitelistTime").value = storage.whitelistTime;
      getElementFromForm("numIntentEntries").value = storage.numIntentEntries;
      getElementFromForm("minIntentLength").value = (_a = storage.minIntentLength, _a !== null && _a !== void 0 ? _a : 3);
      getElementFromForm("customMessage").value = storage.customMessage || "";
      getElementFromForm("enableBlobs").checked = (_b = storage.enableBlobs, _b !== null && _b !== void 0 ? _b : true);
      getElementFromForm("enable3D").checked = (_c = storage.enable3D, _c !== null && _c !== void 0 ? _c : true);
      getElementFromForm("thresholdSlider").value = storage.predictionThreshold || 0.5;
      display.innerHTML = sliderToValue(slider);
    });
    document.getElementById("save").addEventListener("click", saveCurrentOptions);
  });
  function saveCurrentOptions() {
    const whitelistTime = getElementFromForm("whitelistTime").value;
    const numIntentEntries = getElementFromForm("numIntentEntries").value;
    const minIntentLength = getElementFromForm("minIntentLength").value;
    const customMessage = getElementFromForm("customMessage").value;
    const enableBlobs = getElementFromForm("enableBlobs").checked;
    const enable3D = getElementFromForm("enable3D").checked;
    const predictionThreshold = getElementFromForm("thresholdSlider").value;
    setStorage({
      numIntentEntries,
      whitelistTime,
      customMessage,
      enableBlobs,
      enable3D,
      predictionThreshold,
      minIntentLength
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
        getStorage().then((storage) => {
          const blockedSites = storage.blockedSites;
          blockedSites.splice(id, 1);
          setStorage({blockedSites}).then(() => {
            console.log(`removed ${url} from blocked list`);
            drawFilterListTable();
          });
        });
      });
    }
  }
  function generateWebsiteDiv(id, site) {
    return `<tr>
    <td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>
    <td style="width: 5%"><button id=${id}>&times;</button></td>
    </tr>`;
  }
  function generateIntentDiv(id, intent, date, url) {
    const formattedDate = date.toLocaleDateString("default", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
    return `<tr>
      <td style="width: 40%"><p class="intentDisplay" id=${id}>${url}</p></td>
      <td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td>
      <td style="width: 20%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td>
    </tr>`;
  }
  function drawFilterListTable() {
    getStorage().then((storage) => {
      const blockedSites = storage.blockedSites;
      const tableContent = blockedSites.reduce((table2, site, cur_id) => {
        table2 += generateWebsiteDiv(cur_id, site);
        return table2;
      }, "");
      const table = `<table class="hover shadow styled">${tableContent}</table>`;
      const filterList = document.getElementById("filterList");
      if (filterList != null) {
        filterList.innerHTML = table;
      }
      updateButtonListeners();
    });
  }
  function drawIntentListTable() {
    getStorage().then((storage) => {
      const intentList = storage.intentList;
      let table = `<table id="intentList" class="hover shadow styled">
        <tr>
        <th id="urlHeader" style="width: 40%">url</th>
        <th style="width: 40%">intent</th>
        <th style="width: 20%">date</th>
      </tr>`;
      let cur_id = 0;
      for (const rawDate in intentList) {
        if (cur_id < storage.numIntentEntries) {
          const date = new Date(rawDate);
          const intent = intentList[rawDate].intent;
          const url = intentList[rawDate].url;
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
      const url = urlInput.value;
      addToBlocked(url, () => {
        urlInput.value = "";
        drawFilterListTable();
      });
    }
  }
})();
//# sourceMappingURL=options.js.map
