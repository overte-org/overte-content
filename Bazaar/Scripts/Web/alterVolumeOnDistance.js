/*
    alterVolumeOnDistance.js

    Created by Kalila L. on Mar 9 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will ask the specified web entity to alter its volume based on the user's position from it.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    // User Data Functionality

    var defaultUserData = {
        'targetWebEntity': Uuid.NULL,
        'options': {
            'levels': {
                '10': 1.0, // 100 volume when 10 meters or closer.
                '15': 0.5, // 50 volume when 10 meters or closer.
                '25': 0 // 0 volume when 20 meters or closer.
            },
            'outOfRangeVolume': 0, // 0 volume when further than the furthest level.
            'interval': 1000 // Check every second.
        }
    }

    function getEntityUserData() {
        return Entities.getEntityProperties(_this.entityID, ["userData"]).userData;
    }
    
    function getEntityProperties() {
        return Entities.getEntityProperties(_this.entityID);
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
    
    // Main App Functionality
    
    function getAudioLevel (userPosition, webEntityPosition, levels, outOfRangeVolume) {
        for (var level in levels) {
            if (Vec3.distance(userPosition, webEntityPosition) < level) {
                return levels[level];
            }
        }

        return outOfRangeVolume; // Out of all known ranges, return default out of range volume.
    }
    
    function triggerCheckTimer (interval) {
        Script.setTimeout(function () {
            triggerCheck();
        }, interval);
    }
    
    function triggerCheck () {
        var userData = getAndParseUserData();

        if (userData.targetWebEntity === Uuid.NULL) {
            triggerCheckTimer(userData.options.interval);
            return;
        }

        var webEntityPosition = Entities.getEntityProperties(userData.targetWebEntity, ["position"]).position;
        var userPosition = MyAvatar.position;

        Entities.emitScriptEvent(userData.targetWebEntity, JSON.stringify({
            'command': 'script-to-web-set-volume',
            'data': {
                'volume': getAudioLevel(userPosition, webEntityPosition, userData.options.levels, userData.options.outOfRangeVolume)
            }
        }));

        triggerCheckTimer(userData.options.interval);
    }

    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;

        getAndParseUserData(); // preload defaults if they don't already exist...
        
        triggerCheck();
    };

    this.unload = function (entityID) {
    };

});