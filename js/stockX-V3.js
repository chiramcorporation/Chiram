const myForm = document.getElementById("myForm");
const holdingsForm = document.getElementById("holdingsForm");
const csvFile = document.getElementById("csvFile");
const displaySection = document.getElementById("displaySection");
const holdingsFileMessageEelement = document.getElementById("holdingsFileUploadMessage");
// const holdingsCacheMessageEelement = document.getElementById("holdingsCacheLoadMessage");
const tradeDataFileUploadMessageEelement = document.getElementById("tradeDataFileUploadMessage");
const processingFilesMessageElement = document.getElementById("processingFilesMessage");
const finalDownloadButtonEelement = document.getElementById("finalDownloadButton");
const totalHoldingsElement = document.getElementById("totalHoldings");
const amountToDrawElement = document.getElementById("amountToDraw");

const STORAGE_CONST = {
  HOLDINGS_LABEL: 'stockx_js_stock_holdings',
  TRADES_LABEL: 'stockx_js_trade_data'
};


let tradeFileUploaded = false;
let holdingsFileUploaded = false;

let tradeDataCacheData = [];
let newTradeDataRecords = [];
let tradeDataKeys = [];
let holdingsFileData = [];
let holdingsMap = {};
let holdingsAltMap = {};
var processedHoldingsData = [];

/**
 * onLoad of Application, will be called for loading keys from LocalStorage Trade Data
 */
function loadTradeDataKeys() {
// exchange
// order_id
// trade_id
  if (tradeDataCacheData && Array.isArray(tradeDataCacheData)) {
    tradeDataCacheData.forEach(element => {
      tradeDataKeys.push('' + element.exchange + element.order_id + element.trade_id + '');
    });
  } else {
    console.log('No Queue defined');
  }
}
/**
 * When TradeData file uploaded, will be called for loading new Trades into
 */
function insertNewTrades(tempTradeData) {
  // tradeDataFileData
  tempTradeData.forEach(tradeRecord => {
    const tempKey = '' + tradeRecord.exchange + tradeRecord.order_id + tradeRecord.trade_id + '';
    if (!tradeDataKeys.includes(tempKey)) {
      newTradeDataRecords.push(tradeRecord);
      tradeDataKeys.push(tempKey);
    }
  });
  tradeDataFileUploadMessageEelement.innerHTML = "Successfully Uploaded Trade Data File";
  tradeDataFileUploadMessageEelement.hidden = false;
  tradeFileUploaded = true;
  // console.log(newTradeDataRecords);
}

window.onload = function() {
  // console.log('window.onload function called');
  const holdingsString = localStorage.getItem(STORAGE_CONST.HOLDINGS_LABEL);
  if (holdingsString && holdingsString.length > 0) {
    holdingsFileData = processedHoldingsData = JSON.parse(holdingsString);
    displayProcessedHoldingsData();
    holdingsFileMessageEelement.innerHTML = "Successfully loaded Holdings From Cache, if there is any descrepancy upload a new file and overwrite the records";
    holdingsFileMessageEelement.hidden = false;
    finalDownloadButtonEelement.hidden = false;
    holdingsFileUploaded = true;
  } else {
    holdingsFileMessageEelement.innerHTML = "No Holding Records available or Uploaded. Now Application supports creation of Holdings from Trade Data. Just Upload Trade Data and process";
    holdingsFileMessageEelement.hidden = false;
    holdingsFileUploaded = true;
  }

  const tradeDataString = localStorage.getItem(STORAGE_CONST.TRADES_LABEL);
  if (tradeDataString && tradeDataString.length > 0) {
    tradeDataCacheData = JSON.parse(tradeDataString);
    loadTradeDataKeys();
  }
};


function csvToArray(str, delimiter = ",") {

  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");
  if (rows[rows.length - 1].trim() == "") {
    rows.splice(-1);
  }

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
}

function getTextLine(item) {
  return [item.Symbol,item.ISIN,item.Sector,item['Quantity Available'],item.amount_to_recover,item.alternateSymbol].join(",");
}

function downloadFinalData() {
  const firstLine = 'Symbol,ISIN,Sector,Quantity Available,amount_to_recover,alternateSymbol';
  var linesData = [firstLine, ...processedHoldingsData.map(getTextLine)];
  var fileName = "Holdings" + new Date().toISOString() + ".csv";
  downLoadFinalFile(linesData, fileName);
}

function downloadTradeTemplate() {
  const firstLine = 'symbol,isin,trade_date,exchange,segment,series,trade_type,quantity,price,trade_id,order_id,order_execution_time';
  const secondLine = 'SYMBOL,ISIN,2021-05-14,NSE,EQ,EQ,buy,4.000000,5357.600000,1776173,1000000006006988,2021-05-14T09:56:04';
  const rows = [firstLine, secondLine];

  downLoadFinalFile(rows, "tradeData.csv");
}

function downloadHoldingsTemplate() {
  const firstLine = 'Symbol,ISIN,Sector,Quantity Available,amount_to_recover,alternateSymbol';
  const secondLine = 'SYMBOL,INE208A01029,Industrials,255,16589.9,SYMBOL';
  const rows = [firstLine, secondLine];

  downLoadFinalFile(rows, "holdings.csv");
}

function downLoadFinalFile(rows, fileName) {
  let csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");

  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link); // Required for FF

  link.click();
}

myForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const input = csvFile.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    const tempTradeData = csvToArray(text);
    insertNewTrades(tempTradeData);
  };

  reader.readAsText(input);
});

holdingsForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const input = holdingsUploadFile.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    holdingsFileData = csvToArray(text);
    handleHoldingsFileUpload(holdingsFileData);
    // holdingsFileMessageEelement.innerHTML = "Successfully Uploaded Holdings File";
    // holdingsFileMessageEelement.hidden = false;
    // holdingsFileUploaded = true;
  };

  reader.readAsText(input);
});

/**
* When Holdings file uploaded, will be called for loading new Holdings
*/
function handleHoldingsFileUpload(tempHoldingsFileData) {
  var overWriteExistingRecs = false;
  if (!processedHoldingsData || processedHoldingsData.length == 0) {
    processedHoldingsData = tempHoldingsFileData;
    holdingsFileMessageEelement.innerHTML = "Successfully Uploaded Holdings From File";
    holdingsFileMessageEelement.hidden = false;
    holdingsFileUploaded = true;
    displayProcessedHoldingsData();
    document.getElementById('saveAllHoldingsButton').hidden = false;
  } else if (processedHoldingsData.length > 0) {
    overWriteExistingRecs = confirm('Would you like to over write existing records, click OK to ignore existing records and overwrite from file. Cancel to keep existing and insert records from file');
    if (overWriteExistingRecs) {
      processedHoldingsData = tempHoldingsFileData;
      holdingsFileMessageEelement.innerHTML = "Successfully Over written Holdings From imported File";
      holdingsFileMessageEelement.hidden = false;
      holdingsFileUploaded = true;
      displayProcessedHoldingsData();
      document.getElementById('saveAllHoldingsButton').hidden = false;
    } else {
      holdingsFileMessageEelement.innerHTML = "Successfully Uploaded Holdings File, to process";
      holdingsFileMessageEelement.hidden = false;
      holdingsFileUploaded = true;
    }
  }
}

/**
 * @param  {*} tradeRecord 
 * Creates a new Holding record from Trade record if there is no Holding exists
 * returns the HoldingRecord
 */
function createNewHoldingRecord(tradeRecord) {
  if (tradeRecord && tradeRecord.symbol && tradeRecord.price && tradeRecord.quantity && tradeRecord.trade_type) {
    const newHoldingRec = {};
    newHoldingRec.Symbol = tradeRecord.symbol;
    newHoldingRec.ISIN = tradeRecord.isin;
    newHoldingRec.Sector = 'UnKnown';
    newHoldingRec.alternateSymbol = tradeRecord.symbol;
    if (tradeRecord.trade_type.toLowerCase() === "buy") {
      var totalAmount = +(+tradeRecord.quantity * +tradeRecord.price);
      var costAmount = +((totalAmount * 2 * 0.6) / 100);
      const amountToRecover = ( totalAmount + costAmount).toFixed(2);
      newHoldingRec.amount_to_recover = amountToRecover + "";
      newHoldingRec['Quantity Available'] = (+tradeRecord.quantity) + "";
      return newHoldingRec;
    } else if (tradeRecord.trade_type.toLowerCase() === "sell") {
      // throw Error
      return null;
    }
  } else {
    return null;
  }
}
/**
 * To Process the Trade Data and update Holdings with latest Quantity and Amount
 * 
 */
function processData() {

  if (!tradeFileUploaded || !holdingsFileUploaded) {
    alert("Must upload Holdings Data file and Trade Data file, before processing");
    return;
  }

  // Getting Map Object from HoldingsData
  if (holdingsFileData != null && holdingsFileData.length > 0) {
    holdingsFileData.forEach(element => {
      if (element != undefined && element != null && element.Symbol != null && element.Symbol != undefined && element.Symbol != "") {
        holdingsMap[element.Symbol] = element;
        if (element.Symbol !== element.alternateSymbol) {
          holdingsAltMap[element.alternateSymbol] = element.Symbol;
        }
      }
    });
  }

  if (newTradeDataRecords != null && newTradeDataRecords.length > 0) {
    // for each Trade Record, check existing Holdings and process
    newTradeDataRecords.forEach(element => {
      let holdingRec = holdingsMap[element.symbol];
      if (holdingRec != null && holdingRec != undefined) {
        // Nothing should be done
      } else {
        holdingRec = holdingsMap[holdingsAltMap[element.symbol]];
      }
      // holdingRec.amount_to_recover
      // holdingRec['Quantity Available']

      // element.price: "382.700000"
      // element.quantity: "4.000000"
      // element.trade_type: "buy"/"sell"

      if (holdingRec != null && holdingRec != undefined) {
        var amountToRecover = +holdingRec.amount_to_recover;
        var totalAmount = +(+element.quantity * +element.price);
        if (element.trade_type.toLowerCase() === "buy") {
          var costAmount = +((totalAmount * 2 * 0.6) / 100);
          amountToRecover = (amountToRecover + totalAmount + costAmount).toFixed(2);
          holdingRec.amount_to_recover = amountToRecover + "";
          holdingRec['Quantity Available'] = (+holdingRec['Quantity Available'] + +element.quantity) + "";
        } else if (element.trade_type.toLowerCase() === "sell") {
          amountToRecover = (amountToRecover - totalAmount).toFixed(2);
          holdingRec.amount_to_recover = amountToRecover + "";
          holdingRec['Quantity Available'] = (+holdingRec['Quantity Available'] - +element.quantity) + "";
        } else if (element.trade_type.toLowerCase() === "dividend") {
          amountToRecover = (amountToRecover - +element.price).toFixed(2);
          holdingRec.amount_to_recover = amountToRecover + "";
        } else if (element.trade_type.toLowerCase() === "bonus") {
          holdingRec['Quantity Available'] = (+holdingRec['Quantity Available'] + +element.quantity) + "";
        }
        tradeDataCacheData.push(element);
      } else {
        // No Holding record for that SYMBOL, need to create new Holding Record
        const newHoldingRec = createNewHoldingRecord(element);
        if (newHoldingRec) {
          holdingsMap[element.symbol] = newHoldingRec;
          holdingsFileData.push(newHoldingRec);
          tradeDataCacheData.push(element);
        }
      }

    });
    processedHoldingsData = Object.values(holdingsMap);
    localStorage.setItem(STORAGE_CONST.TRADES_LABEL, JSON.stringify(tradeDataCacheData));
    displayProcessedHoldingsData();
    processingFilesMessageElement.innerHTML = "Successfully Processed Holdings and Trade Files";
    document.getElementById('saveAllHoldingsButton').hidden = false;
    processingFilesMessageElement.hidden = false;
    finalDownloadButtonEelement.hidden = false;
    newTradeDataRecords = [];
  }
}

function displayProcessedHoldingsData() {

  let html = `<button id="saveAllHoldingsButton" class="save-all-button" onclick="saveAllHoldingsToLocalStorage()" hidden>Save All</button>`;
  html += "<table border='1|1'>";
  html += "<thead><tr>";
  html += "<th>Symbol</th>";
  html += "<th>ISIN</th>";
  html += "<th>Quantity Available</th>";
  html += "<th>Amount to Recover</th>";
  html += "<th>Alt Symbol</th>";
  html += "<th>Actions</th>";
  html += "</tr></thead><tbody>";

  let countH = 0;
  let amountToRecover = 0;

  processedHoldingsData.sort((a, b) => {
    if (!a || !a.Symbol) return 1;
    if (!b || !b.Symbol) return -1;
    return a.Symbol.localeCompare(b.Symbol);
  });

  processedHoldingsData.forEach((element, index) => {
    if (element != undefined && element != null && element != "") {

      html += `<tr id="row-${index}">`;
      html += `<td>${element.Symbol}</td>`;
      html += `<td>${element.ISIN}</td>`;
      html += `<td>${element["Quantity Available"]}</td>`;
      html += `<td>${element.amount_to_recover}</td>`;
      html += `<td>${element.alternateSymbol}</td>`;
      html += `<td><button class="inline-edit-button" onclick="editRow(${index})">Edit</button></td>`;
      html += "</tr>";

      countH++;
      amountToRecover += parseFloat(element.amount_to_recover) || 0;
    }

  });
  html += "</tbody></table>";

  displaySection.innerHTML = html;
  totalHoldingsElement.innerHTML = "&nbsp &nbsp &nbsp <b>Total Holdings: </b>" + "<b>" + countH + "</b>";
  amountToDrawElement.innerHTML = "&nbsp &nbsp &nbsp <b>Amount Recoverable: </b>" + "<b>" + amountToRecover + "</b>";
  localStorage.setItem(STORAGE_CONST.HOLDINGS_LABEL, JSON.stringify(processedHoldingsData));
}

/**
 * Puts a table row into edit mode.
 * @param {number} index The index of the holding in processedHoldingsData.
 */
function editRow(index) {
  document.getElementById('saveAllHoldingsButton').hidden = false;

  const row = document.getElementById(`row-${index}`);
  const holding = processedHoldingsData[index];

  // Make cells editable. Symbol is the key and should not be edited.
  row.cells[1].innerHTML = `<input type="text" id="isin-${index}" value="${holding.ISIN}">`;
  row.cells[2].innerHTML = `<input type="number" step="any" id="qty-${index}" value="${holding['Quantity Available']}">`;
  row.cells[3].innerHTML = `<input type="number" step="any" id="amount-${index}" value="${holding.amount_to_recover}">`;
  row.cells[4].innerHTML = `<input type="text" id="altSymbol-${index}" value="${holding.alternateSymbol}">`;

  // Change action buttons to Save/Cancel
  row.cells[5].innerHTML = `<button class="save-all-button" onclick="saveRow(${index})">Save</button> <button class="cancel-button" onclick="cancelRow(${index})">Cancel</button>`;
}

/**
 * Saves the changes from an edited row into the in-memory processedHoldingsData array.
 * @param {number} index The index of the holding.
 */
function saveRow(index) {
  const isinInput = document.getElementById(`isin-${index}`);
  const qtyInput = document.getElementById(`qty-${index}`);
  const amountInput = document.getElementById(`amount-${index}`);
  const altSymbolInput = document.getElementById(`altSymbol-${index}`);

  // Update the in-memory data array
  processedHoldingsData[index].ISIN = isinInput.value;
  processedHoldingsData[index]['Quantity Available'] = qtyInput.value;
  processedHoldingsData[index].amount_to_recover = amountInput.value;
  processedHoldingsData[index].alternateSymbol = altSymbolInput.value;

  // Revert row to display mode
  const row = document.getElementById(`row-${index}`);
  row.cells[1].innerHTML = isinInput.value;
  row.cells[2].innerHTML = qtyInput.value;
  row.cells[3].innerHTML = amountInput.value;
  row.cells[4].innerHTML = altSymbolInput.value;
  row.cells[5].innerHTML = `<button onclick="editRow(${index})">Edit</button>`;

  // Recalculate and display totals
  recalculateTotals();
}

/**
 * Cancels editing for a row and reverts it to display mode.
 * @param {number} index The index of the holding.
 */
function cancelRow(index) {
  const row = document.getElementById(`row-${index}`);
  const holding = processedHoldingsData[index];

  // Revert cells to display original data from the in-memory array
  row.cells[1].innerHTML = holding.ISIN;
  row.cells[2].innerHTML = holding['Quantity Available'];
  row.cells[3].innerHTML = holding.amount_to_recover;
  row.cells[4].innerHTML = holding.alternateSymbol;
  row.cells[5].innerHTML = `<button onclick="editRow(${index})">Edit</button>`;
}

/**
 * Saves the entire processedHoldingsData array to localStorage.
 */
function saveAllHoldingsToLocalStorage() {
  localStorage.setItem(STORAGE_CONST.HOLDINGS_LABEL, JSON.stringify(processedHoldingsData));
  alert('Holdings data saved successfully to browser storage!');
  // Re-render the table to ensure a clean state (all rows read-only) and hide the save button.
  displayProcessedHoldingsData();
}

/**
 * Recalculates the total holdings count and recoverable amount and updates the display.
 */
function recalculateTotals() {
  let countH = 0;
  let amountToRecover = 0;
  processedHoldingsData.forEach(element => {
    if (element && element.amount_to_recover) {
      countH++;
      amountToRecover += parseFloat(element.amount_to_recover) || 0;
    }
  });
  totalHoldingsElement.innerHTML = `&nbsp &nbsp &nbsp <b>Total Holdings: </b><b>${countH}</b>`;
  amountToDrawElement.innerHTML = `&nbsp &nbsp &nbsp <b>Amount Recoverable: </b><b>${amountToRecover.toFixed(2)}</b>`;
}
