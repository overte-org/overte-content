/*
    transitionDomainOnEnter.js

    Created by Kalila L. on Mar 1 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will trigger a domain transition when you enter it, creating and parenting you to a zone then hiding it after you enter the new domain.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;
    
    var transitionEntity;

    // User Data Functionality

    var defaultUserData = {
        'destination': 'localhost',
        'options': {
            'useConfirmDialog': false,
            'confirmDialogMessage': 'Would you like to go?',
            'showEntity': true,
            'entity': {
                'modelURL': '#',
                'lifetime': 10, // 10 seconds after creating the entity, delete it... (this only works when in the same domain)
                'deleteAfter': 10000, // 10 seconds after creating the entity, delete it... (this works when going to a different domain)
                'dimensions': [5, 5, 5]
            },
            'delayTransition': 0 // this value is in milliseconds
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
    
    function triggerTransition(userData) {
        if (userData.options.showEntity === true) {
            transitionEntity = Entities.addEntity({
                type: 'Model',
                name: 'transitionEntity',
                modelURL: userData.options.entity.modelURL,
                parentID: MyAvatar.SELF_ID,
                position: MyAvatar.position,
                lifetime: userData.options.entity.lifetime,
                dimensions: userData.options.entity.dimensions,
                userData: JSON.stringify({
                    'deleteAfter': userData.options.entity.deleteAfter
                }),
                script: 'https://cdn-1.vircadia.com/us-e-1/Bazaar/Scripts/Transition/entitySelfDelete.js?12345',
            }, 'local');
        }

        Script.setTimeout(function () {
            location.handleLookupString(userData.destination);
        }, userData.options.delayTransition);
    }

    function onEnterEntity(enteredEntityID) {
        if (_this.entityID === enteredEntityID) {
            var userData = getAndParseUserData();

            if (userData.options.useConfirmDialog) {
                if (Window.confirm(userData.options.confirmDialogMessage)) {
                    triggerTransition(userData);
                }
            } else {
                triggerTransition(userData);
            }
        }
    }

    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;

        getAndParseUserData(); // preload defaults if they don't already exist...
        
        Entities.enterEntity.connect(onEnterEntity);
    };

    this.unload = function (entityID) {
        Entities.enterEntity.disconnect(onEnterEntity);
    };

});