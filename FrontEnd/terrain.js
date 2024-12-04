import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import {Water} from "three/addons";


class terrain{
    constructor(camera, scene) {
        this.textureLoader = new THREE.TextureLoader();
        this.camera = camera;
        this.scene = scene;

        this.groundTexture=this.GroundTexture();

        this.planeSize = 1000;  // 单个平面的大小
        this.planes = [];
        this.planePositions = [
            [-this.planeSize, 0, -this.planeSize],
            [0, 0, -this.planeSize],
            [this.planeSize, 0, -this.planeSize],
            [-this.planeSize, 0, 0],
            [0, 0, 0],
            [this.planeSize, 0, 0],
            [-this.planeSize, 0, this.planeSize],
            [0, 0, this.planeSize],
            [this.planeSize, 0, this.planeSize],
        ];

        this.noise2D = createNoise2D();


    }

    GroundTexture(){

    }

    updateTerrain() {
        const cameraPosition = new THREE.Vector3();
        this.camera.getWorldPosition(cameraPosition);

        this.planes.forEach(plane => {
            const distanceX = Math.abs(cameraPosition.x - plane.position.x);
            const distanceZ = Math.abs(cameraPosition.z - plane.position.z);

            if (distanceX > this.planeSize * 1.5) {
                plane.position.x += Math.sign(cameraPosition.x - plane.position.x) * this.planeSize * 3;
            }
            if (distanceZ > this.planeSize * 1.5) {
                plane.position.z += Math.sign(cameraPosition.z - plane.position.z) * this.planeSize * 3;
            }
        });
    }
}

export class Desert extends terrain{
    constructor(camera, scene) {
        super(camera,scene);
        this.createTerrain();
    }

    GroundTexture(){
        const groundTexture = this.textureLoader.load('./Resource/ground.jpg');  // 替换为您的纹理路径
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(1000, 1000);  // 大量重复纹理，模拟延伸
        return groundTexture;
    }

    generateHeight(x, z) {
        const distanceFromCenter = Math.sqrt(x * x + z * z) / this.planeSize; // 距离中心的相对距离
        const flatRadius = 0.01; // 平原半径 (缩小至0.2, 让山丘更靠近中心)

        if (distanceFromCenter < flatRadius) {
            return 0; // 中心区域为平原
        }

        const noiseScale = 0.004; // 降低噪声频率，增大山丘之间的间距
        const mountainHeight = 30; // 减小山丘的最大高度

        // 使用噪声生成高度，随着距离增加高度增大
        const noiseValue = this.noise2D(x * noiseScale, z * noiseScale);
        return noiseValue * mountainHeight * (distanceFromCenter - flatRadius);
    }

    createTerrain(){
        // 创建多个平面并修改其顶点高度
        this.planePositions.forEach(([x, y, z]) => {
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100); // 使用较多细分以实现平滑地形
            geometry.rotateX(-Math.PI / 2);

            // 调整每个顶点的高度
            geometry.attributes.position.array.forEach((_, idx) => {
                if (idx % 3 === 0) { // 仅处理 X、Z 坐标的每个顶点
                    const vx = geometry.attributes.position.getX(idx / 3); // 获取 X 坐标
                    const vz = geometry.attributes.position.getZ(idx / 3); // 获取 Z 坐标
                    const height = this.generateHeight(vx + x, vz + z); // 基于噪声生成高度
                    geometry.attributes.position.setY(idx / 3, height); // 设置 Y 高度
                }
            });

            geometry.computeVertexNormals(); // 重新计算法向量，以使光照效果正确

            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(x, y, z);
            this.scene.add(plane);
            this.planes.push(plane);
        });
    }
}

export class Hill extends terrain {
    constructor(camera, scene) {
        super(camera, scene);

        // 使用固定种子创建确定性的噪声生成器
        const rng = seedrandom('fixed-seed'); // 固定种子，可以替换成任意字符串
        this.noise2D = createNoise2D(rng); // 使用固定的随机生成器初始化噪声

        this.createTerrain();
    }

    GroundTexture(){
        const groundTexture = this.textureLoader.load('./Resource/island.png');  // 替换为您的纹理路径
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(100,100);  // 大量重复纹理，模拟延伸
        return groundTexture;
    }

    generateHeight(x, z) {
        const noiseScale = 0.005; // 噪声缩放比例
        const maxHeight = 160;    // 中心的最大高度值
        const distanceFromCenter = Math.sqrt(x * x + z * z) / this.planeSize; // 距离中心的相对距离

        // 中心高度较高，远离中心逐渐降低并趋向平坦
        const centerHeight = maxHeight * Math.exp(-distanceFromCenter*2); // 使用指数函数控制高度衰减

        // 使用噪声生成地形细节，并且随着距离增加降低噪声影响
        const noise = this.noise2D(x * noiseScale, z * noiseScale) * 15 * (1 - distanceFromCenter);

        return centerHeight + noise;
    }

    createTerrain() {
        // 创建多个平面并修改其顶点高度
        this.planePositions.forEach(([x, y, z]) => {
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100); // 使用较多细分以实现平滑地形
            geometry.rotateX(-Math.PI / 2);

            // 调整每个顶点的高度
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vx = geometry.attributes.position.getX(i); // 获取 X 坐标
                const vz = geometry.attributes.position.getZ(i); // 获取 Z 坐标
                const height = this.generateHeight(vx + x, vz + z); // 基于噪声生成高度
                geometry.attributes.position.setY(i, height); // 设置 Y 高度
            }

            geometry.computeVertexNormals(); // 重新计算法向量，以使光照效果正确

            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(x - 20, y - 158, z - 9); // 向下平移 103 单位
            this.scene.add(plane);
            this.planes.push(plane);
        });
    }
}

export class Grassland extends terrain {
    constructor(camera, scene) {
        super(camera, scene);

        // 使用固定种子创建一致的噪声生成器
        const rng = seedrandom('fixed-seed');
        this.noise2D = createNoise2D(rng);

        this.createTerrain();
        this.createWaterSurface(); // 添加水面
    }

    GroundTexture() {
        const groundTexture = this.textureLoader.load('./Resource/grass.png');  // 替换为您的草地纹理路径
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(100, 100);
        return groundTexture;
    }

    generateHeight(x, z) {
        const noiseScale = 0.005;
        const maxHeight = 20;       // 高地的最大高度
        const riverWidth = 20;      // 河流宽度
        const hillRadius = 30;      // 高地的半径
        const distanceFromCenter = Math.sqrt(x * x + z * z); // 到中心的距离

        // 中心形成高地，周边为河流和草原
        let height;
        if (distanceFromCenter < hillRadius) {
            // 在高地范围内，噪声高度逐渐增加
            height = this.noise2D(x * noiseScale, z * noiseScale) * maxHeight * (1 - distanceFromCenter / hillRadius);
        } else if (distanceFromCenter < hillRadius + riverWidth) {
            // 在高地外围生成河流，降低该区域的高度
            const riverDepth = 15;
            height = -riverDepth * (1 - (distanceFromCenter - hillRadius) / riverWidth); // 靠近高地区域形成河流
        } else {
            // 更远的区域保持平缓起伏
            height = this.noise2D(x * noiseScale, z * noiseScale) * (maxHeight / 4);
        }
        return height;
    }

    createTerrain() {
        this.planePositions.forEach(([x, y, z]) => {
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100);
            geometry.rotateX(-Math.PI / 2);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vx = geometry.attributes.position.getX(i);
                const vz = geometry.attributes.position.getZ(i);
                const height = this.generateHeight(vx + x, vz + z);
                geometry.attributes.position.setY(i, height);
            }

            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(x-9, y-2, z+2);
            this.scene.add(plane);
            this.planes.push(plane);
        });
    }

    createWaterSurface() {
        // 创建水面几何体
        const waterGeometry = new THREE.PlaneGeometry(this.planeSize * 3, this.planeSize * 3);

        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                './Resource/waternormals.jpg',
                function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
                }
            ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined,
        })

        water.rotation.x = -Math.PI / 2;
        water.position.y = -5; // 将水面置于河道最低位置以下
        this.scene.add(water)

        function animate() {
            requestAnimationFrame(animate)
            water.material.uniforms['time'].value += 1.0 / 60.0
        }

        animate();
    }
}
