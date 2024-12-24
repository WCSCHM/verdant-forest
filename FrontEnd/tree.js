import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Tree {
    constructor(scene, position, scale) {
        this.scene = scene;
        this.position = position; // 树的初始位置
        this.scale = scale; // 树的缩放比例
        this.models = []; // 用于存储当前树的多个模型
        this.currentModelIndex = 0; // 当前展示的模型索引
        this.treeObject = null; // 当前加载的树模型对象
        this.loader = new GLTFLoader(); // GLB 模型加载器
        this.timeOffset = Math.random() * 100; // 每棵树随机偏移时间
    }

    /**
     * 加载树的多个模型
     * @param {Array} modelPaths - 模型路径数组
     * @param {Array} scales - 缩放比例数组
     */
    loadModels(modelPaths, scales) {
        const promises = modelPaths.map((path, index) =>
            new Promise((resolve, reject) => {
                this.loader.load(
                    path,
                    (gltf) => {
                        const model = gltf.scene;
                        const scale = scales[index] || 1; // 使用传入的缩放比例，没有则默认1
                        model.scale.set(scale, scale, scale);
                        model.position.set(...this.position);
                        model.visible = false; // 初始隐藏
                        this.scene.add(model);
                        this.models.push(model);
                        resolve(); // 加载成功
                    },
                    null,
                    (error) => {
                        console.error(`Error loading model ${path}:`, error);
                        reject(error); // 加载失败
                    }
                );
            })
        );

        // 设置一个加载完成的标志
        Promise.all(promises)
            .then(() => {
                this.modelsLoaded = true;
            })
            .catch(() => {
                this.modelsLoaded = false;
            });
    }

    // 控制模型的摇动
    sway(time) {
        if (this.models.length > 0 && this.currentModelIndex >= 0) {
            const model = this.models[this.currentModelIndex];
            const windStrength = 0.0025; // 摆动强度
            const swayAngle = Math.sin(time + this.timeOffset) * windStrength;
            model.rotation.z = swayAngle; // 绕Z轴摇摆
        }
    }

// 在切换模型时检查是否加载完成
    switchModel() {
        if (!this.modelsLoaded) {
            console.warn('Models are still loading.');
            return;
        }
        if (this.models.length === 0) return;

        if (this.treeObject) {
            this.treeObject.visible = false;
        }

        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        this.treeObject = this.models[this.currentModelIndex];
        this.treeObject.visible = true;
    }


    /**
     * 隐藏所有模型
     */
    hideAllModels() {
        this.models.forEach((model) => {
            model.visible = false;
        });
        this.treeObject = null; // 重置当前树对象
    }
}
