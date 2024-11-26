import * as THREE from 'three';
import {Sky} from 'three/examples/jsm/objects/Sky.js';




//晴天 10，3，0.005，0.7
//阴天 20，0.5，0.1，0.8
export class sky{
    constructor(scene,camera){
        this.scene=scene;
        this.camera = camera;

        this.mySky = new Sky();
        this.mySun = new THREE.Vector3();
        this.mySky.scale.setScalar(10000); // 设置天空的范围，使其覆盖整个场景
    }

    getSky(){
        return this.mySky;
    }

    setParam(turbidity,rayleigh,mieCoefficient,mieDirectionalG){
        this.mySky.material.uniforms['turbidity'].value = turbidity;
        this.mySky.material.uniforms['rayleigh'].value = rayleigh;
        this.mySky.material.uniforms['mieCoefficient'].value = mieCoefficient;
        this.mySky.material.uniforms['mieDirectionalG'].value = mieDirectionalG;
    }

    Sun(Elevation,Azimuth){
        // 设置太阳的位置（通过改变仰角和方位角实现太阳位置调整）
        const elevation = Elevation; // 太阳的仰角（影响天空的亮度）
        const azimuth = Azimuth; // 太阳的方位角（决定太阳的方向）

        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        this.mySun.setFromSphericalCoords(1, phi, theta);
        this.mySky.material.uniforms['sunPosition'].value.copy(this.mySun);
    }

}

export class Sunny extends sky{
    constructor(scene,camera) {
        super(scene,camera);
        this.turbidity=0.8;
        this.rayleigh=0.4;
        this.mieCoefficient=0.002;
        this.mieDirectionalG=0.995;
        this.Elevation=20;
        this.Azimuth=180;
        this.createSunnySky();
        this.scene.add(this.mySky);
        this.scene.add(this.Light());
    }

    Light(){
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.copy(this.mySun);
        return sunLight;
    }

    createSunnySky(){
        super.setParam(this.turbidity,this.rayleigh,this.mieCoefficient,this.mieDirectionalG);
        super.Sun(this.Elevation,this.Azimuth);

    }

    addCloud() {

    }


}

export class Sunset extends sky{
    constructor(scene,camera) {
        super(scene,camera);
        this.turbidity=10;
        this.rayleigh=2;
        this.mieCoefficient=0.005;
        this.mieDirectionalG=0.8;
        this.createSunsetSky();
        this.scene.add(this.mySky);
        this.scene.add(this.Light());
    }

    Sun(Elevation,Azimuth){
        // 设置太阳的位置（通过改变仰角和方位角实现太阳位置调整）
        const elevation = Elevation; // 太阳的仰角（影响天空的亮度）
        const azimuth = Azimuth; // 太阳的方位角（决定太阳的方向）

        const theta = Math.PI * (0.5);
        const phi = 2 * Math.PI * (0.25);
        this.mySun.setFromSphericalCoords(1, phi, theta);
        this.mySky.material.uniforms['sunPosition'].value.copy(this.mySun);
    }

    Light(){
        return new THREE.AmbientLight(0x404040, 2);
    }

    createSunsetSky(){
        super.setParam(this.turbidity,this.rayleigh,this.mieCoefficient,this.mieDirectionalG);
        this.Sun(this.Elevation,this.Azimuth);
    }
}

export class Cloudy extends sky{
    constructor(scene,camera) {
        super(scene,camera);
        this.turbidity=20;
        this.rayleigh=1;
        this.mieCoefficient=0.1;
        this.mieDirectionalG=0.95;
        this.Elevation=5;
        this.Azimuth=100;
        this.createCloudySky();
        this.scene.add(this.mySky);
        this.scene.add(this.Light());
    }

    Light(){
        const sunLight = new THREE.DirectionalLight(0x88aaff, 0.2);
        sunLight.position.copy(this.mySun);
        return sunLight;
    }

    createCloudySky(){
        super.setParam(this.turbidity,this.rayleigh,this.mieCoefficient,this.mieDirectionalG);
        super.Sun(this.Elevation,this.Azimuth);
    }

}




