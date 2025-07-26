# Computer Graphics - Exercise 6 - Interactive 3D Basketball Game

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete Instructions (for this exercise)
**All detailed instructions, requirements, and specifications can be found in:**
`basketball_exercise_instructions.html`

## Group Members
**MANDATORY: Add the full names of all group members here:**
- Gabrielle Zohar
- Tomer Sinai

## Technical Details
- **No server required** - runs directly in web browser
- Built with Three.js (r128) for 3D rendering
- Real-time physics simulation at 60 FPS
- Responsive design with automatic window resize handling

## Controls & Gameplay
### Basketball Movement Controls:
- **Arrow Keys**: Move basketball horizontally around the court
  - ↑ / ↓: Forward/Backward movement
  - ← / →: Left/Right movement
- **W / S Keys**: Adjust shot power (increases/decreases shooting strength)
- **Spacebar**: Shoot basketball toward nearest hoop
- **R Key**: Reset basketball to center court position
- **G Key**: Reset game statistics (score, attempts, percentage)

### Camera Controls:
- **Mouse**: Orbit, zoom, and pan around the scene
- **O Key**: Toggle camera controls on/off

## Physics System Implementation
### Realistic Basketball Physics:
- **Gravity Simulation**: Constant downward acceleration (-9.8 m/s² scaled)
- **Parabolic Trajectory**: Realistic arc physics for shot trajectories
- **Bounce Mechanics**: Energy loss on each bounce (60% energy retention)
- **Air Resistance**: Slight velocity reduction during flight (98% retention)
- **Ground Collision**: Accurate collision detection with energy loss
- **Court Boundaries**: Ball bounces off court edges with reduced velocity

### Advanced Collision Detection:
- **Rim Collision Detection**: 
  - Side collision detection for missed shots
  - Top collision detection prevents unrealistic ball passage through rim
  - Proper scoring detection when ball passes through hoop center
- **Realistic Rim Physics**: 
  - Ball deflection based on impact angle and velocity
  - Energy loss and random spin effects on rim contact
- **Score Detection**: Ball must be moving downward through hoop center area

### Basketball Rotation System:
- **Movement Rotation**: Ball rotates based on ground movement direction and speed
- **Flight Rotation**: Realistic spin during trajectory based on velocity vector
- **Collision Rotation**: Random spin effects added during rim/ground impacts
- **Friction Effects**: Rotation gradually slows due to air resistance and ground friction

## Comprehensive Scoring System
### Real-Time Statistics:
- **Total Score**: Points earned from successful shots (2 points per basket)
- **Shot Attempts**: Total number of shots taken (spacebar presses)
- **Shots Made**: Number of successful baskets
- **Shooting Percentage**: Calculated as (Shots Made / Shot Attempts) × 100%

### Visual Feedback System:
- **Success Messages**: "SHOT MADE!" displayed for successful shots
- **Miss Messages**: "MISSED SHOT" displayed for unsuccessful attempts
- **Shot Power Indicator**: Live power bar showing current shooting strength
- **Color-Coded Power**: Green (low), Yellow (medium), Red (high power)
- **Real-Time Updates**: All statistics update immediately upon shot completion

## Features Implemented

### **MANDATORY Interactive Features:**
✅ **Physics-Based Basketball Movement**
- Realistic gravity simulation with proper trajectory physics
- Ball bouncing with energy loss and realistic ground interaction
- Comprehensive collision detection (ground, rim, court boundaries)

✅ **Interactive Basketball Controls**
- Arrow key movement in all four directions with court boundary limits
- W/S power adjustment with visual feedback (0-100% range)
- Spacebar shooting with automatic hoop targeting
- R key reset functionality

✅ **Basketball Rotation Animations**
- Direction-based rotation during ground movement
- Velocity-proportional rotation speed during flight
- Realistic axis rotation matching movement direction
- Smooth rotation transitions with friction effects

✅ **Comprehensive Scoring System**
- Real-time score tracking with immediate updates
- Shot attempt counter and accuracy percentage calculation
- Visual feedback for successful/missed shots with timed display
- Complete statistics panel with live updates

✅ **Enhanced User Interface**
- Live score display with current total points
- Shot statistics (attempts, made, percentage) with real-time updates
- Dynamic shot power indicator with color-coded feedback
- Control instructions panel for user guidance
- Game status messages with success/miss feedback

### **Physics Implementation:**
✅ **Gravity and Trajectory**
- Constant downward acceleration (scaled -4.9 m/s²)
- Parabolic flight paths with realistic arc heights
- Initial velocity calculation based on shot angle and power
- Minimum arc requirement for successful shots

✅ **Advanced Collision Detection**
- Multi-zone rim collision detection (center, side, top)
- Ground collision with realistic bounce physics
- Court boundary collision with velocity reduction
- Precise scoring detection for ball-through-hoop validation

✅ **Shot Mechanics**
- Adjustable shot power (0-100%) affecting initial velocity and arc
- Dynamic shot angle calculation based on power level (40°-65° range)
- Distance-based trajectory optimization for consistent gameplay
- Proper arc height ensuring realistic basketball shot physics

### **Additional Advanced Features:**
🌟 **Enhanced Rim Physics**
- Top-rim collision detection prevents unrealistic ball passage
- Realistic deflection angles based on impact point and velocity
- Energy loss and spin effects on rim contact
- Separate handling for scoring vs. collision scenarios

🌟 **Improved Animation System**
- Frame-rate independent physics using deltaTime calculations
- Smooth 60 FPS performance with optimized collision detection
- Realistic rotation dampening and friction effects
- Seamless transitions between movement and flight states

🌟 **Professional Code Organization**
- Modular code structure with clear separation of concerns
- Distinct systems: Scene Setup, Physics, Input, UI, Rendering
- Comprehensive error handling and state management
- Performance-optimized collision detection algorithms

### **Bonus Features from HW5:**
- **Textured Surfaces**: Wood court texture and realistic basketball texture
- **Enhanced Court Markings**: Complete NBA-standard court with proper dimensions
- **Branded Backboards**: Professional-style backboard markings and target areas
- **Realistic Proportions**: All objects sized to official basketball specifications
- **Professional Lighting**: Ambient and directional lighting with shadow mapping

## Known Issues / Limitations
- **Browser Compatibility**: Best performance in Chrome/Firefox; Safari may have texture loading delays
- **Mobile Support**: Optimized for desktop/laptop use
- **Physics Precision**: Very fast shots near court boundaries may occasionally clip through edges
- **Texture Dependencies**: Requires texture files in `src/` directory for full visual experience

## External Assets / References

### **Libraries & Frameworks**
- **Three.js (r128)** – 3D rendering engine and physics calculations
- **OrbitControls.js** – Camera orbit and interaction controls

### **Texture Assets**
- `src/court_texture_wood.png` – Professional wood flooring texture for basketball court
- `src/ball_texture.png` – Realistic basketball surface texture with proper seam details

### **Technical References**
- Basketball court dimensions: Official NBA/FIBA specifications (94' x 50')
- Physics calculations: Real-world basketball trajectory and bounce coefficients
- Collision detection algorithms: Optimized sphere-to-plane and sphere-to-torus calculations
- Performance optimization: Three.js best practices for 60 FPS rendering

### **Implementation Standards**
- Code organization follows MVC architectural patterns
- Physics implementation based on real-world basketball mechanics
- User interface design inspired by professional basketball video games
- All features implemented to exceed assignment requirements for comprehensive interactive experience

---
