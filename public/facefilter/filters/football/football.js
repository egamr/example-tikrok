"use strict";

let THREECAMERA = null;

// callback: launched if a face is detected or lost
function foot_detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK
function foot_init_threeScene(spec) {
  const threeStuffs = JeelizThreeHelper.init(spec, foot_detect_callback);

  // Add our face model:
  const loader = new THREE.BufferGeometryLoader();

  loader.load(
    './facefilter/filters/football/models/football_makeup/face.json',
    (geometry) => {
      const mat = new THREE.MeshBasicMaterial({
        // DEBUG: uncomment color, comment map and alphaMap
        map: new THREE.TextureLoader().load('./facefilter/filters/football/models/football_makeup/texture.png'),
        alphaMap: new THREE.TextureLoader().load('./facefilter/filters/football/models/football_makeup/alpha_map_256.png'),
        transparent: true,
        opacity: 0.6
      });

      const faceMesh = new THREE.Mesh(geometry, mat);
      faceMesh.position.y += 0.15;
      faceMesh.position.z -= 0.25;

      addDragEventListener(faceMesh);

      threeStuffs.faceObject.add(faceMesh);
    }
  )

  

  // CREATE THE VIDEO BACKGROUND
  function create_mat2d(threeTexture, isTransparent){ //MT216 : we put the creation of the video material in a func because we will also use it for the frame
    return new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: isTransparent,
      vertexShader: "attribute vec2 position;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_Position=vec4(position, 0., 1.);\n\
          vUV=0.5+0.5*position;\n\
        }",
      fragmentShader: "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUV;\n\
        void main(void){\n\
          gl_FragColor=texture2D(samplerVideo, vUV);\n\
        }",
       uniforms:{
        samplerVideo: { value: threeTexture }
       }
    });
  }

  //MT216 : create the frame. We reuse the geometry of the video
  const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry,  create_mat2d(new THREE.TextureLoader().load('./images/cadre_france.png'), true))
  calqueMesh.renderOrder = 999; // render last
  calqueMesh.frustumCulled = false;
  threeStuffs.scene.add(calqueMesh);

  // CREATE THE CAMERA
  THREECAMERA = JeelizThreeHelper.create_camera();
  $("#loading").hide();
} // end init_threeScene()

// Entry point, launched by body.onload():
function init_filter() {
  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    overSamplingFactor:1,
    callback: function(isError, bestVideoSettings){
      foot_init_faceFilter(bestVideoSettings);
    }
  })
}

function foot_init_faceFilter(videoSettings){
  JEEFACEFILTERAPI.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCpath: './facefilter/', // path of NNC.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      $("#loading").hide();
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEEFACEFILTERAPI IS READY');
      foot_init_threeScene(spec);
    }, // end callbackReady()

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      JeelizThreeHelper.render(detectState, THREECAMERA);
    } // end callbackTrack()
  }); // end JEEFACEFILTERAPI.init call
} // end main()

