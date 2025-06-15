# Exercise 5 – Basketball Court with THREE.js

## Overview
This exercise will have you implement a basketball court scene with interactive elements using THREE.js. The provided code gives you a basic brown court surface as a starting point. You will need to add court lines, basketball hoops, and implement a basketball with physics-based movement.

## Tasks
1. Add court lines to the basketball court:
   - Center line
   - Center circle
   - Three-point lines on both sides
   - Other boundary lines (sidelines, baselines, free throw lines, etc.)

2. Create basketball hoops:
   - Backboard with a transparent material
   - Rim with appropriate size (~45cm / 18 inch diameter)
   - Net using line segments
   - Support structure (pole and base)
   - Place hoops on both ends of the court

3. Implement a basketball:
   - Create a sphere with orange material
   - Add black lines to simulate basketball seams
   - Implement physics for the ball (gravity, bouncing, etc.)

4. Add user controls:
   - Move the ball using arrow keys
   - Adjust shot power
   - Shoot the ball with spacebar
   - Reset ball position
   
5. Scoring system (Optional, for extra points):
   - Detect when the ball passes through a hoop
   - Display the score on the screen
   - Create visual/audio feedback when scoring

## Technical Requirements
- All objects should cast and receive shadows
- Use appropriate meshes and materials for each object
- Physics implementation should look realistic
- The scene should be responsive when the browser window is resized

## Getting Started
- The starter code already includes:
  - Basic THREE.js setup with a scene, camera, and renderer
  - A simple brown court surface
  - Lighting setup with shadows enabled
  - Orbit controls for easy scene navigation (toggle with 'o' key)
  
- Examine the `createBasketballCourt()` function and build upon it
- Use the `degrees_to_radians()` helper function for any rotation calculations
- Add all your code to the hw5.js file

## Reference
- Standard basketball court dimensions are ~28m x 15m (92ft x 50ft)
- Standard basketball rim height is 3.05m (10ft)
- Use different materials for different parts (MeshBasicMaterial for lines, MeshPhongMaterial for shiny objects)