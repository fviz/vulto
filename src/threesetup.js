import * as THREE from "three";

export function threeSetup() {
    // let scene = new THREE.Scene();
    // let camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
    //
    // let renderer = new THREE.WebGLRenderer();
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // document.querySelector(".threeContainer").appendChild( renderer.domElement );
    //
    // let geometry = new THREE.BoxGeometry();
    // let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // let cube = new THREE.Mesh( geometry, material );
    // cube.scale.set(0.5, 0.5, 0.5);
    // scene.add( cube );
    //
    // camera.position.z = 5;

    function projectionPosition(x, y) {
        let mouse=new THREE.Vector2();
        mouse.x = ( x / window.innerWidth ) * 2 - 1;
        mouse.y = - ( y / window.innerHeight ) * 2 + 1;
        setCubePosition(window.balls[0], mouse.x, mouse.y);
    }

    function projectionWebcam(x, y) {
        let hand=new THREE.Vector2();
        hand.x = x;
        hand.y = y;
        window.balls[0].setPosition(hand.x, hand.y);
    }

    // document.body.addEventListener("click", (event) => {
    //     projectionPosition(event.clientX, event.clientY);
    // });


    window.animateSphere = function () {
        // requestAnimationFrame( animate );
        projectionWebcam(window.x, window.y);
        //
        // renderer.render( scene, camera );
    };

    animateSphere();
}