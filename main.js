import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import './style.css';

// Texture
const loader = new THREE.TextureLoader();

const texture = loader.load('./map.avif');
const displacement = loader.load('./DisplacementMap.png');
const alpha = loader.load('./alpha.jpg');

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// Helpers

// Vector3 Array to Typed Array
const Vector3ArrayToTyped = (v3Array) => {
    let i = 0,
        len = v3Array.length,
        vertArray = [];
    while (i < len) {
        let v = v3Array[i];
        vertArray.push(v.x, v.y, v.z);
        i += 1;
    }
    return new THREE.Float32BufferAttribute(vertArray, 3);
};

// Buffer Geometry from v3Array
const Vector3ArrayToGeometry = (v3Array) => {
    const typedArray = Vector3ArrayToTyped(v3Array);
    const geometry = new THREE.BufferGeometry();
    return geometry.setAttribute('position', typedArray);
};

// Vector3 array from geometry
const Vector3ArrayFromGeometry = (geometry) => {
    const pos = geometry.getAttribute('position');
    let i = 0;
    const len = pos.count,
        v3Array = [];
    while (i < len) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        v3Array.push(v);
        i += 1;
    }
    return v3Array;
};

// lerp two vector3 arrays
const Vector3ArrayLerp = (v3Array_1, v3Array_2, alpha) => {
    return v3Array_1.map((v, i) => {
        return v.clone().lerp(v3Array_2[i], alpha);
    });
};

// Debug
const gui = new dat.GUI();

// Scene
const scene = new THREE.Scene();

// Geometry
const geometry = new THREE.PlaneGeometry(3, 3, 64, 64);

const cylinderGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 64, 64);
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

const v3Array_1 = Vector3ArrayFromGeometry(sphereGeometry);

const v3Array_2 = v3Array_1.map((v) => {
    const vd = new THREE.Vector3();
    vd.copy(v)
        .normalize()
        .multiplyScalar(2 + 3 * THREE.MathUtils.seededRandom());
    return v.clone().add(vd);
});

const v3Array_3 = Vector3ArrayLerp(v3Array_1, v3Array_2, 0);

// Materials
const material = new THREE.MeshStandardMaterial({
    color: 'gray',
    map: texture,
    displacementMap: displacement,
    displacementScale: 0.8,
    alphaMap: alpha,
    transparent: true,
    depthTest: false,
});

const cylinderMaterial = new THREE.MeshDepthMaterial();

const pointsMaterial = new THREE.PointsMaterial({
    color: 0x888888,
    fog: true,
    size: 0.009,
});

// Mesh
const plane = new THREE.Mesh(geometry, material);
plane.position.y = 0.3;
plane.rotation.x = 300;

const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
// const sphere = new THREE.Points(sphereGeometry, pointsMaterial);
// sphere.position.set(0, 2, 3);

const points = new THREE.Points(
    Vector3ArrayToGeometry(v3Array_3),
    new THREE.PointsMaterial({
        color: 0x00afaf,
        size: 0.01,
    })
);
points.position.set(1, 2, 3);

scene.add(plane);
scene.add(cylinder);
scene.add(points);

// Light 1
const light = new THREE.PointLight(0x00b3ff, 3);
light.position.set(0, 5, 0);
light.intensity = 10;
scene.add(light);

gui.add(light.position, 'x').min(0).max(10).step(1);
gui.add(light.position, 'y').min(0).max(10).step(1);
gui.add(light.position, 'z').min(0).max(10).step(1);

const color = {
    color: '#00ff00',
};

gui.addColor(color, 'color').onChange(() => {
    light.color.set(color.color);
});

const lightHelper = new THREE.PointLightHelper(light, 1);
scene.add(lightHelper);
// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500);
camera.position.set(4, 4, 0);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(3);
renderer.render(scene, camera);

// Controlls
const controlls = new OrbitControls(camera, canvas);
// controlls.enabled = false;
controlls.enableDamping = false;
controlls.enablePan = false;
controlls.enableZoom = true;
controlls.autoRotate = true;
controlls.autoRotateSpeed = 5;

// Resize
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

// Animation
let alphaPeriod = 1;

const clock = new THREE.Clock();
let currentSecond = Math.floor(clock.getElapsedTime());

const loop = () => {
    const elapsedTime = clock.getElapsedTime();
    if (alphaPeriod >= 0) {
        alphaPeriod -= elapsedTime * 0.01;
        const newGeometry = Vector3ArrayToGeometry(Vector3ArrayLerp(v3Array_1, v3Array_2, alphaPeriod));
        points.geometry.copy(newGeometry);
    } else {
        points.rotation.y = 0.2 * elapsedTime;
    }

    if (currentSecond !== Math.floor(elapsedTime) && Math.floor(elapsedTime) % 2 === 0) {
        currentSecond = Math.floor(elapsedTime);
        plane.material.displacementScale = 0.5 + Math.random() * 0.5;
    }

    plane.rotation.z = 0.2 * elapsedTime;
    // sphere.rotation.y = 0.05 * elapsedTime;

    // controlls.update();
    renderer.render(scene, camera);
    // Call again on the next frame
    window.requestAnimationFrame(loop);
};

loop();
