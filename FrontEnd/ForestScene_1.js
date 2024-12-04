import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {WateringEffect} from './watering'

// 创建场景
const scene = new THREE.Scene();

// 设置相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 100);  // 设置相机位置

// 渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加OrbitControls来允许视角旋转
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // 启用阻尼效果（惯性）
controls.minDistance = 15;
controls.maxDistance = 150;

// 添加阳光 (DirectionalLight)
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 20, 10);  // 设置光源位置
sunLight.castShadow = true;         // 启用阴影
scene.add(sunLight);

// 添加环境光 (AmbientLight) 用来稍微照亮所有方向
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);  // 微弱的环境光
scene.add(ambientLight);

// 创建GLTFLoader实例
const gltfLoader = new GLTFLoader();

// 实例化 WateringEffect
const wateringEffect = new WateringEffect(scene);

// 存储树木模型的数组和当前显示的树木索引
let trees = [];
let currentTreeIndex = -1;

// GLTF加载器加载天空盒模型
gltfLoader.load('Resource/skybox_1.glb', (gltf) => {
    const skybox = gltf.scene;
    skybox.scale.set(100, 100, 100);
    skybox.traverse((node) => {
        if (node.isMesh) {
            node.material.side = THREE.BackSide;  // 从内部可以看到天空盒
        }
    });
    scene.add(skybox);
});

// 加载三个树木模型并存储在数组中
gltfLoader.load('Resource/sapling_1.glb', (gltf) => {
    const tree1 = gltf.scene;
    tree1.position.set(0, 0, 0);
    trees.push(tree1);
    checkAndDisplayFirstTree(); // 检查并显示第一个树木
});

gltfLoader.load('Resource/bush_1.glb', (gltf) => {
    const tree2 = gltf.scene;
    tree2.scale.set(50, 50, 50);
    tree2.position.set(0, 0, 0);
    trees.push(tree2);
    checkAndDisplayFirstTree(); // 检查并显示第一个树木
});

gltfLoader.load('Resource/tree_1.glb', (gltf) => {
    const tree3 = gltf.scene;
    tree3.scale.set(100, 100, 100);
    tree3.position.set(0, 0, 0);
    trees.push(tree3);
    checkAndDisplayFirstTree(); // 检查并显示第一个树木
});

// 检查所有树是否加载完成并显示第一棵树
function checkAndDisplayFirstTree() {
    if (trees.length === 3 && currentTreeIndex === -1) {
        // 如果所有树加载完成并且当前没有显示树
        currentTreeIndex = 0; // 设置当前树索引为第一棵树
        scene.add(trees[currentTreeIndex]); // 添加第一棵树到场景
    }
}

// 加载海洋模型
gltfLoader.load('Resource/oceanwave_1.glb', (gltf) => {
    const ocean_wave = gltf.scene;
    ocean_wave.scale.set(2, 2, 2);
    ocean_wave.position.set(0, -6, 0);
    ocean_wave.traverse((node) => {
        if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
                color: 0x00BBFF,   // 浅天蓝色
                metalness: 0.2,    // 较低的金属感
                roughness: 0.4,    // 较低的粗糙度，反光更强
                flatShading: false, // 启用平滑着色
                side: THREE.DoubleSide // 双面可见
            });
        }
    });
    scene.add(ocean_wave);
});

// 添加切换树木按钮
const treeButton = document.createElement('button');
treeButton.innerText = '切换树木';
treeButton.style.position = 'absolute';
treeButton.style.top = '20px';
treeButton.style.left = '20px';
treeButton.style.padding = '10px 20px';
treeButton.style.backgroundColor = '#4CAF50';
treeButton.style.color = 'white';
treeButton.style.border = 'none';
treeButton.style.borderRadius = '5px';
treeButton.style.cursor = 'pointer';
document.body.appendChild(treeButton);

// 点击按钮切换树木模型
treeButton.addEventListener('click', () => {
    if (trees.length > 1) {
        // 从场景中移除当前的树木模型
        scene.remove(trees[currentTreeIndex]);

        // 切换到下一个树木模型
        currentTreeIndex = (currentTreeIndex + 1) % trees.length;

        // 将新的树木模型添加到场景中
        scene.add(trees[currentTreeIndex]);
    }
});

// 树木随风摇动效果
function swayTree(tree) {
    if (tree) {
        const time = Date.now() * 0.001; // 使用时间来控制动画
        const swayAngle = Math.sin(time) * 0.01; // 摇动角度
        tree.rotation.z = swayAngle; // 在 Z 轴上轻微旋转
    }
}

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
    const treePosition = new THREE.Vector3(0, 60, 0); // 假设这是树的位置
    wateringEffect.startEffect(treePosition);
});


// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // 更新浇水效果
    wateringEffect.update()

    // 应用摇动效果到当前显示的树木
    if (trees[currentTreeIndex]) {
        swayTree(trees[currentTreeIndex]);
    }

    renderer.render(scene, camera);
}

animate();

// 处理窗口调整大小
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});