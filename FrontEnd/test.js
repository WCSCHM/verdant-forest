import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import {Cloudy, Sunny, Sunset} from './sky.js';
import {Desert, Grassland, Hill} from './terrain.js'
import {Bird, handleDoubleClick} from "./bird";

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
    './Resource/realistic_hd_mountain_hemlock_1943.glb',
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
        treeModel.position.set(0, 0, 0);
        treeModel.scale.set(0.1, 0.1, 0.1);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error occurred while loading the model:', error);
    }
);

const ground=new Grassland(camera,scene);

const mySky=new Sunny(scene,camera);

const bird1=new Bird(camera,scene,renderer,1);
const bird2=new Bird(camera,scene,renderer,2);

handleDoubleClick([bird1, bird2], renderer, camera, scene);

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

    ground.updateTerrain();
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
