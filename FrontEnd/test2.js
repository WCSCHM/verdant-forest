import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import { Cloudy, Sunny, Sunset } from './sky.js';
import { Desert, Grassland, Hill } from './terrain.js';
import { Bird, handleDoubleClick } from './bird';
import { Tree } from './tree.js';
import { WateringEffect } from './watering';

// 从 localStorage 获取用户 ID
const userId = localStorage.getItem('userId');
const apiUrl = 'http://localhost:3008';

// ------------------------------
// 创建场景、相机和渲染器
// ------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 30, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 使用 OrbitControls，添加缩放限制
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 20; // 禁止离得过近
controls.maxDistance = 130; // 禁止离得过远

// 全局的时间 uniform，用于风的效果
let timeUniform = { value: 0 };

// ------------------------------
// 创建浇水效果
// ------------------------------
const wateringEffect = new WateringEffect(scene);

// ------------------------------
// 创建多个树实例
//   注意：加载时依然是3个模型(1,2,3)，实际预览仅显示第三个
// ------------------------------
const tree1 = new Tree(scene, [0, 0, 0], [5]);
tree1.loadModels(
    [
        './Resource/tree1-1.glb',
        './Resource/tree1-2.glb',
        './Resource/tree1-3.glb'
    ],
    [
        2.5,
        1.5,
        6
    ]
);

const tree2 = new Tree(scene, [0, 0, 0], [5]);
tree2.loadModels(
    [
        './Resource/tree2-1.glb',
        './Resource/tree2-2.glb',
        './Resource/tree2-3.glb'
    ],
    [
        2,
        6,
        13
    ]
);

const tree3 = new Tree(scene, [0, 0, 0], [5]);
tree3.loadModels(
    [
        './Resource/tree3-1.glb',
        './Resource/tree3-2.glb',
        './Resource/tree3-3.glb'
    ],
    [
        0.04,
        70,
        4
    ]
);

const tree4 = new Tree(scene, [0, 0, 0], [5]);
tree4.loadModels(
    [
        './Resource/willow-1.glb',
        './Resource/willow-2.glb',
        './Resource/willow-3.glb'
    ],
    [
        2,
        0.25,
        6.5
    ]
);

const tree5 = new Tree(scene, [0, 0, 0], [5]);
tree5.loadModels(
    [
        './Resource/tree4-1.glb',
        './Resource/tree4-2.glb',
        './Resource/tree4-3.glb'
    ],
    [
        1,
        30,
        60
    ]
);

const tree6 = new Tree(scene, [0, 0, 0], [5]);
tree6.loadModels(
    [
        './Resource/tree6-1.glb',
        './Resource/tree6-2.glb',
        './Resource/tree6-3.glb'
    ],
    [
        3,
        1.5,
        0.1
    ]
);

// 所有树的实例
const trees = [tree1, tree2, tree3, tree4, tree5, tree6];

// 当前选择的树
let currentTree = null;

// ------------------------------
// 创建“选择树种”按钮 + 预览容器
// （将按钮样式改为与浇水按钮一致）
// ------------------------------
const previewButton = document.createElement('button');
previewButton.innerText = '选择树种';
previewButton.style.position = 'absolute';
previewButton.style.top = '50px';
previewButton.style.left = '10px';
previewButton.style.padding = '10px 20px';
previewButton.style.backgroundColor = '#4CAF50';
previewButton.style.color = 'white';
previewButton.style.border = 'none';
previewButton.style.borderRadius = '5px';
previewButton.style.cursor = 'pointer';
document.body.appendChild(previewButton);

const previewContainer = document.createElement('div');
previewContainer.style.position = 'absolute';
previewContainer.style.top = '50%';
previewContainer.style.left = '50%';
previewContainer.style.transform = 'translate(-50%, -50%)';
previewContainer.style.width = '800px';
previewContainer.style.height = '500px';
previewContainer.style.background = 'rgba(0, 0, 0, 0.7)';
previewContainer.style.display = 'none'; // 默认隐藏
previewContainer.style.borderRadius = '8px';
previewContainer.style.overflow = 'hidden';
previewContainer.style.padding = '10px';
document.body.appendChild(previewContainer);

// 关闭预览按钮
const closeButton = document.createElement('button');
closeButton.innerText = '关闭';
closeButton.style.position = 'absolute';
closeButton.style.top = '10px';
closeButton.style.right = '10px';
closeButton.style.zIndex = '10';
closeButton.style.padding = '5px';
previewContainer.appendChild(closeButton);

closeButton.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    // 停止所有预览的渲染
    previewRenderers.forEach((renderer) => renderer.setAnimationLoop(null));
});

// 点击“选择树种”按钮，显示预览
previewButton.addEventListener('click', () => {
    previewContainer.style.display = 'block';
    startPreviewRendering();
});

// ------------------------------
// 为每种树种创建一个小型预览场景
// 需求：只显示第三个模型 (xx-3.glb)
// ------------------------------
const treeModels = [
    { path: './Resource/tree1-3.glb', scale: [0.35, 0.35, 0.35] },
    { path: './Resource/tree2-3.glb', scale: [0.85, 0.85, 0.85] },
    { path: './Resource/tree3-3.glb', scale: [0.25, 0.25, 0.25] },
    { path: './Resource/willow-3.glb', scale: [0.25, 0.25, 0.25] },
    { path: './Resource/tree4-3.glb', scale: [5.5, 5.5, 5.5] },
    { path: './Resource/tree6-3.glb', scale: [0.01, 0.01, 0.01] }
];
const previewScenes = [];
const previewCameras = [];
const previewRenderers = [];
const previewElements = [];

treeModels.forEach((modelConfig, index) => {
    // 创建场景、相机和渲染器
    const previewScene = new THREE.Scene();
    const previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    previewCamera.position.set(0, 1.5, 4);

    const previewRenderer = new THREE.WebGLRenderer({ alpha: true });
    previewRenderer.setSize(250, 230);
    previewRenderer.setClearColor(0x000000, 0); // 透明背景

    const previewElement = document.createElement('div');
    previewElement.style.display = 'inline-block';
    previewElement.style.margin = '5px';
    previewElement.appendChild(previewRenderer.domElement);
    previewContainer.appendChild(previewElement);

    // 加载模型(仅第三个，用于预览)
    const loader = new GLTFLoader();
    loader.load(
        modelConfig.path,
        (gltf) => {
            const model = gltf.scene;
            const [sx, sy, sz] = modelConfig.scale;
            model.scale.set(sx, sy, sz);
            previewScene.add(model);
        },
        undefined,
        (error) => console.error('Error loading model for preview:', error)
    );

    // 预览场景光照
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3);
    previewScene.add(light);

    // 存储
    previewScenes.push(previewScene);
    previewCameras.push(previewCamera);
    previewRenderers.push(previewRenderer);
    previewElements.push(previewElement);

    // 点击选择树种
    previewElement.addEventListener('click', () => {
        // 隐藏所有树的模型
        trees.forEach((t) => t.hideAllModels());

        // 当前选中的树
        currentTree = trees[index];

        // “实际加载时先显示第一个模型”
        // 强制先显示 models[0] (xx-1.glb)
        if (currentTree && currentTree.modelsLoaded) {
            if (currentTree.treeObject) {
                currentTree.treeObject.visible = false;
            }
            currentTree.currentModelIndex = 0;
            currentTree.treeObject = currentTree.models[0];
            currentTree.treeObject.visible = true;
        }

        // 隐藏预览框
        previewContainer.style.display = 'none';
        // 停止预览渲染循环
        previewRenderers.forEach((r) => r.setAnimationLoop(null));

        // “选择树种”按钮仅可使用一次，之后消失
        previewButton.style.display = 'none';

        // 只有选中了树种后才出现“浇水”按钮
        waterButton.style.display = 'block';

        console.log('Selected tree: ' + (index + 1));
    });
});

// 渲染预览场景
function startPreviewRendering() {
    previewRenderers.forEach((renderer, index) => {
        const scene = previewScenes[index];
        const camera = previewCameras[index];

        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    });
}

// ------------------------------
// 地形与天空初始化
// ------------------------------
const ground = new Grassland(camera, scene);
const mySky = new Sunny(scene, camera);

// ------------------------------
// 初始化鸟类对象
// ------------------------------
const bird1 = new Bird(camera, scene, renderer, 1);
const bird2 = new Bird(camera, scene, renderer, 2);
handleDoubleClick([bird1, bird2], renderer, camera, scene);

// ------------------------------
// 场景光照
// ------------------------------
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 50, 50);
scene.add(directionalLight);

// ------------------------------
// “浇水”按钮（初始隐藏, 样式保留）
// ------------------------------
const waterButton = document.createElement('button');
waterButton.innerText = '浇水';
waterButton.style.position = 'absolute';
waterButton.style.top = '20px';
waterButton.style.right = '20px';
waterButton.style.padding = '10px 20px';
waterButton.style.backgroundColor = '#4CAF50';
waterButton.style.color = 'white';
waterButton.style.border = 'none';
waterButton.style.borderRadius = '5px';
waterButton.style.cursor = 'pointer';
waterButton.style.display = 'none'; // 初始隐藏
document.body.appendChild(waterButton);

// ------------------------------
// 自定义金币图案 + 金币数量显示
// ------------------------------
let coinCount = 0; // 初始化为0，后续通过API获取
const coinContainer = document.createElement('div');
coinContainer.style.position = 'absolute';
coinContainer.style.top = '70px';
coinContainer.style.right = '20px';
coinContainer.style.color = '#FFD700';
coinContainer.style.fontSize = '20px';
coinContainer.style.fontWeight = 'bold';
coinContainer.style.textAlign = 'center';
coinContainer.style.display = 'none'; // 初始隐藏, will be shown based on waterButton

// 用一个简单的 SVG 画金币 + “￥”符号
coinContainer.innerHTML = `
  <div style="display: flex; align-items: center;">
    <svg width="40" height="40" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="coinGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFF700"/>
          <stop offset="100%" stop-color="#FFC500"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#coinGradient)" stroke="#E0B400" stroke-width="2"/>
      <text x="32" y="38" font-size="24" text-anchor="middle" fill="#9B7500" font-weight="bold">￥</text>
    </svg>
    <span id="coinText" style="margin-left: 8px;">${coinCount}</span>
  </div>
`;
document.body.appendChild(coinContainer);

// Function to update the coin display from the current coinCount variable
function updateCoinDisplay() {
    const coinText = document.getElementById('coinText');
    if (coinText) {
        coinText.innerText = coinCount;
    }
}

// ------------------------------
// API Integration for Coins
// ------------------------------

// Function to fetch the initial coin count from the backend
async function fetchCoinCount() {
    try {
        const response = await fetch(`${apiUrl}/users/${userId}/coins`);
        if (!response.ok) {
            throw new Error(`Error fetching coins: ${response.statusText}`);
        }
        const data = await response.json();
        coinCount = data.coins;
        updateCoinDisplay();
    } catch (error) {
        console.error(error);
        alert('无法获取金币数量，请稍后再试。');
    }
}

// Function to update the coin count on the backend
async function updateCoinCount(amount) {
    try {
        const response = await fetch(`${apiUrl}/users/${userId}/coins`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error updating coins: ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        console.log(data.message);
        // After successful update, fetch the updated coin count
        await fetchCoinCount();
    } catch (error) {
        console.error(error);
        alert(`金币更新失败: ${error.message}`);
    }
}

// Fetch the initial coin count when the page loads
fetchCoinCount();

// ------------------------------
// 浇水次数 & 切换模型逻辑
// 需求：
//   - 先显示第一个(点击选择时已处理)
//   - 第一次切换(浇5次) -> 第二个
//   - 第二次切换(浇10次) -> 第三个 -> 种植成功
//   - 当金币<=0时，不再产生浇水效果
// ------------------------------
let waterTimes = 0; // 记录总共浇了几次水

waterButton.addEventListener('click', async () => {
    // 1. 若金币数量<=0，则不再起效果
    if (coinCount <= 0) {
        console.warn('金币不足，无法浇水！');
        alert('金币不足，无法浇水！');
        return;
    }

    // 2. 每次点击扣除 10 金币
    // Update the backend first
    await updateCoinCount(-10);

    // After updating, check if coinCount is updated
    if (coinCount <= 0) {
        // Optionally, disable the waterButton
        waterButton.style.display = 'none';
        alert('金币已用完，无法继续浇水。');
    }

    // 3. 触发浇水效果
    if (currentTree) {
        // 可以根据实际的树位置做调整，这里暂时设定
        const treePosition = new THREE.Vector3(5, 5, 0);
        wateringEffect.startEffect(treePosition);
    }

    // 4. 浇水次数 +1
    waterTimes++;

    // 当浇水次数为 5 时，切换到下一个模型（若有）
    if (waterTimes === 5) {
        await currentTree?.switchModel(); // models[1]
    }

    // 当浇水次数为 10 时，切换到最终模型并显示“种植成功”
    if (waterTimes === 10) {
        await currentTree?.switchModel(); // models[2]

        // 显示“种植成功” (字体再大一些)
        const successMessage = document.createElement('div');
        successMessage.innerText = '种植成功！';
        successMessage.style.position = 'absolute';
        successMessage.style.top = '50%';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translate(-50%, -50%)';
        successMessage.style.fontSize = '72px'; // 由原先48px改大
        successMessage.style.color = '#39FF14'; // 荧光绿色
        successMessage.style.fontWeight = 'bold';
        successMessage.style.textShadow = '0 0 15px #39FF14, 0 0 30px #39FF14';
        document.body.appendChild(successMessage);

        // 移除浇水按钮和金币 UI
        waterButton.remove();
        coinContainer.remove();
    }
});

// ------------------------------
// 渲染循环
// ------------------------------
function animate() {
    requestAnimationFrame(animate);
    // 更新 time 用于风的效果
    timeUniform.value += 0.01;

    // 控制所有树随风摇摆
    trees.forEach((tree) => {
        tree.sway(timeUniform.value);
    });

    // 防止相机高度过低
    const minHeight = 2;
    if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
    }

    // 地形更新
    ground.updateTerrain();

    // orbitControls 更新
    controls.update();

    // 浇水粒子更新
    wateringEffect.update();

    renderer.render(scene, camera);
}
animate();

// ------------------------------
// 在窗口调整大小时更新
// ------------------------------
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// ------------------------------
// 让金币显示与浇水按钮的显示状态联动
// ------------------------------
const observer = new MutationObserver(() => {
    if (waterButton.style.display === 'block') {
        coinContainer.style.display = 'block';
    } else {
        coinContainer.style.display = 'none';
    }
});
observer.observe(waterButton, { attributes: true, attributeFilter: ['style'] });
