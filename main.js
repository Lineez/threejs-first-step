// NOTE если будет в spa, нужно удалять event'ы и requestAnimationFrame иначе застакается

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import Stats from 'three/addons/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

let camera, scene, renderer, stats, model;
const viewSize = 1000;
const container = document.body;
const loadingScreen = document.getElementById('loading')
const loadingScreenText = loadingScreen.querySelector('span')
const pgBarTotal = loadingScreen.querySelector('#progress-bar')
const pgBarSize = loadingScreen.querySelector('#progress-bar-size')

// const clock = new THREE.Clock();

// let mixer;


if (WebGL.isWebGLAvailable()) {

  // Инициализируйте функцию или другие инициализации здесь
  init();
  render();

  // задаем контрол для управления "скелетом" модели
  const input = container.querySelector('input');
  if (!input) throw new Error('input not found');
  input.addEventListener('input', (e) => {
    if (!model) return;

    const value = +e.target.value
    const doubleValue = Math.floor(value * 2)
    // 1
    model.children[3].position.set(0, 0, doubleValue)
    model.children[5].position.set(0, 0, doubleValue)
    model.children[9].position.set(0, 0, doubleValue)
    // 2
    model.children[1].position.set(0, 0, value)
    // // 1
    // model.children[0].position.set(0, 0, doubleValue)
    // model.children[2].position.set(0, 0, doubleValue)
    // model.children[9].position.set(0, 0, doubleValue)
    // // 2
    // model.children[7].position.set(0, 0, value)
  })

} else {
  const warning = WebGL.getWebGLErrorMessage();
  container.appendChild(warning);
}

function init() {

  // THREE.Cache.enabled = false
  /**
   * loaders
   * onLoad fire after all loader was load and his onLoad callbacks fired
   */
  const loadingManager = new THREE.LoadingManager();
  const fbxLoader = new FBXLoader(loadingManager);
  const exrLoader = new EXRLoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager).setPath('resources/');
  const dracoLoader = new DRACOLoader(loadingManager);
  const textureLoader = new THREE.TextureLoader(loadingManager)
  dracoLoader.setDecoderPath('resources/draco/')
  dracoLoader.setDecoderConfig({type: 'js'})
  gltfLoader.setDRACOLoader(dracoLoader)

  loadingManager.onStart = (url, loaded, total) => {
    console.log('url, loaded, total', url, loaded, total)
  }
  loadingManager.onProgress = (url, loaded, total) => {
    loadingScreenText.textContent = `Загружено ${loaded} из ${total} ресурсов`
    pgBarTotal.value = Math.round((loaded / total) * 100);
  }
  loadingManager.onLoad = () => {
    loadingScreen.style.display = 'none';
  }
  loadingManager.onError = () => {
    onError(`Resources \`${url}\` was not found or not load`)
  }

  /**
   * camera
   */
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, viewSize);
  camera.position.set(0, 130, 50);

  /**
   * scene
   */
  scene = new THREE.Scene();

  /**
   * background
   */
  scene.background = new THREE.Color(0xf2f2f2);

  // scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

  /**
   * lights
   */
  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
  // hemiLight.position.set(0, 200, 0);
  // scene.add(hemiLight);

  // scene.add( new THREE.HemisphereLightHelper( hemiLight, 5 ) );

  // const dirLight = new THREE.DirectionalLight(0xffffff, 7);
  // dirLight.position.set(0, 200, 100);
  // // dirLight.castShadow = true;
  // dirLight.shadow.camera.top = 180;
  // dirLight.shadow.camera.bottom = - 100;
  // dirLight.shadow.camera.left = - 120;
  // dirLight.shadow.camera.right = 120;
  // console.log('dirLight', dirLight)
  // scene.add(dirLight);
  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

//   const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
// scene.add( light );


  /**
   * ground and grid
   */
  // const mesh = new THREE.Mesh(new THREE.PlaneGeometry(viewSize, viewSize), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
  // mesh.rotation.x = - Math.PI / 2;
  // mesh.receiveShadow = true;
  // scene.add(mesh);

  // const grid = new THREE.GridHelper(viewSize, 20, 0x000000, 0x000000);
  // grid.material.opacity = 0.2;
  // grid.material.transparent = true;
  // scene.add(grid);

  /**
   * models
   */
  // fbxLoader.load('resources/Ski_goggles_HP.FBX', (object) => {
  //   console.log('fbxLoader object', object)
  //   model = object
  //   model.position.set(0, 100, 0)
  //   scene.add(model);
  // }, onLoaderProgress, onError);

  // textures (background)
  // const geometry = new THREE.SphereGeometry( 500, 60, 40 );
	// 			// invert the geometry on the x-axis so that all of the faces point inward
	// 			geometry.scale( - 1, 1, 1 );


  textureLoader
  .load(
    "resources/bg.jpg",
    function (texture) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;

      console.log('texture', texture)

      // scene.background = envMap; //this loads the envMap for the background
      scene.environment = envMap; //this loads the envMap for reflections and lighting

      texture.dispose(); //we have envMap so we can erase the texture
      pmremGenerator.dispose(); //we processed the image into envMap so we can stop this
    }, onLoaderProgress(0), onError
  );

  // exrLoader
  // .setPath('resources/')
  // .load('drakensberg_solitary_mountain_puresky_8k.exr', (texture) => {
  //   console.log('gltfLoader object', texture)
  // 	texture.mapping = THREE.EquirectangularReflectionMapping;
  //   // scene.background = bg
  //   scene.environment = texture
  // }, onLoaderProgress(0), onError)
  gltfLoader
    .load('ski-colors.gltf', (gltf) => {
      console.log('gltfLoader object', gltf)
      gltf.scene.traverse((object) => {
        if (object.material) {
          // object.material.transparent = false;
          object.material.depthWrite = true;
          // object.material.opacity = 1;
        }
      });


      scene.add(gltf.scene);

      
      /**
       * resize
      */
      controls.reset();
     
      // const obj = gltf.scene
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());

      // obj.position.x += (obj.position.x - center.x);
      // obj.position.y += (obj.position.y - center.y);
      // obj.position.z += (obj.position.z - center.z);

      camera.near = size / 100;
      camera.far = size * 100;
      camera.updateProjectionMatrix();

      camera.position.copy(center);
      camera.position.x += size / 2.0;
      camera.position.y += size / 5.0;
      camera.position.z += size / 2.0;
      camera.lookAt(center);

      controls.maxDistance = size * 10;
      controls.update();
      /**
       * end resize
       */
    }, onLoaderProgress(1), onError)

  /**
   * only for loaders onProgress
   */
  function onLoaderProgress(idx) {
    return (xhr) => {
      if (xhr.loaded === xhr.total) {
        pgBarSize.children[idx].textContent = 'Инициализация'
      } else {
        pgBarSize.children[idx].textContent = `${(xhr.loaded / 1e6).toFixed(2)}мб / ${(xhr.total / 1e6).toFixed(2)}мб`
      }
    }
  }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 100, 0);
  controls.update();

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

//

function render() {

  requestAnimationFrame(render);

  // const delta = clock.getDelta();

  // if ( mixer ) mixer.update( delta );

  renderer.render(scene, camera);

  stats.update();

}

function onError(...args) {
  console.log('ERROR:', ...args)
}