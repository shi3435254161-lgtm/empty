// 橱柜模块定义
// mountType: floor=地上, wall=墙上, counter=台面上

const CABINET_MODULES = {
    // 地柜
    base: [
        {
            id: 'base-single',
            name: '单门地柜',
            width: 400,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseSingle
        },
        {
            id: 'base-double',
            name: '双门地柜',
            width: 600,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseDouble
        },
        {
            id: 'base-three',
            name: '三门地柜',
            width: 900,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseThree
        },
        {
            id: 'base-drawer',
            name: '抽屉地柜',
            width: 600,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseDrawer
        },
        {
            id: 'base-drawer-three',
            name: '三抽地柜',
            width: 900,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseDrawerThree
        },
        {
            id: 'base-sink',
            name: '水槽地柜',
            width: 800,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseSink
        },
        {
            id: 'base-corner-l',
            name: 'L型转角柜',
            width: 900,
            depth: 580,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseCornerL
        },
        {
            id: 'base-corner-u',
            name: 'U型转角柜',
            width: 900,
            depth: 900,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            drawPreview: drawBaseCornerU
        }
    ],
    // 吊柜
    wall: [
        {
            id: 'wall-single',
            name: '单门吊柜',
            width: 400,
            depth: 320,
            height: 600,
            mountType: 'wall',
            color: '#f5f5f5',
            drawPreview: drawWallSingle
        },
        {
            id: 'wall-double',
            name: '双门吊柜',
            width: 600,
            depth: 320,
            height: 600,
            mountType: 'wall',
            color: '#f5f5f5',
            drawPreview: drawWallDouble
        },
        {
            id: 'wall-three',
            name: '三门吊柜',
            width: 900,
            depth: 320,
            height: 600,
            mountType: 'wall',
            color: '#f5f5f5',
            drawPreview: drawWallThree
        },
        {
            id: 'wall-open',
            name: '开放吊柜',
            width: 400,
            depth: 320,
            height: 400,
            mountType: 'wall',
            color: '#f5f5f5',
            drawPreview: drawWallOpen
        },
        {
            id: 'wall-microwave',
            name: '微波炉吊柜',
            width: 600,
            depth: 380,
            height: 400,
            mountType: 'wall',
            color: '#f5f5f5',
            drawPreview: drawWallMicrowave
        },
        {
            id: 'range-hood',
            name: '油烟机',
            width: 900,
            depth: 520,
            height: 500,
            mountType: 'wall',
            color: '#666666',
            drawPreview: drawRangeHood
        },
        {
            id: 'range-hood-side',
            name: '侧吸烟机',
            width: 900,
            depth: 480,
            height: 450,
            mountType: 'wall',
            color: '#666666',
            drawPreview: drawRangeHoodSide
        }
    ],
    // 电器（放在台面或地上）
    appliance: [
        {
            id: 'cooktop',
            name: '燃气灶',
            width: 700,
            depth: 400,
            height: 50,
            mountType: 'counter',
            color: '#333333',
            drawPreview: drawCooktop
        },
        {
            id: 'cooktop-induction',
            name: '电磁炉',
            width: 700,
            depth: 400,
            height: 50,
            mountType: 'counter',
            color: '#222222',
            drawPreview: drawCooktopInduction
        },
        {
            id: 'sink-single',
            name: '单槽',
            width: 600,
            depth: 450,
            height: 200,
            mountType: 'counter',
            color: '#c0c0c0',
            drawPreview: drawSinkSingle
        },
        {
            id: 'sink-double',
            name: '双槽',
            width: 800,
            depth: 450,
            height: 200,
            mountType: 'counter',
            color: '#c0c0c0',
            drawPreview: drawSinkDouble
        },
        {
            id: 'fridge',
            name: '冰箱',
            width: 600,
            depth: 600,
            height: 1700,
            mountType: 'floor',
            color: '#e0e0e0',
            drawPreview: drawFridge
        },
        {
            id: 'fridge-big',
            name: '双门冰箱',
            width: 900,
            depth: 650,
            height: 1750,
            mountType: 'floor',
            color: '#e0e0e0',
            drawPreview: drawFridgeBig
        },
        {
            id: 'dishwasher',
            name: '洗碗机',
            width: 600,
            depth: 580,
            height: 820,
            mountType: 'floor',
            color: '#e0e0e0',
            drawPreview: drawDishwasher
        },
        {
            id: 'oven',
            name: '烤箱',
            width: 600,
            depth: 550,
            height: 600,
            mountType: 'floor',
            color: '#333333',
            drawPreview: drawOven
        },
        {
            id: 'washer',
            name: '洗衣机',
            width: 600,
            depth: 550,
            height: 850,
            mountType: 'floor',
            color: '#e0e0e0',
            drawPreview: drawWasher
        }
    ],
    // 卫浴
    bath: [
        {
            id: 'bath-toilet-smart',
            name: '现代坐便器',
            width: 420,
            depth: 700,
            height: 760,
            mountType: 'floor',
            color: '#f7f7f4'
        },
        {
            id: 'bath-vanity',
            name: '浴室柜',
            width: 800,
            depth: 480,
            height: 850,
            mountType: 'floor',
            color: '#d8c0a0'
        },
        {
            id: 'bath-mirror-cabinet',
            name: '镜柜',
            width: 800,
            depth: 160,
            height: 700,
            mountType: 'wall',
            color: '#dfe5e5'
        },
        {
            id: 'bath-shower-set',
            name: '花洒套装',
            width: 320,
            depth: 180,
            height: 2100,
            mountType: 'wall',
            color: '#c6caca'
        },
        {
            id: 'bath-shower-room',
            name: '淋浴房',
            width: 900,
            depth: 900,
            height: 2000,
            mountType: 'floor',
            color: '#b8d0d6'
        },
        {
            id: 'bath-tub',
            name: '浴缸',
            width: 1600,
            depth: 750,
            height: 560,
            mountType: 'floor',
            color: '#f5f3ef'
        },
        {
            id: 'bath-tub-shower-combo',
            name: '浴缸淋浴组合',
            width: 1700,
            depth: 900,
            height: 2100,
            mountType: 'floor',
            color: '#f5f3ef'
        },
        {
            id: 'bath-towel-rack',
            name: '双层毛巾架（真实模型）',
            width: 620,
            depth: 100,
            height: 175,
            mountType: 'wall',
            color: '#c0c0c0'
        },
        {
            id: 'bath-floor-drain',
            name: '地漏',
            width: 120,
            depth: 120,
            height: 18,
            mountType: 'floor',
            color: '#b0b0b0'
        }
    ],
    // 台面
    countertop: [
        {
            id: 'countertop-quartz',
            name: '石英石台面',
            width: 600,
            depth: 580,
            height: 40,
            mountType: 'floor',
            color: '#d4a574',
            material: 'quartz',
            drawPreview: drawCountertopQuartz
        },
        {
            id: 'countertop-marble',
            name: '大理石台面',
            width: 600,
            depth: 580,
            height: 40,
            mountType: 'floor',
            color: '#e8e0d8',
            material: 'marble',
            drawPreview: drawCountertopMarble
        },
        {
            id: 'countertop-stainless',
            name: '不锈钢台面',
            width: 600,
            depth: 580,
            height: 40,
            mountType: 'floor',
            color: '#c0c0c0',
            material: 'stainless',
            drawPreview: drawCountertopStainless
        },
        {
            id: 'countertop-rock',
            name: '岩板台面',
            width: 600,
            depth: 580,
            height: 40,
            mountType: 'floor',
            color: '#a0a0a0',
            material: 'rock',
            drawPreview: drawCountertopRock
        }
    ],
    // 整体橱柜（L型/U型/岛台）
    full: [
        {
            id: 'l-shape',
            name: 'L型橱柜',
            width: 2400,
            depth: 1800,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            isShape: 'L',
            drawPreview: drawLShape
        },
        {
            id: 'u-shape',
            name: 'U型橱柜',
            width: 2400,
            depth: 2200,
            height: 720,
            mountType: 'floor',
            color: '#f5f5f5',
            isShape: 'U',
            drawPreview: drawUShape
        },
        {
            id: 'island',
            name: '岛台',
            width: 2000,
            depth: 900,
            height: 900,
            mountType: 'floor',
            color: '#f5f5f5',
            isShape: 'island',
            drawPreview: drawIsland
        },
        {
            id: 'island-sink',
            name: '岛台带水槽',
            width: 2400,
            depth: 1000,
            height: 900,
            mountType: 'floor',
            color: '#f5f5f5',
            isShape: 'island',
            drawPreview: drawIslandSink
        }
    ]
};

// 材质颜色库
const MATERIAL_COLORS = {
    // 柜体颜色
    cabinet: {
        '白色': '#f5f5f5',
        '米白': '#faf0e6',
        '浅灰': '#d3d3d3',
        '深灰': '#808080',
        '原木色': '#deb887',
        '胡桃木': '#8b6914',
        '樱桃木': '#a0522d',
        '橡木色': '#c8a882',
        '黑色': '#333333',
        '蓝色': '#4682b4',
        '绿色': '#6b8e23'
    },
    // 台面颜色
    countertop: {
        '白色石英石': '#f0f0f0',
        '米黄石英石': '#f5deb3',
        '灰色石英石': '#a9a9a9',
        '黑色石英石': '#404040',
        '大理石白': '#fafafa',
        '大理石灰': '#c0c0c0',
        '不锈钢原色': '#c8c8c8',
        '岩板灰': '#808080',
        '岩板黑': '#383838'
    }
};

const MODULE_APPEARANCE = {
    'base-single': {
        color: '#f4efe6',
        countertopColor: '#f0e6d0',
        accentColor: '#7f8a62',
        materialKind: 'painted',
        countertopMaterial: 'marble',
        doorCount: 1,
        handleStyle: 'right-bar',
        preview: 'door',
        description: '窄位收纳',
        finishName: '暖白烤漆'
    },
    'base-double': {
        color: '#d9c6aa',
        countertopColor: '#404040',
        accentColor: '#1f2421',
        materialKind: 'oak',
        countertopMaterial: 'quartz-dark',
        doorCount: 2,
        handleStyle: 'double-bar',
        preview: 'door',
        description: '常规双门',
        finishName: '橡木纹'
    },
    'base-three': {
        color: '#b8956a',
        countertopColor: '#f8f8f8',
        accentColor: '#5a3e2a',
        materialKind: 'ash',
        countertopMaterial: 'quartz',
        doorCount: 3,
        handleStyle: 'vertical-bars',
        preview: 'door',
        description: '长排储物',
        finishName: '白蜡木'
    },
    'base-drawer': {
        color: '#6f7d83',
        countertopColor: '#d8d0c0',
        accentColor: '#c8a96b',
        materialKind: 'matte',
        countertopMaterial: 'stone',
        drawerCount: 3,
        handleStyle: 'rail',
        preview: 'drawers',
        description: '餐具抽屉',
        finishName: '雾灰哑光'
    },
    'base-drawer-three': {
        color: '#efe7d7',
        countertopColor: '#505050',
        accentColor: '#b28b55',
        materialKind: 'painted',
        countertopMaterial: 'quartz-dark',
        drawerCount: 3,
        doorCount: 3,
        handleStyle: 'knob-grid',
        preview: 'drawer-grid',
        description: '三联抽柜',
        finishName: '奶油白'
    },
    'base-sink': {
        color: '#8da596',
        countertopColor: '#f0f0f0',
        accentColor: '#3f6f67',
        materialKind: 'painted',
        countertopMaterial: 'quartz',
        doorCount: 2,
        hasSink: true,
        handleStyle: 'double-bar',
        preview: 'sink-base',
        description: '水槽收纳',
        finishName: '鼠尾草绿'
    },
    'base-corner-l': {
        color: '#9d8061',
        countertopColor: '#e8dcc8',
        accentColor: '#5b4636',
        materialKind: 'walnut',
        countertopMaterial: 'marble',
        preview: 'corner-l',
        description: '转角利用',
        finishName: '胡桃木'
    },
    'base-corner-u': {
        color: '#ccd6d9',
        countertopColor: '#c0b8a8',
        accentColor: '#69858d',
        materialKind: 'matte',
        countertopMaterial: 'stone',
        preview: 'corner-u',
        description: 'U 型转角',
        finishName: '浅雾蓝'
    },
    'wall-single': {
        color: '#f8f4ec',
        accentColor: '#61766a',
        materialKind: 'painted',
        doorCount: 1,
        glass: true,
        handleStyle: 'right-bar',
        preview: 'glass-door',
        description: '展示吊柜',
        finishName: '透光框门'
    },
    'wall-double': {
        color: '#d8c0a0',
        accentColor: '#6b513c',
        materialKind: 'oak',
        doorCount: 2,
        handleStyle: 'double-bar',
        preview: 'door',
        description: '双门吊柜',
        finishName: '浅橡木'
    },
    'wall-three': {
        color: '#566163',
        accentColor: '#c6a86c',
        materialKind: 'matte',
        doorCount: 3,
        handleStyle: 'vertical-bars',
        preview: 'door',
        description: '长排吊柜',
        finishName: '深灰哑光'
    },
    'wall-open': {
        color: '#d7b889',
        accentColor: '#6d5235',
        materialKind: 'oak',
        openShelves: 3,
        preview: 'open-shelf',
        description: '开放格',
        finishName: '木纹开放'
    },
    'wall-microwave': {
        color: '#e8dfd2',
        accentColor: '#343434',
        materialKind: 'painted',
        applianceFace: '#242628',
        openShelves: 1,
        preview: 'microwave',
        description: '嵌微波炉',
        finishName: '嵌入电器'
    },
    'range-hood': {
        color: '#45484a',
        accentColor: '#c2c7c5',
        materialKind: 'metal',
        applianceFace: '#202224',
        preview: 'hood-top',
        description: '顶吸烟机',
        finishName: '拉丝金属'
    },
    'range-hood-side': {
        color: '#353b3f',
        accentColor: '#9aa3a3',
        materialKind: 'metal',
        applianceFace: '#16191b',
        preview: 'hood-side',
        description: '侧吸烟机',
        finishName: '黑晶玻璃'
    },
    cooktop: {
        color: '#111315',
        accentColor: '#d3a452',
        materialKind: 'glass',
        preview: 'gas-cooktop',
        description: '燃气灶',
        finishName: '黑晶面板'
    },
    'cooktop-induction': {
        color: '#090b0d',
        accentColor: '#5aa0b5',
        materialKind: 'glass',
        preview: 'induction',
        description: '电磁灶',
        finishName: '触控黑晶'
    },
    'sink-single': {
        color: '#bfc6c6',
        accentColor: '#7b8586',
        materialKind: 'metal',
        preview: 'sink-single',
        description: '单槽',
        finishName: '不锈钢',
        // A standalone sink must sit inside a cabinet top. Keep the reviewed
        // imported asset as an explicit option instead of replacing this fit.
        preferParametric: true
    },
    'sink-double': {
        color: '#b7c1c3',
        accentColor: '#7b8586',
        materialKind: 'metal',
        preview: 'sink-double',
        description: '双槽',
        finishName: '不锈钢',
        preferParametric: true
    },
    fridge: {
        color: '#d9dee2',
        accentColor: '#8b9398',
        materialKind: 'metal',
        preview: 'fridge',
        description: '单开冰箱',
        finishName: '银灰金属'
    },
    'fridge-big': {
        color: '#cfd6d9',
        accentColor: '#737c80',
        materialKind: 'metal',
        preview: 'fridge-big',
        description: '双开冰箱',
        finishName: '十字双门'
    },
    dishwasher: {
        color: '#dfe4e4',
        accentColor: '#798284',
        materialKind: 'metal',
        preview: 'dishwasher',
        description: '洗碗机',
        finishName: '嵌入式'
    },
    oven: {
        color: '#202224',
        accentColor: '#b87b44',
        materialKind: 'glass',
        preview: 'oven',
        description: '嵌入烤箱',
        finishName: '黑玻璃'
    },
    washer: {
        color: '#e6eaeb',
        accentColor: '#7f9199',
        materialKind: 'metal',
        preview: 'washer',
        description: '洗衣机',
        finishName: '滚筒'
    },
    'bath-toilet-smart': {
        color: '#f7f7f4',
        accentColor: '#d7d0c4',
        materialKind: 'ceramic',
        preview: 'toilet',
        fixtureKind: 'toilet',
        description: '现代坐便',
        finishName: '釉面陶瓷'
    },
    'bath-vanity': {
        color: '#8da596',
        countertopColor: '#f4f1ea',
        accentColor: '#c7b89d',
        materialKind: 'painted',
        countertopMaterial: 'marble',
        preview: 'vanity',
        fixtureKind: 'vanity',
        doorCount: 2,
        drawerCount: 1,
        hasSink: true,
        description: '台盆收纳',
        finishName: '防潮柜体'
    },
    'bath-mirror-cabinet': {
        color: '#dfe5e5',
        accentColor: '#7b8d91',
        materialKind: 'mirror',
        preview: 'mirror',
        fixtureKind: 'mirror',
        glass: true,
        description: '镜面收纳',
        finishName: '银镜玻璃'
    },
    'bath-shower-set': {
        color: '#c6caca',
        accentColor: '#7f8585',
        materialKind: 'metal',
        preview: 'shower-set',
        fixtureKind: 'shower',
        description: '顶喷+手持',
        finishName: '镀铬金属'
    },
    'bath-shower-room': {
        color: '#b8d0d6',
        accentColor: '#6c8e96',
        materialKind: 'glass',
        preview: 'shower-room',
        fixtureKind: 'shower-room',
        description: '玻璃隔断',
        finishName: '透明钢化玻璃'
    },
    'bath-tub': {
        color: '#f5f3ef',
        accentColor: '#c8b896',
        materialKind: 'ceramic',
        preview: 'bathtub',
        fixtureKind: 'bathtub',
        description: '独立浴缸',
        finishName: '亚克力白'
    },
    'bath-tub-shower-combo': {
        color: '#f5f3ef',
        accentColor: '#8fb1ba',
        materialKind: 'ceramic',
        preview: 'bathtub',
        fixtureKind: 'bathtub',
        description: '浴缸+淋浴',
        finishName: '亚克力/镀铬'
    },
    'bath-towel-rack': {
        color: '#c0c0c0',
        accentColor: '#777f80',
        materialKind: 'metal',
        preview: 'towel-rack',
        fixtureKind: 'towel-rack',
        description: '壁挂五金',
        finishName: '拉丝金属'
    },
    'bath-floor-drain': {
        color: '#b0b0b0',
        accentColor: '#5f6962',
        materialKind: 'metal',
        preview: 'floor-drain',
        fixtureKind: 'floor-drain',
        description: '排水地漏',
        finishName: '防臭地漏'
    },
    'countertop-quartz': {
        color: '#e8e2d8',
        accentColor: '#c7b89d',
        materialKind: 'quartz',
        preview: 'slab-speckle',
        description: '耐污石英',
        finishName: '米白颗粒'
    },
    'countertop-marble': {
        color: '#f4f1ea',
        accentColor: '#b9b0a3',
        materialKind: 'marble',
        preview: 'slab-vein',
        description: '纹理台面',
        finishName: '云纹大理石'
    },
    'countertop-stainless': {
        color: '#b9c0c2',
        accentColor: '#758083',
        materialKind: 'metal',
        preview: 'slab-brushed',
        description: '商厨质感',
        finishName: '拉丝不锈钢'
    },
    'countertop-rock': {
        color: '#6f7472',
        accentColor: '#252827',
        materialKind: 'rock',
        preview: 'slab-rock',
        description: '岩板台面',
        finishName: '深灰岩板'
    },
    'l-shape': {
        color: '#d7b889',
        countertopColor: '#f0e6d0',
        accentColor: '#6b513c',
        materialKind: 'oak',
        countertopMaterial: 'marble',
        preview: 'corner-l',
        description: '一键 L 型',
        finishName: '橡木组合'
    },
    'u-shape': {
        color: '#e8dfd2',
        countertopColor: '#505050',
        accentColor: '#7f8a62',
        materialKind: 'painted',
        countertopMaterial: 'quartz-dark',
        preview: 'corner-u',
        description: '一键 U 型',
        finishName: '浅色组合'
    },
    island: {
        color: '#64716a',
        countertopColor: '#e8dcc8',
        accentColor: '#d6b16e',
        materialKind: 'matte',
        countertopMaterial: 'stone',
        preview: 'island',
        description: '中央岛台',
        finishName: '高级灰绿'
    },
    'island-sink': {
        color: '#8a6d57',
        countertopColor: '#f4f1ea',
        accentColor: '#5f4635',
        materialKind: 'walnut',
        countertopMaterial: 'marble',
        hasSink: true,
        preview: 'island-sink',
        description: '带水槽岛台',
        finishName: '胡桃木岛台'
    }
};

// The default presentation follows the bright, modern kitchen baseline used by
// current customer references: matte graphite bases, white uppers, and a quiet
// white worktop. Custom colours selected by a user remain untouched.
function getNeutralKitchenAppearance(module) {
    const id = String(module?.id || '');
    const isKitchenBase = id.startsWith('base-') || ['l-shape', 'u-shape', 'straight-line', 'galley-shape', 'l-shape-tall', 'island', 'island-sink'].includes(id);
    const isKitchenWall = id.startsWith('wall-');

    if (isKitchenBase) {
        return {
            color: '#444e54',
            countertopColor: '#f8f9f7',
            accentColor: '#151b1e',
            materialKind: 'matte',
            doorStyle: 'slab',
            handleStyle: 'gola',
            finishName: '石墨灰哑光'
        };
    }

    if (isKitchenWall) {
        return {
            color: '#f7f8f7',
            accentColor: '#d9dfe0',
            materialKind: 'painted',
            glass: false,
            doorStyle: 'slab',
            handleStyle: 'gola',
            finishName: '亮白平板门'
        };
    }

    if (id === 'bath-vanity') {
        return {
            color: '#eef1f0',
            countertopColor: '#fafbf9',
            accentColor: '#20272a',
            materialKind: 'matte',
            doorStyle: 'slab',
            handleStyle: 'gola',
            finishName: '雾白防潮柜体'
        };
    }

    return {};
}

let additionalModulesRegistered = false;

function addCabinetModules(category, modules) {
    if (!CABINET_MODULES[category]) CABINET_MODULES[category] = [];
    const bucket = CABINET_MODULES[category];
    const existing = new Set(bucket.map(module => module.id));
    modules.forEach(module => {
        if (!existing.has(module.id)) {
            bucket.push(module);
            existing.add(module.id);
        }
    });
}

function registerAdditionalModules() {
    if (additionalModulesRegistered) return;
    additionalModulesRegistered = true;

    addCabinetModules('base', [
        { id: 'base-tall-pantry', name: '高柜/食品柜', width: 600, depth: 600, height: 2200, mountType: 'floor', color: '#e8dfd2', preview: 'door', doorCount: 2, description: '高收纳', finishName: '哑光米白' },
        { id: 'base-pull-out', name: '窄拉篮柜', width: 300, depth: 580, height: 720, mountType: 'floor', color: '#d9c6aa', preview: 'drawers', drawerCount: 3, description: '调味拉篮', finishName: '浅橡木' },
        { id: 'base-trash-sorter', name: '垃圾分类柜', width: 450, depth: 580, height: 720, mountType: 'floor', color: '#6f7d83', preview: 'drawers', drawerCount: 2, description: '隐藏垃圾桶', finishName: '雾灰哑光' },
        { id: 'base-magic-corner', name: '转角拉篮柜', width: 900, depth: 900, height: 720, mountType: 'floor', color: '#9d8061', preview: 'corner-l', description: '五金转角', finishName: '胡桃木' },
        { id: 'base-open-shelf', name: '开放地柜', width: 600, depth: 580, height: 720, mountType: 'floor', color: '#d7b889', preview: 'open-shelf', openShelves: 3, description: '开放收纳', finishName: '木纹开放' },
        { id: 'base-wine-rack', name: '红酒格柜', width: 600, depth: 580, height: 720, mountType: 'floor', color: '#8a6d57', preview: 'open-shelf', openShelves: 4, description: '酒格展示', finishName: '深胡桃' }
    ]);

    addCabinetModules('wall', [
        { id: 'wall-glass-lift', name: '上翻玻璃吊柜', width: 800, depth: 330, height: 420, mountType: 'wall', color: '#dfe5e5', preview: 'glass-door', glass: true, description: '上翻门', finishName: '窄框玻璃' },
        { id: 'wall-spice-rack', name: '调味开放架', width: 450, depth: 180, height: 420, mountType: 'wall', color: '#d7b889', preview: 'open-shelf', openShelves: 3, description: '墙面调味', finishName: '原木开放' },
        { id: 'wall-dish-rack', name: '沥水吊柜', width: 800, depth: 340, height: 600, mountType: 'wall', color: '#e8dfd2', preview: 'open-shelf', openShelves: 2, description: '沥水收纳', finishName: '米白烤漆' },
        { id: 'wall-corner', name: '转角吊柜', width: 650, depth: 650, height: 700, mountType: 'wall', color: '#ccd6d9', preview: 'corner-l', description: '吊柜转角', finishName: '浅雾蓝' }
    ]);

    addCabinetModules('appliance', [
        { id: 'fridge-french-door-real', name: '法式多门冰箱（真实模型）', width: 860, depth: 680, height: 1820, mountType: 'floor', color: '#1e2225', preview: 'fridge-big', fridgeStyle: 'french-door', description: '四门制冰', finishName: '黑钛烤漆', modelStatus: 'real' },
        { id: 'fridge-french-door', name: '法式多门冰箱（参数化）', width: 860, depth: 680, height: 1820, mountType: 'floor', color: '#d8dde0', preview: 'fridge-big', fridgeStyle: 'french-door', description: '四门底置冷冻', finishName: '银灰金属', modelStatus: 'parametric' },
        { id: 'fridge-side-by-side', name: '对开门制冰冰箱（参数化）', width: 920, depth: 700, height: 1780, mountType: 'floor', color: '#2e3438', preview: 'fridge-big', fridgeStyle: 'side-by-side', description: '深灰对开门', finishName: '石墨金属', modelStatus: 'parametric' },
        { id: 'fridge-retro', name: '复古窄体冰箱（参数化）', width: 560, depth: 620, height: 1660, mountType: 'floor', color: '#dce5df', preview: 'fridge', fridgeStyle: 'retro', description: '小户型独立式', finishName: '雾绿烤漆', modelStatus: 'parametric' },
        { id: 'oven-built-in-real', name: '嵌入式烤箱（真实模型）', width: 600, depth: 550, height: 600, mountType: 'floor', color: '#202224', preview: 'oven', description: '黑玻璃嵌入烤箱', finishName: '黑晶玻璃/拉丝金属', modelStatus: 'real' },
        { id: 'oven-bosch-real', name: 'Bosch 嵌入式烤箱（真实模型）', width: 600, depth: 550, height: 600, mountType: 'floor', color: '#e3e5e5', preview: 'oven', description: '触控银灰嵌入烤箱', finishName: '银灰金属/黑晶玻璃', modelStatus: 'real' },
        { id: 'dishwasher-compact-real', name: '紧凑洗碗机（真实模型）', width: 450, depth: 550, height: 820, mountType: 'floor', color: '#303438', preview: 'dishwasher', description: '拉丝金属窄体洗碗机', finishName: '深灰拉丝金属', modelStatus: 'real' },
        { id: 'steam-oven', name: '蒸烤一体机', width: 600, depth: 550, height: 455, mountType: 'floor', color: '#26282a', preview: 'oven', description: '嵌入电器', finishName: '黑晶玻璃' },
        { id: 'sterilizer', name: '消毒柜', width: 600, depth: 520, height: 620, mountType: 'floor', color: '#dfe4e4', preview: 'dishwasher', description: '餐具消毒', finishName: '银灰嵌入' },
        { id: 'counter-microwave', name: '台面微波炉', width: 520, depth: 390, height: 310, mountType: 'counter', color: '#25282a', preview: 'microwave', description: '台面电器', finishName: '黑玻璃' },
        { id: 'coffee-machine', name: '嵌入咖啡机', width: 600, depth: 450, height: 455, mountType: 'wall', color: '#1f2421', preview: 'oven', description: '高柜电器', finishName: '黑钢面板' },
        { id: 'washer-dryer', name: '洗烘套装', width: 600, depth: 650, height: 1700, mountType: 'floor', color: '#dfe4e4', preview: 'washer', description: '叠放洗烘', finishName: '白色金属' },
        { id: 'water-heater', name: '燃气热水器', width: 360, depth: 180, height: 560, mountType: 'wall', color: '#f2f2ec', preview: 'water-heater', description: '墙挂设备', finishName: '白色金属', fixtureKind: 'water-heater' },
        { id: 'water-heater-rinnai', name: '恒温燃气热水器（参数化）', width: 380, depth: 185, height: 590, mountType: 'wall', color: '#f7f8f8', preview: 'water-heater', description: '恒温热水', finishName: '亮白金属', fixtureKind: 'water-heater' },
        { id: 'water-heater-noritz', name: '静音燃气热水器（参数化）', width: 390, depth: 190, height: 600, mountType: 'wall', color: '#edf2f4', preview: 'water-heater', description: '低噪恒温', finishName: '银白面板', fixtureKind: 'water-heater' },
        { id: 'water-heater-slim', name: '超薄热水器', width: 330, depth: 145, height: 540, mountType: 'wall', color: '#ffffff', preview: 'water-heater', description: '小户型薄款', finishName: '珍珠白', fixtureKind: 'water-heater' },
        { id: 'range-hood-fotile', name: '侧吸烟机（参数化）', width: 900, depth: 455, height: 480, mountType: 'wall', color: '#232629', preview: 'hood-side', description: '近吸排烟', finishName: '黑晶玻璃', modelStatus: 'parametric' },
        { id: 'range-hood-robam', name: '顶吸烟机（参数化）', width: 895, depth: 510, height: 520, mountType: 'wall', color: '#34383b', preview: 'hood-top', description: '大吸力顶吸', finishName: '深灰金属', modelStatus: 'parametric' },
        { id: 'range-hood-integrated', name: '集成灶烟机', width: 900, depth: 600, height: 1250, mountType: 'floor', color: '#202326', preview: 'hood-side', description: '集成烹饪', finishName: '黑钢组合' },
        { id: 'cooktop-premium', name: '嵌入式双眼燃气灶（参数化）', width: 760, depth: 450, height: 55, mountType: 'counter', color: '#08090a', preview: 'gas-cooktop', description: '双眼燃气灶', finishName: '黑晶钢化玻璃', modelStatus: 'parametric' },
        { id: 'cooktop-five-burner', name: '五眼燃气灶', width: 860, depth: 520, height: 60, mountType: 'counter', color: '#0d0f10', preview: 'gas-cooktop', description: '多头烹饪', finishName: '黑晶面板' },
        { id: 'cooktop-domino', name: '模块化灶具', width: 360, depth: 520, height: 52, mountType: 'counter', color: '#101214', preview: 'induction', description: '窄版拼接', finishName: '多米诺模块' },
        { id: 'water-heater-electric', name: '储水式电热水器', width: 760, depth: 360, height: 420, mountType: 'wall', color: '#f7f8fa', preview: 'water-heater', fixtureKind: 'water-heater', heaterStyle: 'tank', description: '横置储水', finishName: '亮白搪瓷' },
        { id: 'water-heater-flat', name: '超薄双胆热水器', width: 720, depth: 260, height: 480, mountType: 'wall', color: '#e9f0f2', preview: 'water-heater', fixtureKind: 'water-heater', heaterStyle: 'flat', description: '扁桶双胆', finishName: '冰川银' },
        { id: 'water-heater-midea', name: '智能燃气热水器（参数化）', width: 380, depth: 170, height: 570, mountType: 'wall', color: '#f4f8fb', preview: 'water-heater', fixtureKind: 'water-heater', description: '零冷水恒温', finishName: '月光白', modelStatus: 'parametric' },
        { id: 'water-heater-haier', name: '浅银燃气热水器（参数化）', width: 370, depth: 165, height: 565, mountType: 'wall', color: '#e8f1f4', preview: 'water-heater', fixtureKind: 'water-heater', description: '智能恒温', finishName: '浅银金属', modelStatus: 'parametric' },
        { id: 'water-heater-copper', name: '铜色复古热水器', width: 390, depth: 190, height: 600, mountType: 'wall', color: '#9b6846', preview: 'water-heater', fixtureKind: 'water-heater', description: '复古定制', finishName: '拉丝古铜' },
        { id: 'range-hood-vatti', name: '超薄侧吸烟机（参数化）', width: 900, depth: 360, height: 420, mountType: 'wall', color: '#1d2225', preview: 'hood-side', hoodStyle: 'slim', description: '超薄近吸', finishName: '曜石黑', modelStatus: 'parametric' },
        { id: 'range-hood-midea', name: '手势控制烟机（参数化）', width: 895, depth: 430, height: 460, mountType: 'wall', color: '#353b3e', preview: 'hood-side', description: '挥手智控', finishName: '深空灰', modelStatus: 'parametric' },
        { id: 'range-hood-siemens', name: '欧式顶吸烟机（参数化）', width: 900, depth: 500, height: 760, mountType: 'wall', color: '#c6ccce', preview: 'hood-top', hoodStyle: 'chimney', description: '欧式塔形', finishName: '拉丝银', modelStatus: 'parametric' },
        { id: 'range-hood-island', name: '岛式吊顶烟机', width: 1000, depth: 650, height: 850, mountType: 'wall', color: '#bfc6c8', preview: 'hood-top', hoodStyle: 'island', description: '中岛烹饪', finishName: '不锈钢' },
        { id: 'range-hood-downdraft', name: '升降下吸烟机', width: 900, depth: 140, height: 620, mountType: 'counter', color: '#25292b', preview: 'hood-side', hoodStyle: 'downdraft', description: '台面升降', finishName: '黑钛玻璃' },
        { id: 'cooktop-robam', name: '三眼燃气灶（参数化）', width: 860, depth: 500, height: 58, mountType: 'counter', color: '#111315', preview: 'gas-cooktop', burnerCount: 3, description: '三眼猛火', finishName: '黑晶玻璃', modelStatus: 'parametric' },
        { id: 'cooktop-vatti', name: '聚能燃气灶（参数化）', width: 780, depth: 460, height: 55, mountType: 'counter', color: '#141719', preview: 'gas-cooktop', burnerCount: 2, description: '聚能燃烧', finishName: '黑钛玻璃', modelStatus: 'parametric' },
        { id: 'cooktop-siemens-induction', name: '四区电磁灶（参数化）', width: 800, depth: 520, height: 48, mountType: 'counter', color: '#090b0d', preview: 'induction', burnerCount: 4, description: '四区联动', finishName: '黑晶面板', modelStatus: 'parametric' },
        { id: 'cooktop-white-induction', name: '白色双区电磁灶', width: 600, depth: 420, height: 45, mountType: 'counter', color: '#eef1f2', preview: 'induction', burnerCount: 2, description: '小户型双区', finishName: '雪瓷白' }
    ]);

    addCabinetModules('bath', [
        { id: 'bath-counter-basin', name: '台上盆', width: 620, depth: 480, height: 220, mountType: 'counter', color: '#f5f3ef', preview: 'vanity', description: '台盆组件', finishName: '陶瓷白' },
        { id: 'bath-pedestal-basin', name: '立柱盆', width: 520, depth: 480, height: 820, mountType: 'floor', color: '#f7f7f4', preview: 'vanity', description: '紧凑台盆', finishName: '陶瓷白' },
        { id: 'bath-faucet', name: '抽拉龙头', width: 180, depth: 160, height: 420, mountType: 'counter', color: '#c0c0c0', preview: 'shower-set', description: '台盆/水槽龙头', finishName: '拉丝金属' },
        { id: 'bath-glass-partition', name: '玻璃隔断', width: 900, depth: 80, height: 2000, mountType: 'floor', color: '#b8d0d6', preview: 'shower-room', description: '干湿分离', finishName: '超白玻璃' },
        { id: 'bath-wall-niche', name: '壁龛', width: 600, depth: 140, height: 400, mountType: 'wall', color: '#d8d0c0', preview: 'open-shelf', openShelves: 2, description: '墙体收纳', finishName: '暖瓷砖' },
        { id: 'bath-heated-rack', name: '电热毛巾架', width: 600, depth: 110, height: 900, mountType: 'wall', color: '#c0c0c0', preview: 'towel-rack', description: '加热烘干', finishName: '金属银' },
        { id: 'bath-towel-shelf', name: '带置物架毛巾杆（真实模型）', width: 620, depth: 320, height: 300, mountType: 'wall', color: '#c2c6c6', preview: 'towel-rack', fixtureKind: 'towel-rack', description: '置物收纳五金', finishName: '拉丝不锈钢', modelStatus: 'real' },
        { id: 'bath-tall-storage', name: '浴室高柜', width: 420, depth: 380, height: 1800, mountType: 'floor', color: '#d9c6aa', preview: 'door', doorCount: 1, description: '卫浴收纳', finishName: '浅橡木' },
        { id: 'bath-toilet-toto', name: '智能马桶（参数化）', width: 430, depth: 720, height: 760, mountType: 'floor', color: '#fbfbf7', preview: 'toilet', fixtureKind: 'toilet', description: '智能一体', finishName: '亮白陶瓷', modelStatus: 'parametric' },
        { id: 'bath-toilet-kohler', name: '连体马桶（参数化）', width: 450, depth: 710, height: 790, mountType: 'floor', color: '#f7f7f4', preview: 'toilet', fixtureKind: 'toilet', description: '连体虹吸', finishName: '釉面陶瓷', modelStatus: 'parametric' },
        { id: 'bath-toilet-jomoo', name: '即热智能马桶（参数化）', width: 430, depth: 700, height: 760, mountType: 'floor', color: '#f9faf8', preview: 'toilet', fixtureKind: 'toilet', description: '即热智能', finishName: '抗菌陶瓷', modelStatus: 'parametric' },
        { id: 'bath-vanity-kohler', name: '亮白岩板浴室柜（参数化）', width: 900, depth: 500, height: 850, mountType: 'floor', color: '#edf1f2', countertopColor: '#ffffff', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 2, hasSink: true, description: '镜柜台盆', finishName: '亮白岩板', modelStatus: 'parametric' },
        { id: 'bath-vanity-jomoo', name: '浅橡木浴室柜（参数化）', width: 800, depth: 480, height: 850, mountType: 'floor', color: '#d7b889', countertopColor: '#f7f8f8', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 1, hasSink: true, description: '木纹收纳', finishName: '浅橡木', modelStatus: 'parametric' },
        { id: 'bath-vanity-floating', name: '悬浮浴室柜', width: 900, depth: 480, height: 520, mountType: 'wall', color: '#f5f7f8', countertopColor: '#ffffff', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 2, hasSink: true, description: '墙排悬浮', finishName: '亮白无拉手' },
        { id: 'bath-vanity-double', name: '双盆浴室柜', width: 1400, depth: 520, height: 850, mountType: 'floor', color: '#cfd8dc', countertopColor: '#ffffff', preview: 'vanity', fixtureKind: 'vanity', doorCount: 4, drawerCount: 2, hasSink: true, description: '双人台盆', finishName: '浅灰岩板' },
        { id: 'bath-toilet-wall-hung', name: '壁挂悬浮马桶', width: 380, depth: 560, height: 420, mountType: 'wall', color: '#fafbf9', preview: 'toilet', fixtureKind: 'toilet', description: '隐藏水箱', finishName: '亮白釉面' },
        { id: 'bath-toilet-tankless', name: '无水箱智能马桶', width: 420, depth: 690, height: 500, mountType: 'floor', color: '#f9faf8', preview: 'toilet', fixtureKind: 'toilet', description: '即热一体', finishName: '珍珠白' },
        { id: 'bath-toilet-compact', name: '小户型短款马桶', width: 390, depth: 620, height: 700, mountType: 'floor', color: '#f7f8f5', preview: 'toilet', fixtureKind: 'toilet', description: '短距省空间', finishName: '陶瓷白' },
        { id: 'bath-toilet-matte-black', name: '哑黑定制马桶', width: 420, depth: 680, height: 520, mountType: 'floor', color: '#282b2c', preview: 'toilet', fixtureKind: 'toilet', description: '暗色定制', finishName: '哑光黑陶' },
        { id: 'bath-vanity-walnut', name: '胡桃木悬浮浴室柜', width: 1000, depth: 500, height: 560, mountType: 'wall', color: '#74513b', countertopColor: '#f7f7f5', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 2, hasSink: true, description: '木纹悬浮', finishName: '胡桃木+白岩板' },
        { id: 'bath-vanity-curve', name: '弧形一体盆浴室柜', width: 900, depth: 520, height: 780, mountType: 'floor', color: '#e8edef', countertopColor: '#ffffff', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 1, hasSink: true, description: '圆角一体盆', finishName: '雾灰烤漆' },
        { id: 'bath-vanity-narrow', name: '窄深小户型浴室柜', width: 600, depth: 380, height: 720, mountType: 'wall', color: '#f1f3f2', countertopColor: '#ffffff', preview: 'vanity', fixtureKind: 'vanity', doorCount: 1, drawerCount: 1, hasSink: true, description: '窄深省空间', finishName: '亮白肤感' },
        { id: 'bath-vanity-hotel', name: '酒店双抽浴室柜', width: 1200, depth: 520, height: 620, mountType: 'wall', color: '#a88e72', countertopColor: '#ecebe7', preview: 'vanity', fixtureKind: 'vanity', doorCount: 2, drawerCount: 2, hasSink: true, description: '酒店式陈列', finishName: '烟熏橡木' }
    ]);

    addCabinetModules('decor', [
        { id: 'decor-plant-tall', name: '高绿植盆栽', width: 420, depth: 420, height: 1500, mountType: 'floor', color: '#4f7f58', preview: 'plant', fixtureKind: 'plant', description: '提升现场感', finishName: '陶盆绿植' },
        { id: 'decor-plant-counter', name: '台面小花盆', width: 220, depth: 220, height: 360, mountType: 'counter', color: '#6f9b65', preview: 'plant', fixtureKind: 'plant', description: '台面点缀', finishName: '白陶盆' },
        { id: 'decor-makeup-mirror', name: '金色台式美容镜（真实模型）', width: 360, depth: 160, height: 460, mountType: 'counter', color: '#b89545', preview: 'mirror', fixtureKind: 'makeup-mirror', description: '台面化妆软装', finishName: '拉丝金属/银镜', modelStatus: 'real' },
        { id: 'decor-window-wide', name: '采光窗', width: 1200, depth: 90, height: 1100, mountType: 'wall', color: '#dcecff', preview: 'window', fixtureKind: 'window', description: '补充自然光', finishName: '断桥铝窗' },
        { id: 'decor-curtain-sheer', name: '白纱窗帘', width: 1300, depth: 80, height: 2100, mountType: 'wall', color: '#f6f7f6', preview: 'curtain', fixtureKind: 'curtain', description: '柔化光线', finishName: '透光白纱' },
        { id: 'decor-curtain-double', name: '双层窗帘', width: 1500, depth: 120, height: 2200, mountType: 'wall', color: '#d9d2c8', preview: 'curtain', fixtureKind: 'curtain', description: '布帘+纱帘', finishName: '亚麻米灰' },
        { id: 'decor-wall-art', name: '装饰挂画', width: 650, depth: 40, height: 520, mountType: 'wall', color: '#f4efe6', preview: 'wall-art', fixtureKind: 'wall-art', description: '墙面软装', finishName: '浅木框' },
        { id: 'decor-bath-mat', name: '浴室地垫', width: 720, depth: 460, height: 18, mountType: 'floor', color: '#d8e0e2', preview: 'mat', fixtureKind: 'mat', description: '脚感软装', finishName: '浅灰织物' },
        { id: 'decor-towel-basket', name: '带盖藤编收纳篮（CC0 实物）', width: 360, depth: 300, height: 420, mountType: 'floor', color: '#b8956b', preview: 'basket', fixtureKind: 'basket', description: '卫浴毛巾收纳', finishName: '天然藤编', modelStatus: 'real' },
        { id: 'decor-plant-areca', name: 'CC0 散尾葵盆栽', width: 620, depth: 620, height: 1650, mountType: 'floor', color: '#3d7650', preview: 'plant', fixtureKind: 'plant', description: 'Poly Haven 实景模型', finishName: '绿植+陶盆' },
        { id: 'decor-plant-fiddle', name: 'CC0 琴叶榕盆栽', width: 560, depth: 560, height: 1450, mountType: 'floor', color: '#477a4d', preview: 'plant', fixtureKind: 'plant', description: 'Poly Haven 实景模型', finishName: '阔叶绿植' },
        { id: 'decor-plant-succulent', name: 'CC0 多肉盆栽', width: 300, depth: 300, height: 340, mountType: 'counter', color: '#66946e', preview: 'plant', fixtureKind: 'plant', description: 'Poly Haven 实景模型', finishName: '多肉陶盆' },
        { id: 'decor-plant-small', name: 'CC0 台面绿植', width: 280, depth: 280, height: 480, mountType: 'counter', color: '#54835b', preview: 'plant', fixtureKind: 'plant', description: 'Poly Haven 实景模型', finishName: '小型盆栽' },
        { id: 'decor-basket-round', name: 'CC0 圆藤编篮', width: 430, depth: 430, height: 390, mountType: 'floor', color: '#a77d50', preview: 'basket', fixtureKind: 'basket', description: 'Poly Haven 实景模型', finishName: '天然藤编' },
        { id: 'decor-basket-handled', name: 'CC0 提手藤篮', width: 480, depth: 360, height: 520, mountType: 'floor', color: '#9c744b', preview: 'basket', fixtureKind: 'basket', description: 'Poly Haven 实景模型', finishName: '提手藤编' },
        { id: 'decor-frame-hanging-01', name: 'CC0 竖幅挂画', width: 520, depth: 45, height: 760, mountType: 'wall', color: '#79634d', preview: 'wall-art', fixtureKind: 'wall-art', description: 'Poly Haven 实景模型', finishName: '深木画框' },
        { id: 'decor-frame-hanging-02', name: 'CC0 横幅挂画', width: 820, depth: 45, height: 520, mountType: 'wall', color: '#b49168', preview: 'wall-art', fixtureKind: 'wall-art', description: 'Poly Haven 实景模型', finishName: '浅木画框' },
        { id: 'decor-frame-standing', name: 'CC0 台面相框', width: 260, depth: 120, height: 360, mountType: 'counter', color: '#c1a278', preview: 'wall-art', fixtureKind: 'wall-art', description: 'Poly Haven 实景模型', finishName: '桌面摆件' },
        { id: 'decor-vase-ceramic-01', name: 'CC0 现代陶瓷花瓶', width: 260, depth: 260, height: 520, mountType: 'counter', color: '#e4e6e3', preview: 'plant', fixtureKind: 'vase', description: 'Poly Haven 实景模型', finishName: '哑光陶瓷' },
        { id: 'decor-vase-ceramic-02', name: 'CC0 彩绘陶瓷花瓶', width: 300, depth: 300, height: 480, mountType: 'counter', color: '#6f8b9c', preview: 'plant', fixtureKind: 'vase', description: 'Poly Haven 实景模型', finishName: '彩绘陶瓷' },
        { id: 'decor-vase-ceramic-03', name: 'CC0 陶瓷花瓶 III', width: 240, depth: 240, height: 420, mountType: 'counter', color: '#d9ddd7', preview: 'plant', fixtureKind: 'vase', description: 'Poly Haven 实景模型', finishName: '素白陶瓷' },
        { id: 'decor-vase-ceramic-04', name: 'CC0 陶瓷花瓶 IV', width: 260, depth: 260, height: 460, mountType: 'counter', color: '#c8d3d0', preview: 'plant', fixtureKind: 'vase', description: 'Poly Haven 实景模型', finishName: '青灰陶瓷' },
        { id: 'decor-vase-antique', name: 'CC0 古典陶瓷花瓶', width: 320, depth: 320, height: 620, mountType: 'counter', color: '#b6946c', preview: 'plant', fixtureKind: 'vase', description: 'Poly Haven 实景模型', finishName: '古典釉彩' },
        { id: 'decor-ceiling-lamp-modern', name: 'CC0 现代吸顶灯', width: 620, depth: 620, height: 180, mountType: 'wall', color: '#f2f1e9', preview: 'wall-art', fixtureKind: 'light', description: 'Poly Haven 实景模型', finishName: '白色灯罩' },
        { id: 'decor-cutting-board', name: 'CC0 实木砧板', width: 420, depth: 260, height: 35, mountType: 'counter', color: '#9c6d43', preview: 'slab-brushed', fixtureKind: 'kitchen-prop', description: 'Poly Haven 厨房摆件', finishName: '实木切板' },
        { id: 'decor-planter-box-01', name: 'CC0 长条花箱', width: 900, depth: 300, height: 500, mountType: 'floor', color: '#5f815f', preview: 'plant', fixtureKind: 'plant', description: 'Poly Haven 实景模型', finishName: '绿植花箱' },
        { id: 'decor-tea-set', name: 'CC0 茶具套装', width: 520, depth: 360, height: 240, mountType: 'counter', color: '#e9e6dc', preview: 'plant', fixtureKind: 'kitchen-prop', description: 'Poly Haven 实景模型', finishName: '陶瓷茶具' },
        { id: 'decor-window-narrow', name: '窄幅通风窗', width: 680, depth: 90, height: 1200, mountType: 'wall', color: '#e5f1f7', preview: 'window', fixtureKind: 'window', description: '小窗采光', finishName: '银色窗框' },
        { id: 'decor-window-corner', name: '转角观景窗', width: 1600, depth: 110, height: 1250, mountType: 'wall', color: '#dcecf4', preview: 'window', fixtureKind: 'window', description: '转角大采光', finishName: '极窄黑框' },
        { id: 'decor-window-frosted', name: '卫浴磨砂窗', width: 900, depth: 90, height: 900, mountType: 'wall', color: '#cddfe3', preview: 'window', fixtureKind: 'window', description: '隐私采光', finishName: '超白磨砂' },
        { id: 'decor-curtain-roller', name: '防水卷帘', width: 1000, depth: 70, height: 1400, mountType: 'wall', color: '#e7eaeb', preview: 'curtain', fixtureKind: 'curtain', description: '厨卫防水', finishName: '浅灰卷帘' },
        { id: 'decor-curtain-linen', name: '亚麻落地帘', width: 1600, depth: 120, height: 2300, mountType: 'wall', color: '#b8aea0', preview: 'curtain', fixtureKind: 'curtain', description: '柔和遮光', finishName: '灰米亚麻' },
        { id: 'decor-kitchen-mat', name: '厨房长条地垫', width: 1500, depth: 520, height: 18, mountType: 'floor', color: '#657478', preview: 'mat', fixtureKind: 'mat', description: '操作区防滑', finishName: '灰蓝织物' },
        { id: 'decor-round-rug', name: '圆形软装地毯', width: 1200, depth: 1200, height: 20, mountType: 'floor', color: '#c7b69e', preview: 'mat', fixtureKind: 'mat', description: '洄游区软装', finishName: '短绒织物' },
        { id: 'decor-soap-dispenser', name: '洗手液瓶组', width: 180, depth: 120, height: 260, mountType: 'counter', color: '#dce6e3', preview: 'plant', fixtureKind: 'kitchen-prop', description: '台盆陈设', finishName: '磨砂玻璃' },
        { id: 'decor-towel-stack', name: '叠放毛巾组', width: 360, depth: 280, height: 220, mountType: 'counter', color: '#f1eee8', preview: 'basket', fixtureKind: 'kitchen-prop', description: '浴室陈设', finishName: '纯棉织物' },
        { id: 'decor-toothbrush-cup', name: '牙刷杯套装', width: 220, depth: 130, height: 240, mountType: 'counter', color: '#cddde2', preview: 'plant', fixtureKind: 'kitchen-prop', description: '洗漱陈设', finishName: '陶瓷浅蓝' },
        { id: 'decor-fruit-bowl', name: '台面水果碗', width: 380, depth: 380, height: 190, mountType: 'counter', color: '#d2a14f', preview: 'plant', fixtureKind: 'kitchen-prop', description: '厨房陈设', finishName: '陶碗果盘' },
        { id: 'decor-knife-block', name: '实木刀具架', width: 260, depth: 180, height: 340, mountType: 'counter', color: '#9b6b43', preview: 'slab-brushed', fixtureKind: 'kitchen-prop', description: '备餐区陈设', finishName: '深色实木' },
        { id: 'decor-spice-jars', name: '调味罐组合', width: 460, depth: 140, height: 210, mountType: 'counter', color: '#e5e0d5', preview: 'plant', fixtureKind: 'kitchen-prop', description: '烹饪区陈设', finishName: '陶瓷木盖' },
        { id: 'decor-wall-clock', name: '简约墙钟', width: 520, depth: 55, height: 520, mountType: 'wall', color: '#e9ece9', preview: 'wall-art', fixtureKind: 'wall-art', description: '墙面陈设', finishName: '白面黑针' },
        { id: 'decor-pendant-lamp', name: '中岛吊灯', width: 420, depth: 420, height: 520, mountType: 'wall', color: '#d7c291', preview: 'wall-art', fixtureKind: 'light', description: '中岛照明', finishName: '黄铜玻璃' },
        { id: 'decor-wall-sconce', name: '卫浴壁灯', width: 220, depth: 180, height: 360, mountType: 'wall', color: '#d8d2c0', preview: 'wall-art', fixtureKind: 'light', description: '镜前辅助光', finishName: '磨砂黄铜' },
        { id: 'decor-round-mirror', name: '圆形装饰镜', width: 760, depth: 45, height: 760, mountType: 'wall', color: '#b9cbd0', preview: 'wall-art', fixtureKind: 'wall-art', description: '墙面扩容', finishName: '极窄金属框' },
        { id: 'decor-venetian-blind', name: '铝合金百叶帘', width: 1200, depth: 75, height: 1500, mountType: 'wall', color: '#e2e6e7', preview: 'curtain', fixtureKind: 'curtain', description: '厨卫控光', finishName: '雾银百叶' }
    ]);

    addCabinetModules('countertop', [
        { id: 'countertop-sintered-light', name: '浅色岩板', width: 600, depth: 580, height: 35, mountType: 'floor', color: '#d9d4c9', material: 'rock', preview: 'slab-rock', description: '大板纹理', finishName: '浅灰岩板' },
        { id: 'countertop-sintered-dark', name: '深色岩板', width: 600, depth: 580, height: 35, mountType: 'floor', color: '#303436', material: 'rock', preview: 'slab-rock', description: '耐磨台面', finishName: '深灰岩板' },
        { id: 'countertop-terrazzo', name: '水磨石台面', width: 600, depth: 580, height: 40, mountType: 'floor', color: '#d8d2c5', material: 'quartz', preview: 'slab-speckle', description: '颗粒质感', finishName: '浅色水磨石' },
        { id: 'countertop-butcher-block', name: '实木台面', width: 600, depth: 580, height: 45, mountType: 'floor', color: '#b88552', material: 'wood', preview: 'slab-brushed', description: '温润木作', finishName: '橡木拼板' }
    ]);

    addCabinetModules('full', [
        { id: 'straight-line', name: '一字型橱柜', width: 2800, depth: 650, height: 720, mountType: 'floor', color: '#e8dfd2', preview: 'door', doorCount: 4, description: '一字排布', finishName: '米白组合' },
        { id: 'galley-shape', name: '双排厨房', width: 2600, depth: 1800, height: 720, mountType: 'floor', color: '#ccd6d9', preview: 'corner-u', description: '双侧操作', finishName: '浅灰组合' },
        { id: 'l-shape-tall', name: 'L型带高柜', width: 2600, depth: 1900, height: 2200, mountType: 'floor', color: '#d7b889', preview: 'corner-l', description: '高柜组合', finishName: '橡木高柜' },
        { id: 'laundry-bath-combo', name: '洗衣卫浴组合', width: 2200, depth: 900, height: 1800, mountType: 'floor', color: '#e8dfd2', preview: 'vanity', description: '阳台/卫浴', finishName: '洗烘台盆组合' }
    ]);
}

function findCabinetModule(moduleId) {
    for (const category of Object.values(CABINET_MODULES)) {
        const module = category.find(item => item.id === moduleId);
        if (module) return module;
    }
    return null;
}

// A product label is not a model. Hide parameter-only clones until each has a
// distinct, reviewed 3D asset instead of presenting one mesh as many brands.
const CURATED_MODULE_EXCLUSIONS = new Set([
    'fridge', 'fridge-big', 'dishwasher', 'oven', 'washer',
    'steam-oven', 'sterilizer', 'counter-microwave', 'coffee-machine', 'washer-dryer',
    'water-heater-rinnai', 'water-heater-noritz', 'water-heater-slim',
    'water-heater-midea', 'water-heater-haier', 'water-heater-copper',
    'range-hood-fotile', 'range-hood-robam', 'range-hood-integrated',
    'range-hood-vatti', 'range-hood-midea', 'range-hood-siemens',
    'range-hood-island', 'range-hood-downdraft',
    'cooktop-premium', 'cooktop-five-burner', 'cooktop-domino',
    'cooktop-robam', 'cooktop-vatti', 'cooktop-siemens-induction', 'cooktop-white-induction',
    'bath-counter-basin', 'bath-pedestal-basin', 'bath-faucet',
    'bath-toilet-toto', 'bath-toilet-kohler', 'bath-toilet-jomoo',
    'bath-toilet-wall-hung', 'bath-toilet-tankless', 'bath-toilet-compact', 'bath-toilet-matte-black',
    'bath-vanity-kohler', 'bath-vanity-jomoo', 'bath-vanity-floating',
    'bath-vanity-double', 'bath-vanity-walnut', 'bath-vanity-curve',
    'bath-vanity-narrow', 'bath-vanity-hotel'
]);

function curateModuleLibrary() {
    Object.values(CABINET_MODULES).forEach(category => {
        for (let index = category.length - 1; index >= 0; index -= 1) {
            if (CURATED_MODULE_EXCLUSIONS.has(category[index].id)) category.splice(index, 1);
        }
    });
}

function enhanceCabinetModules() {
    registerAdditionalModules();
    curateModuleLibrary();
    Object.values(CABINET_MODULES).flat().forEach(module => {
        const appearance = {
            ...(MODULE_APPEARANCE[module.id] || {}),
            ...getNeutralKitchenAppearance(module)
        };
        Object.assign(module, appearance);
        module.color = appearance.color || module.color || '#f5f5f5';
        module.countertopColor = appearance.countertopColor || module.countertopColor || '#f0f0f0';
        module.accentColor = appearance.accentColor || module.accentColor || '#6f7d83';
        module.materialKind = appearance.materialKind || module.materialKind || 'painted';
        module.description = appearance.description || module.description || module.mountType;
        module.finishName = appearance.finishName || module.finishName || '标准饰面';
        // The editor's standard fixtures are dimensioned procedural components.
        // They must never be mistaken for a licensed brand model.
        module.modelStatus = module.modelStatus || 'parametric';
        module.drawPreview = (ctx, width, height, options = {}) => drawStyledModulePreview(ctx, width, height, module, options);
    });
}

function drawStyledModulePreview(ctx, width, height, module, options = {}) {
    const simplePlan = Boolean(options.simplePlan);
    const pad = 7;
    const x = pad;
    const y = pad;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const color = module.color || '#f5f5f5';
    const accent = module.accentColor || '#6f7d83';

    if (!simplePlan) ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.shadowColor = 'rgba(31, 36, 33, 0.18)';
    ctx.shadowBlur = simplePlan ? 0 : 8;
    ctx.shadowOffsetY = simplePlan ? 0 : 3;

    if (module.preview === 'corner-l') {
        drawShapePath(ctx, [
            [x, y], [x + w, y], [x + w, y + h * 0.56], [x + w * 0.58, y + h * 0.56],
            [x + w * 0.58, y + h], [x, y + h]
        ], color, accent);
        drawCounterEdge(ctx, x, y, w, h * 0.12, module.countertopColor || '#f0e6d0');
    } else if (module.preview === 'corner-u') {
        drawShapePath(ctx, [
            [x, y], [x + w * 0.34, y], [x + w * 0.34, y + h * 0.34], [x + w * 0.66, y + h * 0.34],
            [x + w * 0.66, y], [x + w, y], [x + w, y + h], [x, y + h]
        ], color, accent);
        drawCounterEdge(ctx, x, y, w, h * 0.12, module.countertopColor || '#d8d0c0');
    } else {
        roundRectPath(ctx, x, y, w, h, 4);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(31, 36, 33, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
    }
    ctx.restore();

    if (simplePlan) {
        drawPlanModuleDetails(ctx, x, y, w, h, module, accent);
        return;
    }

    addMaterialTexture(ctx, x, y, w, h, module);
    drawPreviewDetails(ctx, x, y, w, h, module, accent);
}

function drawPlanModuleDetails(ctx, x, y, w, h, module, accent) {
    ctx.save();
    ctx.lineWidth = Math.max(1, Math.min(2.2, Math.min(w, h) * 0.014));
    ctx.strokeStyle = 'rgba(6, 12, 12, 0.48)';
    ctx.fillStyle = accent;

    if (module.mountType === 'floor' && module.countertopColor) {
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = module.countertopColor;
        ctx.fillRect(x + 4, y + 4, Math.max(0, w - 8), Math.max(5, h * 0.1));
        ctx.globalAlpha = 1;
    }

    const preview = module.preview || '';
    if (preview.includes('sink')) {
        ctx.fillStyle = 'rgba(215, 222, 223, 0.82)';
        ctx.strokeStyle = 'rgba(6, 12, 12, 0.42)';
        const basinW = w * (preview === 'sink-double' ? 0.28 : 0.44);
        const basinH = h * 0.34;
        const basinY = y + h * 0.28;
        if (preview === 'sink-double') {
            ctx.fillRect(x + w * 0.18, basinY, basinW, basinH);
            ctx.strokeRect(x + w * 0.18, basinY, basinW, basinH);
            ctx.fillRect(x + w * 0.54, basinY, basinW, basinH);
            ctx.strokeRect(x + w * 0.54, basinY, basinW, basinH);
        } else {
            ctx.fillRect(x + w * 0.28, basinY, basinW, basinH);
            ctx.strokeRect(x + w * 0.28, basinY, basinW, basinH);
        }
    } else if (preview === 'gas-cooktop' || preview === 'induction') {
        ctx.strokeStyle = preview === 'induction' ? '#67b4ca' : 'rgba(6, 12, 12, 0.48)';
        const radius = Math.min(w, h) * 0.12;
        getCooktopPreviewBurners(module.burnerCount).forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(x + w * cx, y + h * cy, radius, 0, Math.PI * 2);
            ctx.stroke();
        });
    } else if (preview === 'drawers' || preview === 'drawer-grid') {
        const count = preview === 'drawer-grid' ? 3 : 2;
        for (let i = 1; i < count; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 6, y + (h / count) * i);
            ctx.lineTo(x + w - 6, y + (h / count) * i);
            ctx.stroke();
        }
    } else if (preview === 'open-shelf') {
        for (let i = 1; i < 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 6, y + (h / 3) * i);
            ctx.lineTo(x + w - 6, y + (h / 3) * i);
            ctx.stroke();
        }
    } else {
        const doorCount = Math.max(1, Math.min(4, module.doorCount || (w > h * 1.6 ? 3 : 2)));
        for (let i = 1; i < doorCount; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + (w / doorCount) * i, y + 7);
            ctx.lineTo(x + (w / doorCount) * i, y + h - 7);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.72;
    ctx.strokeRect(x + 4, y + 4, Math.max(0, w - 8), Math.max(0, h - 8));
    ctx.restore();
}

function drawPreviewDetails(ctx, x, y, w, h, module, accent) {
    ctx.save();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(31, 36, 33, 0.42)';
    ctx.fillStyle = accent;

    const preview = module.preview;
    if (preview === 'drawers') {
        drawDrawers(ctx, x, y, w, h, 3, accent);
    } else if (preview === 'drawer-grid') {
        drawVerticalDoors(ctx, x, y, w, h, 3, accent);
        drawDrawers(ctx, x, y, w, h, 2, accent);
    } else if (preview === 'sink-base' || preview === 'sink-single' || preview === 'sink-double' || preview === 'island-sink') {
        drawSinkPreview(ctx, x, y, w, h, preview === 'sink-double');
        if (preview === 'sink-base') drawVerticalDoors(ctx, x, y + h * 0.58, w, h * 0.38, 2, accent);
    } else if (preview === 'glass-door') {
        drawGlassPane(ctx, x + w * 0.16, y + h * 0.16, w * 0.68, h * 0.68);
        drawHandle(ctx, x + w * 0.78, y + h * 0.28, h * 0.42, accent);
    } else if (preview === 'open-shelf') {
        for (let i = 1; i < 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 6, y + (h / 3) * i);
            ctx.lineTo(x + w - 6, y + (h / 3) * i);
            ctx.stroke();
        }
    } else if (preview === 'microwave') {
        drawGlassPane(ctx, x + w * 0.18, y + h * 0.24, w * 0.5, h * 0.48, '#25282a');
        ctx.fillRect(x + w * 0.73, y + h * 0.28, w * 0.08, h * 0.4);
    } else if (preview === 'hood-top' || preview === 'hood-side') {
        ctx.fillStyle = module.applianceFace || '#202224';
        const hoodY = preview === 'hood-side' ? y + h * 0.26 : y + h * 0.54;
        ctx.fillRect(x + w * 0.12, hoodY, w * 0.76, h * 0.3);
        ctx.fillStyle = accent;
        ctx.fillRect(x + w * 0.42, y + h * 0.1, w * 0.16, h * 0.42);
    } else if (preview === 'gas-cooktop' || preview === 'induction') {
        drawCooktopPreview(ctx, x, y, w, h, preview === 'induction', accent, module.burnerCount);
    } else if (preview === 'fridge' || preview === 'fridge-big') {
        drawFridgePreview(ctx, x, y, w, h, preview === 'fridge-big', accent);
    } else if (preview === 'dishwasher') {
        ctx.fillRect(x + w * 0.2, y + h * 0.18, w * 0.6, 3);
        drawGlassPane(ctx, x + w * 0.17, y + h * 0.32, w * 0.66, h * 0.42, 'rgba(115, 124, 128, 0.25)');
    } else if (preview === 'oven') {
        drawGlassPane(ctx, x + w * 0.14, y + h * 0.2, w * 0.72, h * 0.58, '#25282a');
        ctx.fillStyle = '#b87b44';
        ctx.beginPath();
        ctx.arc(x + w * 0.28, y + h * 0.86, 3, 0, Math.PI * 2);
        ctx.arc(x + w * 0.72, y + h * 0.86, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (preview === 'washer') {
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.55, Math.min(w, h) * 0.23, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(127, 145, 153, 0.24)';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.fillRect(x + w * 0.14, y + h * 0.12, w * 0.72, h * 0.12);
    } else if (preview === 'toilet') {
        ctx.fillStyle = '#f7f7f4';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.56, w * 0.22, h * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(x + w * 0.28, y + h * 0.12, w * 0.44, h * 0.22);
        ctx.strokeRect(x + w * 0.28, y + h * 0.12, w * 0.44, h * 0.22);
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.56, w * 0.1, h * 0.14, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (preview === 'vanity') {
        drawCounterEdge(ctx, x + 4, y + 4, w - 8, h * 0.16, module.countertopColor || '#f4f1ea');
        drawSinkPreview(ctx, x + w * 0.18, y + h * 0.05, w * 0.64, h * 0.36, false);
        drawVerticalDoors(ctx, x + 6, y + h * 0.48, w - 12, h * 0.42, 2, accent);
    } else if (preview === 'mirror') {
        drawGlassPane(ctx, x + w * 0.16, y + h * 0.12, w * 0.68, h * 0.7, 'rgba(205, 225, 230, 0.5)');
        ctx.strokeStyle = accent;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y + h * 0.14);
        ctx.lineTo(x + w * 0.5, y + h * 0.8);
        ctx.stroke();
    } else if (preview === 'shower-set') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y + h * 0.14);
        ctx.lineTo(x + w * 0.5, y + h * 0.82);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.16, w * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(x + w * 0.34, y + h * 0.6, w * 0.32, 4);
    } else if (preview === 'shower-room') {
        drawGlassPane(ctx, x + w * 0.12, y + h * 0.1, w * 0.36, h * 0.76, 'rgba(184, 208, 214, 0.42)');
        drawGlassPane(ctx, x + w * 0.52, y + h * 0.1, w * 0.36, h * 0.76, 'rgba(184, 208, 214, 0.28)');
        ctx.fillStyle = accent;
        ctx.fillRect(x + w * 0.48, y + h * 0.12, 3, h * 0.72);
    } else if (preview === 'bathtub') {
        ctx.fillStyle = '#f5f3ef';
        roundRectPath(ctx, x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.52, 15);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.45, w * 0.27, h * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else if (preview === 'towel-rack') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, y + h * (0.28 + i * 0.18));
            ctx.lineTo(x + w * 0.8, y + h * (0.28 + i * 0.18));
            ctx.stroke();
        }
    } else if (preview === 'floor-drain') {
        ctx.fillStyle = '#b0b0b0';
        roundRectPath(ctx, x + w * 0.32, y + h * 0.22, w * 0.36, h * 0.52, 4);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#5f6962';
        for (let i = 0; i < 4; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + w * (0.38 + i * 0.08), y + h * 0.28);
            ctx.lineTo(x + w * (0.38 + i * 0.08), y + h * 0.68);
            ctx.stroke();
        }
    } else if (preview && preview.startsWith('slab')) {
        drawSlabPreview(ctx, x, y, w, h, preview, accent);
    } else if (preview === 'island') {
        drawCounterEdge(ctx, x + 4, y + 4, w - 8, h * 0.18, module.countertopColor || '#e8dcc8');
        drawVerticalDoors(ctx, x + 6, y + h * 0.34, w - 12, h * 0.46, 3, accent);
    } else if (module.doorCount) {
        drawVerticalDoors(ctx, x, y, w, h, module.doorCount, accent);
    }

    ctx.restore();
}

function drawVerticalDoors(ctx, x, y, w, h, count, accent) {
    for (let i = 1; i < count; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + (w / count) * i, y + 4);
        ctx.lineTo(x + (w / count) * i, y + h - 4);
        ctx.stroke();
    }
    for (let i = 0; i < count; i += 1) {
        const center = x + (w / count) * (i + 0.5);
        drawHandle(ctx, center + (w / count) * 0.24, y + h * 0.34, h * 0.32, accent);
    }
}

function drawDrawers(ctx, x, y, w, h, count, accent) {
    for (let i = 1; i < count; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 5, y + (h / count) * i);
        ctx.lineTo(x + w - 5, y + (h / count) * i);
        ctx.stroke();
    }
    for (let i = 0; i < count; i += 1) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + w * 0.32, y + (h / count) * i + h / count * 0.48, w * 0.36, 3);
    }
}

function drawSinkPreview(ctx, x, y, w, h, isDouble = false) {
    ctx.fillStyle = '#d7dedf';
    ctx.strokeStyle = 'rgba(31, 36, 33, 0.36)';
    const basinY = y + h * 0.2;
    if (isDouble) {
        ctx.fillRect(x + w * 0.12, basinY, w * 0.34, h * 0.44);
        ctx.strokeRect(x + w * 0.12, basinY, w * 0.34, h * 0.44);
        ctx.fillRect(x + w * 0.54, basinY, w * 0.34, h * 0.44);
        ctx.strokeRect(x + w * 0.54, basinY, w * 0.34, h * 0.44);
    } else {
        ctx.fillRect(x + w * 0.22, basinY, w * 0.56, h * 0.46);
        ctx.strokeRect(x + w * 0.22, basinY, w * 0.56, h * 0.46);
    }
    ctx.fillStyle = '#8c9798';
    ctx.fillRect(x + w * 0.48, y + h * 0.08, w * 0.04, h * 0.14);
    ctx.beginPath();
    ctx.arc(x + w * 0.52, y + h * 0.1, 3.5, 0, Math.PI * 2);
    ctx.fill();
}

function getCooktopPreviewBurners(count = 2) {
    const normalized = Math.max(2, Math.min(5, Number(count) || 2));
    if (normalized === 3) return [[0.28, 0.58], [0.72, 0.58], [0.5, 0.28]];
    if (normalized === 4) return [[0.3, 0.32], [0.7, 0.32], [0.3, 0.68], [0.7, 0.68]];
    if (normalized === 5) return [[0.26, 0.3], [0.74, 0.3], [0.26, 0.7], [0.74, 0.7], [0.5, 0.5]];
    return [[0.34, 0.52], [0.66, 0.52]];
}

function drawCooktopPreview(ctx, x, y, w, h, isInduction, accent, burnerCount = 2) {
    ctx.strokeStyle = isInduction ? '#67b4ca' : '#7f8585';
    ctx.lineWidth = 1.6;
    const radius = Math.min(w, h) * 0.15;
    getCooktopPreviewBurners(burnerCount).forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(x + w * cx, y + h * cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (isInduction) {
            ctx.beginPath();
            ctx.arc(x + w * cx, y + h * cy, radius * 0.56, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    ctx.fillStyle = accent;
    ctx.fillRect(x + w * 0.45, y + h * 0.82, w * 0.1, 3);
}

function drawFridgePreview(ctx, x, y, w, h, isBig, accent) {
    ctx.strokeStyle = 'rgba(31, 36, 33, 0.4)';
    if (isBig) {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 4);
        ctx.lineTo(x + w / 2, y + h - 4);
        ctx.moveTo(x + 4, y + h * 0.38);
        ctx.lineTo(x + w - 4, y + h * 0.38);
        ctx.stroke();
        drawHandle(ctx, x + w * 0.43, y + h * 0.22, h * 0.36, accent);
        drawHandle(ctx, x + w * 0.57, y + h * 0.22, h * 0.36, accent);
    } else {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h * 0.42);
        ctx.lineTo(x + w - 4, y + h * 0.42);
        ctx.stroke();
        drawHandle(ctx, x + w * 0.82, y + h * 0.18, h * 0.28, accent);
        drawHandle(ctx, x + w * 0.82, y + h * 0.56, h * 0.28, accent);
    }
}

function drawSlabPreview(ctx, x, y, w, h, preview, accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    if (preview === 'slab-vein') {
        for (let i = 0; i < 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 8, y + h * (0.25 + i * 0.18));
            ctx.bezierCurveTo(x + w * 0.35, y + h * (0.1 + i * 0.22), x + w * 0.58, y + h * (0.48 + i * 0.08), x + w - 8, y + h * (0.3 + i * 0.15));
            ctx.stroke();
        }
    } else if (preview === 'slab-brushed') {
        for (let lineY = y + 8; lineY < y + h - 4; lineY += 5) {
            ctx.beginPath();
            ctx.moveTo(x + 8, lineY);
            ctx.lineTo(x + w - 8, lineY);
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = accent;
        for (let i = 0; i < 18; i += 1) {
            const px = x + 8 + ((i * 23) % Math.max(1, w - 16));
            const py = y + 8 + ((i * 17) % Math.max(1, h - 16));
            ctx.globalAlpha = 0.28;
            ctx.beginPath();
            ctx.arc(px, py, 1.4 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function addMaterialTexture(ctx, x, y, w, h, module) {
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, 4);
    ctx.clip();
    if (['oak', 'walnut', 'ash'].includes(module.materialKind)) {
        ctx.strokeStyle = 'rgba(80, 55, 32, 0.18)';
        for (let line = -h; line < w; line += 8) {
            ctx.beginPath();
            ctx.moveTo(x + line, y + h);
            ctx.bezierCurveTo(x + line + w * 0.22, y + h * 0.6, x + line + w * 0.34, y + h * 0.25, x + line + w, y);
            ctx.stroke();
        }
    } else if (['metal', 'glass', 'mirror'].includes(module.materialKind)) {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, 'rgba(255,255,255,0.24)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
        grad.addColorStop(1, 'rgba(0,0,0,0.22)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
    } else if (module.materialKind === 'ceramic') {
        const grad = ctx.createRadialGradient(x + w * 0.35, y + h * 0.2, 2, x + w * 0.5, y + h * 0.5, Math.max(w, h));
        grad.addColorStop(0, 'rgba(255,255,255,0.65)');
        grad.addColorStop(1, 'rgba(210,205,196,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
    } else if (['quartz', 'marble', 'rock'].includes(module.materialKind)) {
        drawSlabPreview(ctx, x, y, w, h, module.materialKind === 'marble' ? 'slab-vein' : 'slab-speckle', module.accentColor || '#aaa');
    }
    ctx.restore();
}

function drawCounterEdge(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.fillStyle = color;
    roundRectPath(ctx, x + 2, y + 2, w - 4, Math.max(6, h), 3);
    ctx.fill();
    ctx.restore();
}

function drawGlassPane(ctx, x, y, w, h, fill = 'rgba(174, 201, 209, 0.38)') {
    ctx.save();
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.48, fill);
    grad.addColorStop(1, 'rgba(50,70,80,0.22)');
    ctx.fillStyle = grad;
    roundRectPath(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(31, 36, 33, 0.22)';
    ctx.stroke();
    ctx.restore();
}

function drawHandle(ctx, x, y, h, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.restore();
}

function drawShapePath(ctx, points, fill, stroke) {
    ctx.beginPath();
    points.forEach(([px, py], index) => {
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();
}

function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
}

enhanceCabinetModules();

// 预览绘制函数 - 地柜系列
function drawBaseSingle(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.fillStyle = '#999';
    ctx.fillRect(w-p-15, h/2-8, 4, 16);
}

function drawBaseDouble(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.beginPath();
    ctx.moveTo(w/2, p);
    ctx.lineTo(w/2, h-p);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.fillRect(w/4-2, h/2-8, 4, 16);
    ctx.fillRect(w*3/4-2, h/2-8, 4, 16);
}

function drawBaseThree(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(w*i/3, p);
        ctx.lineTo(w*i/3, h-p);
        ctx.stroke();
    }
    ctx.fillStyle = '#999';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(w*(i*2+1)/6-2, h/2-8, 4, 16);
    }
}

function drawBaseDrawer(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    const dh = (h-p*2) / 3;
    for (let i = 0; i < 3; i++) {
        ctx.strokeRect(p, p+i*dh, w-p*2, dh);
        ctx.fillStyle = '#999';
        ctx.fillRect(w/2-15, p+i*dh+dh/2-2, 30, 4);
    }
}

function drawBaseDrawerThree(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    const dw = (w-p*2) / 3;
    for (let i = 0; i < 3; i++) {
        ctx.strokeRect(p+i*dw, p, dw, h-p*2);
        ctx.fillStyle = '#999';
        ctx.fillRect(p+i*dw+dw/2-2, h/2-8, 4, 16);
    }
}

function drawBaseSink(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 水槽图标
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w*0.2, h*0.3, w*0.6, h*0.4);
    ctx.strokeRect(w*0.2, h*0.3, w*0.6, h*0.4);
    // 水龙头
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(w/2, h*0.25, 4, 0, Math.PI*2);
    ctx.fill();
}

function drawBaseCornerL(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(w-p, p);
    ctx.lineTo(w-p, h*0.6);
    ctx.lineTo(w*0.6, h*0.6);
    ctx.lineTo(w*0.6, h-p);
    ctx.lineTo(p, h-p);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawBaseCornerU(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    // U型
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(w*0.35, p);
    ctx.lineTo(w*0.35, h*0.35);
    ctx.lineTo(w*0.65, h*0.35);
    ctx.lineTo(w*0.65, p);
    ctx.lineTo(w-p, p);
    ctx.lineTo(w-p, h-p);
    ctx.lineTo(p, h-p);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// 吊柜系列
function drawWallSingle(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.fillStyle = '#999';
    ctx.fillRect(w-p-15, h/2-8, 4, 16);
}

function drawWallDouble(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.beginPath();
    ctx.moveTo(w/2, p);
    ctx.lineTo(w/2, h-p);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.fillRect(w/4-2, h/2-8, 4, 16);
    ctx.fillRect(w*3/4-2, h/2-8, 4, 16);
}

function drawWallThree(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(w*i/3, p);
        ctx.lineTo(w*i/3, h-p);
        ctx.stroke();
    }
    ctx.fillStyle = '#999';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(w*(i*2+1)/6-2, h/2-8, 4, 16);
    }
}

function drawWallOpen(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(p+4, p+4, w-p*2-8, h-p*2-8);
}

function drawWallMicrowave(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 微波炉
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w*0.15, h*0.2, w*0.7, h*0.6);
    ctx.strokeRect(w*0.15, h*0.2, w*0.7, h*0.6);
    // 玻璃门
    ctx.fillStyle = '#666';
    ctx.fillRect(w*0.2, h*0.25, w*0.4, h*0.5);
}

function drawRangeHood(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 烟管
    ctx.fillStyle = '#888';
    ctx.fillRect(w*0.4, p, w*0.2, h*0.3);
    // 挡板
    ctx.fillStyle = '#555';
    ctx.fillRect(w*0.1, h*0.7, w*0.8, h*0.25);
}

function drawRangeHoodSide(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 侧吸面板
    ctx.fillStyle = '#555';
    ctx.fillRect(w*0.1, h*0.3, w*0.8, h*0.6);
    // 玻璃
    ctx.fillStyle = '#444';
    ctx.fillRect(w*0.15, h*0.35, w*0.7, h*0.5);
}

// 电器系列
function drawCooktop(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 灶眼
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    const r = Math.min(w,h) * 0.15;
    ctx.beginPath();
    ctx.arc(w*0.35, h*0.5, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w*0.65, h*0.5, r, 0, Math.PI*2);
    ctx.stroke();
    // 炉架
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w*0.35 + r*Math.cos(i*Math.PI/2), h*0.5 + r*Math.sin(i*Math.PI/2));
        ctx.lineTo(w*0.35 + r*1.5*Math.cos(i*Math.PI/2), h*0.5 + r*1.5*Math.sin(i*Math.PI/2));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w*0.65 + r*Math.cos(i*Math.PI/2), h*0.5 + r*Math.sin(i*Math.PI/2));
        ctx.lineTo(w*0.65 + r*1.5*Math.cos(i*Math.PI/2), h*0.5 + r*1.5*Math.sin(i*Math.PI/2));
        ctx.stroke();
    }
}

function drawCooktopInduction(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#222';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 电磁炉线圈
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    const r = Math.min(w,h) * 0.18;
    ctx.beginPath();
    ctx.arc(w*0.35, h*0.5, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w*0.35, h*0.5, r*0.6, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w*0.65, h*0.5, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w*0.65, h*0.5, r*0.6, 0, Math.PI*2);
    ctx.stroke();
}

function drawSinkSingle(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#c0c0c0';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 水槽
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w*0.15, h*0.2, w*0.7, h*0.6);
    ctx.strokeRect(w*0.15, h*0.2, w*0.7, h*0.6);
    // 水龙头
    ctx.fillStyle = '#999';
    ctx.fillRect(w*0.45, h*0.05, w*0.1, h*0.15);
    ctx.beginPath();
    ctx.arc(w/2, h*0.08, 5, 0, Math.PI*2);
    ctx.fill();
}

function drawSinkDouble(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#c0c0c0';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 双槽
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w*0.08, h*0.2, w*0.38, h*0.6);
    ctx.strokeRect(w*0.08, h*0.2, w*0.38, h*0.6);
    ctx.fillRect(w*0.54, h*0.2, w*0.38, h*0.6);
    ctx.strokeRect(w*0.54, h*0.2, w*0.38, h*0.6);
    // 水龙头
    ctx.fillStyle = '#999';
    ctx.fillRect(w*0.45, h*0.05, w*0.1, h*0.15);
}

function drawFridge(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#e0e0e0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.beginPath();
    ctx.moveTo(p, h*0.4);
    ctx.lineTo(w-p, h*0.4);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.fillRect(w-p-12, h*0.2-10, 4, 20);
    ctx.fillRect(w-p-12, h*0.6-10, 4, 20);
}

function drawFridgeBig(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#e0e0e0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 双开门
    ctx.beginPath();
    ctx.moveTo(w/2, p);
    ctx.lineTo(w/2, h-p);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p, h*0.4);
    ctx.lineTo(w-p, h*0.4);
    ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.fillRect(w/4-2, h*0.3, 4, 20);
    ctx.fillRect(w*3/4-2, h*0.3, 4, 20);
}

function drawDishwasher(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#e0e0e0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    ctx.fillStyle = '#999';
    ctx.fillRect(w/2-15, p+8, 30, 4);
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('洗碗机', w/2, h/2);
}

function drawOven(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 玻璃门
    ctx.fillStyle = '#444';
    ctx.fillRect(w*0.1, h*0.15, w*0.8, h*0.7);
    // 控制面板
    ctx.fillStyle = '#555';
    ctx.fillRect(w*0.1, h*0.85, w*0.8, h*0.1);
    // 旋钮
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(w*0.3, h*0.9, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w*0.7, h*0.9, 5, 0, Math.PI*2);
    ctx.fill();
}

function drawWasher(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#e0e0e0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 圆形门
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(w/2, h*0.45, Math.min(w,h)*0.25, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    // 控制面板
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(w*0.1, h*0.05, w*0.8, h*0.12);
    // 旋钮
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.arc(w*0.25, h*0.11, 8, 0, Math.PI*2);
    ctx.fill();
}

// 台面系列
function drawCountertopQuartz(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 石英石颗粒效果
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(p+Math.random()*(w-p*2), p+Math.random()*(h-p*2), 2+Math.random()*3, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawCountertopMarble(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 大理石纹理
    ctx.strokeStyle = 'rgba(180,180,180,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p, h*0.3);
    ctx.bezierCurveTo(w*0.3, h*0.2, w*0.7, h*0.4, w-p, h*0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p, h*0.7);
    ctx.bezierCurveTo(w*0.4, h*0.6, w*0.6, h*0.8, w-p, h*0.65);
    ctx.stroke();
}

function drawCountertopStainless(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#c8c8c8';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 拉丝效果
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h-p*2; i += 3) {
        ctx.beginPath();
        ctx.moveTo(p, p+i);
        ctx.lineTo(w-p, p+i);
        ctx.stroke();
    }
}

function drawCountertopRock(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#a0a0a0';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 岩板纹理
    ctx.fillStyle = 'rgba(120,120,120,0.3)';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(p+Math.random()*(w-p*2-20), p+Math.random()*(h-p*2-10), 20+Math.random()*30, 10+Math.random()*20);
    }
}

// 整体橱柜
function drawLShape(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(w-p, p);
    ctx.lineTo(w-p, h*0.6);
    ctx.lineTo(w*0.6, h*0.6);
    ctx.lineTo(w*0.6, h-p);
    ctx.lineTo(p, h-p);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 标注
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L型', w*0.3, h*0.5);
}

function drawUShape(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p, p);
    ctx.lineTo(w*0.35, p);
    ctx.lineTo(w*0.35, h*0.35);
    ctx.lineTo(w*0.65, h*0.35);
    ctx.lineTo(w*0.65, p);
    ctx.lineTo(w-p, p);
    ctx.lineTo(w-p, h-p);
    ctx.lineTo(p, h-p);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('U型', w/2, h*0.6);
}

function drawIsland(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 岛台标注
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('岛台', w/2, h/2);
}

function drawIslandSink(ctx, w, h) {
    const p = 8;
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(p, p, w-p*2, h-p*2);
    ctx.strokeRect(p, p, w-p*2, h-p*2);
    // 水槽
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(w*0.3, h*0.3, w*0.4, h*0.4);
    ctx.strokeRect(w*0.3, h*0.3, w*0.4, h*0.4);
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('岛台+水槽', w/2, h*0.2);
}

// 创建橱柜实例
function createCabinetInstance(moduleId, x, y, modelVariantId = null) {
    const module = findCabinetModule(moduleId);
    if (!module) return null;
    const defaultElevation = module.fixtureKind === 'toilet' && module.mountType === 'wall'
        ? 180
        : module.fixtureKind === 'vanity' && module.mountType === 'wall'
            ? 320
        : module.fixtureKind === 'shower'
        ? 300
        : module.fixtureKind === 'mirror'
            ? 1100
            : module.fixtureKind === 'towel-rack'
                ? 1250
                : module.mountType === 'wall'
                    ? 1500
                    : module.mountType === 'counter'
                        ? 720
                        : 0;

    return {
        id: Date.now() + Math.random(),
        moduleId: module.id,
        name: module.name,
        x: x,
        y: y,
        width: module.width,
        depth: module.depth,
        height: module.height,
        elevation: defaultElevation,
        color: module.color,
        customColor: false,
        accentColor: module.accentColor || '#6f7d83',
        countertopColor: module.countertopColor || '#f0f0f0',
        materialKind: module.materialKind || 'painted',
        countertopMaterial: module.countertopMaterial || null,
        doorCount: module.doorCount || 0,
        drawerCount: module.drawerCount || 0,
        openShelves: module.openShelves || 0,
        glass: Boolean(module.glass),
        hasSink: Boolean(module.hasSink),
        applianceFace: module.applianceFace || null,
        handleStyle: module.handleStyle || 'bar',
        doorStyle: module.doorStyle || 'framed',
        appearanceVersion: 'neutral-v1',
        fixtureKind: module.fixtureKind || null,
        heaterStyle: module.heaterStyle || null,
        hoodStyle: module.hoodStyle || null,
        burnerCount: module.burnerCount || null,
        toiletStyle: module.toiletStyle || null,
        vanityStyle: module.vanityStyle || null,
        generatedBy: module.generatedBy || null,
        modelVariantId,
        modelStatus: module.modelStatus || 'parametric',
        finishName: module.finishName || '标准饰面',
        mountType: module.mountType || 'floor',
        material: module.material || null,
        rotation: 0,
        drawPreview: module.drawPreview
    };
}
