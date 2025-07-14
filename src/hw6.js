import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Basketball movement variables
let basketball = null;
const basketballSpeed = 0.15;
const courtBounds = {
    minX: -9.2,    // Left boundary (slightly inside court edge)
    maxX: 9.2,     // Right boundary  
    minZ: -4.2,    // Back boundary
    maxZ: 4.2      // Front boundary
};

// Shot power system variables
let shotPower = 50; // Starting power (50%)
const minPower = 0;
const maxPower = 100;
const powerChangeSpeed = 2; // How fast power changes per frame

// Physics system variables
const gravity = -9.8; // m/s² (scaled for our scene)
const scaledGravity = gravity * 0.5; // Adjust for our scene scale 
let basketballVelocity = new THREE.Vector3(0, 0, 0);
let isbasketballFlying = false;
let basketballRotation = new THREE.Vector3(0, 0, 0);

// Court physics constants
const groundY = 0.32; // Basketball resting height
const bounceRestitution = 0.6; // Energy loss on bounce (60% retained)
const minimumBounceVelocity = 0.1; // Stop bouncing below this velocity
const airResistance = 0.98; // Slight air resistance

// Enhanced collision detection parameters
const rimRadius = 0.3; // Basketball hoop rim radius
const basketballRadius = 0.2; // Basketball radius

let maxHeightDuringFlight = 0;

let basketballAngularVelocity = new THREE.Vector3(0, 0, 0);
const rotationDamping = 0.98; // Rotation air resistance
const groundRotationFriction = 0.85; // Rotation friction when on ground


// Hoop positions for targeting
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


// Update the keys object to include W and S
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

// Set background color
scene.background = new THREE.Color(0x000000);

// Load textures at the top of your code (after scene setup)
const textureLoader = new THREE.TextureLoader();

// Court texture (wood flooring image)
const courtTexture = textureLoader.load("src/court_texture_wood.png");
courtTexture.wrapS = THREE.RepeatWrapping;
courtTexture.wrapT = THREE.RepeatWrapping;
courtTexture.repeat.set(2, 4); // Repeat 4 times along length, 2 times along width

// Basketball texture  
const basketballTexture = textureLoader.load("src/ball_texture.png");

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Create basketball court
function createBasketballCourt() {
  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(20, 0.2, 10);
  // const courtMaterial = new THREE.MeshPhongMaterial({ 
  //   color: 0xc68642,  // Brown wood color
  //   shininess: 50
  // });
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    map: courtTexture,  // Apply the image texture
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);
  
  // Note: All court lines, hoops, and other elements have been removed
  // Students will need to implement these features
  
  // ADDING COURT LINES HERE:
  createCourtLines();

  // ADDING BASKETBALL HOOPS:
  createBasketballHoop(-10, 0, 0, 'backward'); // left hook 
  createBasketballHoop(10, 0, 0, 'forward'); // right hook 

  // ADDING STATIC BASKETBALL 
  createInteractiveBasketball();

}

// === DETAILED MARKINGS (KEY AREAS + FREE THROW CIRCLES) ===
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

// === COURT LINES (CENTER, CIRCLES, THREE-POINTS) ===
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

// === BASKETBALL HOOP STRUCTURE ===
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

// === BASKETBALL OBJECT ===
function createSeamRing(angleOffset = 0, isVertical = true) {
  const points = [], segments = 128, r = 0.201; 
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
        new THREE.SphereGeometry(0.2, 32, 32), 
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
    group.position.set(0, 0.32, 0);
    
    // Store reference to the basketball group
    basketball = group;
    scene.add(group);
    
    return group;
}



// Create all elements
createBasketballCourt();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;


// Update shot power based on W/S keys
function updateShotPower() {
    if (isbasketballFlying) return; // Don't change power while ball is flying
    
    if (keys.KeyW) {
        shotPower = Math.min(maxPower, shotPower + powerChangeSpeed);
    }
    if (keys.KeyS) {
        shotPower = Math.max(minPower, shotPower - powerChangeSpeed);
    }
    
    
    // Update the power display in the UI
    updatePowerDisplay();
}
// Update power display in HTML
function updatePowerDisplay() {
    const powerBar = document.getElementById('power-bar');
    const powerText = document.getElementById('power-text');
    
    if (powerBar && powerText) {
        // Update power bar width
        powerBar.style.width = shotPower + '%';
        
        // Update power text
        powerText.textContent = Math.round(shotPower) + '%';
        
        // Change color based on power level
        if (shotPower < 30) {
            powerBar.style.backgroundColor = '#00ff00'; // Green (low power)
        } else if (shotPower < 70) {
            powerBar.style.backgroundColor = '#ffff00'; // Yellow (medium power)
        } else {
            powerBar.style.backgroundColor = '#ff0000'; // Red (high power)
        }
    }
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

function calculateShotTrajectory(targetHoop) {
    if (!basketball) return new THREE.Vector3(0, 0, 0);
    
    const ballPos = basketball.position.clone();
    const hoopPos = targetHoop.position.clone();
    
    // Calculate horizontal distance and direction
    const dx = hoopPos.x - ballPos.x;
    const dz = hoopPos.z - ballPos.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
    // *** הוסיפי את זה לבדיקה: ***
    console.log("=== DIRECTION DEBUG ===");
    console.log("Ball position:", ballPos.x.toFixed(2), ballPos.z.toFixed(2));
    console.log("Hoop position:", hoopPos.x.toFixed(2), hoopPos.z.toFixed(2));
    console.log("dx (X direction):", dx.toFixed(2));
    console.log("dz (Z direction):", dz.toFixed(2));
    console.log("Target hoop:", targetHoop.name);
    console.log("===================");
    
    const powerFactor = shotPower / 100;
    const maxPower = 20; // כוח מקסימלי
    const actualPower = maxPower * powerFactor;

    // Calculate shot angle based on distance (higher arc for longer shots)
    // const baseAngle = 45; // degrees // 
    // const angleFactor = Math.min(horizontalDistance / 15, 1); // Scale based on distance
    // const shotAngle = (baseAngle + angleFactor * 15) * Math.PI / 180; // Convert to radians
    const minAngle = 40; // מעלות
    const maxAngle = 65; // מעלות
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

// Basketball physics update
function updateBasketballPhysics(deltaTime) {
    if (!basketball || !isbasketballFlying) return;
    
    // Apply gravity
    basketballVelocity.y += scaledGravity * deltaTime;
    
    // Apply air resistance
    basketballVelocity.multiplyScalar(airResistance);
    
    // Update position
    const movement = basketballVelocity.clone().multiplyScalar(deltaTime);
    basketball.position.add(movement);
    
    // Update basketball rotation based on velocity
    if (basketballVelocity.length() > 0.1) {
        const rotationSpeed = basketballVelocity.length() * 2;
        basketballRotation.x += rotationSpeed * deltaTime;
        basketballRotation.z += rotationSpeed * deltaTime * 0.5;
        basketball.rotation.x = basketballRotation.x;
        basketball.rotation.z = basketballRotation.z;
    }
    
    // Enhanced collision detection system
    maxHeightDuringFlight = Math.max(maxHeightDuringFlight, basketball.position.y);

    // checkBackboardCollision();
    checkRimCollision(); // NEW: Check rim collisions first
    handleGroundCollision(); // IMPROVED: Better ground collision
    handleCourtBoundaryCollision(); // IMPROVED: Better boundary collision
    
}

// Basic hoop collision detection
// function checkHoopCollision() {
//     for (const hoop of hoops) {
//         const distance = calculateDistanceToHoop(basketball.position, hoop.position);
//         const heightDiff = Math.abs(basketball.position.y - hoop.position.y);
        
//         // Check if ball is near hoop and moving downward
//         if (distance < 0.3 && heightDiff < 0.2 && basketballVelocity.y < 0) {
//             console.log(`Ball passed through ${hoop.name} hoop!`); // For testing
//             // Future: Update score here
//         }
//     }
// }


// Enhanced rim collision detection
function checkRimCollision() {
    if (!basketball || !isbasketballFlying) return;
    
    const ballPos = basketball.position.clone();
    
    
    for (const hoop of hoops) {
        const rimPos = hoop.rimCenter;
        
        // חישוב מרחק תלת מימדי לרים
        const dx = ballPos.x - rimPos.x;
        const dy = ballPos.y - rimPos.y;
        const dz = ballPos.z - rimPos.z;
        const horizontalDistance = Math.sqrt(dx*dx + dz*dz);
        

        if (!hoop.hasScored && horizontalDistance <= 1.08 &&
            ballPos.y < rimPos.y + 0.8 && 
            ballPos.y > rimPos.y - 0.8 &&
            basketballVelocity.y < -0.2) {
            
            console.log(`basket pos y  : ${basketball.position.y}`);
            console.log(`rim pos y  : ${rimPos.y}`);

            hoop.hasScored = true;
            console.log(`🏀 SCORE! Ball went through ${hoop.name} hoop!`);
            // כאן תוסיפי ניקוד בעתיד
            return;
        }
        // בדיקה אם הכדור קרוב לרים
        // בדיקת התנגשות עם הרים (רק החלק הפנימי והעליון)
        if (horizontalDistance > 1.08 &&
            horizontalDistance < 1.1  &&  
            Math.abs(dy) <= 0.5 ) {
            console.log(`dx : ${dx}`);

            console.log(`💥 Ball hit the rim of ${hoop.name} hoop!`);
            handleSimpleRimCollision(hoop);
            hoop.hasScored = false;
            return;
        }
        return;
    }
}

function handleSimpleRimCollision(hoop) {
    const rimPos = hoop.rimCenter;
    const ballPos = basketball.position.clone();
    
    // חישוב כיוון הדחיפה
    const dx = ballPos.x - rimPos.x;
    const dz = ballPos.z - rimPos.z;
    const distance = Math.sqrt(dx*dx + dz*dz);
    
    // נרמול הכיוון
    const normalX = dx / distance;
    const normalZ = dz / distance;
    
    // הדחיפה החוצה מהרים
    const bounceForce = 0.6;
    basketballVelocity.x = normalX * bounceForce;
    basketballVelocity.z = normalZ * bounceForce;
    basketballVelocity.y = Math.abs(basketballVelocity.y) * 0.3; // קפיצה קלה למעלה
    
    console.log(`🏀 Ball bounced: X=${basketballVelocity.x.toFixed(2)}, Z=${basketballVelocity.z.toFixed(2)}`);
}

// Handle rim collision physics
function handleRimCollision(hoop) {
    const ballPos = basketball.position;
    const rimPos = hoop.rimCenter;

    const dx = ballPos.x - rimPos.x;
    const dz = ballPos.z - rimPos.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = rimRadius + basketballRadius;

    const penetration = minDist - dist;
    if (penetration > 0) {
        const normal = new THREE.Vector3(dx, 0, dz).normalize();

        // הזזה קטנה לאחור לפי כיוון התנועה (כמו קרן שמגיעה מהעבר)
        const backward = basketballVelocity.clone().normalize().multiplyScalar(0.03);
        basketball.position.sub(backward);

        // תיקון מיקום החוצה מה־rim
        const correction = normal.clone().multiplyScalar(penetration + 0.005);
        basketball.position.add(correction);

        // החזרת מהירות לפי הנורמל (כמו קיר עגול)
        const velocityDot = basketballVelocity.x * normal.x + basketballVelocity.z * normal.z;
        if (velocityDot > 0) {
            basketballVelocity.x -= 2 * velocityDot * normal.x;
            basketballVelocity.z -= 2 * velocityDot * normal.z;
            basketballVelocity.multiplyScalar(0.8); // איבוד אנרגיה
        }

        console.log("💥 Rim collision with", hoop.name);
    }
}

function checkBackboardCollision() {
    if (!basketball || !isbasketballFlying) return;

    const ballPos = basketball.position.clone();

    for (const hoop of hoops) {
        // קביעת מיקום הלוח
        let backboardX = hoop.name === "left" ? -10.4 : 10.4;
        const backboardZ = 0;

        // תנאי התנגשות
        const distanceToBackboard = Math.abs(ballPos.x - backboardX);
        const heightOk = (ballPos.y + basketballRadius) >= 3.2 && (ballPos.y - basketballRadius) <= 4.25;
        const widthOk = Math.abs(ballPos.z - backboardZ) <= 0.525;

        if (distanceToBackboard <= 0.42 && heightOk && widthOk) {
            console.log(`💥 Backboard collision with ${hoop.name} hoop!`);

            // שינוי מהירות
            basketballVelocity.x = -basketballVelocity.x * 0.4;
            basketballVelocity.y *= 0.8;
            basketballVelocity.z *= 0.8;

            const wallX = isLeftHoop ? backboardX : backboardX;
            const ballEdgeX = isLeftHoop
                ? basketball.position.x + basketballRadius
                : basketball.position.x - basketballRadius;

            // התנגשות רק אם באמת חודר פנימה (edge של הכדור נכנס אל הלוח)
            const penetrated = isLeftHoop
                ? ballEdgeX >= wallX
                : ballEdgeX <= wallX;

            if (penetrated) {
                // הופכים את מהירות X ומנחיתים
                basketballVelocity.x = -basketballVelocity.x * 0.4;
                basketballVelocity.y *= 0.8;
                basketballVelocity.z *= 0.8;

                // מצמידים את הכדור בדיוק לקצה הלוח (בלי לחדור בכלל)
                basketball.position.x = isLeftHoop
                    ? wallX - basketballRadius
                    : wallX + basketballRadius;
            }
            return;
        }
    }
}


// Enhanced ground collision with better parameters
function handleGroundCollision() {
    if (basketball.position.y <= groundY && basketballVelocity.y < 0) {
        basketball.position.y = groundY;
        
        // Improved bounce physics
        basketballVelocity.y = -basketballVelocity.y * bounceRestitution;
        basketballVelocity.x *= 0.85; // Slightly less horizontal velocity loss
        basketballVelocity.z *= 0.85;
        
        // Add some randomness to bounce for realism
        const randomFactor = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
        basketballVelocity.multiplyScalar(randomFactor);
        
        // Stop bouncing if velocity is too low
        if (Math.abs(basketballVelocity.y) < minimumBounceVelocity) {
            basketballVelocity.set(0, 0, 0);
            isbasketballFlying = false;
            basketballRotation.set(0, 0, 0);
            console.log("Basketball came to rest on ground");
        }
    }
}

// Enhanced court boundary collision
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


// Shooting function
function shootBasketball() {
    if (isbasketballFlying) return; // Don't shoot if ball is already flying
    
    const targetHoop = findNearestHoop();
    basketballVelocity = calculateShotTrajectory(targetHoop);
    isbasketballFlying = true;
    basketballRotation.set(0, 0, 0);
    maxHeightDuringFlight = 0;

    console.log(`Shooting toward ${targetHoop.name} hoop with ${shotPower}% power`);
}

// Reset basketball function
function resetBasketball() {
    if (!basketball) return;
    
    // Reset position
    basketball.position.set(0, groundY, 0);
    
    // Reset physics
    basketballVelocity.set(0, 0, 0);
    isbasketballFlying = false;
    basketballRotation.set(0, 0, 0);
    basketball.rotation.set(0, 0, 0);
    
    // Reset shot power
    shotPower = 50;
    updatePowerDisplay();
    
    console.log("Basketball reset to center court");
}

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


// Handle key events
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

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);


// --- FOR RESPONSIVE SECNE --- 
function handleWindowResize() {
  // Update camera aspect ratio to match new window size
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update renderer canvas size
  renderer.setSize(window.innerWidth, window.innerHeight);
}
// ---- 

// Listen for window resize events
window.addEventListener('resize', handleWindowResize);

// Delta time calculation for smooth physics
let lastTime = performance.now();

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Calculate delta time for smooth physics
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  updateBasketballMovement();

  // Update shot power 
  updateShotPower();
  
  // Update basketball physics (when flying)
  updateBasketballPhysics(deltaTime);
    
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();

// Initialize power display when page loads 
window.addEventListener('load', function() {
    updatePowerDisplay();
});