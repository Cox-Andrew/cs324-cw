import * as THREE from '../three/build/three.module.js';
import {PointerLockControls} from '../three/examples/jsm/controls/PointerLockControls.js';

const FOV = 75;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const FOG_COLOR = '#ffffff';
const FOG_NEAR = 1;
const FOG_FAR = 800;
const HEM_SKY_COLOR = '#bde6ff';
const HEM_GROUND_COLOR = '#82aa14';
const HEM_INTENSITY = 0.5;
const JUMP_VELOCITY = 350;
const GROUND_COLOR = '#82aa14';
const SUN_COLOR = '#fdfbd3';
const SUN_INTENSITY = 0.8;

let camera, scene, renderer, controls;

const objects = [];

let raycaster;

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
    camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
    camera.position.y = 10;

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
    const hemisphereLight = new THREE.HemisphereLight(HEM_SKY_COLOR, HEM_GROUND_COLOR, HEM_INTENSITY);
    scene.add(hemisphereLight);

    const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 10);
    scene.add(hemisphereLightHelper);

    const directionalLight = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
    directionalLight.position.set(0, 100, 0);
    scene.add(directionalLight);

    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 10);
    scene.add(directionalLightHelper);

    // Init controls
    controls = new PointerLockControls(camera, document.body);
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

    // Init raycaster for collision detection
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10 );

    // Create a subdivided plane for the ground
    let groundGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    groundGeometry.rotateX(-Math.PI / 2);

    // Randomly displace all the vertices on the plane to create texture
    // Select position buffer of all vertex positions in plane
    let position = groundGeometry.attributes.position;

    // Iterate over vertices in plane and displace
    for (let i = 0, l = position.count; i < l; i ++) {
        vertex.fromBufferAttribute(position, i);

        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    groundGeometry = groundGeometry.toNonIndexed(); // ensure each face has unique vertices

    // Generate random ground colors through the use of vertex colours
    // position = groundGeometry.attributes.position;
    // const groundColors = [];
    // for ( let i = 0, l = position.count; i < l; i ++ ) {
    //     groundColors.push(130 / 255, 150 / 255, 59 / 255);
    // }
    //
    // groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
    const groundMaterial = new THREE.MeshBasicMaterial({color: GROUND_COLOR});

    // Add ground to scene
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    scene.add(ground);

    // Boxes
    const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 ).toNonIndexed();

    position = boxGeometry.attributes.position;
    const colorsBox = [];

    for ( let i = 0, l = position.count; i < l; i ++ ) {

        color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
        colorsBox.push( color.r, color.g, color.b );

    }

    boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

    for ( let i = 0; i < 500; i ++ ) {

        const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
        boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

        const box = new THREE.Mesh( boxGeometry, boxMaterial );
        box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
        box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
        box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

        scene.add( box );
        objects.push( box );

    }

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.id = "gl-canvas";
    document.body.appendChild(renderer.domElement);

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

    if (controls.isLocked === true) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects, false);

        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;
        }
    }

    prevTime = time;

    renderer.render(scene, camera);
}