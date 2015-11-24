/*!
 * \brief  Основной модуль игровой логики "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var AEROBIKE = {};

AEROBIKE.Start = function() {

};


AEROBIKE.Garage = function() {
    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _mouse_x = 0;
    var _mouse_y = 0;
    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _group = new THREE.Group();
    var _scene = new THREE.Scene();
    var _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    var _progress = new UTILS.ProgressManager();

    function Garage() {
        var bike = new MODELS.BikePelican(_progress);
        _group.add(bike);

        var ground_texture = new UTILS.TextureLoader();
        ground_texture.load(_progress, "./images/lavatile.jpg", function(texture) {
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

        _scene.add(new THREE.AmbientLight(0xffffff));
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 0).normalize();
        _scene.add(directionalLight);
        //var particle_light = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
        //particle_light.add(new THREE.PointLight(0xffffff, 2, 700));
        //particle_light.position.y = 200;

        //_scene.add(particle_light);
        _scene.add(_group);

        _camera.position.z = 400;
    } Garage();

    this.scene = function() {
        return _scene;
    };

    this.camera = function() {
        return _camera;
    };

    this.resize = function() {
        _mouse_x = 0;
        _mouse_y = 0;
        _window_half_x  = window.innerWidth * 0.5;
        _window_half_y  = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _camera.aspect  = window.innerWidth / window.innerHeight;
        _camera.updateProjectionMatrix();
    };

    this.update = function() {
        _group.rotation.y -= X_SCENE_ROTATION;
        _camera.position.x += (_mouse_x * X_VIEW_PERCENT - _camera.position.x);
        _camera.position.y += (-_mouse_y * Y_VIEW_PERCENT - _camera.position.y);
        _camera.lookAt(_scene.position);
    };

    this.mouseMove = function(e) {
        _mouse_x = (e.clientX - _window_half_x);
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
    };
};


AEROBIKE.Main = function() {
    var _scope = this;
    var _renderer;

    var _garage;

    function Main() {
        new UTILS.CreateStyle("html,body{background-color:#f0f0f0;overflow:hidden;width:100 %;height:100 %;margin:0;padding:0;}");
        new UTILS.CreateStyle("#scene_container{width:100%; height:100%; touch-action:none;}");

        _renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
        _renderer.setClearColor(0x0a0c1f);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.gammaInput = true;
        _renderer.gammaOutput = true;

        var scene_container = new UTILS.CreateContainer("scene_container");
        scene_container.appendChild(_renderer.domElement);

        _garage = new AEROBIKE.Garage();

        document.addEventListener('mousedown',  onMouseDown,  false);
        document.addEventListener('mouseup',    onMouseUp,    false);
        document.addEventListener('mousemove',  onMouseMove,  false);
        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('touchstart', onTouchStart, false);
        document.addEventListener('touchmove',  onTouchMove,  false);

        window.addEventListener('resize', onWindowResize, false);

        //var display = new UTILS.Display(scene_container);
        //display.hide();
        //display.show();
    } Main();

    function animate() {
        requestAnimationFrame(animate);
        render();
    } animate();

    function render() {
        _garage.update();
        _renderer.render(_garage.scene(), _garage.camera());
    }

    function onWindowResize() {
        _garage.resize();
        _renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }

    function onMouseDown(e) {
    }

    function onMouseUp(e) {
    }

    function onMouseMove(e) {
        _garage.mouseMove(e);
    }


    function onMouseWheel(e) {
    }

    function onTouchStart(e) {
        //if (e.touches.length == 1) {
        //    e.preventDefault();
        //    e.touches[0].pageX;
        //    e.touches[0].pageY;
        //}
    }

    function onTouchMove(e) {
        //if (e.touches.length == 1) {
        //    e.preventDefault();
        //    e.touches[0].pageX;
        //    e.touches[0].pageY;
        //}
    }
};


//var ui = new UI.View();
////var container = new ui.Container(10, 10, window.innerWidth - 20, window.innerHeight - 20);
////container.open();
//
////var button = new ui.Button(undefined, window.innerWidth / 2 - 20, window.innerHeight / 2 - 20, 100, 30);
//var close_button = function() {
//    button.close();
//};
////var button = new ui.Button(close_button, 200, 100, 100, 30, "кнопка", 20);
//var button = new ui.Button(undefined, 200, 100, 100, 30, "на старт", 20);
//button.open();

var main = new AEROBIKE.Main();
