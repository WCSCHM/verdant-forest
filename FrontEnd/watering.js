import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class WateringEffect {
    constructor(scene) {
        this.scene = scene;
        this.clock = new THREE.Clock(); // 用于时间控制
        this.activeEffects = []; // 存储当前激活的浇水效果
        this.loader = new GLTFLoader(); // 加载模型
        this.wateringCan = null; // 用于存储浇水壶模型
    }

    async loadWateringCanModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                'Resource/watering_can.glb',
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.5, 0.5, 0.5); // 根据需要调整模型大小
                    resolve(model);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }

    async createWateringCan(position) {
        if (!this.wateringCan) {
            this.wateringCan = await this.loadWateringCanModel();
        }
        const can = this.wateringCan.clone();
        can.position.copy(position);
        this.scene.add(can);
        return can;
    }

    createWaterFlow(startPosition, endPosition) {
        const particleCount = 1000; // 细化粒子数量以模拟细流
        const particleGeometry = new THREE.BufferGeometry();
        const positions = [];
        const speeds = [];

        // 创建严格的贝塞尔曲线
        const curve = new THREE.QuadraticBezierCurve3(
            startPosition,
            new THREE.Vector3(
                (startPosition.x + endPosition.x) / 2,
                startPosition.y + 2, // 控制点稍微高于中点以形成弧形
                (startPosition.z + endPosition.z) / 2
            ),
            endPosition
        );

        // 初始化粒子位置和速度
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount; // 均匀分布在曲线上
            const point = curve.getPoint(t);

            positions.push(point.x, point.y, point.z);
            speeds.push(t); // 保存每个粒子的位置参数 t
        }

        particleGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        particleGeometry.setAttribute(
            'speed',
            new THREE.Float32BufferAttribute(speeds, 1)
        );

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00bbff,
            size: 0.3, // 极小粒子模拟细流
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        return { particles, curve };
    }

    updateParticles(particles, curve, deltaTime) {
        const positions = particles.geometry.attributes.position.array;
        const speeds = particles.geometry.attributes.speed.array;

        for (let i = 0; i < speeds.length; i++) {
            speeds[i] += deltaTime * 0.2; // 调整速度倍率控制流动快慢

            // 如果超出曲线末端，重置到曲线起点
            if (speeds[i] > 1) speeds[i] = 0;

            // 根据更新的 t 值计算粒子新位置
            const point = curve.getPoint(speeds[i]);
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    async startEffect() {
        const wateringCanPosition = new THREE.Vector3(5, 5, 0);
        const wateringCan = await this.createWateringCan(wateringCanPosition);
        const spoutPosition = new THREE.Vector3(3, 5, 0);
        const endPosition = new THREE.Vector3(0, 0, 0);

        // 添加倾斜动画
        const tiltDuration = 1.0; // 倾斜时间
        const startTime = this.clock.getElapsedTime();

        const tiltInterval = setInterval(() => {
            const elapsed = this.clock.getElapsedTime() - startTime;
            if (elapsed >= tiltDuration) {
                clearInterval(tiltInterval);
            } else {
                const tiltAngle = elapsed / tiltDuration * Math.PI / 6; // 最大倾斜角为30度
                wateringCan.rotation.z = tiltAngle; // 向前倾斜
            }
        }, 16); // 每帧更新

        // 延迟水流出现
        setTimeout(() => {
            const { particles, curve } = this.createWaterFlow(spoutPosition, endPosition);
            const duration = 5; // 水流持续时间
            this.activeEffects.push({
                wateringCan,
                particles,
                curve,
                startTime: this.clock.getElapsedTime(),
                duration,
            });
        }, tiltDuration * 1000);
    }

    update() {
        const deltaTime = this.clock.getDelta();
        const currentTime = this.clock.getElapsedTime();

        this.activeEffects = this.activeEffects.filter(({ wateringCan, particles, curve, startTime, duration }) => {
            // 更新水流粒子系统
            this.updateParticles(particles, curve, deltaTime);

            // 检查是否超时
            if (currentTime - startTime > duration) {
                this.scene.remove(wateringCan);
                this.scene.remove(particles);
                return false;
            }

            return true;
        });
    }
}
