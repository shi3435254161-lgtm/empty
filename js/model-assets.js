// Reviewed local 3D model registry. API tokens must never be stored here.
const MODEL_ASSETS = {};

const NORMALIZED_MODEL_ASSETS = {
    "sink-single": [
        {
            "id": "sf-kitchen-sink-504248ed-normalized",
            "name": "真实厨房水槽",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/kitchen-sink-504248ed68e3480a807aced6f002b2d5",
            "author": "HippoStance",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-kitchen-sink-504248ed/model.glb",
            "format": "glb",
            "bytes": 76404,
            "fitMode": "footprint"
        }
    ],
    "sink-double": [],
    "cooktop": [
        {
            "id": "sf-gas-stove-056ccf89-normalized",
            "name": "真实燃气灶",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/gas-stove-056ccf898f9e49acb6e3e370deabf184",
            "author": "Lyskilde",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-gas-stove-056ccf89/model.glb",
            "format": "glb",
            "bytes": 353008,
            "fitMode": "footprint"
        }
    ],
    "bath-faucet": [
        {
            "id": "sf-sink-faucet-e7c2bdda-normalized",
            "name": "真实台盆龙头",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/sink-with-faucet-e7c2bddaebe94dd0a28fd89981de5195",
            "author": "blendffnike",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-sink-faucet-e7c2bdda/model.glb",
            "format": "glb",
            "bytes": 115376,
            "fitMode": "footprint"
        }
    ],
    "bath-counter-basin": [
        {
            "id": "sf-bath-sink-1557268d-normalized",
            "name": "真实浴室台盆",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/bathroom-sink-1557268d1464411caf9f71062e410885",
            "author": "SamSolax",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-bath-sink-1557268d/model.glb",
            "format": "glb",
            "bytes": 4123928,
            "fitMode": "footprint"
        }
    ],
    "bath-vanity": [
        {
            "id": "sf-bath-sink-1557268d-normalized",
            "name": "真实浴室台盆",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/bathroom-sink-1557268d1464411caf9f71062e410885",
            "author": "SamSolax",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-bath-sink-1557268d/model.glb",
            "format": "glb",
            "bytes": 4123928,
            "fitMode": "footprint"
        }
    ],
    "bath-tub": [
        {
            "id": "sf-bathtub-3350f810-normalized",
            "name": "真实浴缸",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/bathtub-3350f81025974c53808a2efd2b31d4fd",
            "author": "3ddominator",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-bathtub-3350f810/model.glb",
            "format": "glb",
            "bytes": 152068,
            "fitMode": "footprint"
        }
    ],
    "bath-shower-room": [
        {
            "id": "sf-shower-cabin-e2c6a8dd-normalized",
            "name": "真实淋浴房",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/shower-cabin-e2c6a8dd490e4e4398378e1f6c9121a8",
            "author": "Heliona",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-shower-cabin-e2c6a8dd/model.glb",
            "format": "glb",
            "bytes": 447820,
            "fitMode": "footprint"
        }
    ],
    "bath-toilet-smart": [
        {
            "id": "sf-toilet-132a8ee2-normalized",
            "name": "真实马桶",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/toilet-132a8ee2af3a40d39d270fbed3d3666c",
            "author": "HippoStance",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-toilet-132a8ee2/model.glb",
            "format": "glb",
            "bytes": 224144,
            "fitMode": "footprint"
        }
    ],
    "range-hood": [
        {
            "id": "sf-range-hood-e846cb48-normalized",
            "name": "真实油烟机",
            "ready": true,
            "safe": true,
            "normalized": true,
            "sourceUrl": "https://sketchfab.com/3d-models/range-hood-kitchen-hood-e846cb48e88446808af55976ff76b1da",
            "author": "govindu94",
            "license": "CC BY 4.0",
            "requiresAttribution": true,
            "url": "assets/models/normalized/sf-range-hood-e846cb48/model.glb",
            "format": "glb",
            "bytes": 36780,
            "fitMode": "footprint"
        }
    ]
};

function prependAssetGroups(groups) {
    Object.entries(groups || {}).forEach(([moduleId, variants]) => {
        MODEL_ASSETS[moduleId] = [
            ...(Array.isArray(variants) ? variants : []),
            ...(Array.isArray(MODEL_ASSETS[moduleId]) ? MODEL_ASSETS[moduleId] : [])
        ];
    });
}

prependAssetGroups(NORMALIZED_MODEL_ASSETS);
prependAssetGroups(window.POLYHAVEN_MODEL_ASSETS);
prependAssetGroups(window.INCOMING_REAL_ASSETS);

// Only assets that passed a visual, in-space review are available in the editor.
window.ASSET_REVIEW = {
    'sf-kitchen-sink-504248ed-normalized': { status: 'approved', note: '现代双槽水槽，可用于厨房台面。' },
    'sf-shower-cabin-e2c6a8dd-normalized': { status: 'approved', note: '现代黑框淋浴房，可用于卫浴干湿分离。' },
    'ph-potted-plant-02': { status: 'approved', note: '真实 PBR 琴叶榕，可用于软装点缀。' },
    'ph-cutting-board': { status: 'approved', note: '真实 PBR 砧板，可用于厨房台面。' },
    'ph-ceramic-vase-01': { status: 'approved', note: '现代白瓷花瓶，可用于台面软装。' },
    'ph-potted-plant-04': { status: 'approved', note: '白陶盆多肉，比例和贴图通过明亮空间验收。' },
    'ph-ceramic-vase-03': { status: 'approved', note: '浅色高花瓶，材质和比例通过明亮空间验收。' },
    'ph-ceramic-vase-04': { status: 'approved', note: '带耳白瓷花瓶，材质和比例通过明亮空间验收。' },
    'ph-ceiling-lamp-01': { status: 'approved', note: '现代吊灯，可用于空间照明装饰。' },
    'sf-toilet-132a8ee2-normalized': { status: 'approved', note: '现代独立坐便器，比例和 CC BY 署名要求已验收。' },

    'sf-gas-stove-056ccf89-normalized': { status: 'rejected', note: '锈蚀独立炉灶，与现代嵌入式厨房不匹配。' },
    'ph-electric-stove': { status: 'rejected', note: '老式独立电炉，与现代嵌入式厨房不匹配。' },
    'sf-range-hood-e846cb48-normalized': { status: 'rejected', note: '材质和细节不足，不能作为现代烟机成品素材。' },
    'sf-sink-faucet-e7c2bdda-normalized': { status: 'rejected', note: '实际为小浴室柜，不能冒充独立龙头。' },
    'sf-bath-sink-1557268d-normalized': { status: 'hold', note: '仅台上盆组件，不是完整现代浴室柜。' },
    'sf-bathtub-3350f810-normalized': { status: 'hold', note: '古典脚浴缸，不进入现代厨卫默认库。' },
    'ph-drawer-cabinet': { status: 'hold', note: '开放式抽屉架，不适合作为厨柜地柜。' },
    'ph-modern-wooden-cabinet': { status: 'hold', note: '餐边柜比例，不适合作为厨柜地柜。' },
    'ph-ornate-mirror': { status: 'rejected', note: '古典装饰镜，不是现代镜柜。' },
    'ph-antique-vase-01': { status: 'hold', note: '古典花瓶，仅适合特定风格。' },
    'ph-hanging-frame-01': { status: 'rejected', note: '只有黑色空画面，缺少可用纹理。' },
    'ph-hanging-frame-02': { status: 'rejected', note: '只有黑色空画面，缺少可用纹理。' },
    'ph-standing-frame-01': { status: 'rejected', note: '只有黑色空画面，缺少可用纹理。' },
    'ph-ceramic-vase-02': { status: 'hold', note: '风格待按具体空间复核。' },
    'ph-tea-set-01': { status: 'hold', note: '中式茶具，暂不作为现代厨卫默认软装。' },
    'ph-planter-box-01': { status: 'hold', note: '旧木风格，等待标准化并放入风格筛选库。' },
    'ph-planter-box-02': { status: 'rejected', note: '与同组旧木花箱近重复，不进入主库。' },
    'ph-planter-box-03': { status: 'rejected', note: '与同组旧木花箱近重复，不进入主库。' },
    'ph-potted-plant-01': { status: 'hold', note: '陶土盆风格偏旧，等待标准化。' },
    'ph-roller-window-01': { status: 'rejected', note: '黑色遮板且与同组文件重复，不是可用窗户或窗帘。' },
    'ph-roller-window-02': { status: 'rejected', note: '黑色遮板且与同组文件重复，不是可用窗户或窗帘。' },
    'ph-roller-window-03': { status: 'rejected', note: '黑色遮板且与同组文件重复，不是可用窗户或窗帘。' },

    'toilet-hippostance': { status: 'hold', note: '普通坐便器，外形和细节不足以作为智能马桶素材。' },
    'toilet-pasha': { status: 'rejected', note: '文件实际包含公共卫生间场景，不是可独立摆放的坐便器。' },
    'toilet-xill': { status: 'hold', note: '普通旧式坐便器，不能标为智能马桶或品牌款。' },
    'vanity-legion': { status: 'hold', note: '单盆柜细节和比例偏旧，不符合当前现代卫浴默认风格。' },
    'vanity-designer-vessel': { status: 'rejected', note: '夹带大面积原场景背景板，不能作为独立浴室柜导入。' },
    'vanity-ada': { status: 'hold', note: '完整浴室柜、台盆、镜面和龙头可见，仍需标准化。' },
    'shower-like': { status: 'hold', note: '独立花洒组件结构完整，仍需标准化朝向和安装点。' },
    'shower-grohe': { status: 'hold', note: '花洒有品牌参考价值，但带背景且比例未完成适配。' },
    'shower-dobbies': { status: 'rejected', note: '浴缸花洒套装风格过时，与现代干湿分离空间不匹配。' },
    'tub-classic': { status: 'rejected', note: '古典脚浴缸，不属于现代厨卫默认素材。' },
    'tub-simple': { status: 'hold', note: '独立浴缸造型偏旧，暂不进入现代样板。' },
    'tub-shower': { status: 'hold', note: '浴缸花洒组合的朝向和比例尚未完成空间适配。' },
    'rack-01': { status: 'hold', note: '带置物层和毛巾杆，仍需标准化挂墙锚点。' },
    'rack-02': { status: 'hold', note: '双层毛巾架结构完整，仍需标准化挂墙锚点。' },
    'rack-rail': { status: 'hold', note: '带毛巾的壁挂杆结构完整，仍需标准化挂墙锚点。' },

    'mirror-vanity': { status: 'rejected', note: '实际是一整张老式梳妆台，不是独立化妆镜或浴室镜柜。' },
    'mirror-wall-modern': { status: 'rejected', note: '黑色装饰环造型且没有可用镜面效果，不符合现代浴室镜柜要求。' },
    'mirror-beauty': { status: 'hold', note: '独立台式美容镜可用，但不是壁挂镜柜；需改分类并标准化材质。' },
    'shower-cabin-glass': { status: 'hold', note: '完整现代玻璃淋浴房；与已标准化版本同源，原始文件仅保留作溯源。' },
    'shower-cubicle': { status: 'rejected', note: '夹带整面墙、地面和固定场景，不是可独立摆放的淋浴隔断。' },
    'shower-room-simple': { status: 'rejected', note: '几何和材质过于简陋，达不到成品设计图质量。' },
    'drain-floor-grate': { status: 'rejected', note: '夹带大块破旧地面且蓝色材质异常，不能作为现代厨卫地漏。' },
    'drain-round-cover': { status: 'rejected', note: '夹带整块旧地砖和锈蚀盖板，不能作为独立地漏素材。' },
    'sink-hippostance': { status: 'rejected', note: '与已标准化并通过的真实厨房水槽同源重复。' },
    'sink-simple': { status: 'rejected', note: '实际是低细节壁挂洗手盆，不是厨房单槽水槽。' },
    'sink-granite': { status: 'hold', note: '独立单槽和龙头结构合格，需重新标准化 PBR 材质与安装高度。' },
    'sink-kohler-double': { status: 'hold', note: '科勒双槽轮廓和比例合格，需补材质、龙头和安装锚点。' },
    'sink-fiesta': { status: 'hold', note: '独立深盆水槽质量可用，但实际是单槽，需改分类并压缩文件。' },
    'cooktop-gas-modern': { status: 'hold', note: '现代嵌入式燃气灶结构合格，需标准化尺寸、材质和安装高度。' },
    'cooktop-gas-classic': { status: 'rejected', note: '实际是严重锈蚀的独立烤箱灶，不适合现代厨卫设计。' },
    'cooktop-gas-slim': { status: 'rejected', note: '实际是带烤箱的独立灶具，不是嵌入式燃气灶。' },
    'induction-caple': { status: 'hold', note: '现代黑晶嵌入式灶外形和细节合格，需压缩并标准化。' },
    'induction-countertop': { status: 'rejected', note: '实际包含整座黑色岛台和水槽，不是独立台下电磁灶。' },
    'hood-stainless': { status: 'hold', note: '独立玻璃不锈钢烟机结构合格，需修复 PBR 与安装锚点。' },
    'hood-wall-mount': { status: 'hold', note: '包含两台烟机且文件达 28 MB，必须拆分和压缩。' },
    'hood-rectangular': { status: 'rejected', note: '模型接近无材质黑盒，结构细节不足。' }
};

window.isUsableModelAsset = function isUsableModelAsset(variant) {
    const review = window.ASSET_REVIEW?.[variant?.id];
    return Boolean(
        variant &&
        variant.ready !== false &&
        variant.url &&
        (variant.safe === true || variant.normalized === true) &&
        review?.status === 'approved'
    );
};

window.getAssetReview = function getAssetReview(variant) {
    return window.ASSET_REVIEW?.[variant?.id] || {
        status: 'unreviewed',
        note: '尚未进行空间验收，不能进入设计主库。'
    };
};

function canonicalAssetSource(variant) {
    const source = String(variant?.sourceUrl || variant?.url || '').trim().toLowerCase();
    return source.replace(/[?#].*$/, '').replace(/\/$/, '');
}

window.getAssetLibraryAudit = function getAssetLibraryAudit() {
    const assignedSources = new Map();
    const duplicates = [];
    const approved = [];
    Object.entries(MODEL_ASSETS).forEach(([moduleId, variants]) => {
        (Array.isArray(variants) ? variants : []).forEach(variant => {
            if (!window.isUsableModelAsset(variant)) return;
            const source = canonicalAssetSource(variant);
            if (!source) return;
            if (assignedSources.has(source)) {
                duplicates.push({
                    source,
                    first: assignedSources.get(source),
                    duplicate: { moduleId, id: variant.id, name: variant.name }
                });
                return;
            }
            const entry = { moduleId, id: variant.id, name: variant.name, source };
            assignedSources.set(source, entry);
            approved.push(entry);
        });
    });
    return { approved, duplicates };
};

window.MODEL_ASSETS = MODEL_ASSETS;
window.getModelVariants = function getModelVariants(moduleId) {
    const variants = MODEL_ASSETS[moduleId];
    if (!Array.isArray(variants)) return [];
    const audit = window.getAssetLibraryAudit();
    const duplicateIds = new Set(audit.duplicates.map(item => item.duplicate.id));
    return variants.filter(variant => window.isUsableModelAsset(variant) && !duplicateIds.has(variant.id));
};
