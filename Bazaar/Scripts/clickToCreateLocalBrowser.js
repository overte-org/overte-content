/*
    clickToCreateLocalBrowser.js

    Created by Kalila L. on 13 Dec 2020
    Copyright 2020 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will create a local browser entity when you click on the entity.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;
    var webViewID = null;

    // Main Script Functionality

    function onMousePressOnEntity(pressedEntityID, event) {
        if (_this.entityID === pressedEntityID && event.isPrimaryButton) {
            if (webViewID === null) {
                var METERS_TO_INCHES = 39.3701;
                webViewID = Entities.addEntity({
                    type: "Web",
                    sourceUrl: "https://google.com/",
                    position: Vec3.sum(MyAvatar.position, Vec3.multiplyQbyV(MyAvatar.orientation, { x: 0, y: 0.75, z: -4 })),
                    rotation: MyAvatar.orientation,
                    dimensions: {
                        x: 3,
                        y: 3 * 1080 / 1920,
                        z: 0.01
                    },
                    dpi: 1920 / (3 * METERS_TO_INCHES),
                    useBackground: false, // this makes the web view transparent or not
                    lifetime: 30
                }, "local");
            } else {
                destroyWebEntity();
            }
        }
    }

    function destroyWebEntity() {
        Entities.deleteEntity(webViewID);
        webViewID = null;
    }

    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;
        
        Entities.mousePressOnEntity.connect(onMousePressOnEntity);
        Window.domainChanged.connect(destroyWebEntity);
    };

    this.unload = function (entityID) {
        Entities.mousePressOnEntity.disconnect(onMousePressOnEntity);
        Window.domainChanged.disconnect(destroyWebEntity);
    };

});