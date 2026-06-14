const SHEET_NAME = "inventory";
const HEADERS = ["menu_key", "menu_name_en", "stock_status", "note"];
// Standalone Apps Script에서 실행할 때: 시트 URL의 /d/ 와 /edit 사이 ID를 넣으세요.
// 예) https://docs.google.com/spreadsheets/d/abc123xyz/edit  -> abc123xyz
const SPREADSHEET_ID = "";

const CATEGORY_ORDER = [
  "loafBread",
  "artisanBread",
  "saltBreadBagel",
  "sweetBread",
  "cookieSmallSweets",
  "scone",
  "cakeMadeleine",
  "giftSet",
  "jamSpread",
  "cashewProduct",
];

const CATEGORY_LABELS = {
  loafBread: "Loaf Bread",
  artisanBread: "Artisan Bread",
  saltBreadBagel: "Salt Bread & Bagel",
  sweetBread: "Sweet Bread",
  cookieSmallSweets: "Cookie & Small Sweets",
  scone: "Scone",
  cakeMadeleine: "Cake & Madeleine",
  giftSet: "Gift Set",
  jamSpread: "Jam & Spread",
  cashewProduct: "Cashew Product",
};

const CATEGORY_COLORS = {
  loafBread: { header: "#B8895A", row: "#FFF6EE" },
  artisanBread: { header: "#8B7355", row: "#F7F2EA" },
  saltBreadBagel: { header: "#5E7F96", row: "#EEF4F8" },
  sweetBread: { header: "#C97B8F", row: "#FFF3F6" },
  cookieSmallSweets: { header: "#A06B4F", row: "#FAF3ED" },
  scone: { header: "#B8942E", row: "#FFFAEF" },
  cakeMadeleine: { header: "#8E6FA8", row: "#F7F2FB" },
  giftSet: { header: "#B04A46", row: "#FFF0EF" },
  jamSpread: { header: "#9B4568", row: "#FCF2F6" },
  cashewProduct: { header: "#5F8A63", row: "#F1F8F2" },
};

const SHEET_HEADER_COLOR = "#4A3728";
const DEFAULT_CATEGORY_COLOR = { header: "#7A7A7A", row: "#FFFFFF" };
const SYNC_KEY = "cashew-house-inventory";

const MENU_CATALOG = [
  ["loafBread", "milk-bread", "Milk Bread"],
  ["loafBread", "sugar-toast", "Sugar Toast"],
  ["loafBread", "whole-wheat-bread", "Whole Wheat Bread"],
  ["loafBread", "cashew-strawberry-jam-toast", "Cashew Strawberry Jam Toast"],
  ["loafBread", "cashew-chestnut-bread", "Cashew Chestnut Bread"],
  ["artisanBread", "wine-fig-cream-cheese-sourdough", "Wine Fig Cream Cheese Sourdough"],
  ["artisanBread", "honey-sweet-potato-sourdough", "Honey Sweet Potato Sourdough"],
  ["artisanBread", "chestnut-sourdough", "Chestnut Sourdough"],
  ["artisanBread", "chocolate-baguette", "Chocolate Baguette"],
  ["saltBreadBagel", "salt-bread", "Salt Bread"],
  ["saltBreadBagel", "cashew-salt-bread", "Cashew Salt Bread"],
  ["saltBreadBagel", "red-bean-butter-salt-bread", "Red Bean Butter Salt Bread"],
  ["saltBreadBagel", "green-onion-cream-cheese-salt-bread", "Green Onion Cream Cheese Salt Bread"],
  ["saltBreadBagel", "corn-cheese-salt-bread", "Corn Cheese Salt Bread"],
  ["saltBreadBagel", "sriracha-mayo-sausage-salt-bread", "Sriracha Mayo Sausage Salt Bread"],
  ["saltBreadBagel", "plain-bagel", "Plain Bagel"],
  ["saltBreadBagel", "salt-bagel", "Salt Bagel"],
  ["saltBreadBagel", "olive-cheese-bagel", "Olive Cheese Bagel"],
  ["saltBreadBagel", "potato-cheese-bagel", "Potato Cheese Bagel"],
  ["sweetBread", "cashew-cinnamon-roll", "Cashew Cinnamon Roll"],
  ["sweetBread", "condensed-milk-bread", "Condensed Milk Bread"],
  ["sweetBread", "cashew-bun", "Cashew Bun"],
  ["sweetBread", "cream-cashew-bun", "Cream Cashew Bun"],
  ["sweetBread", "cashew-butter-cream-sand", "Cashew Butter Cream Sand"],
  ["sweetBread", "cream-cheese-roll-bread", "Cream Cheese Roll Bread"],
  ["sweetBread", "condensed-coffee-bread", "Condensed Coffee Bread"],
  ["sweetBread", "blueberry-bread", "Blueberry Bread"],
  ["sweetBread", "sweet-potato-bread", "Sweet Potato Bread"],
  ["sweetBread", "cream-cheese-cashew-bread", "Cream Cheese Cashew Bread"],
  ["sweetBread", "cranberry-cream-cheese-bread", "Cranberry Cream Cheese Bread"],
  ["sweetBread", "sausage-bread", "Sausage Bread"],
  ["sweetBread", "sweet-red-bean-bread", "Sweet Red Bean Bread"],
  ["sweetBread", "butter-mochi", "Butter Mochi"],
  ["sweetBread", "black-butter-mochi", "Black Sesame Butter Mochi"],
  ["sweetBread", "garlic-cream-cheese-baguette", "Garlic Cream Cheese Baguette"],
  ["sweetBread", "shrimp-baguette", "Shrimp Baguette"],
  ["cookieSmallSweets", "cashew-ball-cookie-large", "Cashew Ball Cookie (Large)"],
  ["cookieSmallSweets", "cashew-ball-cookie-small", "Cashew Ball Cookie (Small)"],
  ["cookieSmallSweets", "cashew-crunch-toffee", "Cashew Crunch Toffee"],
  ["cookieSmallSweets", "dark-chocolate-cashew-cookie", "Dark Chocolate Cashew Cookie"],
  ["cookieSmallSweets", "white-chocolate-cashew-cookie", "White Chocolate Cashew Cookie"],
  ["cookieSmallSweets", "caramel-cashew-rocher-chocolate", "Caramel Cashew Rocher Chocolate"],
  ["cookieSmallSweets", "double-berry-jam-cookie", "Double Berry Jam Cookie"],
  ["cookieSmallSweets", "milk-ganache-cookie", "Milk Ganache Cookie"],
  ["cookieSmallSweets", "cashew-cocoa-crispy-cookie", "Cashew Cocoa Crispy Cookie"],
  ["scone", "chocolate-cashew-mini-scone", "Chocolate Cashew Mini Scone"],
  ["scone", "cashew-mini-scone", "Cashew Mini Scone"],
  ["scone", "chocolate-cashew-scone", "Chocolate Cashew Scone"],
  ["scone", "cashew-nut-scone", "Cashew Nut Scone"],
  ["cakeMadeleine", "earl-grey-madeleine", "Earl Grey Madeleine"],
  ["cakeMadeleine", "lemon-madeleine", "Lemon Madeleine"],
  ["cakeMadeleine", "chocolate-madeleine", "Chocolate Madeleine"],
  ["cakeMadeleine", "cashew-gianduja-madeleine", "Cashew Gianduja Madeleine"],
  ["cakeMadeleine", "matcha-white-chocolate-madeleine", "Matcha White Chocolate Madeleine"],
  ["cakeMadeleine", "cashew-carrot-cake", "Cashew Carrot Cake"],
  ["cakeMadeleine", "double-chocolate-muffin", "Double Chocolate Muffin"],
  ["giftSet", "cashew-house-gift-set-25", "Cashew House Gift Set 25"],
  ["giftSet", "cashew-house-gift-set-30", "Cashew House Gift Set 30"],
  ["giftSet", "cashew-house-gift-set-66", "Cashew House Gift Set 66"],
  ["jamSpread", "cashew-basil-pesto", "Cashew Basil Pesto"],
  ["jamSpread", "homemade-raspberry-jam", "Homemade Raspberry Jam"],
  ["jamSpread", "homemade-blueberry-jam", "Homemade Blueberry Jam"],
  ["cashewProduct", "vietnam-premium-cashew-210g", "Vietnam Premium Cashew 210g"],
];

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  throw new Error(
    "연결된 스프레드시트가 없습니다. Code.gs 상단 SPREADSHEET_ID에 시트 ID를 입력하세요."
  );
}

function sheetHasMenuKeyHeader_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return false;
  }

  const header = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return header.some((cell) => String(cell).trim() === "menu_key");
}

function getInventorySheet_() {
  const spreadsheet = getSpreadsheet_();
  const namedSheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (namedSheet) {
    return namedSheet;
  }

  const sheets = spreadsheet.getSheets();
  for (let index = 0; index < sheets.length; index += 1) {
    const sheet = sheets[index];
    if (sheetHasMenuKeyHeader_(sheet)) {
      if (sheet.getName() !== SHEET_NAME) {
        sheet.setName(SHEET_NAME);
      }
      return sheet;
    }
  }

  return spreadsheet.insertSheet(SHEET_NAME);
}

function getHeaderIndexes_(header) {
  return {
    menuKey: header.indexOf("menu_key"),
    menuNameEn: header.indexOf("menu_name_en"),
    stockStatus: header.indexOf("stock_status"),
    note: header.indexOf("note"),
  };
}

function normalizeStockStatus_(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (normalized === "in_stock" || normalized === "sold_out") {
    return normalized;
  }
  if (normalized === "low_stock" || normalized === "out_of_stock" || normalized === "soldout") {
    return normalized === "low_stock" ? "in_stock" : "sold_out";
  }
  return "in_stock";
}

function readExistingInventoryMap_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return new Map();
  }

  const header = values.shift();
  const indexes = getHeaderIndexes_(header);
  const map = new Map();

  values.forEach((row) => {
    const menuKey = String(row[indexes.menuKey] || "").trim();
    if (!menuKey) {
      return;
    }
    map.set(menuKey, {
      stockStatus: normalizeStockStatus_(row[indexes.stockStatus]),
      note: indexes.note >= 0 ? String(row[indexes.note] || "").trim() : "",
    });
  });

  return map;
}

function buildCategoryRows_(existingMap) {
  const rows = [HEADERS];
  const rowCategories = [""];
  let previousCategoryKey = "";

  MENU_CATALOG.forEach(([categoryKey, menuKey, menuNameEn]) => {
    if (categoryKey !== previousCategoryKey) {
      const categoryLabel = CATEGORY_LABELS[categoryKey] || categoryKey;
      rows.push(["", `--- ${categoryLabel} ---`, "", ""]);
      rowCategories.push(categoryKey);
      previousCategoryKey = categoryKey;
    }

    const existing = existingMap.get(menuKey) || {};
    rows.push([
      menuKey,
      menuNameEn,
      existing.stockStatus || "in_stock",
      existing.note || "",
    ]);
    rowCategories.push(categoryKey);
  });

  return { rows, rowCategories };
}

function isCategorySectionRow_(row) {
  return !String(row[0] || "").trim();
}

function applySheetFormatting_(sheet, rows, rowCategories) {
  const columnCount = HEADERS.length;
  const rowCount = rows.length;

  sheet.getRange(1, 1, 1, columnCount)
    .setBackground(SHEET_HEADER_COLOR)
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  if (rowCount <= 1) {
    return;
  }

  const dataRowCount = rowCount - 1;
  const backgrounds = [];
  const fontWeights = [];
  const fontColors = [];
  const horizontalAlignments = [];

  for (let index = 1; index < rowCount; index += 1) {
    const row = rows[index];
    const categoryKey = String(rowCategories[index] || "").trim();
    const colors = CATEGORY_COLORS[categoryKey] || DEFAULT_CATEGORY_COLOR;
    const isSectionHeader = isCategorySectionRow_(row);
    const background = isSectionHeader ? colors.header : colors.row;
    const fontColor = isSectionHeader ? "#FFFFFF" : "#333333";
    const fontWeight = isSectionHeader ? "bold" : "normal";

    backgrounds.push(Array(columnCount).fill(background));
    fontWeights.push(Array(columnCount).fill(fontWeight));
    fontColors.push(Array(columnCount).fill(fontColor));
    horizontalAlignments.push(
      Array(columnCount).fill(isSectionHeader ? "center" : "left")
    );
  }

  const dataRange = sheet.getRange(2, 1, dataRowCount, columnCount);
  dataRange
    .setBackgrounds(backgrounds)
    .setFontWeights(fontWeights)
    .setFontColors(fontColors)
    .setHorizontalAlignments(horizontalAlignments)
    .setVerticalAlignment("middle");

  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 180);
}

function applyStockStatusValidation_(sheet, rows) {
  const menuRows = [];

  for (let index = 1; index < rows.length; index += 1) {
    if (!isCategorySectionRow_(rows[index])) {
      menuRows.push(index + 1);
    }
  }

  if (menuRows.length === 0) {
    return;
  }

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["in_stock", "sold_out"], true)
    .setAllowInvalid(false)
    .build();

  menuRows.forEach((rowNumber) => {
    sheet.getRange(rowNumber, 3).setDataValidation(rule);
  });
}

function applyInventoryLayout_(showAlert) {
  const sheet = getInventorySheet_();
  const existingMap = readExistingInventoryMap_(sheet);
  const built = buildCategoryRows_(existingMap);

  sheet.clear();
  sheet.getRange(1, 1, built.rows.length, HEADERS.length).setValues(built.rows);
  sheet.setFrozenRows(1);
  applySheetFormatting_(sheet, built.rows, built.rowCategories);
  applyStockStatusValidation_(sheet, built.rows);

  if (showAlert) {
    SpreadsheetApp.getUi().alert(
      "inventory 시트를 메뉴판 순서로 정리하고 카테고리별 색상을 적용했습니다."
    );
  }

  return {
    ok: true,
    rowCount: built.rows.length,
    menuCount: built.rows.filter((row) => String(row[0] || "").trim()).length,
  };
}

function reorganizeInventorySheet() {
  try {
    applyInventoryLayout_(true);
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      `정리 실패: ${error}\n\n시트 주소창 URL에서 스프레드시트 ID를 복사해\nCode.gs 맨 위 SPREADSHEET_ID = "..." 에 넣은 뒤 다시 실행하세요.`
    );
    throw error;
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("재고 관리")
    .addItem("카테고리별 정렬 및 색상 적용", "reorganizeInventorySheet")
    .addToUi();
}

function doGet(e) {
  const action = String(e?.parameter?.action || "").trim();

  if (action === "apply") {
    const key = String(e?.parameter?.key || "").trim();
    if (key !== SYNC_KEY) {
      return jsonResponse_({ ok: false, error: "invalid_key" });
    }

    try {
      return jsonResponse_(applyInventoryLayout_(false));
    } catch (error) {
      return jsonResponse_({ ok: false, error: String(error) });
    }
  }

  const sheet = getInventorySheet_();
  const values = sheet.getDataRange().getValues();
  const header = values.shift();
  const indexes = getHeaderIndexes_(header);

  const rows = values
    .filter((row) => String(row[indexes.menuKey] || "").trim())
    .map((row) => ({
      menu_key: String(row[indexes.menuKey]).trim(),
      stock_status: normalizeStockStatus_(row[indexes.stockStatus]),
    }));

  return jsonResponse_({ rows });
}
