import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(import.meta.dirname, "..");
const modelsRoot = path.join(rootDir, "assets", "models", "sketchfab");
const wwwModelsRoot = path.join(rootDir, "www", "assets", "models", "sketchfab");
const incomingRegistryPath = path.join(rootDir, "assets", "models", "incoming", "registry.json");
const generatedPaths = [
  path.join(rootDir, "js", "incoming-assets.generated.js"),
  path.join(rootDir, "www", "js", "incoming-assets.generated.js")
];

const candidates = [
  // Bathroom fixtures already imported.
  asset("bath-toilet-smart", "toilet-hippostance", "简洁坐便器", "132a8ee2af3a40d39d270fbed3d3666c", "https://sketchfab.com/3d-models/toilet-132a8ee2af3a40d39d270fbed3d3666c", "HippoStance", "CC BY 4.0"),
  asset("bath-toilet-smart", "toilet-pasha", "现代坐便器", "9befba766b7c47fdb134f5d2d6072bc9", "https://sketchfab.com/3d-models/toilet-9befba766b7c47fdb134f5d2d6072bc9", "Pasha", "CC BY 4.0"),
  asset("bath-toilet-smart", "toilet-xill", "流线坐便器", "24d1b493899d407780140688abae19bc", "https://sketchfab.com/3d-models/toilet-24d1b493899d407780140688abae19bc", "Xill", "CC BY 4.0"),
  asset("bath-vanity", "vanity-legion", "单盆浴室柜", "750dfa5fab444c28baf30e063d2b56d3", "https://sketchfab.com/3d-models/legion-single-sink-bathroom-vanity-sink-750dfa5fab444c28baf30e063d2b56d3", "allenbranch", "CC BY 4.0"),
  asset("bath-vanity", "vanity-designer-vessel", "木质台盆柜", "b0b478131827419c8965132a19eb8993", "https://sketchfab.com/3d-models/designer-vessel-on-wooden-vanity-unit-b0b478131827419c8965132a19eb8993", "attilakozma", "CC BY 4.0"),
  asset("bath-vanity", "vanity-ada", "无障碍浴室柜", "f0b5d1339d7749a48b39ab954b36ce25", "https://sketchfab.com/3d-models/bathroom-ada-vanity-f0b5d1339d7749a48b39ab954b36ce25", "geppettomaster", "CC BY 4.0"),
  asset("bath-shower-set", "shower-like", "圆形顶喷花洒", "83938a58e0f84fd0b2ffc8fb0af5824e", "https://sketchfab.com/3d-models/like-shower-set-83938a58e0f84fd0b2ffc8fb0af5824e", "dm3V", "CC BY 4.0"),
  asset("bath-shower-set", "shower-grohe", "恒温花洒", "6ae3fcb6c6ea415a8fec05d2e82f5505", "https://sketchfab.com/3d-models/grohe-grohtherm-smart-shower-set-34705000-6ae3fcb6c6ea415a8fec05d2e82f5505", "bimstore", "CC BY 4.0"),
  asset("bath-shower-set", "shower-dobbies", "浴缸花洒套装", "62a9bda14f614a678bd810d6760731f4", "https://sketchfab.com/3d-models/dobbies-bath-and-shower-set-62a9bda14f614a678bd810d6760731f4", "dobbiej23", "CC BY 4.0"),
  asset("bath-tub", "tub-classic", "经典浴缸", "7427e2c0c32c44b89deb058f6583742a", "https://sketchfab.com/3d-models/classic-bathtub-7427e2c0c32c44b89deb058f6583742a", "RenderArteStudio", "CC BY 4.0"),
  asset("bath-tub", "tub-simple", "简约浴缸", "4f0df513307e4d8b958345570f6cf5b0", "https://sketchfab.com/3d-models/simple-bathtub-4f0df513307e4d8b958345570f6cf5b0", "neverfollow81", "CC BY 4.0"),
  asset("bath-tub", "tub-shower", "浴缸淋浴组合", "22e187363dd14bc3a3e1b4611830236a", "https://sketchfab.com/3d-models/bathtub-with-shower-22e187363dd14bc3a3e1b4611830236a", "HippoStance", "CC BY 4.0"),
  asset("bath-towel-rack", "rack-02", "双层毛巾架", "ceb7ac69e75f472ea6708a81f069766b", "https://sketchfab.com/3d-models/towel-racks-02-ceb7ac69e75f472ea6708a81f069766b", "OliverMatheGames", "CC BY 4.0"),
  asset("bath-towel-rack", "rack-01", "单杆毛巾架", "6c3cff31368b44b8bfab8b8670703f9f", "https://sketchfab.com/3d-models/towel-racks-01-6c3cff31368b44b8bfab8b8670703f9f", "OliverMatheGames", "CC BY 4.0"),
  asset("bath-towel-rack", "rack-rail", "壁挂毛巾杆", "6bd16f3cb1ea4a9cb08a404ea3635c5f", "https://sketchfab.com/3d-models/towel-rail-6bd16f3cb1ea4a9cb08a404ea3635c5f", "KargaEntiti", "CC BY 4.0"),

  // New bathroom additions.
  asset("bath-mirror-cabinet", "mirror-vanity", "化妆镜", "49883c6c218640f1bb3e62d7bc2280bb", "https://sketchfab.com/3d-models/vanity-mirror-49883c6c218640f1bb3e62d7bc2280bb", "Brendan Wood", "CC BY 4.0"),
  asset("bath-mirror-cabinet", "mirror-wall-modern", "现代壁挂镜", "9a2e94d656da43a9ab64d4c8a93581e4", "https://sketchfab.com/3d-models/wall-mirror-mirror-espejo-de-pared-9a2e94d656da43a9ab64d4c8a93581e4", "tlaloc", "CC BY 4.0"),
  asset("bath-mirror-cabinet", "mirror-beauty", "带灯美容镜", "3379e01816ab4dd1a9674d1c984d7f97", "https://sketchfab.com/3d-models/modern-beauty-mirror-3d-model-3379e01816ab4dd1a9674d1c984d7f97", "ProductViz", "CC BY 4.0"),
  asset("bath-shower-room", "shower-cabin-glass", "玻璃淋浴房", "e2c6a8dd490e4e4398378e1f6c9121a8", "https://sketchfab.com/3d-models/shower-cabin-e2c6a8dd490e4e4398378e1f6c9121a8", "Heliona", "CC BY 4.0"),
  asset("bath-shower-room", "shower-cubicle", "方形淋浴隔断", "a8ebef3c06e2452a93a4ef89703db446", "https://sketchfab.com/3d-models/shower-cubicle-a8ebef3c06e2452a93a4ef89703db446", "stu82", "CC BY 4.0"),
  asset("bath-shower-room", "shower-room-simple", "简洁淋浴间", "3c1e3162f05147bea97b5515ce2d4031", "https://sketchfab.com/3d-models/shower-3c1e3162f05147bea97b5515ce2d4031", "Ali107_YT", "CC BY 4.0"),
  asset("bath-floor-drain", "drain-floor-grate", "金属地漏格栅", "7896d2b8f1794cc2b491c451ab814874", "https://sketchfab.com/3d-models/floor-grate-7896d2b8f1794cc2b491c451ab814874", "Forest Run Forever", "CC BY 4.0"),
  asset("bath-floor-drain", "drain-round-cover", "圆形地漏盖", "93eeec8d570d4f51aa4550146b2774bf", "https://sketchfab.com/3d-models/drain-cover-93eeec8d570d4f51aa4550146b2774bf", "gyre77", "CC BY 4.0"),

  // New kitchen appliance and sink additions.
  asset("sink-single", "sink-hippostance", "单槽水槽龙头", "504248ed68e3480a807aced6f002b2d5", "https://sketchfab.com/3d-models/kitchen-sink-504248ed68e3480a807aced6f002b2d5", "HippoStance", "CC BY 4.0"),
  asset("sink-single", "sink-simple", "简洁单槽", "73bda35b6e7a499a80427fc1b049b192", "https://sketchfab.com/3d-models/simple-sink-73bda35b6e7a499a80427fc1b049b192", "Andrew.Mischenko", "CC BY 4.0"),
  asset("sink-single", "sink-granite", "花岗岩单槽", "bad956f2f67a4cd5995fb1a46f5b94da", "https://sketchfab.com/3d-models/granite-sink-single-bad956f2f67a4cd5995fb1a46f5b94da", "Jan Orel", "CC BY 4.0"),
  asset("sink-double", "sink-kohler-double", "双盆不锈钢水槽", "8bc381a229e34834bd8e20ca6011e82f", "https://sketchfab.com/3d-models/kohler-undermount-double-bowl-kitchen-sink-8bc381a229e34834bd8e20ca6011e82f", "allenbranch", "CC BY 4.0"),
  asset("sink-double", "sink-fiesta", "深盆双槽水槽", "fbe874f7f96f4727981087c1a0c7262e", "https://sketchfab.com/3d-models/kitchen-sink-fiesta-5149-fbe874f7f96f4727981087c1a0c7262e", "yuridiz", "CC BY 4.0"),
  asset("cooktop", "cooktop-gas-modern", "现代燃气灶", "3791a4e3d92a4623a2e5b9493448922c", "https://sketchfab.com/3d-models/gas-cooktop-3d-model-kitchen-appliance-3791a4e3d92a4623a2e5b9493448922c", "ProductViz", "CC BY 4.0"),
  asset("cooktop", "cooktop-gas-classic", "四眼燃气灶", "056ccf898f9e49acb6e3e370deabf184", "https://sketchfab.com/3d-models/gas-stove-056ccf898f9e49acb6e3e370deabf184", "Lyskilde", "CC BY 4.0"),
  asset("cooktop", "cooktop-gas-slim", "嵌入式燃气灶", "9a4b89d7ff5c482dae835df596fdcc2f", "https://sketchfab.com/3d-models/gas-stove-9a4b89d7ff5c482dae835df596fdcc2f", "Francesco Coldesina", "CC BY 4.0"),
  asset("cooktop-induction", "induction-caple", "黑晶电磁灶", "339e5aa21166471cbf9db815230954df", "https://sketchfab.com/3d-models/caple-dd930bk-1-80cm-339e5aa21166471cbf9db815230954df", "eltayerkebulan", "CC BY 4.0"),
  asset("cooktop-induction", "induction-countertop", "台下电磁灶", "25ad632ea58649dfb30f3aee90075c9e", "https://sketchfab.com/3d-models/induction-cooktop-under-countertop-25ad632ea58649dfb30f3aee90075c9e", "anhtruc1892005", "CC BY 4.0"),
  asset("range-hood", "hood-stainless", "不锈钢烟机", "e7408d63175b4d76b8e7b2ca7435fc10", "https://sketchfab.com/3d-models/ge-stainless-steel-chimney-stylerange-hood-e7408d63175b4d76b8e7b2ca7435fc10", "allenbranch", "CC BY 4.0"),
  asset("range-hood", "hood-wall-mount", "壁挂烟机", "a7ae92979c624ac39de4094bf10f6164", "https://sketchfab.com/3d-models/samsung-bespoke-36-smart-wall-mount-hood-a7ae92979c624ac39de4094bf10f6164", "eltayerkebulan", "CC BY 4.0"),
  asset("range-hood", "hood-rectangular", "矩形抽油烟机", "a3ec10632d83426aaa5dad54422a6aec", "https://sketchfab.com/3d-models/free-rectangular-cooker-hood-60-x-40-cm-a3ec10632d83426aaa5dad54422a6aec", "marcin_malcherek", "CC BY 4.0"),
  asset("fridge", "fridge-french-door", "法式双开门冰箱", "ebe62ed6dd9b446a9c9b7d7d6a8086e7", "https://sketchfab.com/3d-models/french-door-refrigerator-stainless-ebe62ed6dd9b446a9c9b7d7d6a8086e7", "Smokahontas", "CC BY 4.0"),
  asset("fridge", "fridge-compact", "紧凑冰箱", "1a4b185d4df449a59433ae80310d1809", "https://sketchfab.com/3d-models/fridge-1a4b185d4df449a59433ae80310d1809", "cicinha", "CC BY 4.0"),
  asset("fridge", "fridge-lg-stainless", "银色上冷藏冰箱", "9c48cce97126455faa4b00c0ffa2387c", "https://sketchfab.com/3d-models/fridge-lg-243l-top-mount-stainless-steel-9c48cce97126455faa4b00c0ffa2387c", "abass20", "CC BY 4.0"),
  asset("dishwasher", "dishwasher-built-in", "嵌入式洗碗机", "88a14cc94f7643eeaccd7a3006b3462b", "https://sketchfab.com/3d-models/countertop-dishwasher-built-in-88a14cc94f7643eeaccd7a3006b3462b", "nurhadimli", "CC BY 4.0"),
  asset("dishwasher", "dishwasher-ge", "不锈钢洗碗机", "f840ded0f295466392b8e2e8591e9f17", "https://sketchfab.com/3d-models/ge-built-in-dishwasher-stainless-steel-f840ded0f295466392b8e2e8591e9f17", "allenbranch", "CC BY 4.0"),
  asset("dishwasher", "dishwasher-compact", "紧凑洗碗机", "8d47d7a007f34965a93111b22274f489", "https://sketchfab.com/3d-models/compact-dishwasher-18-width-samsung-inspired-8d47d7a007f34965a93111b22274f489", "MUSHROOM_BUILDS", "CC BY 4.0"),
  asset("oven", "oven-bosch-wall", "嵌入式烤箱", "2c46c1663590439a9edc0de3cb51dba9", "https://sketchfab.com/3d-models/bosch-built-in-wall-oven-2c46c1663590439a9edc0de3cb51dba9", "eltayerkebulan", "CC BY 4.0", { rotation: 180 }),
  asset("oven", "oven-small-kitchen", "黑色烤箱", "e783d6d64f8c453ab534bdde715b210d", "https://sketchfab.com/3d-models/small-kitchen-with-oven-e783d6d64f8c453ab534bdde715b210d", "AleixoAlonso", "CC BY 4.0"),
  asset("oven", "oven-electrolux", "电烤箱", "69b8e036e0664f7988c66ff3745d210b", "https://sketchfab.com/3d-models/built-in-oven-electrolux-69b8e036e0664f7988c66ff3745d210b", "eltayerkebulan", "CC BY 4.0"),
  asset("washer", "washer-dryer", "洗烘一体机", "8358b47f171d43e98f473083ce55b36e", "https://sketchfab.com/3d-models/washer-dryer-machine-8358b47f171d43e98f473083ce55b36e", "rhcreations", "CC BY 4.0"),
  asset("washer", "washer-front-load", "滚筒洗衣机", "75879a749a554ec4803082bdcc1af670", "https://sketchfab.com/3d-models/washing-machine-75879a749a554ec4803082bdcc1af670", "bucketo", "CC BY 4.0"),
  asset("washer", "washer-modern", "白色洗衣机", "87a77b97a6054a7f81ef3ac6915ad0c7", "https://sketchfab.com/3d-models/washing-machine-87a77b97a6054a7f81ef3ac6915ad0c7", "appsnation", "CC BY 4.0")
];

const includedModules = new Set([
  "bath-toilet-smart",
  "bath-vanity",
  "bath-shower-set",
  "bath-tub",
  "bath-towel-rack",
  "bath-mirror-cabinet",
  "bath-shower-room",
  "bath-floor-drain",
  "sink-single",
  "sink-double",
  "cooktop",
  "cooktop-induction",
  "range-hood",
  "fridge",
  "dishwasher",
  "oven",
  "washer"
]);

const requestedModules = new Set(
  String(process.env.SKETCHFAB_MODULES || "")
    .split(",")
    .map((moduleId) => moduleId.trim())
    .filter(Boolean)
);
const activeCandidates = candidates.filter((candidate) => (
  includedModules.has(candidate.moduleId) &&
  (!requestedModules.size || requestedModules.has(candidate.moduleId))
));

function asset(moduleId, id, name, uid, sourceUrl, author, license, extra = {}) {
  return { moduleId, id, name, uid, sourceUrl, author, license, ...extra };
}

function getToken() {
  const token = process.env.SKETCHFAB_TOKEN;
  if (!token) throw new Error("Set SKETCHFAB_TOKEN before running this downloader.");
  return token;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, token, attempt = 1) {
  const response = await fetch(url, {
    headers: { Authorization: `Token ${token}`, accept: "application/json" }
  });
  if (response.status === 429 && attempt <= 10) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(120000, 30000 * attempt);
    console.log(`rate limited; waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/10)`);
    await sleep(waitMs);
    return fetchJson(url, token, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const data = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, data);
  return data.length;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyFileIfReady(sourcePath, targetPath) {
  if (!(await fileExists(sourcePath))) return;
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

function renderIncomingAssets(records) {
  const byModule = new Map();
  for (const record of records) {
    const candidate = activeCandidates.find((item) => item.id === record.id) || record;
    if (!record?.ready || !candidate.moduleId) continue;
    if (!byModule.has(candidate.moduleId)) byModule.set(candidate.moduleId, []);
    const entry = {
      id: candidate.id,
      name: candidate.name,
      ready: true,
      sourceUrl: candidate.sourceUrl,
      author: candidate.author,
      license: candidate.license,
      url: record.url,
      format: record.format || "glb",
      bytes: record.bytes,
      auditOnly: true,
      note: "Sketchfab API 下载候选，须完成授权与空间画面验收后才能进入主库。"
    };
    if (candidate.rotation) entry.rotation = candidate.rotation;
    byModule.get(candidate.moduleId).push(entry);
  }

  return [
    "// Generated by tools/sketchfab-download.mjs. Do not hand edit or store API tokens here.",
    "// Downloaded Sketchfab files remain audit-only until their license and visual review pass.",
    `window.INCOMING_REAL_ASSETS = ${JSON.stringify(Object.fromEntries(byModule), null, 4)};`,
    ""
  ].join("\n");
}

async function loadIncomingRegistry() {
  if (!await fileExists(incomingRegistryPath)) return [];
  const parsed = JSON.parse(await fs.readFile(incomingRegistryPath, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

async function writeIncomingRegistry(records) {
  await fs.mkdir(path.dirname(incomingRegistryPath), { recursive: true });
  await fs.writeFile(incomingRegistryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  const generated = renderIncomingAssets(records);
  await Promise.all(generatedPaths.map(async (filePath) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, generated, "utf8");
  }));
}

async function importCandidate(candidate, token) {
  const modelPath = path.join(modelsRoot, candidate.id, "model.glb");
  const wwwModelPath = path.join(wwwModelsRoot, candidate.id, "model.glb");
  const relativeUrl = `assets/models/sketchfab/${candidate.id}/model.glb`;

  if (await fileExists(modelPath)) {
    const stat = await fs.stat(modelPath);
    await copyFileIfReady(modelPath, wwwModelPath);
    return { ...candidate, ready: true, url: relativeUrl, bytes: stat.size, status: "keep" };
  }

  if (process.env.SKETCHFAB_SKIP_DOWNLOADS === "1") {
    return { ...candidate, ready: false, status: "missing" };
  }

  const download = await fetchJson(`https://api.sketchfab.com/v3/models/${candidate.uid}/download`, token);
  if (!download.glb?.url) {
    return { ...candidate, ready: false, status: "skip", error: "no glb archive" };
  }

  const bytes = await downloadFile(download.glb.url, modelPath);
  await copyFileIfReady(modelPath, wwwModelPath);

  const licenseText = [
    candidate.name,
    `Author: ${candidate.author}`,
    `Source: ${candidate.sourceUrl}`,
    `License: ${candidate.license}`,
    "Attribution required by the original Sketchfab license."
  ].join("\n");
  await fs.writeFile(path.join(modelsRoot, candidate.id, "license.txt"), `${licenseText}\n`, "utf8");
  await fs.writeFile(path.join(wwwModelsRoot, candidate.id, "license.txt"), `${licenseText}\n`, "utf8");
  return { ...candidate, ready: true, url: relativeUrl, bytes, status: "downloaded" };
}

const token = process.env.SKETCHFAB_SKIP_DOWNLOADS === "1" ? "" : getToken();
const records = [];

let isFirst = true;
for (const candidate of activeCandidates) {
  const modelPath = path.join(modelsRoot, candidate.id, "model.glb");
  const needsRequest = process.env.SKETCHFAB_SKIP_DOWNLOADS !== "1" && !await fileExists(modelPath);
  if (!isFirst && needsRequest) {
    const delay = 5000;
    console.log(`waiting ${delay / 1000}s between requests...`);
    await sleep(delay);
  }
  if (needsRequest) isFirst = false;
  try {
    const record = await importCandidate(candidate, token);
    records.push(record);
    const bytes = record.bytes ? ` ${record.bytes}` : "";
    console.log(`${record.status} ${candidate.id}${bytes}`);
  } catch (error) {
    records.push({ ...candidate, ready: false, error: error.message });
    console.log(`failed ${candidate.id}: ${error.message}`);
  }
}

const importedIds = new Set(records.map((record) => record.id));
const previousRecords = await loadIncomingRegistry();
const mergedRecords = [
  ...previousRecords.filter((record) => !importedIds.has(record.id)),
  ...records.filter((record) => record.ready)
].sort((a, b) => String(a.name).localeCompare(String(b.name), "zh-CN"));
await writeIncomingRegistry(mergedRecords);

const ready = records.filter((record) => record.ready).length;
console.log(`audit-only ready ${ready}/${activeCandidates.length}`);
