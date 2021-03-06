createLandscape({
    palleteImage:'static/img/palette.png'
})
var scene, renderer, camera;
var once;

function createLandscape(params){

    var container = document.querySelector("#c")
    var width = window.innerWidth;
    var height = window.innerHeight;

    //var scene, renderer, camera;
    var terrain, skybox;
    var gyro;

    var score = 1000;

    var mouse = { x:0, y:0, xDamped:0, yDamped:0 };
    var isMobile = typeof window.orientation !== 'undefined'

    init();

    function init(){
        gyro = new GyroNorm(); // gyroscope polyfill

        sceneSetup();
        sceneElements();
        sceneTextures();
        render();

            //window.addEventListener("touchmove", onInputMove, {passive:false})
            //gyro.init().then( () => gn.start( onOrientationChange ) )
        if(isMobile)
            window.addEventListener("deviceorientation", onOrientationChange, true)
        else
            window.addEventListener("mousemove", onInputMove)

        window.addEventListener("resize", resize)
        resize()
    }

    function sceneSetup(){
        scene = new THREE.Scene();
        var fogColor = new THREE.Color( 0x000000 )
        scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 10, 400);


        sky()

        camera = new THREE.PerspectiveCamera(60, width / height, .1, 10000);
        camera.position.y = 8;
        camera.position.z = 4;

        ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight)


        renderer = new THREE.WebGLRenderer( {
            canvas:container,
            antialias:true
        } );
        renderer.setPixelRatio = devicePixelRatio;
        renderer.setSize(width, height);


    }

    function sceneElements(){

        var geometry = new THREE.PlaneBufferGeometry(100, 400, 400, 400);

        score = 0;

        var uniforms = {
            time: { type: "f", value: 0.0 },
            distortCenter: { type: "f", value: 0.1 },
            roadWidth: { type: "f", value: 2 },
            pallete:{ type: "t", value: null},
            speed: { type: "f", value: 2.5 },
            maxHeight: { type: "f", value: 10.0 },
            color:new THREE.Color(1, 1, 1),
            scrollPercent: { type: "f", value: 0.0 },

            angleCenter: {type: "f", value:0.0},
            centerOff:{type: "f", value:0.0}
        }

        var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([ THREE.ShaderLib.basic.uniforms, uniforms ]),
            vertexShader: document.getElementById( 'custom-vertex' ).textContent,
            fragmentShader: document.getElementById( 'custom-fragment' ).textContent,
            wireframe:false,
            fog:true
        });

        terrain = new THREE.Mesh(geometry, material);
        terrain.position.z = -180;
        terrain.rotation.x = -Math.PI / 2

        scene.add(terrain)
    }

    function sceneTextures(){
        // pallete
        new THREE.TextureLoader().load( params.palleteImage, function(texture){
            terrain.material.uniforms.pallete.value = texture;
            terrain.material.needsUpdate = true;
        });
    }

    function calculateSunPosition(scrollPos) {
        let lerpedThetaMod = map(scrollPos, 0, 1, -0.03, -0.25);

        var theta = Math.PI * ( lerpedThetaMod ); // -0.03 -> -0.25
        var phi = 2 * Math.PI * ( -.25 );

        let vec = new THREE.Vector3(0,0,0);

        vec.x = 400000 * Math.cos( phi );
        vec.y = -400000 * Math.sin( phi ) * Math.sin( theta );
        vec.z = -400000 * Math.sin( phi ) * Math.cos( theta );

        this.skybox.material.uniforms.sunPosition.value.copy( vec );
    }

    function sky(){
        this.skybox = new THREE.Sky();
        this.skybox.scale.setScalar( 450000 );
        this.skybox.material.uniforms.turbidity.value = 1;
        this.skybox.material.uniforms.rayleigh.value = 0.01;
        this.skybox.material.uniforms.luminance.value = 1;
        this.skybox.material.uniforms.mieCoefficient.value = 0.0003;
        this.skybox.material.uniforms.mieDirectionalG.value = 0.99995;

        scene.add( this.skybox );
        calculateSunPosition(0)
    }

    function resize(){
        width = window.innerWidth
        height = window.innerHeight
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize( width, height );
    }

    function onInputMove(e){
        e.preventDefault();

        var x, y
        if(e.type == "mousemove"){
            x = e.clientX;
            y = e.clientY;
        }else{
            x = e.changedTouches[0].clientX
            y = e.changedTouches[0].clientY
        }

        mouse.x = x;
        mouse.y = y;

    }
    function onOrientationChange(e) {
        // map the beta axis (X) of the accel event to some "height" along the
        // window to retrofit accel controls for the bump height
        let betaRadian = (e.beta * Math.PI) / 180;
        mouse.x = 0;
        mouse.y = 1 - (window.innerHeight * (0.5 + ((-1 * Math.cos(betaRadian * 2)) / 2)))
    }


    function updateScore(mouseXPos, sliderValue)
    {
      var tolerance = 0;
      if (terrain.material.uniforms.time.value > 30){
        tolerance = 12;
      } else {
        tolerance = 17;
      }

      var scaleMouse = (mouseXPos - (window.innerWidth/2))*(50/(window.innerWidth/2))

      var diff = Math.abs(scaleMouse - sliderValue);
      //console.log(scaleMouse + ' vs ' +  sliderValue)
      if (diff > tolerance)
      {
        score -= (diff)/8.5
        document.getElementById("header").style.color = 'red'
      }
      else
      {
        document.getElementById("header").style.color = 'white'
        score += 1
      }

      if (terrain.material.uniforms.time.value < 7){
        score = 200;
      }



      //if (score > 500){
      //if (terrain.material.uniforms.speed.value< score/2/100){
      //  terrain.material.uniforms.speed.value = score/2/100;
      //}
      //}

      if (score < 0){
        if (!once) gameOver()
      }

      score = Math.round(score)
      document.getElementById("header").innerHTML = `score ${score}`

    }

    function gameOver(){
      document.body.style.cursor = 'auto';
      var seconds = Math.round(terrain.material.uniforms.time.value);
      document.getElementById("finalScore").innerHTML = `Congrats, you survived for ${seconds} seconds`;
      document.getElementById("overlay").style.display = "block";
      document.getElementById("rocket").style.display = "none";
      document.getElementById("header").style.display = "none";
      once = true;
    }

    function render(){
        requestAnimationFrame(render)

        // damping mouse for smoother interaction
        mouse.xDamped = lerp(mouse.xDamped, mouse.x, 0.18);
        mouse.yDamped = lerp(mouse.yDamped, mouse.y, 0.1);

        var time = performance.now() * 0.001
        terrain.material.uniforms.time.value = time;
        terrain.material.uniforms.distortCenter.value = Math.sin(time) * 0.1;
        terrain.material.uniforms.maxHeight.value = map(mouse.yDamped, 0, height, 20, 5);


        //terrain.material.uniforms.roadWidth.value =  Math.abs(Math.sin(time) * 4);
        //console.log(terrain.material.program.getAttributes())
        //console.log(terrain.material.program.getAttributes)

        // transformation of skybox
        let scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrollPercent < 0) {
            scrollPercent = 0
        } else if (scrollPercent > 1) {
            scrollPercent = 1
        }
        terrain.material.uniforms.scrollPercent.value = 0.2

            /*
        let lerpedRayleigh = map(scrollPercent, 0, 1, 0.01, 1);
        let lerpedMieDirectionalG = map(scrollPercent, 0, 1, 0.9995, 0.8);
        let lerpedLuminance = map(scrollPercent, 0, 1, 1, 0.1);
        this.skybox.material.uniforms.rayleigh.value = lerpedRayleigh;
        this.skybox.material.uniforms.mieDirectionalG.value = lerpedMieDirectionalG;
        this.skybox.material.uniforms.luminance.value = lerpedLuminance;

        scene.fog.near = map(scrollPercent, 0, 1, 10, 399 );

        calculateSunPosition( scrollPercent );
        */
        // Update Score

        // uv.y
        var PI = 3.1415926535897932384626433832795
        var t = terrain.material.uniforms.speed.value * terrain.material.uniforms.time.value
        terrain.material.uniforms.angleCenter.value = 0.35 * PI;
        terrain.material.uniforms.angleCenter.value += t * 0.9; // the x value, function of time and speed

        angleCenter = terrain.material.uniforms.angleCenter.value;
        wRoad = terrain.material.uniforms.distortCenter.value;

        //console.log(terrain.material.uniforms.angleCenter.value);

        terrain.material.uniforms.centerOff.value =  ( // Defines the path the road will take
                    Math.sin(angleCenter)
                    + Math.sin(angleCenter*0.5)
            ) * wRoad;
        //document.getElementById("header").innerHTML = terrain.material.uniforms.centerOff.value;
        document.getElementById("header").innerHTML = `Score: ${terrain.material.uniforms.centerOff.value}`
        //document.getElementById("rangey").value = Math.sign(terrain.material.uniforms.centerOff.value)*Math.pow(Math.abs(terrain.material.uniforms.centerOff.value),0.5)*100.0;

        document.getElementById("rocket").style.marginLeft = `${100*mouse.xDamped/window.innerWidth}%`
        document.getElementById("rocket").style.marginRight = `${100 - 100*mouse.xDamped/window.innerWidth}%`
        document.getElementById("rocket").style.marginTop = `60%`

        terrain.material.uniforms.roadWidth.value = 20 - time*3;
        if (terrain.material.uniforms.roadWidth.value < 0.5) terrain.material.uniforms.roadWidth.value = 0.5;

        var diff =-45 - (mouse.xDamped-mouse.x)*0.3;

        document.getElementById("rocketoo").style.transform = 'rotate('+diff+'deg)';
        //console.log('rotate('+diff+'deg)')

        terrain.material.uniforms.speed.value = terrain.material.uniforms.time.value/10;
        //console.log(terrain.material.uniforms.time.value);

        //console.log(terrain.material.uniforms.centerOff.value);
        //console.log(Math.sign(terrain.material.uniforms.centerOff.value)*Math.pow(Math.abs(terrain.material.uniforms.centerOff.value),0.5)*100.0);
        updateScore(mouse.x, Math.sign(terrain.material.uniforms.centerOff.value)*Math.pow(Math.abs(terrain.material.uniforms.centerOff.value),0.5)*100.0);

        //terrain.material.uniforms.angleCenter.value = 0.0;
        renderer.render(scene, camera)

    }

    function map (value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
    }

    function lerp (start, end, amt){
        return (1 - amt) * start + amt * end
    }
}
