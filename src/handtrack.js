import * as handTrack from "handtrackjs";
import {Ball} from "./Ball";
import {load} from "handtrackjs";

let xAverageArray = [];
let yAverageArray = [];

class RecordSession {
    constructor() {
        this.limit = 200;
        this.buffer = [];
        this.ball = new Ball();
        this.recording = true;
    }

    addToBuffer(record) {
        if (this.buffer.length < this.limit) {
            this.buffer.push(record);
        } else {
            this.finishedRecording();
        }
    }

    finishedRecording() {
        if (this.recording) {
            console.log("Finished recording");
            this.recording = false;
            window.balls.push(this.ball);
            this.ball.generateSphere();
            this.ball.buffer = this.buffer;
            this.ball.playback = true;
            this.ball.DOMElement.innerText = "IP: 34.33.0.3\nDATE: 30/04/2021 8:32PM";
        }
    }
}

let recordSession = new RecordSession();

export function handtrack() {
    const video = document.getElementById("myvideo");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    let trackButton = document.getElementById("trackbutton");
    let loadingStatus = document.querySelector(".loaddiv");
    let updateNote = document.querySelector(".updateNote");
    let ui = document.querySelector('.ui');

    let isVideo = false;
    let model = null;

// video.width = 500
// video.height = 400

    const modelParams = {
        flipHorizontal: true,   // flip e.g for video
        maxNumBoxes: 20,        // maximum number of boxes to detect
        iouThreshold: 0.5,      // ioU threshold for non-max suppression
        scoreThreshold: 0.66,    // confidence threshold for predictions.
    }

    function startVideo() {
        handTrack.startVideo(video).then(function (status) {
            if (status) {
                updateNote.innerText = "Video started. Now tracking"
                isVideo = true
                runDetection()
            } else {
                updateNote.innerText = "Please enable video"
            }
        });
    }

    function toggleVideo() {
        if (!isVideo) {
            startVideo();
        } else {
            handTrack.stopVideo(video)
            isVideo = false;
        }
    }

    trackButton.addEventListener("click", function(){
        toggleVideo();
        ui.style.display = 'none';
    });

    function calculateAverage(array) {
        let total = 0;
        array.forEach((number) => {
            total += number;
        });
        return total / array.length;
    }

    function runDetection() {
        model.detect(video).then(predictions => {
            model.renderPredictions(predictions, canvas, context, video);
            let previousX = window.x;
            let previousY = window.y;
            // context.clearRect(0, 0, canvas.width, canvas.height);
            // console.log("Predictions: ", predictions);
            // model.renderPredictions(predictions, canvas, context, video);
            if (predictions.length > 0) {
                window.isCapturing = true;
                predictions.forEach( (prediction) => {
                    let bbox = prediction.bbox;
                    let px = bbox[0];
                    let py = bbox[1];
                    let pw = bbox[2];
                    let ph = bbox[3];
                    let x = px + pw / 2;
                    let y = py + ph / 2;

                    if (xAverageArray.length < 10) {
                        xAverageArray.push(x);
                    } else if (xAverageArray.length >= 10) {
                        xAverageArray.shift();
                        xAverageArray.push(x);
                        yAverageArray.shift();
                        yAverageArray.push(y);
                    }

                    let positionRecord = {
                        x: null,
                        y: null
                    }

                    window.x  = calculateAverage(xAverageArray);
                    positionRecord.x = window.x;

                    window.y = calculateAverage(yAverageArray);
                    positionRecord.y = window.y;

                    recordSession.addToBuffer(positionRecord);

                    if (isNaN(window.x)) {
                        window.x = 0;
                    }

                    if (isNaN(window.y)) {
                        window.y = 0;
                    }
                });
            } else {
                window.isCapturing = false;
            }
            if (isVideo) {
                requestAnimationFrame(runDetection);
            }
        });
    }

// Load the model.
    handTrack.load(modelParams).then(lmodel => {
        // detect objects in the image.
        model = lmodel;
        loadingStatus.style.opacity = '0';
        trackButton.style.display = 'inline';
        trackButton.disabled = false;
    });
}