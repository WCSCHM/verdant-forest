import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {createNoise2D} from 'simplex-noise';
import {Cloudy, Sunny, Sunset} from './sky.js';
import {Desert, Grassland, Hill} from './terrain.js';
import {Bird, handleDoubleClick} from './bird';
import {Tree} from './tree.js';
import {WateringEffect} from './watering'

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let timeUniform = {value: 0};

const wateringEffect = new WateringEffect(scene);

// 创建多个树实例
const tree1 = new Tree(scene, [0, 0, 0], [5]);
tree1.loadModels(
    [
        './Resource/tree1-1.glb', // 模型1路径
        './Resource/tree1-2.glb', // 模型2路径
        './Resource/tree1-3.glb'  // 模型3路径
    ],
    [
        2.5, // tree1-1.glb 的缩放比例
        1.5, // tree1-2.glb 的缩放比例
        6  // tree1-3.glb 的缩放比例
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
        2, // tree2-1.glb 的缩放比例
        6, // tree2-2.glb 的缩放比例
        13  // tree2-3.glb 的缩放比例
    ]
);

const tree3 = new Tree(scene, [0, 0, 0], [5]);
tree3.loadModels(
    [
        './Resource/tree3-1.glb', // 模型1路径
        './Resource/tree3-2.glb', // 模型2路径
        './Resource/tree3-3.glb'  // 模型3路径
    ],
    [
        0.04, // tree3-1.glb 的缩放比例
        70, // tree3-2.glb 的缩放比例
        4  // tree3-3.glb 的缩放比例
    ]
);

const tree4 = new Tree(scene, [0, 0, 0], [5]);
tree4.loadModels(
    [
        './Resource/willow-1.glb', // 模型1路径
        './Resource/willow-2.glb', // 模型2路径
        './Resource/willow-3.glb'  // 模型3路径
    ],
    [
        2, // willow-1.glb 的缩放比例
        0.25, // willow-2.glb 的缩放比例
        6.5  // willow-3.glb 的缩放比例
    ]
);

// 当前选择的树
let currentTree = tree1;

// 创建按钮界面
const switchButton = document.createElement('button');
switchButton.innerText = '切换模型';
switchButton.style.position = 'absolute';
switchButton.style.top = '10px';
switchButton.style.left = '10px';
document.body.appendChild(switchButton);
switchButton.addEventListener('click', () => {
    currentTree.switchModel();
});

// // 创建选择树的下拉菜单
// const treeSelect = document.createElement('select');
// treeSelect.style.position = 'absolute';
// treeSelect.style.top = '90px';
// treeSelect.style.left = '10px';
// ['Tree1', 'Tree2','Tree3','Tree4'].forEach((name, index) => {
//     const option = document.createElement('option');
//     option.value = index;
//     option.innerText = name;
//     treeSelect.appendChild(option);
// });
// document.body.appendChild(treeSelect);

// 假设有6种树对象，分别是 tree1, tree2, ..., tree6
const trees = [tree1, tree2, tree3, tree4];

// // 处理选择树的切换
// treeSelect.addEventListener('change', (event) => {
//     const selectedValue = parseInt(event.target.value, 10);
//
//     if (currentTree) {
//         currentTree.hideAllModels(); // 隐藏之前树的所有模型
//     }
//
//     // 根据 selectedValue 动态选择对应的树
//     currentTree = trees[selectedValue];
//
//     if (currentTree) {
//         currentTree.currentModelIndex = -1; // 重置索引
//         currentTree.switchModel(); // 默认展示新树的第一个模型
//     } else {
//         console.error("Invalid tree selection:", selectedValue);
//     }
// });


// 创建预览功能
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

// 创建一个关闭按钮
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

// 创建模型预览按钮
const previewButton = document.createElement('button');
previewButton.innerText = '选择树种';
previewButton.style.position = 'absolute';
previewButton.style.top = '50px';
previewButton.style.left = '10px';
document.body.appendChild(previewButton);

previewButton.addEventListener('click', () => {
    previewContainer.style.display = 'block';
    startPreviewRendering();
});

// 为每种树种创建一个小型的 Three.js 场景
// 初始化树模型配置数组
const treeModels = [
    {path: './Resource/tree1-3.glb', scale: [0.35, 0.35, 0.35]},  // 默认比例
    {path: './Resource/tree2-3.glb', scale: [0.85, 0.85, 0.85]},  // 比较小
    {path: './Resource/tree3-3.glb', scale: [0.25, 0.25, 0.25]},  // 放大
    {path: './Resource/willow-3.glb', scale: [0.25, 0.25, 0.25]}   // 缩小很多
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

    const previewRenderer = new THREE.WebGLRenderer({alpha: true});
    previewRenderer.setSize(250, 230);
    previewRenderer.setClearColor(0x000000, 0); // 透明背景

    const previewElement = document.createElement('div');
    previewElement.style.display = 'inline-block';
    previewElement.style.margin = '5px';
    previewElement.appendChild(previewRenderer.domElement);
    previewContainer.appendChild(previewElement);

    // 加载模型
    const loader = new GLTFLoader();
    loader.load(
        modelConfig.path,  // 使用模型路径
        (gltf) => {
            const model = gltf.scene;
            const [scaleX, scaleY, scaleZ] = modelConfig.scale; // 获取 scale 值
            model.scale.set(scaleX, scaleY, scaleZ);  // 应用模型的比例
            previewScene.add(model);
        },
        undefined,
        (error) => console.error('Error loading model for preview:', error)
    );

    // 添加方向光
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3);
    previewScene.add(light);

    // 存储场景、相机和渲染器
    previewScenes.push(previewScene);
    previewCameras.push(previewCamera);
    previewRenderers.push(previewRenderer);
    previewElements.push(previewElement);

    // 添加选择点击事件
    previewElement.addEventListener('click', () => {
        if (currentTree) {
            currentTree.hideAllModels();
        }

        // 选择对应的树种
        currentTree = trees[index];
        if (currentTree) {
            currentTree.currentModelIndex = -1;
            currentTree.switchModel();
        }


        previewContainer.style.display = 'none';
        console.log(`Selected tree: ${index + 1}`);
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

// 地形与天空初始化
const ground = new Grassland(camera, scene);
const mySky = new Sunny(scene, camera);

// 初始化鸟类对象
const bird1 = new Bird(camera, scene, renderer, 1);
const bird2 = new Bird(camera, scene, renderer, 2);
handleDoubleClick([bird1, bird2], renderer, camera, scene);

// 添加方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 50, 50);
scene.add(directionalLight);

// 添加按钮触发浇水
const waterButton = document.createElement('button');
waterButton.innerText = '浇水';
waterButton.style.position = 'absolute';
waterButton.style.top = '20px';
waterButton.style.right = '20px'; // 放置在右侧
waterButton.style.padding = '10px 20px';
waterButton.style.backgroundColor = '#4CAF50';
waterButton.style.color = 'white';
waterButton.style.border = 'none';
waterButton.style.borderRadius = '5px';
waterButton.style.cursor = 'pointer';
document.body.appendChild(waterButton);

// 点击按钮时触发浇水效果
waterButton.addEventListener('click', () => {
    const treePosition = new THREE.Vector3(0, 100, 0); // 假设这是树的位置
    wateringEffect.startEffect(treePosition);
});

// 渲染循环
function animate() {
    requestAnimationFrame(animate);

    // 更新 time 值用于风的效果
    timeUniform.value += 0.01;

    const minHeight = 2;
    if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
    }

    ground.updateTerrain();
    controls.update();
    wateringEffect.update()
    renderer.render(scene, camera);
}

animate();

// 处理窗口大小调整
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
