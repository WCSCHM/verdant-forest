import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise2D } from 'simplex-noise';
import {Cloudy, Sunny, Sunset} from '../sky.js';
import {Desert, Grassland, Hill} from '../terrain.js'
import {Bird, handleDoubleClick} from "../bird";

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 30; // 相机最小缩放距离
controls.maxDistance = 100; // 相机最大缩放距离


let timeUniform = { value: 0 };

const ground=new Hill(camera,scene);

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