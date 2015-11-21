var AEROBIKE = {VERSIION: '0.1'};


AEROBIKE.Utils = function() {
    this.CreateStyle = function(inner_html) {
        var style = document.createElement('style');
        style.innerHTML = inner_html;
        document.head.appendChild(style);
        return style;
    };

    this.CreateContainer = function(container_name) {
        var container = document.createElement('div');
        container.id = container_name;
        document.body.appendChild(container);
        return container;
    };

    this.getGradientTexture = function(w, h) {
        //var end_r = (w < h) ? h/2 : w/2;
        //var gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, end_r);
        //gradient.addColorStop(0.5, 'rgba(10,15,50,0.9)');
        //gradient.addColorStop(1, 'rgba(60,60,80,0.6)');
        //return gradient;

        var canvas = document.createElement( 'canvas' );
        canvas.width = w;
        canvas.height = h;

        var context = canvas.getContext('2d');
        var gradient = context.createRadialGradient(w / 2,  h / 2,  0,  w / 2,  h / 2,  w / 2);
        gradient.addColorStop(0.5, 'rgba(15,15,50,1)');
        gradient.addColorStop(1, 'rgba(60,60,80,0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    };


    this.loadTexture = function(path, callback, texture_placeholder) {
        var texture = new THREE.Texture(texture_placeholder);
        var material = new THREE.MeshBasicMaterial({map:texture, overdraw:true});
        var image = new Image();
        image.onload = function() {
            texture.needsUpdate = true;
            material.map.image = this;
            callback();
        };
        image.src = path;
        return material;
    }


    this.ProgressManager = function() {
        var _manager = new THREE.LoadingManager();
        _manager.onProgress = function(item, loaded, total) {
            //console.log(item, loaded, total);
        };

        this.manager = function() {
            return _manager;
        }
    };

    this.TextureLoader = function() {
        var _loader;
        var _texture;
        var _on_load;

        this.load = function(manager, texture_path, on_load) {
            _on_load = on_load;
            _loader = new THREE.ImageLoader(manager);
            _loader.load(texture_path, onLoad);
        }

        function onLoad(image) {
            _texture = new THREE.Texture();
            _texture.image = image;
            _texture.needsUpdate = true;
            _texture.wrapS = _texture.wrapT = THREE.RepeatWrapping;
            _texture.anisotropy = 16;
            if (_on_load) {
                _on_load(_texture);
            }
        }
    }


    this.ObjLoader = function() {
        var _loader;
        var _texture;
        var _on_load;

        this.load = function(manager, obj_path, texture, on_load) {
            _on_load = on_load;
            _loader = new THREE.OBJLoader(manager);
            _texture = texture;
            _loader.load(obj_path, onLoad, onProgress, onError);
        };

        function onLoad(object) {
            object.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    child.material.map = _texture;
                }
            });

            if(_on_load) {
                _on_load(object);
            }
        }


        function onProgress() {
            console.log("onProgress");
        }

        function onError() {
            console.log("Obj loading error.");
        }
    }
};


var utils = new AEROBIKE.Utils();


AEROBIKE.Garage = function() {
    var _self = this;

    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _mouse_x = 0;
    var _mouse_y = 0;
    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _group = undefined;
    var _scene = undefined;
    var _camera = undefined;

    var _progress = new utils.ProgressManager();
    var _obj_loader;
    var _is_complete = false;

    this.init = function(on_complete) {
        _obj_loader = new utils.ObjLoader();
        var texture = new utils.TextureLoader();
        _group = new THREE.Group();
        _group.position.y = -150;
        texture.load(_progress.manager(), "./images/test.jpg", function(texture) {
            _obj_loader.load(_progress.manager(), "./objs/bike.obj", texture, function(obj) {
                obj.position.y = 100;
                _group.add(obj);
            });
        });
        var shader_geometry = new THREE.PlaneBufferGeometry(100, 150);
        shader_geometry.rotateX(-Math.PI / 2);
        var material = new THREE.MeshBasicMaterial({map:utils.getGradientTexture(100, 100), overdraw:0.5});
        //var material = new THREE.MeshLambertMaterial({map:utils.getGradientTexture(100, 100)});
        var plane = new THREE.Mesh(shader_geometry, material);
        //
        _group.add(plane);

        _scene = new THREE.Scene();
        _scene.add(new THREE.AmbientLight( 0x404040 ));
        _scene.add(_group);

        _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
        _camera.position.z = 400;

    };

    this.scene = function() {
        return _scene;
    };

    this.camera = function() {
        return _camera;
    };

    this.resize = function() {
        _mouse_x = 0;
        _mouse_y = 0;
        _window_half_x = window.innerWidth * 0.5;
        _window_half_y = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _camera.aspect = window.innerWidth / window.innerHeight;
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


AEROBIKE.Game = function() {
    var _self = this;
    var _renderer;

    var _garage;

    function render() {
        _garage.update();
        _renderer.render(_garage.scene(), _garage.camera());
    }

    this.init = function() {
        new utils.CreateStyle("html,body{background-color:#f0f0f0;overflow:hidden;width:100 %;height:100 %;margin:0;padding:0;}");
        new utils.CreateStyle("#scene_container{width:100%; height:100%; touch-action:none;}");

        _renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
        _renderer.setClearColor(0x0a0c1f);
        _renderer.setPixelRatio(window.devicePixelRatio);
        //_renderer.setClearColor(0xf0f0f0);
        _renderer.setSize(window.innerWidth, window.innerHeight);

        var scene_container = new utils.CreateContainer("scene_container");
        scene_container.appendChild(_renderer.domElement);

        _garage = new AEROBIKE.Garage();
        _garage.init();

        document.addEventListener('mousedown',  onMouseDown,  false);
        document.addEventListener('mouseup',    onMouseUp,    false);
        document.addEventListener('mousemove',  onMouseMove,  false);
        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('touchstart', onTouchStart, false);
        document.addEventListener('touchmove',  onTouchMove,  false);

        window.addEventListener('resize', onWindowResize, false);
    };

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

    this.animate = function() {
        requestAnimationFrame(_self.animate);
        render();
    };
};


function main() {
    var ui = new UI.View();
    //var container = new ui.Container(10, 10, window.innerWidth - 20, window.innerHeight - 20);
    //container.open();

    //var button = new ui.Button(undefined, window.innerWidth / 2 - 20, window.innerHeight / 2 - 20, 100, 30);
    var close_button = function() {
        button.close();
    };
    //var button = new ui.Button(close_button, 200, 100, 100, 30, "кнопка", 20);
    var button = new ui.Button(undefined, 200, 100, 100, 30, "на старт", 20);
    button.open();


    var game = new AEROBIKE.Game();
    game.init();
    game.animate();
};


main();