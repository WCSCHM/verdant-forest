import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Clock } from 'three';
import { MathUtils } from 'three';

export class Bird {
    constructor(camera, scene, renderer, route) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.modelLoaded = false; // 标记是否已加载模型
        this.route = route;
        this.mixer = null; // 动画混合器
        this.model = null; // 模型
        this.loadedData = null; // GLTF 加载数据
    }

    loadBird(callback) {
        if (this.modelLoaded) return; // 防止重复加载
        let loader = new GLTFLoader();
        loader.load('./Resource/Parrot.glb', (data) => {
            // 模型加载成功后
            this.loadedData = data;
            this.model = data.scene.children[0];
            console.log(this.model, 'model');

            this.model.scale.set(0.04, 0.04, 0.04);
            // 设置模型初始位置
            this.model.position.set(0, 0, 0);

            // 将模型添加到场景中
            this.scene.add(this.model);

            // 加载动画
            this.animation();

            this.modelLoaded = true; // 标记模型已加载

            if (callback) callback(); // 回调通知加载完成
        }, undefined, (error) => {
            console.error('模型加载失败:', error);
        });
    }

    animation() {
        this.mixer = new THREE.AnimationMixer(this.model);

        let positionKF;
        // 位置动画剪辑
        if (this.route === 1) {
            positionKF = new THREE.VectorKeyframeTrack(
                ".position",
                [0, 20, 40],
                [0, 5, -200 * Math.tan(20) / 2,
                    35, 30, 200 * Math.tan(20) / 2,
                    40, 40, -200 * Math.tan(20) / 2]
            );
        } else if (this.route === 2) {
            console.log("Route 2 position keyframe");
            positionKF = new THREE.VectorKeyframeTrack(
                ".position",
                [0, 20, 40],
                [0, 0, -200 * Math.tan(20) / 2,
                    35, 20, 200 * Math.tan(20) / 2,
                    40, 30, -200 * Math.tan(20) / 2]
            );
        }

        const rotationKF = new THREE.QuaternionKeyframeTrack(
            ".quaternion",
            [0, 20, 25],
            [0, 0, 0, 1,
                0, 0, 0, 1,
                0, 1, 0, 0,
            ]
        );

        const moveBlinkClip = new THREE.AnimationClip("move-n-blink", -1, [
            positionKF, rotationKF
        ]);

        // 模型上加载的动画
        const clip = this.loadedData.animations[0];
        const action = this.mixer.clipAction(clip);
        const action1 = this.mixer.clipAction(moveBlinkClip);
        action.play();
        action1.play();
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}

// 集中管理双击事件
export function handleDoubleClick(birds, renderer, camera, scene) {
    const clock = new Clock();

    window.addEventListener('dblclick', () => {
        let allLoaded = true;

        birds.forEach((bird) => {
            if (!bird.modelLoaded) {
                bird.loadBird(() => {
                    allLoaded = birds.every((b) => b.modelLoaded);
                });
            }
        });

        if (allLoaded) {
            renderer.setAnimationLoop(() => {
                const delta = clock.getDelta();
                birds.forEach((bird) => bird.update(delta));
                renderer.render(scene, camera);
            });
        }
    });
}
