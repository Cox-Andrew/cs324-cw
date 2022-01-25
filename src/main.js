import * as THREE from '../three/build/three.module.js';
import {PointerLockControls} from './PointerLockControlsFix.js';
import Stats from '../three/examples/jsm/libs/stats.module.js';
import {GLTFLoader} from '../three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from '../cannon-es-0.19.0/dist/cannon-es.js';
import {PointerLockControlsCannon} from "../cannon-es-0.19.0/examples/js/PointerLockControlsCannon.js";

const CAMERA_FOV = 70;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

const FOG_COLOR = '#ffffff';
const FOG_NEAR = 1;
const FOG_FAR = 800;

const HEM_SKY_COLOR = '#bde6ff';
const HEM_GROUND_COLOR = '#82aa14';
const HEM_INTENSITY = 0.8;

const GROUND_COLOR = '#82aa14';

const SUN_COLOR = '#fdfbd3';
const SUN_INTENSITY = 1;
const SUN_FAR = 1000;

const PLAYER_HEIGHT = 2;
const PHYS_TICK_RATE = 60;

let camera, scene, renderer, controls, stats, arrowRaycaster, clock, world, playerBody, activeCube;

const targets = [];

let score = 0;

init();
animate();

function init() {
    // Initialise clock
    clock = new THREE.Clock(false);

    // Initialise physics world
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, - 9.8, 0),
    })

    const solver = new CANNON.GSSolver();
    solver.iterations = 7;
    solver.tolerance = 0.01;
    world.solver = new CANNON.SplitSolver(solver);

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

    // Setup renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "gl-canvas";
    document.body.appendChild(renderer.domElement);

    // Setup stats module (fps count etc.)
    stats = new Stats();
    stats.dom.id = "stats";
    document.body.appendChild(stats.dom);

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
    // controls = new PointerLockControls(camera, document.body);
    // // TODO: check - think this just adds camera, getObject is depreciated
    // scene.add(controls.getObject());

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;
    world.broadphase.useBoundingBoxes = true;

    const physicsMat = new CANNON.Material();
    const matContact = new CANNON.ContactMaterial(physicsMat, physicsMat, {
       friction: 0.0,
       restitution: 0.3,
    });
    world.addContactMaterial(matContact);

    const playerShape = new CANNON.Sphere(1);
    playerBody = new CANNON.Body({
        mass: 5,
        material: physicsMat,
    });
    playerBody.addShape(playerShape);
    playerBody.linearDamping = 0.9;
    world.addBody(playerBody);

    // Create the ground physics
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        type: CANNON.BODY_TYPES.STATIC,
        material: physicsMat,
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    controls = new PointerLockControlsCannon(camera, playerBody);
    scene.add(controls.getObject());

    // Setup overlay controls and pointer capture events
    const splash = document.getElementById('splash');
    const blocker = document.getElementById('blocker');
    const levelSelect = document.getElementById('level-select');
    const pauseMenu = document.getElementById('pause');
    const overlay = document.getElementById('overlay');

    document.getElementById('start').addEventListener(
        'click', () => {
        splash.style.display = 'none';
        levelSelect.style.display = 'flex';
    });
    document.getElementById('forest').addEventListener(
        'click', () => controls.lock()
    );
    document.getElementById('desert').addEventListener(
        'click', () => controls.lock()
    );
    document.getElementById('resume').addEventListener(
        'click', () => controls.lock()
    );
    document.getElementById('return').addEventListener(
        'click', () => {
        pauseMenu.style.display = 'none';
        levelSelect.style.display = 'flex';
    });

    controls.addEventListener('lock', () => {
        controls.enabled = true;

        levelSelect.style.display = 'none';
        // pauseMenu.style.display = 'none';
        blocker.style.display = 'none';
        overlay.style.display = 'block';
        stats.dom.style.display = 'block';

        animate();
        clock.start();
    });

    controls.addEventListener('unlock', () => {
        clock.stop();
        controls.enabled = false;

        blocker.style.display = 'block';
        pauseMenu.style.display = 'flex';
        overlay.style.display = 'none';
        stats.dom.style.display = 'none';
    });

    // Register click (shoot) listener
    document.body.addEventListener('mousedown', onMouseDown);

    // Listen for window resize
    window.addEventListener('resize', onWindowResize);

    // Arrow raycaster
    arrowRaycaster = new THREE.Raycaster();

    // ======================== Add geometry to scene ========================

    // Create a subdivided plane for the ground
    let groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    groundGeometry.rotateX(-Math.PI / 2);

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
    scene.add(ground);

    // Add box
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cubeMat = new THREE.MeshStandardMaterial({color: '#ffffff'});
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    cubeMesh.position.set(3, 2, 3);
    scene.add(cubeMesh);
    targets.push(cubeMesh);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileCubemapShader();
    const envMapTarget = pmremGenerator.fromScene(scene);

    activeCube = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 2),
        new THREE.MeshStandardMaterial({
            color: '#ff00ff',
            flatShading: true,
            metalness: 0.7,
            roughness: 0,
            envMap: envMapTarget.texture
        })
    )
    activeCube.castShadow = true;
    activeCube.position.set(-3, 2, -3);

    scene.add(activeCube);

    // TODO: Load tree models
    // CommonTree_Autumn_1.blend -5
    // BirchTree_Autumn_1.blend -5
    // Willow_Autumn_1.blend -5
    // PineTree_1.blend -5

    const loader = new GLTFLoader();
    for (let i = 1; i <= 5; i++) {
        loader.load( `../resources/low-poly-nature/CommonTree_Autumn_${i}.blend.glb`, (gltf) => {
            gltf.scene.rotateY(Math.random() * 2 * Math.PI);
            gltf.scene.scale.multiplyScalar(3);
            gltf.scene.traverse((node) => {
                if (node.isMesh) node.castShadow = true;
            });
            gltf.scene.translateOnAxis(new THREE.Vector3(Math.random(), 0, Math.random()), 50);
            scene.add(gltf.scene);
        }, undefined, (error) => {
            console.error(error);
        });
    }
}

// Fire arrow
function onMouseDown() {
    if (!controls.enabled) return;
    const tempVec = new THREE.Vector3();
    arrowRaycaster.set(camera.position, controls.getDirection(tempVec));

    const intersects = arrowRaycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
        let target = intersects[0].object;
        target.visible = false;
        score++;
        document.getElementById("score").innerText = score;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    if (!controls.enabled) return;

    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Step physics engine
    // 60Hz tick rate, use clock as it allows us to pause on menu
    world.step(1 / PHYS_TICK_RATE, delta);

    // TODO: remove this
    // Rotating icosahedron to show active render
    activeCube.rotation.y += 0.01;

    controls.update(delta);

    renderer.render(scene, camera);

    stats.update();
}