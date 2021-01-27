// ChromaKey.js
//
// Created by Kalila L. on Jan. 26, 2021
//
// Copyright 2021 Vircadia contributors.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
// Algorithms to remove a "green" screen from the background of a video in realtime and write that to a canvas.
//

// Options
const TIMEOUT_TO_INIT = 4000;
var shouldFindSpecific = false;
var videoIDToFind = 'testVideo';
var videoPrefixToFind = 'videosource_';
var workCanvas = 'c1';
var finalCanvas = 'c2';
var heightMultiplier = 0.5;
var widthMultiplier = 0.5;
var shouldWaitForPlay = false;

// Variables
var videoToChroma;

var video;
var c1;
var ctx1;
var c2;
var ctx2;

var width;
var height;

// let l_r = 131,
//     l_g = 190,
//     l_b = 137,
// 
//     d_r = 74,
//     d_g = 148,
//     d_b = 100;
// 
// let tolerance = 0.5;

// function calculateDistance (c, min, max) {
//     if(c < min) return min - c;
//     if(c > max) return c - max;
// 
//     return 0;
// }
// 
// function computeFrame() {
//     ctx1.drawImage(video, 0, 0, width, height);
//     let frame = ctx1.getImageData(0, 0, width, height);
//     let l = frame.data.length / 4;
// 
//     for (let i = 0; i < l; i++) {
//         let _r = frame.data[i * 4 + 0];
//         let _g = frame.data[i * 4 + 1];
//         let _b = frame.data[i * 4 + 2];
// 
//         let difference = calculateDistance(_r, d_r, l_r) + 
//                      calculateDistance(_g, d_g, l_g) +
//                      calculateDistance(_b, d_b, l_b);
//         difference /= (255 * 3); // convert to percent
//         if (difference < tolerance)
//         frame.data[i * 4 + 3] = 0;
//     }
//     ctx2.putImageData(frame, 0, 0);
//     return;
// }

function loadProcessor () {
    video = document.getElementById(videoToChroma);
    c1 = document.getElementById(workCanvas);
    ctx1 = c1.getContext("2d");
    c2 = document.getElementById(finalCanvas);
    ctx2 = c2.getContext("2d");
    if (shouldWaitForPlay === true) {
        video.addEventListener("play", function() {
            height = video.videoHeight * heightMultiplier;
            width = video.videoWidth * widthMultiplier;
            c1.height = height;
            c1.width = width;
            c2.height = height;
            c2.width = width;
            timerCallback();
        }, false);
    } else {
        height = video.videoHeight * heightMultiplier;
        width = video.videoWidth * widthMultiplier;
        c1.height = height;
        c1.width = width;
        c2.height = height;
        c2.width = width;
        timerCallback();
    }
}

function timerCallback () {
    if (video.paused || video.ended) {
        return;
    }
    computeFrame();
    setTimeout(function () {
        timerCallback();
    }, 0);
}

function rgbTest (r, g, b) {
    var redTest = r > 100; // orig > 100
    var greenTest = g > 100; // orig > 100
    var blueTest = b < 43; // orig < 43
    if (redTest && greenTest && blueTest) { 
        return true;
    } else {
        return false;
    }
}

function computeFrame () {
    ctx1.drawImage(video, 0, 0, width, height);
    let frame = ctx1.getImageData(0, 0, width, height);
    let l = frame.data.length / 4;

    for (let i = 0; i < l; i++) {
        let r = frame.data[i * 4 + 0];
        let g = frame.data[i * 4 + 1];
        let b = frame.data[i * 4 + 2];

        if (rgbTest(r, g, b)) {
            frame.data[i * 4 + 3] = 0;
        }
    }
    ctx2.putImageData (frame, 0, 0);
    // ctx2.putImageData(frame, 0, 0, 0, 0, width, height);
    return;
}

function initialize () {
    console.info('ChromaKey initializing.');
    var elements = document.getElementsByTagName('video');
    
    for (let i = 0; i < elements.length; i++) {
        var item = elements[i];
        if ((shouldFindSpecific && videoIDToFind === item.id) || item.id.startsWith(videoPrefixToFind)) {
            videoToChroma = item.id;
            loadProcessor();
            console.info('Using ID', elements[i].id, 'as source for ChromaKey.');
        }
    }
}

setTimeout(function(){ initialize(); }, TIMEOUT_TO_INIT);

// Function to process alpha frames
// function processFrame() {
//   buffer.drawImage(video, 0, 0);
// 
//   // this can be done without alphaData, except in Firefox which doesn't like it when image is bigger than the canvas
//   var image = buffer.getImageData(0, 0, width, height),
//     imageData = image.data,
//     alphaData = buffer.getImageData(0, height, width, height).data;
// 
//   for (var i = 3, len = imageData.length; i < len; i = i + 4) {
//     imageData[i] = alphaData[i - 1];
//   }
// 
//   output.putImageData(image, 0, 0, 0, 0, width, height);
// }