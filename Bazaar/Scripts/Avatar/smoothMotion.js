//
//  smoothMotion.js
//
//  Created by Kalila L on Jan. 27 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

Script.include("/~/system/libraries/utils.js");

var percent = 0;
var elapsed = 0;
var start = {
    x: MyAvatar.position.x,
    y: MyAvatar.position.y,
    z: MyAvatar.position.z,
}
var end = {
    x: MyAvatar.position.x,
    y: MyAvatar.position.y,
    z: MyAvatar.position.z + 1,
}
var total = 10000; // 10 seconds
var INTERVAL = 25; // 25 ms

var mainInterval = Script.setInterval(function () {
    if (percent >= 1 || elapsed >= total) {
        Script.clearInterval(mainInterval);
        return;
    }

    MyAvatar.position = {
        x: easeInOutQuad(percent, elapsed, start.x, end.x, total),
        y: easeInOutQuad(percent, elapsed, start.y, end.y, total),
        z: easeInOutQuad(percent, elapsed, start.z, end.z, total)
    };

    percent = (MyAvatar.position.z - start.z) / (end.z - start.z);
    elapsed = elapsed + INTERVAL;
    console.log(percent, elapsed);
}, INTERVAL);

// To be moved to utils.js

function easeInOutQuad (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t + b;
    return -c/2 * ((--t)*(t-2) - 1) + b;
};