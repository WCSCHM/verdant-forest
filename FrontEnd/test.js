import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import {Cloudy, Sunny, Sunset} from './sky.js';

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let timeUniform = { value: 0 };

// 加载 GLB 模型
const loader = new GLTFLoader();
loader.load(
    './Resource/ja19_tsuga_diversifolia_japanese_hemlock.glb',
    (gltf) => {
        const treeModel = gltf.scene;

        // 遍历模型中的每一个网格，并应用自定义的着色器修改
        treeModel.traverse((child) => {
            if (child.isMesh) {
                const material = child.material;

                // 使用 onBeforeCompile 修改顶点着色器
                material.onBeforeCompile = (shader) => {
                    shader.uniforms.time = timeUniform;  // 动态时间
                    shader.uniforms.windStrength = { value: 0.5 };

                    shader.vertexShader = `
                        uniform float time;
                        uniform float windStrength;
                        ${shader.vertexShader}
                    `.replace(
                        `#include <begin_vertex>`,
                        `
                                     vec3 transformed = vec3(position);
                                        float offset = sin(time + position.y * 0.5) * windStrength;  // 使用 sin 函数实现平移
                                        transformed.x += offset;  // 仅在 X 轴方向上偏移
                                        transformed.z += offset;  // 在 Z 轴方向上也添加偏移
    `
                    );

                };
            }
        });

        scene.add(treeModel);
        treeModel.position.set(0, 0, -10);
        treeModel.scale.set(0.1, 0.1, 0.1);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error occurred while loading the model:', error);
    }
);

const noise2D = createNoise2D(); // 创建 2D 噪声生成器

// 创建地形纹理
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('./Resource/ground.jpg');  // 替换为您的纹理路径
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(1000, 1000);  // 大量重复纹理，模拟延伸

// 地形参数
const planeSize = 1000;  // 单个平面的大小
const planes = [];
const planePositions = [
    [-planeSize, 0, -planeSize],
    [0, 0, -planeSize],
    [planeSize, 0, -planeSize],
    [-planeSize, 0, 0],
    [0, 0, 0],
    [planeSize, 0, 0],
    [-planeSize, 0, planeSize],
    [0, 0, planeSize],
    [planeSize, 0, planeSize],
];

// 配置地形高度
function generateHeight(x, z) {
    const distanceFromCenter = Math.sqrt(x * x + z * z) / planeSize; // 距离中心的相对距离
    const flatRadius = 0.1; // 平原半径 (缩小至0.2, 让山丘更靠近中心)

    if (distanceFromCenter < flatRadius) {
        return 0; // 中心区域为平原
    }

    const noiseScale = 0.004; // 降低噪声频率，增大山丘之间的间距
    const mountainHeight = 30; // 减小山丘的最大高度

    // 使用噪声生成高度，随着距离增加高度增大
    const noiseValue = noise2D(x * noiseScale, z * noiseScale);
    return noiseValue * mountainHeight * (distanceFromCenter - flatRadius);
}

// 创建多个平面并修改其顶点高度
planePositions.forEach(([x, y, z]) => {
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, 100, 100); // 使用较多细分以实现平滑地形
    geometry.rotateX(-Math.PI / 2);

    // 调整每个顶点的高度
    geometry.attributes.position.array.forEach((_, idx) => {
        if (idx % 3 === 0) { // 仅处理 X、Z 坐标的每个顶点
            const vx = geometry.attributes.position.getX(idx / 3); // 获取 X 坐标
            const vz = geometry.attributes.position.getZ(idx / 3); // 获取 Z 坐标
            const height = generateHeight(vx + x, vz + z); // 基于噪声生成高度
            geometry.attributes.position.setY(idx / 3, height); // 设置 Y 高度
        }
    });

    geometry.computeVertexNormals(); // 重新计算法向量，以使光照效果正确

    const material = new THREE.MeshStandardMaterial({ map: groundTexture });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, z);
    scene.add(plane);
    planes.push(plane);
});

// 更新地形的位置，使地形延伸
function updateTerrain() {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    planes.forEach(plane => {
        const distanceX = Math.abs(cameraPosition.x - plane.position.x);
        const distanceZ = Math.abs(cameraPosition.z - plane.position.z);

        if (distanceX > planeSize * 1.5) {
            plane.position.x += Math.sign(cameraPosition.x - plane.position.x) * planeSize * 3;
        }
        if (distanceZ > planeSize * 1.5) {
            plane.position.z += Math.sign(cameraPosition.z - plane.position.z) * planeSize * 3;
        }
    });
}

const mySky=new Sunset(scene);
scene.add(mySky.getSky());
scene.add(mySky.Light());



// 添加方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 50, 50);
scene.add(directionalLight);

// 渲染循环
function animate() {
    requestAnimationFrame(animate);

    // 更新 time 值用于风的效果
    timeUniform.value += 0.01;

    const minHeight = 2;
    if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
    }

    updateTerrain();
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 处理窗口大小调整
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
