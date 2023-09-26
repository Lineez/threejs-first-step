// NOTE если будет в spa, нужно удалять event'ы и requestAnimationFrame иначе застакается

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/addons/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let camera, scene, renderer, stats, model, controls;
const viewSize = 1;
const container = document.body;
const loadingScreen = document.getElementById('loading')
const loadingScreenText = loadingScreen.querySelector('span')
const pgBarTotal = loadingScreen.querySelector('#progress-bar')
// const pgBarSize = loadingScreen.querySelector('#progress-bar-size')


if (WebGL.isWebGLAvailable()) {
  init();


  // задаем контрол для управления "скелетом" модели
  const input = container.querySelector('input');
  if (!input) throw new Error('input not found');
  input.addEventListener('input', (e) => {
    if (!model) return;

    const value = +e.target.value
    const doubleValue = value * 2
    // 1
    model.children[7].position.set(0, 0, doubleValue)
    model.children[8].position.set(0, 0, doubleValue)
    model.children[9].position.set(0, 0, doubleValue)
    // 2
    model.children[6].position.set(0, 0, value)
  })

} else {
  const warning = WebGL.getWebGLErrorMessage();
  container.appendChild(warning);
}

function init() {
  /**
   * loaders
   * onLoad fire after all loader was load and his onLoad callbacks fired
   */
  const loadingManager = new THREE.LoadingManager();
  const gltfLoader = new GLTFLoader(loadingManager);
  const textureLoader = new THREE.TextureLoader(loadingManager)
  const dracoLoader = new DRACOLoader(loadingManager);
  dracoLoader.setDecoderPath('resources/draco/')
  dracoLoader.setDecoderConfig({ type: 'js' })
  gltfLoader.setDRACOLoader(dracoLoader)

  loadingManager.onProgress = (url, loaded, total) => {
    loadingScreenText.textContent = `Загружено ${loaded} из ${total} ресурсов`
    pgBarTotal.value = Math.round((loaded / total) * 100);
    console.log( 'Started loading file: ' + url );
  }
  loadingManager.onLoad = () => {
    loadingScreen.style.display = 'none';
    render();
  }
  loadingManager.onError = () => {
    onError(`Resources \`${url}\` was not found or not load`)
  }

  /**
   * camera
   */
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, viewSize);
  // camera.position.set(0, 130, 50);

  /**
   * scene
   */
  scene = new THREE.Scene();

  /**
   * background
   */
  scene.background = new THREE.Color(0xf2f2f2);

  /**
   * model
   */
  gltfLoader
    .setPath('resources/')
    .load('ski-colors.glb', (gltf) => {
      model = gltf.scene

      console.log('gltf.scene[0]', gltf.scene)

      gltf.scene.traverse((object) => {
        // fix semi-opacity on zoom
        // search depthWrite on threejs docs for more info
        if (object.material) {
          object.material.depthWrite = true;
        }
      });

      /**
       * resize
      */
      // controls.reset();

      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      camera.near = size / 100;
      camera.far = size * 100;
      camera.updateProjectionMatrix();

      camera.position.copy(center);
      camera.position.x += size / 2.0;
      camera.position.y += size / 5.0;
      camera.position.z += size / 2.0;
      camera.lookAt(center);


      controls = new OrbitControls(camera, renderer.domElement)

      controls.maxDistance = size * 10;
      controls.update();
      /**
       * end resize
       */

      scene.add(gltf.scene);
    })

  textureLoader
  .load(
    "resources/bg.jpg",
    function (texture) {
      console.log('texture', texture)

      texture.mapping = THREE.EquirectangularReflectionMapping;

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;

      // scene.background = envMap; //this loads the envMap for the background
      scene.environment = envMap; //this loads the envMap for reflections and lighting

      texture.dispose(); //we have envMap so we can erase the texture
      pmremGenerator.dispose(); //we processed the image into envMap so we can stop this
    });

  /**
   * only for loaders onProgress
   */
  // function onLoaderProgress(idx) {
  //   return (xhr) => {
  //     if (xhr.loaded === xhr.total) {
  //       pgBarSize.children[idx].textContent = 'Инициализация'
  //     } else {
  //       pgBarSize.children[idx].textContent = `${(xhr.loaded / 1e6).toFixed(2)}мб / ${(xhr.total / 1e6).toFixed(2)}мб`
  //     }
  //   }
  // }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // const controls = new OrbitControls(camera, renderer.domElement);
  // controls.target.set(0, 100, 0);
  // controls.update();

  window.addEventListener('resize', onWindowResize);

  // stats
  stats = new Stats();
  container.appendChild(stats.dom);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  stats.update();
}

function onError(...args) {
  console.error('ERROR:', ...args)
}