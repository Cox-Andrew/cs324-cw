# Computer Graphics Coursework
###### Andrew Cox - 1905839

## Resources

- skybox
  - Source: labs
- exit logo
  - https://www.svgrepo.com/svg/384339/back-entrance-exit-logout-quit
  - [Hasyim Ari](https://www.behance.net/_hasyimasari/)

- fonts
  - https://en.bestfonts.pro/font/persephone-&-hades
  - https://www.1001fonts.com/alegreya-sans-font.html
  - https://www.1001fonts.com/caesar-dressing-font.html

- rock models
  - https://assetstore.unity.com/packages/3d/props/exterior/rock-and-boulders-2-6947

- conifers
  - https://assetstore.unity.com/packages/3d/vegetation/trees/conifers-botd-142076

- unity standard assets https://assetstore.unity.com/packages/essentials/asset-packs/standard-assets-for-unity-2018-4-32351
- cannon-es (fork of cannon.js) - a three.js inspired physics engine based on ammo.js and the Bullet engine
  - https://github.com/pmndrs/cannon-es


## Specification

| Requirement            | Description                                                  | E/D  |
| ---------------------- | ------------------------------------------------------------ | ---- |
| Interactivity          | The player must be able to interact with the game using mouse and  keyboard. | E    |
| Camera                 | The game should offer at least two different camera views (e.g., First  Person Perspective, Top-Down View etc.) and let the user be able to switch  between the views. | E    |
| Menu                   | At least one initial menu containing a short description of the game and  how to play it. | E    |
| Levels                 | The game should have at least TWO levels.                    | E    |
| Models                 | You should create yourself at least one model using Blender and import it  into your game. (More on this in the supporting document and the assessment  section). | E    |
| Lighting               | You should create a scene and add at least two different light sources. | E    |
| Textures               | The scene should have at least one texture introduced by you. | E    |
| Heads-Up Display (HUD) | You might want to visualise on screen useful info for the player using  transparency e.g., health bar, points, remaining lives etc. | D    |
| Sounds                 | You might want to add sounds to your game e.g., play a sound every time  the player scores a point etc. | D    |
| Collision Detection    | You might want to detect collisions between different objects e.g.,  Raycaster. | D    |
| Physics                | You might want to add physics to your game e.g., gravity.    | D    |
| Environment Map        | You might want to include environment maps to add more realism to your  scene. | D    |
| Animation              | You might want to introduce simple animations to your scene. | D    |

- **Interactivity**
  - first person navigation with WASD (relative to view direction)
  - use pointer lock controls to control view with mouse
  - left click to shoot
- **Camera**
  - first person view with camera at height of head
  - first person view zooms (decrease FOV) when aiming arrow
  - camera follows arrow (see tutorials for following third person)
- **Menu**
  - html menu that displays name of the game brief instructions
- **Levels**
  - one forest level one desert level
  - navigate via menu to switch levels or ideally through portal
- **Models**
  - create bow model in blender
- **Lighting**
  - hemisphere light for even lighting across scene
  - directional light to emulate sun (how high and where should this go?)
  - fire for a flickering light?
- **Textures**
  - texture introduced for sky
  - no other textures used as low poly
- Heads-Up Display (HUD) 
  - score and time remaining
  - add some transparency think they want it
  - use HTML
- Sounds
  - death sound or bird song maybe
- Collision Detection
  - collision detection with trees
  - collision detection of arrow with animal
- Physics
  - arrow obeys gravity
- Environment Map
  - something glossy in environment
  - water maybe?
  - statue?
- Animation
  - bow draw animation
  - animal running animation
  - animal death animation

## Modelling

![image-20220123193630963](C:\Users\valsp\source\repos\cs324-cw\images\image-20220123193630963.png)