import {OrbitControls} from './OrbitControls.js'


// ============================================================================
// 1. SCENE SETUP & BASIC CONFIGURATION
// ============================================================================

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Set background and enable shadows
scene.background = new THREE.Color(0x000000);
renderer.shadowMap.enabled = true;

// Load textures
const textureLoader = new THREE.TextureLoader();
const courtTexture = textureLoader.load("src/court_texture_wood.png");
courtTexture.wrapS = THREE.RepeatWrapping;
courtTexture.wrapT = THREE.RepeatWrapping;
courtTexture.repeat.set(2, 4); // Repeat 4 times along length, 2 times along width
const basketballTexture = textureLoader.load("src/ball_texture.png");

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Set camera position and controls
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// ============================================================================
// 2. GAME STATE VARIABLES & CONSTANTS
// ============================================================================

// Basketball object reference
let basketball = null;

// Physics constants
const gravity = -9.8; // m/s² (scaled for our scene)
const scaledGravity = gravity * 0.5; // Adjust for our scene scale 
const groundY = 0.26; // Basketball resting height
const bounceRestitution = 0.6; // Energy loss on bounce (60% retained)
const minimumBounceVelocity = 0.1; // Stop bouncing below this velocity
const airResistance = 0.98; // Slight air resistance
const rotationDamping = 0.98; // Rotation air resistance
const groundRotationFriction = 0.85; // Rotation friction when on ground

// Basketball parameters
const basketballSpeed = 0.15;
const rimRadius = 0.3;
const ballRadius = 0.15;

// Court boundaries
const courtBounds = {
    minX: -9.3,    // Left boundary 
    maxX: 9.3,     // Right boundary  
    minZ: -4.2,    // Back boundary
    maxZ: 4.2      // Front boundary
};

// Basketball physics state
let basketballVelocity = new THREE.Vector3(0, 0, 0);
let basketballAngularVelocity = new THREE.Vector3(0, 0, 0);
let basketballRotation = new THREE.Vector3(0, 0, 0);
let isbasketballFlying = false;
let maxHeightDuringFlight = 0;

// Shot power system
let shotPower = 50; // Starting power (50%)
const minPower = 0;
const maxPower = 100;
const powerChangeSpeed = 2; // How fast power changes per frame


// Game scoring system
let gameScore = {
    totalScore: 0,
    shotAttempts: 0,
    shotsMade: 0,
    shootingPercentage: 0
};

// Game state tracking
let shotInProgress = false;
let collisionAlreadyDetected = false;
let feedbackTimeout = null;
let shotResultDetected = false; 

// Hoop positions 
const hoops = [
    { 
        position: new THREE.Vector3(-10, 3.4, 0), 
        name: "left",
        rimCenter: new THREE.Vector3(-10, 3.4, 0),
        hasScored: false
    },
    { 
        position: new THREE.Vector3(10, 3.4, 0),  
        name: "right",
        rimCenter: new THREE.Vector3(10, 3.4, 0),
        hasScored: false
    }
];


// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyW: false,
    KeyS: false,
    Space: false,
    KeyR: false
};

// ============================================================================
// 3. UTILITY FUNCTIONS
// ============================================================================

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}
// Physics calculation functions
function calculateDistanceToHoop(ballPos, hoopPos) {
    const dx = hoopPos.x - ballPos.x;
    const dz = hoopPos.z - ballPos.z;
    return Math.sqrt(dx * dx + dz * dz);
}


function findNearestHoop() {
    if (!basketball) return hoops[0];
    
    let nearestHoop = hoops[0];
    let minDistance = calculateDistanceToHoop(basketball.position, hoops[0].position);
        
    for (let i = 1; i < hoops.length; i++) {
        const distance = calculateDistanceToHoop(basketball.position, hoops[i].position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestHoop = hoops[i];
        }
    }
    return nearestHoop;
}

// ============================================================================
// 4. SCENE CREATION FUNCTIONS
// ============================================================================

// Basketball hoop structure 
function createSupportStructure(group){
  const poleMat = new THREE.MeshPhongMaterial({ color: 0x464646 });

  const baseGeometry = new THREE.CylinderGeometry(0.5, 1, 0.4, 16);
  const base = new THREE.Mesh(baseGeometry, poleMat);
  base.position.set(0, 0.2, -1.1);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.6, 16), poleMat);
  pole.position.set(0, 2.73, -1.1);
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.65, 12), poleMat);
  arm.position.set(0, 3.7, -0.5);
  arm.rotation.x = degrees_to_radians(90);
  arm.castShadow = true;
  group.add(arm);
  
}

function createWhiteRectangle(width, height, thickness = 0.03) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  // Top line
  const topLine = new THREE.Mesh(
    new THREE.BoxGeometry(width, thickness, thickness),
    material
  );
  topLine.position.set(0, height/2, 0);
  
  // Bottom line  
  const bottomLine = new THREE.Mesh(
    new THREE.BoxGeometry(width, thickness, thickness),
    material
  );
  bottomLine.position.set(0, -height/2, 0);
  
  // Left line
  const leftLine = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, thickness),
    material
  );
  leftLine.position.set(-width/2, 0, 0);
  
  // Right line
  const rightLine = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, thickness),
    material
  );
  rightLine.position.set(width/2, 0, 0);
  
  group.add(topLine, bottomLine, leftLine, rightLine);
  return group;
}

function createBasketballHoop(x, y, z, facing){
  const group = new THREE.Group();
  createSupportStructure(group);

  const backboard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.1), new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  }));
  backboard.position.set(0, 3.7, 0.4);
  backboard.castShadow = true;
  backboard.receiveShadow = true;
  group.add(backboard);

  // BRANDED BACKBOARD (Bonus): 
  // Large rectangle (backboard outline)
  const backboardOutline = createWhiteRectangle(1.7, 1.02, 0.05);
  backboardOutline.position.set(0, 3.7, 0.44); 
  group.add(backboardOutline);
  // Small rectangle (inner target)
  const targetRectangle = createWhiteRectangle(0.6, 0.35, 0.04); // Smaller and thinner
  targetRectangle.position.set(0, 3.6, 0.44); 
  group.add(targetRectangle);
  /// ---

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 32), new THREE.MeshPhongMaterial({ color: 0xff6600 }));
  rim.position.set(0, 3.4, 0.75);
  rim.rotation.x = degrees_to_radians(90);
  rim.receiveShadow = true;
  rim.castShadow = true;
  group.add(rim);

  
  const netMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const p1 = new THREE.Vector3(Math.cos(a) * 0.3, 3.4, Math.sin(a) * 0.3 + 0.75);
    const p2 = new THREE.Vector3(Math.cos(a) * 0.09, 2.8, Math.sin(a) * 0.09 + 0.75);
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    group.add(new THREE.Line(geom, netMat));
  }
  
  // APPLY FACING DIRECTION (ROTATION)
  group.rotation.y = {
    right: 0,
    left: degrees_to_radians(180),
    forward: degrees_to_radians(-90),
    backward: degrees_to_radians(90)
  }[facing] || 0;
  // --- 

  group.position.set(x, y, z);
  scene.add(group);
  
}

// The court markings and lines
function createDetailedCourtMarkings(){
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  
  const createRectangle = (points) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineLoop(geometry, lineMaterial);
  };

  const createCircle = (x, z , start, end ) => {
    const curve = new THREE.EllipseCurve(x, z, 1, 1, start, end);
    const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, 0.11, p.y));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, lineMaterial);
  };

  const createDashedCircle = (x, z, start, end) => {
    const dashedLineMaterial = new THREE.LineDashedMaterial({ 
    color: 0xffffff,
    dashSize: 0.2,     
    gapSize: 0.1       
    });
    const curve = new THREE.EllipseCurve(x, z, 1, 1, start, end);
    const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, 0.11, p.y));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const dashedCircle = new THREE.Line(geometry, dashedLineMaterial);
    dashedCircle.computeLineDistances(); 
    return dashedCircle;
  };

  // LEFT SIDE (Key Area + Free Throw Circle)
  scene.add(createRectangle([
    new THREE.Vector3(-10, 0.11, -1.5), new THREE.Vector3(-6.2, 0.11, -1.5),
    new THREE.Vector3(-6.2, 0.11, 1.5), new THREE.Vector3(-10, 0.11, 1.5)
  ]));
  scene.add(createCircle(-6, 0,-Math.PI / 2,  Math.PI / 2 ));
  scene.add(createDashedCircle(-6,0,Math.PI / 2 , 3* Math.PI / 2 ));

  // RIGHT SIDE (Key Area + Free Throw Circle)
  scene.add(createRectangle([
    new THREE.Vector3(10, 0.11, -1.5), new THREE.Vector3(6.2, 0.11, -1.5),
    new THREE.Vector3(6.2, 0.11, 1.5), new THREE.Vector3(10, 0.11, 1.5)
  ]));
  scene.add(createCircle(6, 0, Math.PI / 2 , 3* Math.PI / 2  ));
  scene.add(createDashedCircle(6, 0,-Math.PI / 2,  Math.PI / 2  ));
  
}

function createCourtLines(){
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // CENTER LINE 
    const centerLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.11, -5), new THREE.Vector3(0, 0.11, 5)
      ]);
    scene.add(new THREE.Line(centerLine, lineMaterial));

    const addEllipse = (x, z, rx, rz, start, end) => {
      const curve = new THREE.EllipseCurve(x, z, rx, rz, start, end);
      const points = curve.getPoints(50).map(p => new THREE.Vector3(p.x, 0.11, p.y));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      scene.add(new THREE.Line(geometry, lineMaterial));
    };

    // LEFT THREE-POINT LINE
    addEllipse(-10, 0, 5.33, 4.2, -Math.PI / 2, Math.PI / 2);

    // RIGHT THREE-POINT LINE
    addEllipse(10, 0, 5.33, 4.2, Math.PI / 2, 3 * Math.PI / 2);

    // CENTER CIRCLE 
    addEllipse(0, 0, 1, 1, 0, 2 * Math.PI);

    // ADD THE NEW DETAILED MARKINGS (Bonus)
    createDetailedCourtMarkings();  
}

// Basketball object 
function createSeamRing(angleOffset = 0, isVertical = true) {
  const points = [], segments = 128, r = 0.151; 
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = isVertical ? Math.sin(t) * Math.cos(angleOffset) * r : Math.cos(t) * r;
    const y = isVertical ? Math.cos(t) * r : 0;
    const z = isVertical ? Math.sin(t) * Math.sin(angleOffset) * r : Math.sin(t) * r;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 100, 0.002, 8, false), 
    new THREE.MeshBasicMaterial({ color: 0x000000 }) 
  );
}
function createInteractiveBasketball() {
    const group = new THREE.Group();

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 32, 32), 
        new THREE.MeshPhongMaterial({ 
            map: basketballTexture,
            shininess: 30 
        })
    );

    ball.castShadow = true;
    ball.receiveShadow = true;
    group.add(ball);

    // Add seam rings
    group.add(createSeamRing(0, false));
    for (let i = 0; i < 2; i++) {
        const angle = (i / 2) * Math.PI * 2;
        group.add(createSeamRing(angle, true));
    }

    // Starting position at center court
    group.position.set(0, 0.26, 0);
    
    // Store reference to the basketball group
    basketball = group;
    scene.add(group);
    
    return group;
}

// Create basketball court
function createBasketballCourt() {
  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(20, 0.2, 10);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    map: courtTexture,  // Apply the image texture
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);
  
  // Note: All court lines, hoops, and other elements have been removed
  // Students will need to implement these features
  
  createCourtLines();
  createBasketballHoop(-10, 0, 0, 'backward'); // left hook 
  createBasketballHoop(10, 0, 0, 'forward'); // right hook 
  createInteractiveBasketball();

}

// ============================================================================
// 5. INPUT HANDLING SYSTEM
// ============================================================================

function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
    return;
  }
   // Handle special keys
  if (e.code === "Space") {
    shootBasketball();
    e.preventDefault();
    return;
  }
    
  if (e.code === "KeyR") {
    resetBasketball();
    e.preventDefault();
    return;
  }
  
  if (e.code === "KeyG") {
    resetGameStats();
    e.preventDefault();
    return;
  }
  
  // Basketball movement controls
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = true;
    e.preventDefault(); // Prevent page scrolling
  }
  
}

function handleKeyUp(e) {
  // Basketball movement controls
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = false;
    e.preventDefault(); // Prevent page scrolling
  }
}

function handleWindowResize() {
  // Update camera aspect ratio to match new window size
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update renderer canvas size
  renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
window.addEventListener('resize', handleWindowResize);

// ============================================================================
// 6. PHYSICS SYSTEM
// ============================================================================
function calculateShotTrajectory(targetHoop) {
    if (!basketball) return new THREE.Vector3(0, 0, 0);
    
    const ballPos = basketball.position.clone();
    const hoopPos = targetHoop.position.clone();
    
    // Calculate horizontal distance and direction
    const dx = hoopPos.x - ballPos.x;
    const dz = hoopPos.z - ballPos.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
   
    
    const powerFactor = shotPower / 100;
    const maxPower = 20; // maximal power
    const actualPower = maxPower * powerFactor;

    
    const minAngle = 40; // degrees
    const maxAngle = 65; // degrees
    const shotAngle = (maxAngle - (powerFactor * (maxAngle - minAngle))) * Math.PI / 180;

    // Calculate velocity components
    const horizontalVelocity = actualPower * Math.cos(shotAngle);
    const verticalVelocity = actualPower * Math.sin(shotAngle);
    
    // Direction unit vector
    const direction = new THREE.Vector3(dx, 0, dz).normalize();
    
    return new THREE.Vector3(
        direction.x * horizontalVelocity,
        verticalVelocity,
        direction.z * horizontalVelocity
    );
}

function updateFlightRotation(deltaTime) {
    const velocityMagnitude = basketballVelocity.length();
    
    if (velocityMagnitude > 0.1) {
        const horizontalVel = new THREE.Vector2(basketballVelocity.x, basketballVelocity.z);
        const horizontalSpeed = horizontalVel.length();
        
        if (horizontalSpeed > 0.1) {
            const normalizedHorizontal = horizontalVel.normalize();
            
            basketballAngularVelocity.x = -basketballVelocity.z * 8;
            basketballAngularVelocity.z = basketballVelocity.x * 8;
            basketballAngularVelocity.y += (normalizedHorizontal.x * normalizedHorizontal.y) * 2;
        }
        
        // Apply air resistance to rotation
        basketballAngularVelocity.multiplyScalar(rotationDamping);
        
        basketball.rotation.x += basketballAngularVelocity.x * deltaTime;
        basketball.rotation.y += basketballAngularVelocity.y * deltaTime;
        basketball.rotation.z += basketballAngularVelocity.z * deltaTime;
    }
}

function updateMovementRotation(deltaX, deltaZ) {
    const movementSpeed = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    const rotationSpeed = movementSpeed * 8; 
    
    // Calculate rotation axis based on movement direction
    
    if (Math.abs(deltaZ) > Math.abs(deltaX)) {
        // Primary movement is forward/backward
        basketballAngularVelocity.x = deltaZ > 0 ? rotationSpeed : -rotationSpeed;
        basketballAngularVelocity.z *= 0.8; 
    } else {
        // Primary movement is left/right
        basketballAngularVelocity.z = deltaX > 0 ? -rotationSpeed : rotationSpeed;
        basketballAngularVelocity.x *= 0.8; 
    }
    
    // Diagonal movement combines both rotations
    if (Math.abs(deltaX) > 0 && Math.abs(deltaZ) > 0) {
        basketballAngularVelocity.x = deltaZ > 0 ? rotationSpeed * 0.7 : -rotationSpeed * 0.7;
        basketballAngularVelocity.z = deltaX > 0 ? -rotationSpeed * 0.7 : rotationSpeed * 0.7;
    }
}

function handleRealisticRimCollision(hoop) {
    const rimPos = hoop.rimCenter;
    const ballPos = basketball.position.clone();
    
    const dx = ballPos.x - rimPos.x;
    const dz = ballPos.z - rimPos.z;
    const dy = ballPos.y - rimPos.y;

    const distance = Math.sqrt(dx*dx + dz*dz);
    
    const minDistance = rimRadius + ballRadius + 0.02;
    
    // Handle top collision
    if (ballPos.y > rimPos.y + 0.05 && basketballVelocity.y < 0) {        
        basketball.position.y = rimPos.y + 0.25;
        basketballVelocity.y = Math.abs(basketballVelocity.y) * 0.4; // הפיכה למעלה עם אובדן אנרגיה
        
        let normalX = dx / distance;
        let normalZ = dz / distance;
        
        if (distance < 0.1) {
            const randomAngle = Math.random() * 2 * Math.PI;
            normalX = Math.cos(randomAngle);
            normalZ = Math.sin(randomAngle);
        }
        
        const pushForce = 0.3;
        basketballVelocity.x = normalX * pushForce;
        basketballVelocity.z = normalZ * pushForce;
        
        basketballAngularVelocity.x += (Math.random() - 0.5) * 8;
        basketballAngularVelocity.y += (Math.random() - 0.5) * 4;
        basketballAngularVelocity.z += (Math.random() - 0.5) * 8;
        
        return; 
    }
    
    // Handle side/bottom collision
    let normalX = dx / distance;
    let normalZ = dz / distance;
    
    if (distance < minDistance ) {
        normalX = dx / distance;
        normalZ = dz / distance;
        
        basketball.position.x = rimPos.x + normalX * minDistance;
        basketball.position.z = rimPos.z + normalZ * minDistance;

        if (ballPos.y < rimPos.y - 0.15) {
            basketball.position.y = rimPos.y - 0.15;
        }        
    }
  

    const velocityTowardsRim = basketballVelocity.x * normalX + basketballVelocity.z * normalZ;

    if (velocityTowardsRim < 0) {
        basketballVelocity.x -= 2 * velocityTowardsRim * normalX;
        basketballVelocity.z -= 2 * velocityTowardsRim * normalZ;

        if (ballPos.y <= rimPos.y && basketballVelocity.y < 0) {
            basketballVelocity.y *= -0.2;
        } else {
            basketballVelocity.y = Math.abs(basketballVelocity.y) * 0.3;
        }

        basketballVelocity.multiplyScalar(0.4);
    }
    
    basketballAngularVelocity.x += (Math.random() - 0.5) * 6;
    basketballAngularVelocity.y += (Math.random() - 0.5) * 4;
    basketballAngularVelocity.z += (Math.random() - 0.5) * 6;
}

function checkRimCollision() {
    if (!basketball || !isbasketballFlying || collisionAlreadyDetected) return; // 🔥 עצור אם כבר זוהה
    
    const ballPos = basketball.position.clone();
    
    
    for (const hoop of hoops) {
        const rimPos = hoop.rimCenter;
        
        const dx = ballPos.x - rimPos.x;
        const dy = ballPos.y - rimPos.y;
        const dz = ballPos.z - rimPos.z;
        const horizontalDistance = Math.sqrt(dx*dx + dz*dz);
        
        if (horizontalDistance > 2.0 || Math.abs(dy) > 1.5) {
          hoop.hasScored = false; 
        }

        // ZONE 1: Rim collision (miss)
        if (!hoop.hasScored && horizontalDistance >= 0.87 &&
            horizontalDistance < 1.1 &&
            Math.abs(dy) <= 0.3) {

              collisionAlreadyDetected = true; 
              handleRealisticRimCollision(hoop);
              hoop.hasScored = false;
              shotResultDetected = true;
              detectMiss();
            return;
        }

        // ZONE 2: Ball scored (went down through hoop)
        if (!hoop.hasScored &&
            horizontalDistance < 0.87 &&
            ballPos.y < rimPos.y + 0.2 &&
            ballPos.y > rimPos.y - 0.15 &&   
            basketballVelocity.y < -0.05) {
            
            if( horizontalDistance >= 0.8 && Math.abs(dy) <= 0.3){

            }
            hoop.hasScored = true;
            collisionAlreadyDetected = true; 
            detectScore(2);
            return;
          }
        return;
    }
}

function handleGroundCollision() {
    if (basketball.position.y <= groundY && basketballVelocity.y < 0) {
        basketball.position.y = groundY;
        
        basketballVelocity.y = -basketballVelocity.y * bounceRestitution;
        basketballVelocity.x *= 0.85; 
        basketballVelocity.z *= 0.85;

        const spinEffect = 0.1;
        basketballVelocity.x += basketballAngularVelocity.z * spinEffect;
        basketballVelocity.z -= basketballAngularVelocity.x * spinEffect;
        basketballAngularVelocity.multiplyScalar(0.7);

        const randomFactor = 0.95 + Math.random() * 0.1; 
        basketballVelocity.multiplyScalar(randomFactor);
        
        if (Math.abs(basketballVelocity.y) < minimumBounceVelocity) {
            basketballVelocity.set(0, 0, 0);
            isbasketballFlying = false;

            if (shotInProgress && !collisionAlreadyDetected) {
                const hadScore = hoops.some(h => h.hasScored);
                
                if (!hadScore) {
                    collisionAlreadyDetected = true;
                    detectMiss();
                }
            }
            
            shotInProgress = false;
        }
    }
}

function handleCourtBoundaryCollision() {
    let collisionOccurred = false;
    
    // X boundaries (left/right)
    if (basketball.position.x <= courtBounds.minX || basketball.position.x >= courtBounds.maxX) {
        basketballVelocity.x = -basketballVelocity.x * 0.8; // Bounce off court walls
        basketball.position.x = Math.max(courtBounds.minX, Math.min(courtBounds.maxX, basketball.position.x));
        collisionOccurred = true;
    }
    
    // Z boundaries (front/back)
    if (basketball.position.z <= courtBounds.minZ || basketball.position.z >= courtBounds.maxZ) {
        basketballVelocity.z = -basketballVelocity.z * 0.8; // Bounce off court walls
        basketball.position.z = Math.max(courtBounds.minZ, Math.min(courtBounds.maxZ, basketball.position.z));
        collisionOccurred = true;
    }
    
    if (collisionOccurred) {
        console.log("Ball bounced off court boundary");
    }
}

function updateBasketballPhysics(deltaTime) {
    if (!basketball || !isbasketballFlying) return;
    
    // Apply gravity
    basketballVelocity.y += scaledGravity * deltaTime;
    
    // Apply air resistance
    basketballVelocity.multiplyScalar(airResistance);
    
    // Update position
    const movement = basketballVelocity.clone().multiplyScalar(deltaTime);
    basketball.position.add(movement);
    
    // Enhanced flight rotation 
    updateFlightRotation(deltaTime);

    // Enhanced collision detection system
    maxHeightDuringFlight = Math.max(maxHeightDuringFlight, basketball.position.y);

    checkRimCollision(); 
    handleGroundCollision(); 
    handleCourtBoundaryCollision(); 
    
}


// ============================================================================
// 7. GAME LOGIC & SCORING SYSTEM
// ============================================================================

function detectScore(points = 2) {
    gameScore.totalScore += points;
    gameScore.shotsMade++;
    gameScore.shotAttempts++;

    if (gameScore.shotAttempts > 0) {
      gameScore.shootingPercentage = Math.round((gameScore.shotsMade / gameScore.shotAttempts) * 100);
    } else {
      gameScore.shootingPercentage = 0;
    }    
    showShotFeedback("SHOT MADE!", false);
    updateScoreDisplay();

    shotInProgress = false;
    collisionAlreadyDetected = true; 

    console.log(`🏀 SHOT MADE! Total Score: ${gameScore.totalScore}`);
}

function detectMiss() {
    gameScore.shotAttempts++;
    if (gameScore.shotAttempts > 0) {
      gameScore.shootingPercentage = Math.round((gameScore.shotsMade / gameScore.shotAttempts) * 100);
    } else {
      gameScore.shootingPercentage = 0;
    }    
    showShotFeedback("MISSED SHOT", true);
    updateScoreDisplay();
    shotInProgress = false;
    collisionAlreadyDetected = true;

    console.log(`💔 MISSED SHOT! Total Score: ${gameScore.totalScore}`);
}

function resetGameStats() {
    gameScore = {
        totalScore: 0,
        shotAttempts: 0,
        shotsMade: 0,
        shootingPercentage: 0
    };
    
    updateScoreDisplay();
    
    const feedback = document.getElementById('shot-feedback');
    if (feedback) {
        feedback.className = 'shot-feedback';
    }
    
    console.log("Game statistics reset!");
}

function shootBasketball() {
  if (isbasketballFlying) return; 
  shotInProgress = true;
  collisionAlreadyDetected = false; 
  const targetHoop = findNearestHoop();
  basketballVelocity = calculateShotTrajectory(targetHoop);
  isbasketballFlying = true;
  basketballRotation.set(0, 0, 0);
  maxHeightDuringFlight = 0;

  console.log(`Shooting toward ${targetHoop.name} hoop with ${shotPower}% power`);
}

function resetBasketball() {
  if (!basketball) return;
    
  // Reset position
  basketball.position.set(0, groundY, 0);
    
  // Reset physics
  basketballVelocity.set(0, 0, 0);
  isbasketballFlying = false;
  basketballRotation.set(0, 0, 0);
  basketballAngularVelocity.set(0, 0, 0);
  basketball.rotation.set(0, 0, 0);
    
  // Reset all hoops
  hoops.forEach(hoop => {
    hoop.hasScored = false;
  });
    
  shotInProgress = false;
  collisionAlreadyDetected = false;

  // Reset shot power
  shotPower = 50;
  updatePowerDisplay();
    
  console.log("Basketball reset to center court");
}

// ============================================================================
// 8. USER INTERFACE SYSTEM
// ============================================================================

function updatePowerDisplay() {
    const powerBar = document.getElementById('power-bar');
    const powerText = document.getElementById('power-text');
    
    if (powerBar && powerText) {
      powerBar.style.width = shotPower + '%';
      powerText.textContent = Math.round(shotPower) + '%';
        
      if (shotPower < 30) {
        powerBar.style.backgroundColor = '#00ff00'; // Green (low power)
      } else if (shotPower < 70) {
        powerBar.style.backgroundColor = '#ffff00'; // Yellow (medium power)
      } else {
        powerBar.style.backgroundColor = '#ff0000'; // Red (high power)
      }
    }
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-number');
    if (scoreDisplay) scoreDisplay.textContent = gameScore.totalScore;
    
    const shotsMade = document.getElementById('shots-made');
    if (shotsMade) shotsMade.textContent = gameScore.shotsMade;
    
    const shotAttempts = document.getElementById('shots-attempted');
    if (shotAttempts) shotAttempts.textContent = gameScore.shotAttempts;
    
    const shootingPercentage = document.getElementById('shooting-percentage');
    if (shootingPercentage) shootingPercentage.textContent = gameScore.shootingPercentage + '%';
}

function showShotFeedback(message, isMiss) {
    const feedback = document.getElementById('shot-feedback');
    if (!feedback) return;
    
    feedback.textContent = message;
    feedback.className = 'shot-feedback show' + (isMiss ? ' miss' : '');
    
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => {
        feedback.className = 'shot-feedback';
    }, 2000);
}

function updateShotPower() {
    if (isbasketballFlying) return; 
    
    if (keys.KeyW) {
        shotPower = Math.min(maxPower, shotPower + powerChangeSpeed);
    }
    if (keys.KeyS) {
        shotPower = Math.max(minPower, shotPower - powerChangeSpeed);
    }
    
    
    // Update the power display in the UI
    updatePowerDisplay();
}


// ============================================================================
// 9. MOVEMENT & ANIMATION SYSTEM
// ============================================================================

function updateBasketballMovement() {
    if (!basketball || isbasketballFlying) return; // Don't move if ball is flying
    
    let deltaX = 0;
    let deltaZ = 0;

    // Calculate movement based on pressed keys
    if (keys.ArrowLeft) deltaX -= basketballSpeed;
    if (keys.ArrowRight) deltaX += basketballSpeed;
    if (keys.ArrowUp) deltaZ -= basketballSpeed;
    if (keys.ArrowDown) deltaZ += basketballSpeed;

    // Apply movement if any keys are pressed
    if (deltaX !== 0 || deltaZ !== 0) {
        const newX = basketball.position.x + deltaX;
        const newZ = basketball.position.z + deltaZ;

        basketball.position.x = Math.max(courtBounds.minX, Math.min(courtBounds.maxX, newX));
        basketball.position.z = Math.max(courtBounds.minZ, Math.min(courtBounds.maxZ, newZ));
        
        // phase 5 addition
        updateMovementRotation(deltaX, deltaZ);
    } else {
        // Apply friction to angular velocity when not moving
        basketballAngularVelocity.multiplyScalar(groundRotationFriction);
        
        // Stop rotation if it's very slow
        if (basketballAngularVelocity.length() < 0.1) {
            basketballAngularVelocity.set(0, 0, 0);
        }
    }

    // Apply current angular velocity to basketball rotation
    basketball.rotation.x += basketballAngularVelocity.x;
    basketball.rotation.y += basketballAngularVelocity.y;
    basketball.rotation.z += basketballAngularVelocity.z;
    // ---
}

// ============================================================================
// 10. MAIN ANIMATION LOOP
// ============================================================================

let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; 
  lastTime = currentTime;

  updateBasketballMovement();
  updateShotPower();
  updateBasketballPhysics(deltaTime);
  
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

// ============================================================================
// 11. INITIALIZATION
// ============================================================================


// Create all elements and the scene
createBasketballCourt();

// Initialize displays
updateScoreDisplay();
window.addEventListener('load', function() {
    updatePowerDisplay();
});

// Start animation loop
animate();
