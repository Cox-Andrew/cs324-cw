import * as THREE from '../three/build/three.module.js';
import {PointerLockControls} from './PointerLockControlsFix.js';
import Stats from '../three/examples/jsm/libs/stats.module.js';

const CAMERA_FOV = 70;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

const FOG_COLOR = '#ffffff';
const FOG_NEAR = 1;
const FOG_FAR = 800;

const HEM_SKY_COLOR = '#bde6ff';
const HEM_GROUND_COLOR = '#82aa14';
const HEM_INTENSITY = 0.6;

const GROUND_COLOR = '#82aa14';

const SUN_COLOR = '#fdfbd3';
const SUN_INTENSITY = 1;
const SUN_FAR = 1000;

const JUMP_VELOCITY = 4;
const GRAVITY = 9.8;
const PLAYER_HEIGHT = 1.8;
const FRICTION = 5;
const ACCELERATION = 20;

let camera, scene, renderer, controls, stats;

const objects = [];

let jumpRaycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
// const color = new THREE.Color();

init();
animate();

function init() {
    // Setup camera
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
    camera.position.y = PLAYER_HEIGHT;

    // Setup scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

    let skyboxURLs = [
        '../resources/skybox/east.bmp',
        '../resources/skybox/west.bmp',
        '../resources/skybox/up.bmp',
        '../resources/skybox/down.bmp',
        '../resources/skybox/north.bmp',
        '../resources/skybox/south.bmp'
    ];
    scene.background = new THREE.CubeTextureLoader().load(skyboxURLs);

    // Add light sources
    // Position of hemisphereLight is irrelevant - only +/- the axis affects ground vs sky
    const hemisphereLight = new THREE.HemisphereLight(HEM_SKY_COLOR, HEM_GROUND_COLOR, HEM_INTENSITY);
    hemisphereLight.position.set(0, 2, 0);
    scene.add(hemisphereLight);

    const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight);
    scene.add(hemisphereLightHelper);

    // Direction affects shadow direction, position affects centre of shadow map => where it gets clipped
    const sunLight = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
    sunLight.position.set(1, 0.75, 0.6);
    sunLight.position.multiplyScalar(5);
    scene.add(sunLight);

    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;

    const d = 50;

    sunLight.shadow.camera.left = - d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = - d;

    sunLight.shadow.camera.far = SUN_FAR;
    sunLight.shadow.bias = - 0.0001;

    const directionalLightHelper = new THREE.DirectionalLightHelper(sunLight);
    scene.add(directionalLightHelper);

    // Init controls
    controls = new PointerLockControls(camera, document.body);
    // TODO: check - think this just adds camera, getObject is depreciated
    scene.add(controls.getObject());

    // Init pointer lock/unlock listeners
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    // Add movement control listeners
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if (canJump === true) velocity.y += JUMP_VELOCITY;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );

    // Init raycaster for jump collision detection
    // Ray is directed straight down
    jumpRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 1);

    // Create a subdivided plane for the ground
    let groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    groundGeometry.rotateX(-Math.PI / 2);
    //
    // // Randomly displace all the vertices on the plane to create texture
    // // Select position buffer of all vertex positions in plane
    // let position = groundGeometry.attributes.position;
    //
    // // Iterate over vertices in plane and displace
    // for (let i = 0, l = position.count; i < l; i ++) {
    //     vertex.fromBufferAttribute(position, i);
    //
    //     vertex.x += Math.random() * 20 - 10;
    //     vertex.y += Math.random() * 2;
    //     vertex.z += Math.random() * 20 - 10;
    //
    //     position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    // }
    //
    // groundGeometry = groundGeometry.toNonIndexed(); // ensure each face has unique vertices

    // Generate random ground colors through the use of vertex colours
    // position = groundGeometry.attributes.position;
    // const groundColors = [];
    // for ( let i = 0, l = position.count; i < l; i ++ ) {
    //     groundColors.push(130 / 255, 150 / 255, 59 / 255);
    // }
    //
    // groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
    const groundMaterial = new THREE.MeshLambertMaterial({color: GROUND_COLOR});

    // Add ground to scene
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.castShadow = true;
    scene.add(ground);

    // Add box
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cubeMat = new THREE.MeshStandardMaterial({color: '#ffffff'});
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    cubeMesh.position.set(3, 2, 3);
    scene.add(cubeMesh);
    objects.push(cubeMesh);

    // TODO: Load tree models


    // Init renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "gl-canvas";
    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    // Physics are based on PointerLockControls example
    if (controls.isLocked === true) {
        jumpRaycaster.ray.origin.copy(controls.getObject().position);
        // Shift ray origin to feet
        jumpRaycaster.ray.origin.y -= PLAYER_HEIGHT;
        // Check for intersections with objects from list
        const intersections = jumpRaycaster.intersectObjects(scene.children, false);
        // If any intersections, we are on object
        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        // friction
        velocity.x -= velocity.x * FRICTION * delta;
        velocity.z -= velocity.z * FRICTION * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * ACCELERATION * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * ACCELERATION * delta;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        } else {
            velocity.y -= GRAVITY * delta;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        if (controls.getObject().position.y < PLAYER_HEIGHT) {
            velocity.y = 0;
            controls.getObject().position.y = PLAYER_HEIGHT;

            canJump = true;
        }
    }

    prevTime = time;

    renderer.render(scene, camera);
}