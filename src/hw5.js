import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
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
  createStaticBasketball();

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
  arm.position.set(0, 3.7, -0.6);
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
  backboard.position.set(0, 3.7, 0.26);
  backboard.castShadow = true;
  backboard.receiveShadow = true;
  group.add(backboard);

  // BRANDED BACKBOARD (Bonus): 
  // Large rectangle (backboard outline)
  const backboardOutline = createWhiteRectangle(1.7, 1.02, 0.05);
  backboardOutline.position.set(0, 3.7, 0.3); 
  group.add(backboardOutline);
  // Small rectangle (inner target)
  const targetRectangle = createWhiteRectangle(0.6, 0.35, 0.04); // Smaller and thinner
  targetRectangle.position.set(0, 3.6, 0.3); 
  group.add(targetRectangle);
  /// ---

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 32), new THREE.MeshPhongMaterial({ color: 0xff6600 }));
  rim.position.set(0, 3.4, 0.59);
  rim.rotation.x = degrees_to_radians(90);
  rim.receiveShadow = true;
  rim.castShadow = true;
  group.add(rim);

  const netMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const p1 = new THREE.Vector3(Math.cos(a) * 0.3, 3.4, Math.sin(a) * 0.3 + 0.59);
    const p2 = new THREE.Vector3(Math.cos(a) * 0.09, 2.8, Math.sin(a) * 0.09 + 0.59);
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
function createStaticBasketball(){
  const group = new THREE.Group();

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), new THREE.MeshPhongMaterial({ 
    map: basketballTexture,  // Apply the image texture
    shininess: 30 
  }))  

  ball.castShadow = true;
  ball.receiveShadow = true;
  group.add(ball);

  group.add(createSeamRing(0, false));
  for (let i = 0; i < 2; i++) {
    const angle = (i / 2) * Math.PI * 2;
    group.add(createSeamRing(angle, true));
  }

  group.position.set(0, 0.32, 0);
  scene.add(group);
    
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

// Instructions display
// const instructionsElement = document.createElement('div');
// instructionsElement.style.position = 'absolute';
// instructionsElement.style.bottom = '20px';
// instructionsElement.style.left = '20px';
// instructionsElement.style.color = 'white';
// instructionsElement.style.fontSize = '16px';
// instructionsElement.style.fontFamily = 'Arial, sans-serif';
// instructionsElement.style.textAlign = 'left';
// instructionsElement.innerHTML = `
//   <h3>Controls:</h3>
//   <p>O - Toggle orbit camera</p>
// `;
// document.body.appendChild(instructionsElement);


// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
}

document.addEventListener('keydown', handleKeyDown);

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

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();