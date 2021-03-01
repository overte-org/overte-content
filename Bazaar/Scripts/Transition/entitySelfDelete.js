/*
    entitySelfDelete.js

    Created by Kalila L. on Mar 1 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will delete the entity it is attached to after a specified amount of time.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    // User Data Functionality
    
    var defaultUserData = {
        'deleteAfter': 10000 // 10 seconds
    };

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
        }

        return userData;
    }

    // Main App Functionality

    function triggerDeleteTimer() {
        var userData = getAndParseUserData();

        Script.setTimeout(function () {
            Entities.deleteEntity(_this.entityID);
        }, userData.deleteAfter);
    }

    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;
        
        triggerDeleteTimer();
    };

    this.unload = function (entityID) {
    };

});