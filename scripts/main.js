/*!
 * \brief  Основной модуль игровой логики "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var AEROBIKE = {};


AEROBIKE.Screen = function(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.hide = function() {};
    this.show = function() {};
    this.resize = function() {};
    this.update = function() {};
};


AEROBIKE.Start = function(on_without_login, on_login, on_vk_login, on_fb_login) {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

    var _display = new UTILS.Display(document.getElementById("start_screen"));

    function Start() {
        document.getElementById("login_btn").addEventListener("click", on_login, false);
        document.getElementById("login_vk_btn").addEventListener("click", on_vk_login, false);
        document.getElementById("login_fb_btn").addEventListener("click", on_fb_login, false);
        document.getElementById("without_login_btn").addEventListener("click", on_without_login, false);
    } Start();

    this.hide = function() {
        _display.hide();
    }
};
AEROBIKE.Start.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Garage = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _scope = this;
    var _mouse_x = 0;
    var _mouse_y = 0;
    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _display = new UTILS.Display(document.getElementById("garage_screen"));
    var _group = new THREE.Group();
    var _progress = new UTILS.ProgressManager();

    function Garage() {
        _display.show();

        var bike = new MODELS.BikePelican(_progress);
        _group.add(bike);

        var ground_texture = new UTILS.TextureLoader(_progress);
        ground_texture.load("./images/lavatile.jpg", function(texture) {
            var ground_geometry = new THREE.PlaneBufferGeometry(1000, 1000);
            ground_geometry.rotateX(-Math.PI / 2);
            var ground_material = new THREE.MeshPhongMaterial({
                map:texture, bumpMap:texture, bumpScale:2, color:0x00ff00,
                specular:50, shininess:0x333333, shading:THREE.SmoothShading
            });
            var plane = new THREE.Mesh(ground_geometry, ground_material);
            _group.add(plane);
        });
        _group.position.y = -150;

        _scope.scene.add(new THREE.AmbientLight(0xffffff));
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 0).normalize();
        _scope.scene.add(directionalLight);
        //var particle_light = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
        //particle_light.add(new THREE.PointLight(0xffffff, 2, 700));
        //particle_light.position.y = 200;

        //_scene.add(particle_light);
        _scope.scene.add(_group);

        _scope.camera.position.z = 400;

        document.addEventListener('mousemove',  onMouseMove,  false);
    } Garage();

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };

    this.resize = function() {
        _mouse_x = 0;
        _mouse_y = 0;
        _window_half_x  = window.innerWidth * 0.5;
        _window_half_y  = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _scope.camera.aspect  = window.innerWidth / window.innerHeight;
        _scope.camera.updateProjectionMatrix();
    };

    this.update = function() {
        _group.rotation.y -= X_SCENE_ROTATION;
        _scope.camera.position.x += (_mouse_x * X_VIEW_PERCENT - _scope.camera.position.x);
        _scope.camera.position.y += (-_mouse_y * Y_VIEW_PERCENT - _scope.camera.position.y);
        _scope.camera.lookAt(_scope.scene.position);
    };

    function onMouseMove(e) {
        _mouse_x = (e.clientX - _window_half_x);
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
    };
};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Settings = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Rating = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Shop = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.About = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.ChoocePartner = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Game = function() {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Main = function() {
    var _scope = this;
    var _renderer;

    var _start;
    var _garage;
    var _screen;

    function Main() {
        _renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
        _renderer.setClearColor(0x0a0c1f);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.gammaInput = true;
        _renderer.gammaOutput = true;

        var scene_container = document.getElementById("scene_container");
        scene_container.appendChild(_renderer.domElement);

        _start = new AEROBIKE.Start(toSimpleGarageScreen);
        _screen = _start;

        window.addEventListener('resize', onWindowResize, false);
    } Main();

    function toSimpleGarageScreen(e) {
        console.log("toSimpleGarageScreen");
        _start.hide();
        _garage = new AEROBIKE.Garage();
        _screen = _garage;
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    } animate();

    function render() {
        _screen.update();
        _renderer.render(_screen.scene, _screen.camera);
    }

    function onWindowResize() {
        _screen.resize();
        _renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }
};


new AEROBIKE.Main();
