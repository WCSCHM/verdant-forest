import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Clock } from 'three';
import { MathUtils } from 'three';

async function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    //renderer.background='red'
    document.body.appendChild(renderer.domElement);
    let loader = new GLTFLoader();//加载模型
    const loadedData = await loader.loadAsync('./Resource/Parrot.glb');
    const model = loadedData.scene.children[0];
    console.log(model, 'model')
    model.position.set(0, 0, 0);
    //加载动画

    const mixer = new THREE.AnimationMixer(model)

    //位置动画剪辑
    const positionKF = new THREE.VectorKeyframeTrack(
        ".position",
        [0, 20, 40],
        [ 0, 0, -200 * Math.tan(20) / 2,
            0, 0, 200 * Math.tan(20) / 2,
            0, 0, -200 * Math.tan(20) / 2]
    );

    // const quaternion = new THREE.Quaternion();
    // var qInitial = quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
    // var qFinal = quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    // console.log(qInitial, qFinal)
    // const rotationKF = new THREE.QuaternionKeyframeTrack(
    //   ".quaternion",
    //   [0, 10, 11],
    //   [qInitial.x, qInitial.y, qInitial.z, qInitial.w,
    //   qInitial.x, qInitial.y, qInitial.z, qInitial.w,
    //   qFinal.x, qFinal.y, qFinal.z, qFinal.w]
    // )
    const rotationKF = new THREE.QuaternionKeyframeTrack(
        ".quaternion",
        [0, 20, 25],
        [ 0, 0, 0, 1,
            0, 0, 0, 1,
            0, 1, 0, 0,
        ]
    )

    const moveBlinkClip = new THREE.AnimationClip("move-n-blink", -1, [
        positionKF, rotationKF
    ]);

    //模型上加载的动画
    const clip = loadedData.animations[0]
    const action = mixer.clipAction(clip)
    const action1 = mixer.clipAction(moveBlinkClip)
    action.play()
    action1.play()

    //相机

    const fov = 40;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(200, 0, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    //场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');
    const axesHelper = new THREE.AxesHelper(10);//红色代表 X 轴. 绿色代表 Y 轴. 蓝色代表 Z 轴.
    scene.add(axesHelper);
    //灯光
    {

        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);

    }
    scene.add(model)

    const orbitControls = new OrbitControls(camera, canvas)
    const clock = new Clock();

    renderer.setAnimationLoop(() => {//
        const delta = clock.getDelta();
        mixer.update(delta)
        resizeRendererToDisplaySize(renderer)
        renderer.render(scene, camera);
    });
    renderer.render(scene, camera);



    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            camera.lookAt(model.position)
            renderer.setSize(width, height, false);
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
    }



    // function render(time) {

    //   time *= 0.001;

    //   if (resizeRendererToDisplaySize(renderer)) {

    //     const canvas = renderer.domElement;
    //     camera.aspect = canvas.clientWidth / canvas.clientHeight;
    //     camera.updateProjectionMatrix();
    //     console.log(canvas.clientWidth);
    //   }
    //   renderer.render(scene, camera);
    //   requestAnimationFrame(render);

    // }
    // requestAnimationFrame(render);
}

main();