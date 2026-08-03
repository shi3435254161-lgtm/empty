import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const rootDir = path.resolve(import.meta.dirname, "..");
const textureRoot = path.join(rootDir, "assets", "textures", "cc0");
const modelRoot = path.join(rootDir, "assets", "models", "polyhaven");
const wwwTextureRoot = path.join(rootDir, "www", "assets", "textures", "cc0");
const wwwModelRoot = path.join(rootDir, "www", "assets", "models", "polyhaven");
const generatedRegistryPath = path.join(rootDir, "js", "polyhaven-assets.generated.js");
const wwwGeneratedRegistryPath = path.join(rootDir, "www", "js", "polyhaven-assets.generated.js");

const textureAssets = [
  { id: "concrete_tile_facade", folder: "ph_concrete_tile_facade", name: "Concrete Tile Facade", resolution: "2k" },
  { id: "brown_floor_tiles", folder: "ph_brown_floor_tiles", name: "Brown Floor Tiles", resolution: "2k" },
  { id: "diagonal_parquet", folder: "ph_diagonal_parquet", name: "Diagonal Parquet", resolution: "2k" },
  { id: "dark_wood", folder: "ph_dark_wood", name: "Dark Wood", resolution: "2k" },
  { id: "fine_grained_wood", folder: "ph_fine_grained_wood", name: "Fine Grained Wood", resolution: "2k" },
  { id: "metal_plate_02", folder: "ph_metal_plate_02", name: "Metal Plate 02", resolution: "2k" }
];

const modelAssets = [
  { moduleId: "cooktop", id: "ph-electric-stove", polyId: "electric_stove", name: "CC0 电炉灶", resolution: "2k" },
  { moduleId: "base-drawer", id: "ph-drawer-cabinet", polyId: "drawer_cabinet", name: "CC0 木质抽屉柜", resolution: "4k" },
  { moduleId: "base-double", id: "ph-modern-wooden-cabinet", polyId: "modern_wooden_cabinet", name: "CC0 现代木柜", resolution: "2k" },
  { moduleId: "bath-mirror-cabinet", id: "ph-ornate-mirror", polyId: "ornate_mirror_01", name: "CC0 装饰镜", resolution: "2k" },
  { moduleId: "decor-plant-fiddle", id: "ph-potted-plant-02", polyId: "potted_plant_02", name: "CC0 琴叶榕盆栽", resolution: "1k" },
  { moduleId: "decor-plant-succulent", id: "ph-potted-plant-04", polyId: "potted_plant_04", name: "CC0 Succulent Plant", resolution: "1k" },
  { moduleId: "decor-frame-hanging-01", id: "ph-hanging-frame-01", polyId: "hanging_picture_frame_01", name: "CC0 竖幅挂画", resolution: "1k" },
  { moduleId: "decor-frame-hanging-02", id: "ph-hanging-frame-02", polyId: "hanging_picture_frame_02", name: "CC0 横幅挂画", resolution: "1k" },
  { moduleId: "decor-frame-standing", id: "ph-standing-frame-01", polyId: "standing_picture_frame_01", name: "CC0 台面相框", resolution: "1k" },
  { moduleId: "decor-vase-ceramic-01", id: "ph-ceramic-vase-01", polyId: "ceramic_vase_01", name: "CC0 现代陶瓷花瓶", resolution: "1k" },
  { moduleId: "decor-vase-ceramic-02", id: "ph-ceramic-vase-02", polyId: "ceramic_vase_02", name: "CC0 彩绘陶瓷花瓶", resolution: "1k" },
  { moduleId: "decor-vase-ceramic-03", id: "ph-ceramic-vase-03", polyId: "ceramic_vase_03", name: "CC0 Ceramic Vase 03", resolution: "1k" },
  { moduleId: "decor-vase-ceramic-04", id: "ph-ceramic-vase-04", polyId: "ceramic_vase_04", name: "CC0 Ceramic Vase 04", resolution: "1k" },
  { moduleId: "decor-vase-antique", id: "ph-antique-vase-01", polyId: "antique_ceramic_vase_01", name: "CC0 古典陶瓷花瓶", resolution: "1k" },
  { moduleId: "decor-ceiling-lamp-modern", id: "ph-ceiling-lamp-01", polyId: "modern_ceiling_lamp_01", name: "CC0 现代吸顶灯", resolution: "1k" },
  { moduleId: "decor-cutting-board", id: "ph-cutting-board", polyId: "wooden_cutting_board", name: "CC0 实木砧板", resolution: "1k" },
  { moduleId: "decor-planter-box-01", id: "ph-planter-box-01", polyId: "planter_box_01", name: "CC0 Planter Box 01", resolution: "1k" },
  { moduleId: "decor-planter-box-01", id: "ph-planter-box-02", polyId: "planter_box_02", name: "CC0 Planter Box 02", resolution: "1k" },
  { moduleId: "decor-planter-box-01", id: "ph-planter-box-03", polyId: "planter_box_03", name: "CC0 Planter Box 03", resolution: "1k" },
  { moduleId: "decor-window-wide", id: "ph-roller-window-01", polyId: "rollershutter_window_01", name: "CC0 Roller Shutter Window 01", resolution: "2k" },
  { moduleId: "decor-window-wide", id: "ph-roller-window-02", polyId: "rollershutter_window_02", name: "CC0 Roller Shutter Window 02", resolution: "2k" },
  { moduleId: "decor-window-wide", id: "ph-roller-window-03", polyId: "rollershutter_window_03", name: "CC0 Roller Shutter Window 03", resolution: "2k" },
  { moduleId: "decor-plant-tall", id: "ph-potted-plant-01", polyId: "potted_plant_01", name: "CC0 Potted Plant 01", resolution: "1k" },
  { moduleId: "decor-towel-basket", id: "ph-wicker-basket-02", polyId: "wicker_basket_02", name: "CC0 带盖藤编收纳篮", resolution: "1k" },
  { moduleId: "decor-tea-set", id: "ph-tea-set-01", polyId: "tea_set_01", name: "CC0 茶具套装", resolution: "1k" }
];

async function readJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function download(url, target, expectedBytes = null) {
  try {
    const stat = await fs.stat(target);
    if (stat.size > 0 && (!expectedBytes || stat.size === expectedBytes)) return stat.size;
    if (expectedBytes && stat.size !== expectedBytes) await fs.rm(target, { force: true });
  } catch {
    // Download when the target does not exist yet.
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const partial = `${target}.part`;
  await fs.rm(partial, { force: true });
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  await execFileAsync(curl, [
    "-L", "--fail", "--retry", "3", "--retry-delay", "2",
    "--connect-timeout", "20", "--max-time", "300",
    "--silent", "--show-error", "--output", partial, url
  ]);
  await fs.rename(partial, target);
  const size = (await fs.stat(target)).size;
  if (expectedBytes && size !== expectedBytes) {
    await fs.rm(target, { force: true });
    throw new Error(`size mismatch for ${path.basename(target)}: expected ${expectedBytes}, got ${size}`);
  }
  return size;
}

async function copyTree(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  await Promise.all(entries.map(async entry => {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else await fs.copyFile(from, to);
  }));
}

function selectResolution(block, preferred) {
  if (block?.[preferred]) return preferred;
  const order = ["4k", "2k", "1k", "8k"];
  return order.find(res => block?.[res]) || Object.keys(block || {})[0];
}

function findTextureUrl(files, keys, resolution) {
  for (const key of keys) {
    const map = files[key];
    const res = selectResolution(map, resolution);
    const item = map?.[res]?.jpg || map?.[res]?.png;
    if (item?.url) return item.url;
  }
  return null;
}

async function importTexture(asset) {
  const files = await readJson(`https://api.polyhaven.com/files/${asset.id}`);
  const target = path.join(textureRoot, asset.folder);
  const diffuse = findTextureUrl(files, ["Diffuse", "diffuse", "Color", "Base Color"], asset.resolution);
  const normal = findTextureUrl(files, ["nor_gl", "Normal"], asset.resolution);
  const roughness = findTextureUrl(files, ["Rough", "Roughness"], asset.resolution);
  if (!diffuse || !normal || !roughness) throw new Error(`missing texture maps for ${asset.id}`);

  const bytes = await Promise.all([
    download(diffuse, path.join(target, "diffuse.jpg")),
    download(normal, path.join(target, "normal.jpg")),
    download(roughness, path.join(target, "roughness.jpg"))
  ]);
  await fs.writeFile(path.join(target, "license.txt"), [
    asset.name,
    `Source: https://polyhaven.com/a/${asset.id}`,
    "License: CC0",
    "Provider: Poly Haven"
  ].join("\n") + "\n", "utf8");
  await copyTree(target, path.join(wwwTextureRoot, asset.folder));
  return { id: asset.id, bytes: bytes.reduce((a, b) => a + b, 0) };
}

async function importModel(asset) {
  const files = await readJson(`https://api.polyhaven.com/files/${asset.polyId}`);
  const gltfBlock = files.gltf;
  const resolution = selectResolution(gltfBlock, asset.resolution);
  const gltf = gltfBlock?.[resolution]?.gltf;
  if (!gltf?.url || !gltf.include) throw new Error(`missing glTF for ${asset.polyId}`);

  const target = path.join(modelRoot, asset.id);
  const includeBytes = await Promise.all(Object.entries(gltf.include)
    .filter(([, file]) => file?.url)
    .map(([relative, file]) => download(file.url, path.join(target, relative), file.size)));
  const total = await download(gltf.url, path.join(target, "model.gltf"), gltf.size)
    + includeBytes.reduce((sum, bytes) => sum + bytes, 0);
  await fs.writeFile(path.join(target, "license.txt"), [
    asset.name,
    `Source: https://polyhaven.com/a/${asset.polyId}`,
    "License: CC0",
    "Provider: Poly Haven"
  ].join("\n") + "\n", "utf8");
  await copyTree(target, path.join(wwwModelRoot, asset.id));
  return {
    ...asset,
    url: `assets/models/polyhaven/${asset.id}/model.gltf`,
    bytes: total,
    license: "CC0",
    author: "Poly Haven",
    sourceUrl: `https://polyhaven.com/a/${asset.polyId}`
  };
}

const importedTextures = [];
for (const asset of textureAssets) {
  const result = await importTexture(asset);
  importedTextures.push(result);
  console.log(`texture ${asset.id} ${result.bytes}`);
}

const importedModels = [];
for (let index = 0; index < modelAssets.length; index += 3) {
  const batch = modelAssets.slice(index, index + 3);
  const results = await Promise.allSettled(batch.map(importModel));
  results.forEach((result, itemIndex) => {
    if (result.status === "fulfilled") {
      importedModels.push(result.value);
      console.log(`model ${batch[itemIndex].polyId} ${result.value.bytes}`);
    } else {
      console.error(`failed ${batch[itemIndex].polyId}: ${result.reason?.message || result.reason}`);
    }
  });
}

await fs.writeFile(path.join(modelRoot, "polyhaven-models.json"), JSON.stringify(importedModels, null, 2), "utf8");
await fs.mkdir(wwwModelRoot, { recursive: true });
await fs.writeFile(path.join(wwwModelRoot, "polyhaven-models.json"), JSON.stringify(importedModels, null, 2), "utf8");
const generatedRegistry = importedModels.reduce((registry, asset) => {
  if (!registry[asset.moduleId]) registry[asset.moduleId] = [];
  registry[asset.moduleId].push({
    id: asset.id,
    name: asset.name,
    ready: true,
    safe: true,
    normalized: true,
    sourceUrl: asset.sourceUrl,
    author: asset.author,
    license: asset.license,
    url: asset.url,
    format: "gltf",
    bytes: asset.bytes,
    fitMode: "footprint"
  });
  return registry;
}, {});
const generatedSource = `// Generated by tools/polyhaven-import.mjs.\nwindow.POLYHAVEN_MODEL_ASSETS = ${JSON.stringify(generatedRegistry, null, 2)};\n`;
await fs.writeFile(generatedRegistryPath, generatedSource, "utf8");
await fs.mkdir(path.dirname(wwwGeneratedRegistryPath), { recursive: true });
await fs.writeFile(wwwGeneratedRegistryPath, generatedSource, "utf8");
console.log(`imported ${importedTextures.length} textures, ${importedModels.length} models`);
