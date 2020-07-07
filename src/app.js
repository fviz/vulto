import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import {handtrack} from "./handtrack";
import {threeSetup} from "./threesetup";
import {Ball} from "./Ball";
const axios = require('axios').default;

let time = new Date();
let enableLoad = true;

let controls;
let clothMaterial;

let userBall = new Ball();
userBall.DOMElement.innerText  = 'user';
window.balls = [userBall];

axios.get('https://vultoserver.vizent.in/api/fetch').then((response) => {
    let loadedBall = new Ball(response.data.ip, response.data.buffer);
    loadedBall.generateSphere();
    loadedBall.playback = true;
    window.balls.push(loadedBall);
}).catch((err) => {
});

window.trackingVideoSize = {
    x: 640,
    y: 480
}
let backgroundColor = 0x000000;



handtrack();

window.params = {
    enableWind: false,
    showBall: true,
    togglePins: togglePins,
};

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.1;
var xSegs = 40;
var ySegs = 30;

var restDistance = window.innerWidth / xSegs;


var clothFunction = plane( restDistance * xSegs, restDistance * ySegs );

window.cloth = new Cloth( xSegs, ySegs );

var GRAVITY = 981 * 1.4;
var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var pins = [];

var windForce = new THREE.Vector3( 0, 0, 0 );

window.ballPosition = new THREE.Vector3( 0, - 45, 0 );
var ballSize = 120; //40

var tmpForce = new THREE.Vector3();



function plane( width, height ) {

    return function ( u, v, target ) {

        var x = ( u - 0.5 ) * width;
        var y = ( v + 0.5 ) * height;
        var z = 0;

        target.set( x, y, z );

    };

}

function Particle( x, y, z, mass ) {

    this.position = new THREE.Vector3();
    this.previous = new THREE.Vector3();
    this.original = new THREE.Vector3();
    this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
    this.mass = mass;
    this.invMass = 1 / mass;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();

    // init

    clothFunction( x, y, this.position ); // position
    clothFunction( x, y, this.previous ); // previous
    clothFunction( x, y, this.original );

}

// Force -> Acceleration

Particle.prototype.addForce = function ( force ) {

    this.a.add(
        this.tmp2.copy( force ).multiplyScalar( this.invMass )
    );

};


// Performs Verlet integration

Particle.prototype.integrate = function ( timesq ) {

    var newPos = this.tmp.subVectors( this.position, this.previous );
    newPos.multiplyScalar( DRAG ).add( this.position );
    newPos.add( this.a.multiplyScalar( timesq ) );

    this.tmp = this.previous;
    this.previous = this.position;
    this.position = newPos;

    this.a.set( 0, 0, 0 );

};


window.diff = new THREE.Vector3();

function satisfyConstraints( p1, p2, distance ) {

    diff.subVectors( p2.position, p1.position );
    var currentDist = diff.length();
    if ( currentDist === 0 ) return; // prevents division by 0
    var correction = diff.multiplyScalar( 1 - distance / currentDist );
    var correctionHalf = correction.multiplyScalar( 0.5 );
    p1.position.add( correctionHalf );
    p2.position.sub( correctionHalf );

}


function Cloth( w, h ) {

    w = w || 10;
    h = h || 10;
    this.w = w;
    this.h = h;

    var particles = [];
    var constraints = [];

    var u, v;

    // Create particles
    for ( v = 0; v <= h; v ++ ) {

        for ( u = 0; u <= w; u ++ ) {

            particles.push(
                new Particle( u / w, v / h, 0, MASS )
            );

        }

    }

    // Structural

    for ( v = 0; v < h; v ++ ) {

        for ( u = 0; u < w; u ++ ) {

            constraints.push( [
                particles[ index( u, v ) ],
                particles[ index( u, v + 1 ) ],
                restDistance
            ] );

            constraints.push( [
                particles[ index( u, v ) ],
                particles[ index( u + 1, v ) ],
                restDistance
            ] );

        }

    }

    for ( u = w, v = 0; v < h; v ++ ) {

        constraints.push( [
            particles[ index( u, v ) ],
            particles[ index( u, v + 1 ) ],
            restDistance

        ] );

    }

    for ( v = h, u = 0; u < w; u ++ ) {

        constraints.push( [
            particles[ index( u, v ) ],
            particles[ index( u + 1, v ) ],
            restDistance
        ] );

    }


    // While many systems use shear and bend springs,
    // the relaxed constraints model seems to be just fine
    // using structural springs.
    // Shear
    // var diagonalDist = Math.sqrt(restDistance * restDistance * 2);


    // for (v=0;v<h;v++) {
    // 	for (u=0;u<w;u++) {

    // 		constraints.push([
    // 			particles[index(u, v)],
    // 			particles[index(u+1, v+1)],
    // 			diagonalDist
    // 		]);

    // 		constraints.push([
    // 			particles[index(u+1, v)],
    // 			particles[index(u, v+1)],
    // 			diagonalDist
    // 		]);

    // 	}
    // }


    this.particles = particles;
    this.constraints = constraints;

    function index( u, v ) {

        return u + v * ( w + 1 );

    }

    this.index = index;

}

function simulate( now ) {

    var windStrength = Math.cos( now / 7000 ) + 10;

    windForce.set( Math.sin( now / 2000 ), Math.cos( now / 3000 ), Math.sin( now / 1000 ) );
    windForce.normalize();
    windForce.multiplyScalar( windStrength );

    var i, j, il, particles, particle, constraints, constraint;

    // Aerodynamics forces

    if ( params.enableWind ) {

        var indx;
        var normal = new THREE.Vector3();
        var indices = clothGeometry.index;
        var normals = clothGeometry.attributes.normal;

        particles = cloth.particles;

        for ( i = 0, il = indices.count; i < il; i += 3 ) {

            for ( j = 0; j < 3; j ++ ) {

                indx = indices.getX( i + j );
                normal.fromBufferAttribute( normals, indx );
                tmpForce.copy( normal ).normalize().multiplyScalar( normal.dot( windForce ) );
                particles[ indx ].addForce( tmpForce );

            }

        }

    }

    for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ) {

        particle = particles[ i ];
        particle.addForce( gravity );

        particle.integrate( TIMESTEP_SQ );

    }

    // Start Constraints

    constraints = cloth.constraints;
    il = constraints.length;

    for ( i = 0; i < il; i ++ ) {

        constraint = constraints[ i ];
        satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );

    }

    // Ball Constraints

    window.balls.forEach((ball) => {
        ball.constraints(particles);
    });

    // Floor Constraints

    let pos;

    for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ) {

        particle = particles[ i ];
        pos = particle.position;
        if ( pos.y < - 1000 ) {

            pos.y = - 1000;

        }

    }

    // Pin Constraints

    for ( i = 0, il = pins.length; i < il; i ++ ) {

        var xy = pins[ i ];
        var p = particles[ xy ];
        p.position.copy( p.original );
        p.previous.copy( p.original );

    }


}

/* testing cloth simulation */
//0
var pinsFormation = [];
var pins = [ 6 ];

pinsFormation.push( pins );
// 1
pins = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
pinsFormation.push( pins );
// 2
pins = [ 0 ];
pinsFormation.push( pins );
// 3
pins = []; // cut the rope ;)
pinsFormation.push( pins );
// 4
pins = [ 0, cloth.w ]; // classic 2 pins
pinsFormation.push( pins );
// 5
pins = [0, cloth.w / 4, cloth.w / 2, cloth.w / 4 * 3, cloth.w];
pinsFormation.push(pins);
pins = pinsFormation[ 5 ];

function togglePins() {

    pins = pinsFormation[ ~ ~ ( Math.random() * pinsFormation.length ) ];

}

let container, stats;
let renderer;

let clothGeometry;
let sphere;
let object;

init();
animate( 0 );

function init() {

    container = document.querySelector( '.threeContainer' );
    document.body.appendChild( container );

    // scene

    window.scene = new THREE.Scene();
    scene.background = new THREE.Color( backgroundColor );
    scene.fog = new THREE.Fog( backgroundColor, 500, 10000 );

    // camera

    window.camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 0, 0, 1500 );

    // lights

    scene.add( new THREE.AmbientLight( 0x666666 ) );

    var light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );

    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 300;

    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;

    light.shadow.camera.far = 1000;

    scene.add( light );

    // cloth material

    var loader = new THREE.TextureLoader();
    var clothTexture = loader.load( 'mypat1.png' );
    clothTexture.anisotropy = 16;

    clothMaterial = new THREE.MeshLambertMaterial( {
        map: clothTexture,
        side: THREE.DoubleSide,
        alphaTest: 0.5,
        wireframe: false
    } );

    // cloth geometry

    clothGeometry = new THREE.ParametricBufferGeometry( clothFunction, cloth.w, cloth.h );

    // cloth mesh

    object = new THREE.Mesh( clothGeometry, clothMaterial );
    object.position.set( 0, 0, 0 );
    object.castShadow = true;
    scene.add( object );

    object.customDepthMaterial = new THREE.MeshDepthMaterial( {
        depthPacking: THREE.RGBADepthPacking,
        map: clothTexture,
        alphaTest: 0.5
    } );

    // sphere

    userBall.generateSphere();

    // ground

    var groundTexture = loader.load( 'grasslight-big.jpg' );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set( 25, 25 );
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );
    groundMaterial = new THREE.MeshStandardMaterial({
        color: backgroundColor
    });

    var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
    mesh.position.y = - 1000;
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.shadowMap.enabled = true;

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1000;
    controls.maxDistance = 5000;

    // performance monitor

    // stats = new Stats();
    // container.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    //

    // var gui = new GUI();
    // gui.add( params, 'enableWind' ).name( 'Enable wind' );
    // gui.add( params, 'showBall' ).name( 'Show ball' );
    // gui.add( params, 'togglePins' ).name( 'Toggle pins' );
    // gui.add( params, 'handtrackPositionX' ).name( 'handtrackPositionX' );
    // gui.add( params, 'handtrackPositionY' ).name( 'handtrackPositionY' );
    //

    if ( typeof TESTING !== 'undefined' ) {

        for ( var i = 0; i < 50; i ++ ) {

            simulate( 500 - 10 * i );

        }

    }

}

//

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate( now ) {

    let currentTime = new Date();
    let timeDiff = currentTime - time;
    if (timeDiff > 30000 && enableLoad) {
        enableLoad = false;
        axios.get('https://vultoserver.vizent.in/api/fetch').then((response) => {
            let loadedBall = new Ball(response.data.ip, response.data.buffer);
            loadedBall.generateSphere();
            loadedBall.playback = true;
            window.balls.push(loadedBall);
        }).catch((err) => {
        });
    }
    controls.update();
    requestAnimationFrame( animate );
    if (window.animateSphere) {
        window.animateSphere();
    }
    simulate( now );
    render();
    // stats.update();

}

function render() {

    var p = cloth.particles;

    for ( var i = 0, il = p.length; i < il; i ++ ) {

        var v = p[ i ].position;

        clothGeometry.attributes.position.setXYZ( i, v.x, v.y, v.z );

    }

    clothGeometry.attributes.position.needsUpdate = true;

    clothGeometry.computeVertexNormals();

    renderer.render( scene, camera );

}

threeSetup();
