import * as THREE from '../three/build/three.module.js';
import * as CANNON from '../cannon-es-0.19.0/dist/cannon-es.js';

const FIX = true;

/**
 * @author Cox-Andrew
 * @author mrdoob / http://mrdoob.com/
 * @author schteppe / https://github.com/schteppe
 */
class PointerLockControlsArtemis extends THREE.EventDispatcher {
  constructor(
      camera, cannonBody, moveVelocity = 20, jumpVelocity = 20, eyeYPos = 2, sensitivity = 1) {
    super();

    this.enabled = false;

    this.cannonBody = cannonBody;

    this.moveVelocity = moveVelocity;
    this.jumpVelocity = jumpVelocity;

    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);

    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = eyeYPos;
    this.yawObject.add(this.pitchObject);

    this.quaternion = new THREE.Quaternion();

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.canJump = false;

    this.sensitivity = sensitivity;

    const contactNormal = new CANNON.Vec3(); // Normal in the contact, pointing *out* of whatever the player touched
    const upAxis = new CANNON.Vec3(0, 1, 0);
    this.cannonBody.addEventListener('collide', (event) => {
      const {contact} = event;

      // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
      // We do not yet know which one is which! Let's check.
      if (contact.bi.id === this.cannonBody.id) {
        // bi is the player body, flip the contact normal
        contact.ni.negate(contactNormal);
      } else {
        // bi is something else. Keep the normal as it is
        contactNormal.copy(contact.ni);
      }

      // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
      if (contactNormal.dot(upAxis) > 0.5) {
        // Use a "good" threshold value between 0 and 1 here!
        this.canJump = true;
      }
    });

    this.velocity = this.cannonBody.velocity;

    // Moves the camera to the cannon.js object position and adds velocity to the object if the run key is down
    this.inputVelocity = new THREE.Vector3();
    this.euler = new THREE.Euler();

    this.lockEvent = {type: 'lock'};
    this.unlockEvent = {type: 'unlock'};

    // Fix code
    if (FIX) {
      this.prevMoveX = Number.POSITIVE_INFINITY;
      this.prevMoveY = Number.POSITIVE_INFINITY;
    }

    this.connect();
  }

  connect() {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerlockChange);
    document.addEventListener('pointerlockerror', this.onPointerlockError);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  disconnect() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerlockChange);
    document.removeEventListener('pointerlockerror', this.onPointerlockError);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  dispose() {
    this.disconnect();
  }

  lock() {
    document.body.requestPointerLock();
  }

  unlock() {
    document.exitPointerLock();
  }

  onPointerlockChange = () => {
    if (document.pointerLockElement) {
      this.dispatchEvent(this.lockEvent);

      this.isLocked = true;
    } else {
      this.dispatchEvent(this.unlockEvent);

      this.isLocked = false;
    }
  };

  onPointerlockError = () => {
    console.error('PointerLockControlsCannon: Unable to use Pointer Lock API');
  };

  onMouseMove = (event) => {
    if (!this.enabled) {
      return;
    }

    let {movementX, movementY} = event;

    if (FIX) {
      if (movementX > 100 || movementX < -100) console.log("x: " + movementX);
      if (movementY > 100 || movementY < -100) console.log("y: " + movementY);

      let temp = movementX;
      if (Math.abs(movementX) > Math.abs(this.prevMoveX) * 1.5) {
        movementX = this.prevMoveX;
      }
      this.prevMoveX = temp;

      temp = movementY;
      if (Math.abs(movementY) > Math.abs(this.prevMoveY) * 1.2) {
        movementY = this.prevMoveY;
      }
      this.prevMoveY = temp;
    }

    this.yawObject.rotation.y -= movementX * 0.001 * this.sensitivity;
    this.pitchObject.rotation.x -= movementY * 0.001 * this.sensitivity;

    this.pitchObject.rotation.x = Math.max(-Math.PI / 2,
        Math.min(Math.PI / 2, this.pitchObject.rotation.x));
  };

  onKeyDown = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;

      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;

      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;

      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;

      case 'Space':
        if (this.canJump) {
          this.velocity.y = this.jumpVelocity;
        }
        this.canJump = false;
        break;
    }
  };

  onKeyUp = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;

      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;

      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;

      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
    }
  };

  getObject() {
    return this.yawObject;
  }

  getDirection() {
    const vector = new THREE.Vector3(0, 0, -1);
    vector.applyQuaternion(this.quaternion);
    return vector;
  }

  update() {
    if (this.enabled === false) {
      return;
    }

    this.inputVelocity.set(0, 0, 0);

    this.inputVelocity.z += this.moveBackward - this.moveForward;
    this.inputVelocity.x += this.moveRight - this.moveLeft;

    this.inputVelocity.normalize();
    this.inputVelocity.multiplyScalar(this.moveVelocity);

    // Convert velocity to world coordinates
    this.euler.x = this.pitchObject.rotation.x;
    this.euler.y = this.yawObject.rotation.y;
    this.euler.order = 'XYZ';
    this.quaternion.setFromEuler(this.euler);
    this.inputVelocity.applyQuaternion(this.quaternion);

    // Add to the object
    this.velocity.x = this.inputVelocity.x;
    this.velocity.z = this.inputVelocity.z;

    this.yawObject.position.copy(this.cannonBody.position);
  }
}

export {PointerLockControlsArtemis};
