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


// Garage screen
AEROBIKE.Garage = function(
    on_settings,
    on_rating,
    on_shop,
    on_chooce_partner,
    on_fast_game,
    on_about) {
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
        document.getElementById("settings_btn").addEventListener("click", on_settings, false);
        document.getElementById("rating_btn").addEventListener("click", on_rating, false);
        document.getElementById("shop_btn").addEventListener("click", on_shop, false);
        document.getElementById("chooce_partner_btn").addEventListener("click", on_chooce_partner, false);
        document.getElementById("fast_game_btn").addEventListener("click", on_fast_game, false);
        document.getElementById("about_btn").addEventListener("click", on_about, false);

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

        document.getElementById("prev_bike_btn").addEventListener("click", onPrevBike, false);
        document.getElementById("next_bike_btn").addEventListener("click", onNextBike, false);

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
    } Garage();

    function onPrevBike() {

    }

    function onNextBike() {

    }

    function onMouseMove(e) {
        _mouse_x = (e.clientX - _window_half_x);
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
    }

    function onMouseDown(e) {

    }

    function onMouseUp(e) {

    }

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
};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


// Settings screen
AEROBIKE.Settings = function(garage, on_return_settings) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("settings_screen"));

    function Settings() {
        document.getElementById("return_settings_btn").addEventListener("click", on_return_settings, false);
    } Settings();

    this.resize = function() {
        garage.resize();
    };

    this.update = function() {
        garage.update();
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Settings.prototype = Object.create(AEROBIKE.Screen.prototype);


// Rating screen
AEROBIKE.Rating = function(garage, on_return_rating) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("rating_screen"));

    function Rating() {
        document.getElementById("return_rating_btn").addEventListener("click", on_return_rating, false);
    } Rating();

    this.resize = function() {
        garage.resize();
    };

    this.update = function() {
        garage.update();
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Rating.prototype = Object.create(AEROBIKE.Screen.prototype);


// Shop screen
AEROBIKE.Shop = function(garage, on_return_shop) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("shop_screen"));

    function Shop() {
        document.getElementById("return_shop_btn").addEventListener("click", on_return_shop, false);
    } Shop();

    this.resize = function() {
        garage.resize();
    };

    this.update = function() {
        garage.update();
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Shop.prototype = Object.create(AEROBIKE.Screen.prototype);


// About screen
AEROBIKE.About = function(garage, on_return_about) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("about_screen"));

    function About() {
        document.getElementById("return_about_btn").addEventListener("click", on_return_about, false);
    } About();

    this.resize = function() {
        garage.resize();
    };

    this.update = function() {
        garage.update();
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.About.prototype = Object.create(AEROBIKE.Screen.prototype);


// ChoocePartner screen
AEROBIKE.ChoocePartner = function(garage, on_return_chooce_partner) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("chooce_partner_screen"));

    function ChoocePartner() {
        document.getElementById("return_chooce_partner_btn").addEventListener("click", on_return_chooce_partner, false);
    } ChoocePartner();

    this.resize = function() {
        garage.resize();
    };

    this.update = function() {
        garage.update();
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.ChoocePartner.prototype = Object.create(AEROBIKE.Screen.prototype);


// Game screen
AEROBIKE.Game = function(on_return_game) {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

    var _display = new UTILS.Display(document.getElementById("game_screen"));

    function Game() {
        document.getElementById("return_game_btn").addEventListener("click", on_return_game, false);

        document.getElementById("up_game_btn").addEventListener("click", onUp, false);
        document.getElementById("down_game_btn").addEventListener("click", onDown, false);
        document.getElementById("left_game_btn").addEventListener("click", onLeft, false);
        document.getElementById("right_game_btn").addEventListener("click", onRight, false);
    } Game();

    function onUp() {}
    function onDown() {}
    function onLeft() {}
    function onRight() {}

    this.resize = function() {
    };

    this.update = function() {
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Game.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Main = function() {
    var _scope = this;
    var _renderer;

    var _screen;
    var _start;
    var _garage;
    var _settings;
    var _rating;
    var _shop;
    var _chooce_partner;
    var _about;
    var _game;

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
        _garage = new AEROBIKE.Garage(
            onSettings,
            onRating,
            onShop,
            onChoocePartner,
            onFastGame,
            onAbout);
        _settings = new AEROBIKE.Settings(_garage, onReturnSettings);
        _rating = new AEROBIKE.Rating(_garage, onReturnRating);
        _shop = new AEROBIKE.Shop(_garage, onReturnShop);
        _chooce_partner = new AEROBIKE.ChoocePartner(_garage, onReturnChoocePartner);
        _about = new AEROBIKE.About(_garage, onReturnAbout);
        _game = new AEROBIKE.Game(onReturnGame);

        _start.hide();
        _garage.show();
        _screen = _garage;
    }

    // Garage methods
    function onSettings() {
        _garage.hide();
        _settings.show();
        _screen = _settings;
    }

    function onRating() {
        _garage.hide();
        _rating.show();
        _screen = _rating;
    }

    function onShop() {
        _garage.hide();
        _shop.show();
        _screen = _shop;
    }

    function onChoocePartner() {
        _garage.hide();
        _chooce_partner.show();
        _screen = _chooce_partner;
    }

    function onAbout() {
        _garage.hide();
        _about.show();
        _screen = _about;
    }

    function onFastGame() {
        _garage.hide();
        _game.show();
        _screen = _game;
    }

    // Main methods
    function onReturnSettings() {
        _settings.hide();
        _garage.show();
        _screen = _garage;
    }

    // Rating methods
    function onReturnRating() {
        _rating.hide();
        _garage.show();
        _screen = _garage;
    }

    // Shop methods
    function onReturnShop() {
        _shop.hide();
        _garage.show();
        _screen = _garage;
    }

    // cHOOCE PARTNER methods
    function onReturnChoocePartner() {
        _chooce_partner.hide();
        _garage.show();
        _screen = _garage;
    }

    // About methods
    function onReturnAbout() {
        _about.hide();
        _garage.show();
        _screen = _garage;
    }

    // Game methods
    function onReturnGame() {
        _game.hide();
        _garage.show();
        _screen = _garage;
    }

    // Main methods
    function render() {
        _screen.update();
        _renderer.render(_screen.scene, _screen.camera);
    }

    function onWindowResize() {
        _screen.resize();
        _renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    } animate();
};
new AEROBIKE.Main();
