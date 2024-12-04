import * as THREE from 'three';

export class WateringEffect {
    constructor(scene) {
        this.scene = scene;
        this.clock = new THREE.Clock(); // 用于时间控制
        this.activeEffects = []; // 存储当前激活的浇水效果
    }

    createWormhole(position) {
        // 创建虫洞几何和材质
        const wormholeGeometry = new THREE.RingGeometry(3, 5, 64, 1); // 大内外半径
        const wormholeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x00ff80) },
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    pos.z += sin(uv.x * 10.0 + uTime * 5.0) * 0.2; // 动态波动
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying vec2 vUv;
                void main() {
                    float dist = length(vUv - 0.5); // 距离中心的距离
                    float glow = smoothstep(0.4, 0.0, dist); // 光晕效果
                    vec3 color = uColor * (glow + 0.5); // 光晕加动态亮度
                    gl_FragColor = vec4(color, 1.0); // 不透明
                }
            `,
            transparent: false,
            side: THREE.DoubleSide, // 双面可见
        });

        const wormhole = new THREE.Mesh(wormholeGeometry, wormholeMaterial);
        wormhole.position.copy(position);
        wormhole.rotation.x = Math.PI / 2; // 水平放置

        this.scene.add(wormhole);
        return wormhole;
    }

    createWaterFlow(position) {
        // 创建水流粒子系统
        const particleCount = 5000; // 粒子数量适中
        const particleGeometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8; // 扩散范围与虫洞半径一致

            const x = position.x + Math.cos(angle) * radius;
            const y = position.y - 1; // 水流从虫洞下方开始
            const z = position.z + Math.sin(angle) * radius;

            positions.push(x, y, z);
            velocities.push((Math.random() - 0.5) * 5, -Math.random() * 10 - 5, (Math.random() - 0.5) * 5); // 初始速度
        }

        particleGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        particleGeometry.setAttribute(
            'velocity',
            new THREE.Float32BufferAttribute(velocities, 3)
        );

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00bbff,
            size: 0.5, // 粒子尺寸
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);

        this.scene.add(particles);
        return particles;
    }

    updateParticles(particles, deltaTime) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            velocities[i + 1] -= 9.8 * deltaTime * 0.5; // 模拟重力
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            if (positions[i + 1] < -10) {
                // 重置粒子位置和速度
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 4;

                positions[i] = particles.position.x + Math.cos(angle) * radius;
                positions[i + 1] = particles.position.y - 1; // 水流从虫洞下方开始
                positions[i + 2] = particles.position.z + Math.sin(angle) * radius;

                velocities[i] = (Math.random() - 0.5) * 5;
                velocities[i + 1] = -Math.random() * 10 - 5;
                velocities[i + 2] = (Math.random() - 0.5) * 5;
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    startEffect(position) {
        const wormhole = this.createWormhole(position);
        const waterFlow = this.createWaterFlow(position);
        
        const duration = 4;

        this.activeEffects.push({ wormhole, waterFlow, startTime: this.clock.getElapsedTime(), duration });
    }

    update() {
        const deltaTime = this.clock.getDelta();
        const currentTime = this.clock.getElapsedTime();

        // 遍历激活效果，更新或移除
        this.activeEffects = this.activeEffects.filter(({ wormhole, waterFlow, startTime, duration }) => {
            // 更新虫洞效果
            if (wormhole && wormhole.material.uniforms.uTime) {
                wormhole.material.uniforms.uTime.value = currentTime; // 更新时间
            }

            // 更新水流粒子系统
            this.updateParticles(waterFlow, deltaTime);

            // 检查是否超时
            if (currentTime - startTime > duration) {
                // 从场景中移除虫洞和水流
                this.scene.remove(wormhole);
                this.scene.remove(waterFlow);
                return false; // 移除效果
            }

            return true; // 保留效果
        });
    }
}
