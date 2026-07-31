const fs = require("fs");
const path = require("path");

const DEFAULT_INVENTORY_API_URL =
  "https://script.google.com/macros/s/AKfycbxpjTqVOzeSskfRaFxZZYwcALaou-Dt5_DJqNtrECD_IRw-fS15CGE9tR_PA7koQkg1/exec";
const SYNC_KEY = "cashew-house-inventory";
const rootDir = path.resolve(__dirname, "..");
const scriptPath = path.join(rootDir, "script.js");
const INVENTORY_API_URL = (process.argv[2] || process.env.INVENTORY_API_URL || DEFAULT_INVENTORY_API_URL)
  .trim()
  .replace(/\/$/, "");

function buildCatalogFromScript() {
  const code = fs.readFileSync(scriptPath, "utf8");
  const extractMenu = new Function(`
    ${code.split("const htmlRoot")[0]}
    return { menuData, categories, FIXED_MENU_KEYS };
  `);
  const { menuData, categories, FIXED_MENU_KEYS } = extractMenu();
  const categoryOrder = new Map(categories.map((categoryKey, index) => [categoryKey, index]));
  const menuOrder = new Map(FIXED_MENU_KEYS.map((menuKey, index) => [menuKey, index]));
  const sortedMenus = [...menuData].sort((a, b) => {
    const categoryDiff = categoryOrder.get(a.category) - categoryOrder.get(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return menuOrder.get(a.menuKey) - menuOrder.get(b.menuKey);
  });

  return sortedMenus.map((menu) => [
    menu.category,
    menu.menuKey,
    menu.name.en ?? menu.name.ko ?? menu.menuKey,
  ]);
}

async function fetchJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (_error) {
    throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 180)}`);
  }
  return { response, payload };
}

async function main() {
  const catalog = buildCatalogFromScript();
  console.log(`Using API: ${INVENTORY_API_URL}`);
  console.log(`Local catalog size: ${catalog.length}`);

  try {
    const versionUrl = `${INVENTORY_API_URL}?action=version`;
    const version = await fetchJson(versionUrl);
    if (version.payload?.version) {
      console.log(
        `Deployed version: ${version.payload.version}, catalog=${version.payload.menuCatalogCount}`
      );
    } else {
      console.warn(
        "이 URL은 아직 예전 배포입니다 (action=version 미지원). 배포를 '수정(연필)'으로 업데이트하거나 새 웹앱 URL을 인자로 넣어주세요."
      );
      console.warn("예) node tools/sync-google-sheet.js https://script.google.com/macros/s/XXXX/exec");
    }
  } catch (error) {
    console.warn(`version check skipped: ${error.message}`);
  }

  // POST apply with local catalog so new menus appear without redeploying Apps Script.
  const { response, payload } = await fetchJson(INVENTORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "apply",
      key: SYNC_KEY,
      catalog,
    }),
  });

  if (!response.ok || !payload?.ok) {
    console.error("Google Sheet sync failed.");
    console.error(payload);
    console.error("");
    console.error("1) Apps Script에 inventory/Code.gs 전체 붙여넣기 후 저장");
    console.error("2) 배포 → 배포 관리 → 연필(수정) → 버전: 새 버전 → 배포");
    console.error("3) 또는 에디터에서 reorganizeInventorySheet 함수 실행");
    console.error("4) 새 배포로 URL이 바뀌었으면: node tools/sync-google-sheet.js <새웹앱URL>");
    process.exit(1);
  }

  console.log(`Google Sheet updated: ${payload.menuCount} menus, ${payload.rowCount} total rows.`);

  if (Number(payload.menuCount) !== catalog.length) {
    console.error("");
    console.error(
      `경고: 시트 메뉴 수(${payload.menuCount})가 로컬 메뉴 수(${catalog.length})와 다릅니다.`
    );
    console.error("Apps Script 코드/배포가 최신이 아닙니다. Code.gs 붙여넣기 후 배포를 수정(연필)하세요.");
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
