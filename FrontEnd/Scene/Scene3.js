import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import { Cloudy, Sunny, Sunset } from '../sky';
import { Desert, Grassland, Hill } from '../terrain';
import { Bird, handleDoubleClick } from '../bird';
import { WateringEffect } from '../watering';

// 从 localStorage 获取用户 ID
const userId = localStorage.getItem('userId');
const apiUrl = 'http://localhost:3008';
const chooseTree = 3; // 假设选择的树种 ID 为 3

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

// ------------------------------
// 全局的时间 uniform，用于风的效果
// ------------------------------
let timeUniform = { value: 0 };

// ------------------------------
// 创建浇水效果
// ------------------------------
const wateringEffect = new WateringEffect(scene);

// ------------------------------
// 使用 GLTFLoader 分别加载三阶段模型
//   并用 treeStage=1,2,3 来标识当前阶段
// ------------------------------
const loader = new GLTFLoader();
let treeStage1 = null; // 第一阶段模型
let treeStage2 = null; // 第二阶段模型
let treeStage3 = null; // 第三阶段模型

// 当场景中正在显示的树（便于做摇摆效果、切换等）
let currentTree = null;

// 标识种植阶段：1->2->3
let treeStage = 1;

// 计数器，用于跟踪加载的模型数量
let modelsLoaded = 0;

// 分别加载3个 glb
loader.load(
    './Resource/tree3-1.glb',
    (gltf) => {
        treeStage1 = gltf.scene;
        treeStage1.scale.set(0.04, 0.04, 0.04);
        console.log('Tree stage 1 loaded');
        modelsLoaded++;
        checkAllModelsLoaded();
    },
    undefined,
    (err) => console.error('Error loading tree1-1:', err)
);

loader.load(
    './Resource/tree3-2.glb',
    (gltf) => {
        treeStage2 = gltf.scene;
        treeStage2.scale.set(70, 70, 70);
        console.log('Tree stage 2 loaded');
        modelsLoaded++;
        checkAllModelsLoaded();
    },
    undefined,
    (err) => console.error('Error loading tree1-2:', err)
);

loader.load(
    './Resource/tree3-3.glb',
    (gltf) => {
        treeStage3 = gltf.scene;
        treeStage3.scale.set(4, 4, 4);
        console.log('Tree stage 3 loaded');
        modelsLoaded++;
        checkAllModelsLoaded();
    },
    undefined,
    (err) => console.error('Error loading tree1-3:', err)
);

// 检查所有模型是否加载完成
function checkAllModelsLoaded() {
    if (modelsLoaded === 3) {
        loadUserTree();
    }
}

// 获取用户种植信息并加载对应的树模型
async function loadUserTree() {
    try {
        const response = await fetch(`${apiUrl}/user-trees/${userId}/${chooseTree}`);
        if (!response.ok) {
            throw new Error(`Error fetching user tree: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
            treeStage = data.growthStage;
            console.log(`Growth stage for tree ${chooseTree}: ${treeStage}`);
            
            // 根据 growthStage 显示对应���树模型
            switch (treeStage) {
                case 1:
                    if (treeStage1) {
                        scene.add(treeStage1);
                        currentTree = treeStage1;
                    } else {
                        console.error('Tree stage 1 not loaded');
                    }
                    break;
                case 2:
                    if (treeStage2) {
                        scene.add(treeStage2);
                        currentTree = treeStage2;
                    } else {
                        console.error('Tree stage 2 not loaded');
                    }
                    break;
                case 3:
                    if (treeStage3) {
                        scene.add(treeStage3);
                        currentTree = treeStage3;
                    } else {
                        console.error('Tree stage 3 not loaded');
                    }
                    break;
                default:
                    console.error(`Invalid growth stage: ${treeStage}`);
            }
        } else {
            console.error('未找到种植信息');
        }
    } catch (error) {
        console.error('Error loading user tree:', error);
    }
}

// 在页面加载时调用
loadUserTree();

// ------------------------------
// 地形与天空初始化
// ------------------------------
const ground = new Desert(camera, scene);
const mySky = new Sunset(scene, camera);

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
// “浇水”按钮
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
document.body.appendChild(waterButton);

// ------------------------------
// 自定义金币图案 + 金币数显示
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

function updateCoinDisplay() {
    const coinText = document.getElementById('coinText');
    if (coinText) {
        coinText.innerText = coinCount;
    }
}

// ------------------------------
// API Integration for Coins
// ------------------------------
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

// 页面加载时获取初始金币数
fetchCoinCount();

// ------------------------------
// 浇水次数 & 切换模型逻辑
//   - 第一次(累计 5 次浇水) -> 显示 tree1-2.glb
//   - 第二次(累计 10 次浇水) -> 显示 tree1-3.glb 并“种植成功”
//   - 当金币<=0时，不再产生浇水效果
// ------------------------------
let waterTimes = 0;

// 更新数据库中的生长阶段
async function updateGrowthStage(newStage) {
    try {
        const response = await fetch(`${apiUrl}/user-trees/${userId}/${chooseTree}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ growthStage: newStage })
        });
        if (!response.ok) {
            throw new Error(`Error updating growth stage: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Error updating growth stage:', error);
    }
}

waterButton.addEventListener('click', async () => {
    // 1. 若金币数量<=0，则不再起效果
    if (coinCount <= 0) {
        console.warn('金币不足，无法浇水！');
        alert('金币不足，无法浇水！');
        return;
    }

    // 2. 每次点击扣除 10 金币
    await updateCoinCount(-10);
    if (coinCount <= 0) {
        waterButton.style.display = 'none';
        alert('金币已用完，无法继续浇水。');
    }

    // 3. 触发浇水效果
    if (currentTree) {
        const treePosition = new THREE.Vector3(5, 5, 0);
        wateringEffect.startEffect(treePosition);
    }

    // 4. 浇水次数 +1
    waterTimes++;

    // 当浇水次数为 5 时，切换到第二阶段
    if (waterTimes === 2 && treeStage === 1) {
        // 移除当前树（第一阶段），添加第二阶段
        if (currentTree) {
            scene.remove(currentTree);
        }
        if (treeStage2) {
            scene.add(treeStage2);
            currentTree = treeStage2;
        }
        treeStage = 2;
        await updateGrowthStage(treeStage); // 更新数据库中的生长阶段
    }

    // 当浇水次数为 10 时，切换到第三阶段并显示“种植成功”
    if (waterTimes === 4 && treeStage === 2) {
        // 移除当前树（第二阶段），添加第三阶段
        if (currentTree) {
            scene.remove(currentTree);
        }
        if (treeStage3) {
            scene.add(treeStage3);
            currentTree = treeStage3;
        }
        treeStage = 3;
        await updateGrowthStage(treeStage); // 更新数据库中的生长阶段

        // 显示“种植成功”
        const successMessage = document.createElement('div');
        successMessage.innerText = '种植成功！';
        successMessage.style.position = 'absolute';
        successMessage.style.top = '50%';
        successMessage.style.left = '50%';
        successMessage.style.transform = 'translate(-50%, -50%)';
        successMessage.style.fontSize = '72px';
        successMessage.style.color = '#39FF14';
        successMessage.style.fontWeight = 'bold';
        successMessage.style.textShadow = '0 0 15px #39FF14, 0 0 30px #39FF14';
        document.body.appendChild(successMessage);

        // 移除浇水按钮和金币 UI
        waterButton.remove();
        coinContainer.remove();
    }
});

// ------------------------------
// 一个简易的“摇摆”示函数
//   仅作演示，实际可用更复杂的骨骼动画或顶点动画
// ------------------------------
function swayTree(object, time) {
    if (!object) return;
    // 简单地左右轻微摆动
    const swayAmplitude = 0.005;
    object.rotation.z = swayAmplitude * Math.sin(time * 2);
}

// ------------------------------
// 渲染循环
// ------------------------------
function animate() {
    requestAnimationFrame(animate);

    // 更新 time 用于风的效果
    timeUniform.value += 0.01;

    // 让当前显示的树随风摇摆
    swayTree(currentTree, timeUniform.value);

    // 防止相机高度过低
    const minHeight = 2;
    if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
    }

    // 更新地形
    ground.updateTerrain();

    // 更新相机控制
    controls.update();

    // 更新浇水粒子
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
// 让币显示与浇水按钮的显示状态联动
// ------------------------------
const observer = new MutationObserver(() => {
    if (waterButton.style.display !== 'none') {
        coinContainer.style.display = 'block';
    } else {
        coinContainer.style.display = 'none';
    }
});
observer.observe(waterButton, { attributes: true, attributeFilter: ['style'] });
