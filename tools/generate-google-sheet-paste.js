const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const scriptPath = path.join(rootDir, "script.js");
const outputPath = path.join(rootDir, "inventory", "google-sheet-paste.tsv");
const apiUrl =
  "https://script.google.com/macros/s/AKfycbxpjTqVOzeSskfRaFxZZYwcALaou-Dt5_DJqNtrECD_IRw-fS15CGE9tR_PA7koQkg1/exec";

async function fetchStockMap() {
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) return new Map();
    const payload = await response.json();
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    return new Map(
      rows.map((row) => [
        String(row.menu_key ?? row.menuKey ?? "").trim(),
        String(row.stock_status ?? row.stockStatus ?? "in_stock").trim(),
      ])
    );
  } catch (_error) {
    return new Map();
  }
}

async function main() {
  const code = fs.readFileSync(scriptPath, "utf8");
  const extractMenu = new Function(`
    ${code.split("const htmlRoot")[0]}
    return { menuData, categories, i18n, FIXED_MENU_KEYS };
  `);
  const { menuData, categories, i18n, FIXED_MENU_KEYS } = extractMenu();
  const stockByKey = await fetchStockMap();
  const categoryOrder = new Map(categories.map((categoryKey, index) => [categoryKey, index]));
  const menuOrder = new Map(FIXED_MENU_KEYS.map((menuKey, index) => [menuKey, index]));
  const sortedMenus = [...menuData].sort((a, b) => {
    const categoryDiff = categoryOrder.get(a.category) - categoryOrder.get(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return menuOrder.get(a.menuKey) - menuOrder.get(b.menuKey);
  });

  const lines = ["menu_key\tmenu_name_en\tstock_status"];
  let previousCategoryKey = "";

  sortedMenus.forEach((menu) => {
    if (menu.category !== previousCategoryKey) {
      const label = i18n.en.categories[menu.category] ?? menu.category;
      lines.push(`\t--- ${label} ---\t`);
      previousCategoryKey = menu.category;
    }

    const menuNameEn = menu.name.en ?? menu.name.ko ?? menu.menuKey;
    lines.push(
      `${menu.menuKey}\t${menuNameEn}\t${stockByKey.get(menu.menuKey) || "in_stock"}`
    );
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${lines.length - 1} rows to ${outputPath}`);
}

main();
