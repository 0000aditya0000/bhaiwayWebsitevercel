/**
 * BhaiWay Exclusive Priority Launch — Google Sheets webhook
 *
 * SETUP (if Extensions → Apps Script fails, use this instead):
 *
 * 1. Create a Google Sheet at https://sheets.google.com
 * 2. Copy the Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit
 * 3. Open https://script.google.com → New project
 * 4. Paste this entire file, set SPREADSHEET_ID below, Save (Ctrl+S)
 * 5. Run testSetup once (select testSetup → Run → allow permissions)
 * 6. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the Web app URL into frontend/.env:
 *    REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL=<your web app url>
 */

// Paste your Google Sheet ID here (required when using script.google.com)
var SPREADSHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";

var TAB_NAME = "Waitlist";
var HEADERS = ["Timestamp", "Name", "Email", "Role", "City", "Reward"];

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var email = String(data.email || "").trim().toLowerCase();
    if (!email) {
      return _jsonResponse({ ok: false, error: "Email is required." });
    }

    var sheet = _getOrCreateSheet();
    var existing = _findEmailRow(sheet, email);
    if (existing > 0) {
      return _jsonResponse({
        ok: false,
        error: "This email is already registered on our premium waitlist!",
      });
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      email,
      data.role || "",
      data.city || "",
      data.reward || "50 Bhaiway Coins",
    ]);

    return _jsonResponse({ ok: true });
  } catch (err) {
    return _jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _jsonResponse({ ok: true, service: "BhaiWay waitlist webhook" });
}

/** Run once from the Apps Script editor to verify sheet access and create the Waitlist tab. */
function testSetup() {
  var sheet = _getOrCreateSheet();
  Logger.log("Connected to sheet: " + sheet.getParent().getName());
  Logger.log("Tab ready: " + sheet.getName());
}

function _jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function _getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "PASTE_YOUR_SHEET_ID_HERE") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  throw new Error(
    "Set SPREADSHEET_ID at the top of this script to your Google Sheet ID."
  );
}

function _getOrCreateSheet() {
  var ss = _getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function _findEmailRow(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  var emails = sheet.getRange(2, 3, lastRow, 3).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0] || "").trim().toLowerCase() === email) {
      return i + 2;
    }
  }
  return -1;
}
