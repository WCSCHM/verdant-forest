import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom';
import { Water } from 'three/addons';
import { LeafGeometry } from "./leaf_flower_fruit/LeafGeometry";
import { FlowerGeometry } from "./leaf_flower_fruit/FlowerGeometry";

/**
 * 在给定顶点坐标（世界坐标）上，随机散布“草 + 花”组合，让花朵处于草丛中间。
 * @param {THREE.Scene} scene       - Three.js 场景
 * @param {THREE.TextureLoader} loader - 纹理加载器
 * @param {number[]} vertices       - 世界坐标数组 [x0,y0,z0, x1,y1,z1, ...]
 * @param {number|null} waterLevel  - 若需要排除水面以下区域，可传水面高度；无则传 null
 */
function scatterGrassAndFlowers(scene, loader, vertices, waterLevel = null) {
    const grassTexture = loader.load("/resources/images/grass.png");
    const flowerTexture = loader.load("/resources/images/dingxiang/flower_base.png");

    const grassGeo = new LeafGeometry("cross", 3, 3).generate();
    const flowerGeo = new FlowerGeometry()
        .generate()
        .scale(0.3, 0.3, 0.3)
        .translate(0, 1.5, 0); // 花稍微抬高，让其从草丛中显露

    const grassMat = new THREE.MeshBasicMaterial({
        map: grassTexture,
        side: THREE.DoubleSide,
        color: 0x646464,
        alphaTest: 0.1,
    });
    const flowerMat = new THREE.MeshBasicMaterial({
        map: flowerTexture,
        side: THREE.DoubleSide,
        color: 0x646464,
        alphaTest: 0.1,
    });

    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    const flowerMesh = new THREE.Mesh(flowerGeo, flowerMat);
    const grassFlowerGroupPrototype = new THREE.Group();
    grassFlowerGroupPrototype.add(grassMesh);
    grassFlowerGroupPrototype.add(flowerMesh);
    const total = 500; // 可根据需求调整数量
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const scaleVec = new THREE.Vector3();

    for (let i = 0; i < total; i++) {
        const randIndex = 3 * Math.floor(Math.random() * (vertices.length / 3));
        const x = vertices[randIndex];
        const y = vertices[randIndex + 1];
        const z = vertices[randIndex + 2];

        // 若指定 waterLevel，则过滤掉水面以下区域
        if (waterLevel !== null && y <= waterLevel) {
            continue;
        }

        const size = Math.random() * 2 + 2;
        scaleVec.set(size, size, size);

        quaternion.setFromAxisAngle(yAxis, Math.random() * Math.PI * 2);
        position.set(x, y, z);

        // 克隆“草+花”组合
        const newGroup = grassFlowerGroupPrototype.clone();
        newGroup.position.copy(position);
        newGroup.quaternion.copy(quaternion);
        newGroup.scale.copy(scaleVec);

        scene.add(newGroup);
    }
}

class terrain {
    constructor(camera, scene) {
        this.textureLoader = new THREE.TextureLoader();
        this.camera = camera;
        this.scene = scene;

        this.groundTexture = this.GroundTexture();

        this.planeSize = 1000; // 单块平面大小
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

    // 由子类覆盖
    GroundTexture() {}

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

export class Desert extends terrain {
    constructor(camera, scene) {
        super(camera, scene);
        this.createTerrain();
    }

    GroundTexture() {
        const groundTexture = this.textureLoader.load('./Resource/ground.jpg'); // 沙地纹理
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(1000, 1000);
        return groundTexture;
    }

    generateHeight(x, z) {
        const distanceFromCenter = Math.sqrt(x * x + z * z) / this.planeSize;
        const flatRadius = 0.01; // 中心更平坦

        if (distanceFromCenter < flatRadius) {
            return 0;
        }

        const noiseScale = 0.004;
        const mountainHeight = 30;
        const noiseValue = this.noise2D(x * noiseScale, z * noiseScale);

        return noiseValue * mountainHeight * (distanceFromCenter - flatRadius);
    }

    createTerrain() {
        const tempVec3 = new THREE.Vector3();

        this.planePositions.forEach(([px, py, pz]) => {
            // 创建 PlaneGeometry 并生成高度
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100);
            geometry.rotateX(-Math.PI / 2);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vx = geometry.attributes.position.getX(i);
                const vz = geometry.attributes.position.getZ(i);
                const height = this.generateHeight(vx + px, vz + pz);
                geometry.attributes.position.setY(i, height);
            }

            geometry.computeVertexNormals();

            // 创建网格
            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(px, py, pz);
            this.scene.add(plane);
            this.planes.push(plane);

            // 将几何顶点局部坐标转为世界坐标
            const verticesGlobal = [];
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                tempVec3.set(
                    geometry.attributes.position.getX(i),
                    geometry.attributes.position.getY(i),
                    geometry.attributes.position.getZ(i)
                );
                plane.localToWorld(tempVec3);
                verticesGlobal.push(tempVec3.x, tempVec3.y, tempVec3.z);
            }

            // 沙漠不考虑水面 => waterLevel = null
            scatterGrassAndFlowers(this.scene, this.textureLoader, verticesGlobal, null);
        });
    }
}

export class Hill extends terrain {
    constructor(camera, scene) {
        super(camera, scene);

        const rng = seedrandom('fixed-seed');
        this.noise2D = createNoise2D(rng); // 固定种子 => 地形可复现

        this.createTerrain();
    }

    GroundTexture() {
        const groundTexture = this.textureLoader.load('./Resource/island.png'); // 山地纹理
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(100, 100);
        return groundTexture;
    }

    generateHeight(x, z) {
        const noiseScale = 0.005;
        const maxHeight = 160;
        const distanceFromCenter = Math.sqrt(x * x + z * z) / this.planeSize;

        // 中心较高，离中心越远越低
        const centerHeight = maxHeight * Math.exp(-distanceFromCenter * 2);
        const noise = this.noise2D(x * noiseScale, z * noiseScale) * 15 * (1 - distanceFromCenter);

        return centerHeight + noise;
    }

    createTerrain() {
        const tempVec3 = new THREE.Vector3();

        this.planePositions.forEach(([px, py, pz]) => {
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100);
            geometry.rotateX(-Math.PI / 2);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vx = geometry.attributes.position.getX(i);
                const vz = geometry.attributes.position.getZ(i);
                const height = this.generateHeight(vx + px, vz + pz);
                geometry.attributes.position.setY(i, height);
            }

            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            // 这里按你的需求做一些位置微调
            plane.position.set(px - 20, py - 158, pz - 9);
            this.scene.add(plane);
            this.planes.push(plane);

            // 局部坐标 => 世界坐标
            const verticesGlobal = [];
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                tempVec3.set(
                    geometry.attributes.position.getX(i),
                    geometry.attributes.position.getY(i),
                    geometry.attributes.position.getZ(i)
                );
                plane.localToWorld(tempVec3);
                verticesGlobal.push(tempVec3.x, tempVec3.y, tempVec3.z);
            }

            // 山地也没水面 => waterLevel = null
            scatterGrassAndFlowers(this.scene, this.textureLoader, verticesGlobal, null);
        });
    }
}

export class Grassland extends terrain {
    constructor(camera, scene) {
        super(camera, scene);

        const rng = seedrandom('fixed-seed');
        this.noise2D = createNoise2D(rng);

        this.createTerrain();
        this.createWaterSurface();
    }

    GroundTexture() {
        const groundTexture = this.textureLoader.load('./Resource/grass.png'); // 草地纹理
        groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(100, 100);
        return groundTexture;
    }

    generateHeight(x, z) {
        const noiseScale = 0.005;
        const maxHeight = 20;
        const riverWidth = 20;
        const hillRadius = 30;
        const distanceFromCenter = Math.sqrt(x * x + z * z);

        let height;
        if (distanceFromCenter < hillRadius) {
            // 高地
            height = this.noise2D(x * noiseScale, z * noiseScale) * maxHeight * (1 - distanceFromCenter / hillRadius);
        } else if (distanceFromCenter < hillRadius + riverWidth) {
            // 河流区
            const riverDepth = 15;
            height = -riverDepth * (1 - (distanceFromCenter - hillRadius) / riverWidth);
        } else {
            // 远处平缓
            height = this.noise2D(x * noiseScale, z * noiseScale) * (maxHeight / 4);
        }
        return height;
    }

    createTerrain() {
        const tempVec3 = new THREE.Vector3();

        this.planePositions.forEach(([px, py, pz]) => {
            const geometry = new THREE.PlaneGeometry(this.planeSize, this.planeSize, 100, 100);
            geometry.rotateX(-Math.PI / 2);

            for (let i = 0; i < geometry.attributes.position.count; i++) {
                const vx = geometry.attributes.position.getX(i);
                const vz = geometry.attributes.position.getZ(i);
                const height = this.generateHeight(vx + px, vz + pz);
                geometry.attributes.position.setY(i, height);
            }

            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({ map: this.groundTexture });
            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(px - 9, py - 2, pz + 2);
            this.scene.add(plane);
            this.planes.push(plane);

            // 转为世界坐标
            const verticesGlobal = [];
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                tempVec3.set(
                    geometry.attributes.position.getX(i),
                    geometry.attributes.position.getY(i),
                    geometry.attributes.position.getZ(i)
                );
                plane.localToWorld(tempVec3);
                verticesGlobal.push(tempVec3.x, tempVec3.y, tempVec3.z);
            }

            // Grassland 带水面 => 传 waterLevel = -5, 排除 y <= -5 区域
            scatterGrassAndFlowers(this.scene, this.textureLoader, verticesGlobal, -5);
        });
    }

    createWaterSurface() {
        const waterGeometry = new THREE.PlaneGeometry(this.planeSize * 3, this.planeSize * 3);
        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('./Resource/waternormals.jpg', texture => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: this.scene.fog !== undefined,
        });

        water.rotation.x = -Math.PI / 2;
        // 对应 generateHeight 中的“河流最低点”
        water.position.y = -5;
        this.scene.add(water);

        const animateWater = () => {
            requestAnimationFrame(animateWater);
            water.material.uniforms['time'].value += 1.0 / 60.0;
        };
        animateWater();
    }
}
