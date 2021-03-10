/*
    webEntityZoneLoader.js

    Created by Kalila L. on 13 Oct 2020
    Copyright 2020 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will create/destroy web entities in a specified zone.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    var zoneToHandle;
    var maxFPS;
    var relative;
    var rotation; // Can be "Quat" or "Vec3Degrees"
    var webEntitiesToLoad = [];
    var webEntitiesActive = [];

    // User Data Functionality
    //
    // Required values for web entities are:
    // url, position, rotation, dimensions, and dpi
    // All others are optional to help save space in userData.
    //

    var defaultUserData = {
        "webEntitiesToLoad": [
            {
                "url": "https://google.com/",
                "script": "https://lol.com/script.js",
                "serverScripts": "https://lol.com/script.js",
                "position": [400, 22, 400],
                "rotation": [0, 0, 0],
                "dimensions": [2, 2],
                "dpi": 10,
                "background": true
            }
        ],
        "options": {
            "relative": true,
            "rotation": "Quat",
            "maxFPS": 30,
            "zoneToHandle": ""
        }
    }
    
    function getEntityUserData() {
        return Entities.getEntityProperties(_this.entityID, ["userData"]).userData;
    }

    function setDefaultUserData() {
        Entities.editEntity(_this.entityID, {
            userData: JSON.stringify(defaultUserData)
        });
    }

    function getAndParseUserData() {
        var userData = getEntityUserData();

        try {
            userData = Object(JSON.parse(userData)); 
        } catch (e) {
            userData = defaultUserData;
            setDefaultUserData();
        }

        return userData;
    }
    
    // Main Script Functionality
    
    function destroyAllWebEntities() {
        for (i = 0; i < webEntitiesActive.length; i++) {
            Entities.deleteEntity(webEntitiesActive[i]);
        } 
    }

    function onZoneEnter (zoneID) {
        if (zoneID === zoneToHandle) {
            var userData = getAndParseUserData();

            if (userData.options.maxFPS) {
                maxFPS = userData.options.maxFPS;
            }

            if (userData.options.relative) {
                relative = userData.options.relative;
            }
            
            if (userData.options.rotation) {
                rotation = userData.options.rotation;
            } else {
                rotation = "Quat";
            }

            if (userData.webEntitiesToLoad) {
                webEntitiesToLoad = userData.webEntitiesToLoad;
            }

            for (i = 0; i < webEntitiesToLoad.length; i++) {
                var loaderEntityProps = Entities.getEntityProperties(_this.entityID, ["position", "rotation"]);

                var webPosition;
                if (relative === true) {
                    loaderEntityProps.position;
                    loaderEntityProps.rotation;

                    webPosition = {
                        "x": webEntitiesToLoad[i].position[0],
                        "y": webEntitiesToLoad[i].position[1],
                        "z": webEntitiesToLoad[i].position[2]
                    }

                    webPosition = Vec3.sum(loaderEntityProps.position, Vec3.multiplyQbyV(loaderEntityProps.rotation, webPosition));
                } else {
                    webPosition = {
                        "x": webEntitiesToLoad[i].position[0],
                        "y": webEntitiesToLoad[i].position[1],
                        "z": webEntitiesToLoad[i].position[2]
                    }
                }

                var webRotation;
                if (relative === true) {
                    var loaderEntityRotation = loaderEntityProps.rotation;
                    
                    webRotation = {
                        "x": webEntitiesToLoad[i].rotation[0],
                        "y": webEntitiesToLoad[i].rotation[1],
                        "z": webEntitiesToLoad[i].rotation[2],
                        "w": 1
                    }
                    
                    if (rotation === "Vec3Degrees") {
                        webRotation = Quat.fromVec3Degrees({ x: webRotation.x, y: webRotation.y, z: webRotation.z });
                    }
                    
                    webRotation = Quat.multiply(loaderEntityRotation, webRotation);
                } else {
                    webRotation = {
                        "x": webEntitiesToLoad[i].rotation[0],
                        "y": webEntitiesToLoad[i].rotation[1],
                        "z": webEntitiesToLoad[i].rotation[2],
                        "w": 1
                    }
                    
                    webRotation = Quat.fromVec3Degrees({ x: webRotation.x, y: webRotation.y, z: webRotation.z });
                }

                var webDimensions = {
                    "x": webEntitiesToLoad[i].dimensions[0],
                    "y": webEntitiesToLoad[i].dimensions[1],
                    "z": 0.0100
                }

                var webScript = '';
                if (webEntitiesToLoad[i].script) {
                    webScript = webEntitiesToLoad[i].script;
                }
                
                var webServerScripts = '';
                if (webEntitiesToLoad[i].serverScripts) {
                    webServerScripts = webEntitiesToLoad[i].serverScripts;
                }
                
                var webBackground = true;
                if (webEntitiesToLoad[i].background) {
                    webBackground = webEntitiesToLoad[i].background;
                }
                
                var webEntity = Entities.addEntity({
                    type: "Web",
                    parentID: _this.entityID,
                    position: webPosition,
                    rotation: webRotation,
                    dimensions: webDimensions,
                    sourceUrl: webEntitiesToLoad[i].url,
                    script: webScript,
                    serverScripts: webServerScripts,
                    dpi: webEntitiesToLoad[i].dpi,
                    maxFPS: maxFPS,
                    useBackground: webBackground
                }, "local");

                webEntitiesActive.push(webEntity);
            }
        }
    }
    
    function onZoneLeave (zoneID) {
        if (zoneID === zoneToHandle) {
            destroyAllWebEntities();
        }
    }
    
    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;
        var userData = getAndParseUserData();

        if (userData.options.zoneToHandle) {
            zoneToHandle = userData.options.zoneToHandle;
        }

        Entities.enterEntity.connect(onZoneEnter);
        Entities.leaveEntity.connect(onZoneLeave);
        
        Window.domainChanged.connect(destroyAllWebEntities);
    };

    this.unload = function (entityID) {
        Entities.enterEntity.disconnect(onZoneEnter);
        Entities.leaveEntity.disconnect(onZoneLeave);
        
        Window.domainChanged.disconnect(destroyAllWebEntities);
        
        destroyAllWebEntities();
    };
    
});