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
 * Saves the entire processedHoldingsData array to localStorage.
 */
function saveAllHoldingsToLocalStorage() {
  localStorage.setItem(STORAGE_CONST.HOLDINGS_LABEL, JSON.stringify(processedHoldingsData));
  alert('Holdings data saved successfully to browser storage!');
  // Re-render the table to ensure a clean state (all rows read-only) and hide the save button.
  displayProcessedHoldingsData();
}

