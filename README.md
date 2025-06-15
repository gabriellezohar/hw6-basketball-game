# Computer Graphics - Exercise 5 - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete Instructions
**All detailed instructions, requirements, and specifications can be found in:**
`basketball_exercise_instructions.html`

## Group Members
**MANDATORY: Add the full names of all group members here:**
- Gabrielle Zohar
- Tomer Sinai

## Technical Details
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser
- Controls:
    - Use mouse to orbit, zoom, and pan the camera
    - Press "O" key to toggle camera controls on/off

## Features Implemented
**Must-Have Features:**
- 3D Basketball Court: Full court rendered using Three.js with proper dimensions (30m x 15m)
- Basketball Hoops: Two complete basketball hoops with:
    - Support structures with cylindrical bases for stability
    - Proper rim dimensions (45cm diameter) at correct height (3.05m)
    - Backboards with correct proportions (1.8m x 1.05m)
    - Realistic net rendering with 8 individual strands
- Static Basketball: Detailed basketball object with:
    - Proper size (24cm diameter)
    - Realistic seam lines positioned correctly on ball surface
- Lighting and shadows for realism
- Court Markings: Complete court line system including:
    - Center line and center circle
    - Three-point arcs on both sides
    - Key areas (painted zones)
    - Free throw circles with mixed solid/dashed line rendering
- Proper Material Usage:
    - MeshPhongMaterial for shiny objects (ball, rim, backboards)
    - LineBasicMaterial and LineDashedMaterial for court lines
    - MeshBasicMaterial for simple elements (seams)
- Realistic Proportions: All objects sized according to real basketball specifications
- Camera controls using `OrbitControls` with toggle using the "O" key
- UI overlay including:
  - **Score container** (currently static)
  - **Controls container** with user instruction display
- Responsive Design: Window resize handling that maintains proper aspect ratio

**Bonus Features (Partial):**
- Textured Surfaces:
    - Wood texture applied to court floor with proper repeat settings
    - Basketball texture applied to ball for enhanced realism
- Enhanced Court Markings:
    - Combination of solid and dashed line circles in key areas
    - Detailed free throw circle implementations
- Branded Backboards: Outline rectangles on backboards for target area


## Known Issues / Limitations

- The basketball is static and cannot be moved or interacted with.
- The scoreboard is currently static (no gameplay logic or scoring system).
- The control overlay supports only toggling OrbitControls via the keyboard.
- Project does not include collision detection, animations, or interactivity beyond camera movement.

## External Assets / References
**Libraries & Frameworks**
- Three.js (r128) – 3D rendering engine (via CDN)
- OrbitControls.js – Camera orbit interaction

**Texture Assets**
- src/court_texture_wood.png – Wood flooring texture for basketball court
- src/ball_texture.png – Basketball surface texture

**Technical References**
- Basketball court dimensions based on official NBA/FIBA specifications
- Shadow mapping implementation following Three.js documentation
- Texture wrapping and repeat patterns optimized for realistic appearance