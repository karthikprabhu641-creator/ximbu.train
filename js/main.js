/**
 * Main Application Orchestrator
 * Railway Journey Portfolio - Phase 1 + 2
 * 
 * Architecture: Welcome screen initializes immediately and independently.
 * The 3D scene loads lazily only after ENTER is clicked, with graceful
 * fallback if Three.js cannot be fetched.
 */
import { ProceduralAudio } from './audio.js';
import { WelcomeScreen } from './welcome.js';
import { CinematicTransition } from './transition.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize procedural audio synthesizer
  const audio = new ProceduralAudio();

  // Initialize transition engine
  const transition = new CinematicTransition({ audio });

  // Welcome screen initializes immediately — no Three.js dependency here
  let mainScene = null;
  let welcome = null;

  const handleEnter = () => {
    transition.start(async () => {
      if (welcome) welcome.hide();

      // Lazy-load the 3D scene only when needed
      try {
        const { MainScenePlaceholder } = await import('./scene-placeholder.js');
        mainScene = new MainScenePlaceholder({
          audio,
          onReplay: () => {
            if (welcome) welcome.reset();
            mainScene.hide();
          }
        });
        mainScene.show();
      } catch (err) {
        console.error('3D scene failed to initialize:', err);
        // Show a fallback scene if Three.js fails
        showFallbackScene();
      }
    });
  };

  welcome = new WelcomeScreen({
    audio,
    onEnter: handleEnter
  });

  welcome.init();
});

function showFallbackScene() {
  const mainSection = document.getElementById('main-scene');
  if (mainSection) {
    mainSection.classList.add('is-active');
    // Insert a beautiful fallback message
    const container = document.getElementById('webgl-canvas-container');
    if (container) {
      container.innerHTML = `
        <div style="
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: #64d2ff; font-family: 'Space Grotesk', monospace;
          font-size: clamp(0.8rem, 2vw, 1.1rem);
          letter-spacing: 0.2em; text-transform: uppercase;
          background: radial-gradient(ellipse at center, #0a1628 0%, #04070d 70%);
        ">
          <div style="opacity:0.5; margin-bottom: 1rem;">⬡</div>
          <div>3D ENGINE INITIALIZING</div>
          <div style="opacity:0.4; font-size:0.7em; margin-top:0.5rem; letter-spacing:0.1em;">
            CONNECT TO NETWORK TO LOAD RAILWAY WORLD
          </div>
        </div>
      `;
    }
  }
}
