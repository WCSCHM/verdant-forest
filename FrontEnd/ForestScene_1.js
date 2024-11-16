import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 创建场景
const scene = new THREE.Scene();

// 设置相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 1000);  // 设置相机位置

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

const gltfLoader = new GLTFLoader();

// GLTF加载器加载天空盒模型
gltfLoader.load('Resource/skybox_1.glb', (gltf) => {
    const skybox = gltf.scene;
    skybox.scale.set(100, 100, 100);
    skybox.traverse((node) => {
        if (node.isMesh) {
            // 将材质的面朝向设置为反向，确保从内部可以看到天空盒
            node.material.side = THREE.BackSide;
        }
    });
    scene.add(skybox);
});

// 定义变量来保存树模型
const trees = [];
let currentTreeIndex = 0;

// 加载第一个树模型
gltfLoader.load('Resource/sakura_tree.glb', (gltf) => {
    const tree1 = gltf.scene;
    tree1.scale.set(0.1, 0.1, 0.1);
    tree1.position.set(0, 0, 0);
    trees.push(tree1);
});

// 加载第二个树模型
gltfLoader.load('Resource/tree1-2.glb', (gltf) => {
    const tree2 = gltf.scene;
    tree2.scale.set(3, 3, 3);
    tree2.position.set(0, 0, 0);
    trees.push(tree2);
});

// 加载第三个树模型
gltfLoader.load('Resource/tree1-3.glb', (gltf) => {
    const tree3 = gltf.scene;
    tree3.scale.set(13, 13, 13);
    tree3.position.set(0, 0, 0);
    trees.push(tree3);
});

// 创建按钮并添加到页面中
const button = document.createElement('button');
button.innerText = '切换模型';
button.style.position = 'absolute';
button.style.top = '20px';
button.style.left = '20px';
document.body.appendChild(button);

// 添加按钮点击事件监听器
button.addEventListener('click', () => {
    if (trees.length === 0) return; // 确保模型加载完毕

    // 移除当前模型
    scene.remove(trees[currentTreeIndex]);

    // 计算下一个模型的索引
    currentTreeIndex = (currentTreeIndex + 1) % trees.length;

    // 添加下一个模型到场景中
    scene.add(trees[currentTreeIndex]);
});

// GLTF加载器加载海洋模型
gltfLoader.load('Resource/oceanwave_1.glb', (gltf) => {
    const ocean_wave = gltf.scene;
    ocean_wave.scale.set(2, 2, 2);
    ocean_wave.position.set(0, -6, 0);
    // 遍历海洋模型中的所有Mesh
    ocean_wave.traverse((node) => {
        if (node.isMesh) {
            // 创建并设置自定义的材质 (蓝色，带有反光效果)
            node.material = new THREE.MeshStandardMaterial({
                color: 0x00BBFF,   // 浅天蓝色
                metalness: 0.2,    // 较低的金属感
                roughness: 0.4,    // 较低的粗糙度，反光更强
                flatShading: false, // 启用平滑着色，使波浪看起来更加真实
                side: THREE.DoubleSide // 双面可见
            });
        }
    });
    scene.add(ocean_wave);
});

// 渲染循环
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001; // 获取当前时间

    // 为每棵树添加风动特效
    trees.forEach(tree => {
        tree.rotation.y = Math.sin(time * 0.25) * 0.04;  // 根据时间改变树的旋转
        tree.rotation.x = Math.cos(time * 0.15) * 0.04;  // 在不同的轴上添加摆动效果
    });


    controls.update();
    renderer.render(scene, camera);
}

animate();

// 处理窗口调整大小
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
