import * as THREE from "three";

export class Ball {
    constructor() {
        this.size = 120;
        this.position = {
            x: 0,
            y: 0,
            z: 0
        }
        this.projectedPosition = new THREE.Vector3();
        this.previousPosition = new THREE.Vector3();
        this.easing = 0.1;
        this.sphere = null;
        this.playback = false;
        this.buffer = [];
        this.bufferIterator = 0;
        this.skipFrames = true;
        this.skipFrameCheck = true;
        this.DOMElement = this.generateDOMElement();
    }

    generateSphere() {
        let ballGeo = new THREE.SphereBufferGeometry(this.size, 32, 16);
        let ballMaterial = new THREE.MeshLambertMaterial();

        this.sphere = new THREE.Mesh(ballGeo, ballMaterial);
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        this.sphere.visible = false;
        this.sphere.position.x = this.position.x;
        this.sphere.position.y = this.position.y;
        this.sphere.position.z = this.position.z;
        scene.add(this.sphere);
    }

    generateDOMElement() {
        let element = document.createElement("div");
        element.innerText = "You";
        element.style.position = 'absolute';
        element.style.color = 'black';
        element.style.backgroundColor = 'white';
        document.body.appendChild(element);
        return element;
    }

    constraints(particles) {
        this.play();
        if (window.params.showBall) {

            this.sphere.visible = false;

            let i;
            let il;
            for (particles = window.cloth.particles, i = 0, il = particles.length; i < il; i++) {

                let particle = particles[i];
                let pos = particle.position;
                diff.subVectors(pos, this.projectedPosition);
                if (diff.length() < this.size) {

                    // collided
                    diff.normalize().multiplyScalar(this.size);
                    let cPos = new THREE.Vector3(this.projectedPosition.x, this.projectedPosition.y, this.projectedPosition.z);
                    pos.copy(cPos).add(diff);

                }

            }

        } else {
            this.sphere.visible = false;

        }
    }

    drawTag() {
        let x = this.projectedPosition.x + window.innerWidth / 2;
        let y = -this.projectedPosition.y + window.innerHeight / 2;
        this.DOMElement.style.left = `${x}px`;
        this.DOMElement.style.top = `${y}px`;

    }

    setPosition(x, y) {
        if (isNaN(x) || isNaN(y)) {
            x = 0;
            y= 0;
        }
        let previousPositionX = this.position.x;
        let previousPositionY = this.position.y;

        let targetPositionX = x;
        let targetPositionY = y;

        let dxEased = (targetPositionX - previousPositionX) * this.easing;
        let dyEased = (targetPositionY - previousPositionY) * this.easing;

        this.position.x += dxEased;
        this.position.y += dyEased;


        this.setProjectedPosition(this.position.x, this.position.y);
        this.sphere.position.x = this.projectedPosition.x;
        this.sphere.position.y = this.projectedPosition.y;
        this.drawTag();
    }

    play() {
        if (this.bufferIterator === this.buffer.length) {
            this.bufferIterator = 0;
        }
        if (this.playback) {

            this.setPosition(this.buffer[this.bufferIterator].x, this.buffer[this.bufferIterator].y);

            if (this.skipFrames) {
                if (this.skipFrameCheck) {
                    this.skipFrameCheck = false;
                    this.bufferIterator++;
                } else {
                    this.skipFrameCheck = true;
                }
            }
        }
    }

    setProjectedPosition(x, y) {
        let parseVector = new THREE.Vector2();
        parseVector.x = (x / window.trackingVideoSize.x) * 2 - 1;
        parseVector.y = -(y / window.trackingVideoSize.y) * 2 + 1;
        let camera = window.camera;
        let vector = new THREE.Vector3();
        vector.set(parseVector.x, parseVector.y, 0.5);
        vector.unproject(camera);
        let dir = vector.sub(camera.position).normalize();
        let distance = -camera.position.z / dir.z;
        let pos = camera.position.clone().add(dir.multiplyScalar(distance));
        this.projectedPosition.x = pos.x * 1.5;
        this.projectedPosition.y = pos.y * 1.5;
    }
}