import * as THREE from "three";

export class Rain{
    constructor(scene,camera,renderer){

        let flash = new THREE.PointLight(0x062d89, 30, 500, 1.7);
        flash.position.set(20,30, 10);
        scene.add(flash);

        let rainCount = 9500;
        let rainPositions = new Float32Array(rainCount * 3); // 每个雨滴有3个坐标 (x, y, z)
        let rainVelocities = []; // 存储雨滴的速度（可以独立处理）

        // 创建雨滴位置和速度
        for (let i = 0; i < rainCount; i++) {
            rainPositions[i * 3] = Math.random() * 400 - 200; // x 坐标
            rainPositions[i * 3 + 1] = Math.random() * 500 - 250; // y 坐标
            rainPositions[i * 3 + 2] = Math.random() * 400 - 200; // z 坐标

            rainVelocities.push(0); // 初始化每个雨滴的速度
        }

        // 创建 BufferGeometry 并设置顶点位置
        let rainGeo = new THREE.BufferGeometry();
        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3)); // 每个顶点3个值 (x, y, z)

        // 创建材质
        let rainMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.15,
            transparent: true
        });

        // 创建雨滴的粒子系统
        let rain = new THREE.Points(rainGeo, rainMaterial);

        // 添加到场景
        scene.add(rain);

        function render() {
            renderer.render(scene, camera);
            requestAnimationFrame(render);



            let positions = rainGeo.attributes.position.array; // 获取顶点位置数组
            for (let i = 0; i < rainCount; i++) {
                let x = positions[i * 3];     // x 坐标
                let y = positions[i * 3 + 1]; // y 坐标
                let z = positions[i * 3 + 2]; // z 坐标

                // 更新速度并计算新的位置
                rainVelocities[i] -= 3 * Math.random() * 1; // 模拟重力加速度
                y += rainVelocities[i];

                // 如果雨滴低于底部，将其重置到顶部
                if (y < -100) {
                    y = 100;
                    rainVelocities[i] = 0; // 重置速度
                }

                // 更新位置
                positions[i * 3 + 1] = y; // 更新 y 坐标
            }

            // 标记顶点数据需要更新
            rainGeo.attributes.position.needsUpdate = true;

            // 添加旋转效果
            rain.rotation.y += 0.002;

            if(Math.random() > 0.96 || flash.power > 100) {
                if(flash.power<100) {
                    flash.position.set(
                        Math.random()*40,
                        30+Math.random()*20,
                        10
                    );
                }
                flash.power = 50 + Math.random() * 500;
            }
        }

        render();
    }
}