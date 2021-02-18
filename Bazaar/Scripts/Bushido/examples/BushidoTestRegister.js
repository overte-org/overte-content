/*
    BushidoTestRegister.js

    Created by Kalila L. on Feb 9 2021.
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

(function () {
    var BUSHIDO_MASTER_SERVER_CHANNEL = 'BUSHIDO-MASTER';
    var BUSHIDO_LOGGING_PREFIX = 'BUSHIDO-MASTER';
    var entityID;

    function clickDownOnEntity (clickedID, event) {
        // Signal is triggered for all entities.
        if (clickedID === entityID) {
            Messages.sendMessage(BUSHIDO_MASTER_SERVER_CHANNEL, JSON.stringify({
            	"command": "script-to-master-server-register-combatant",
            	"data": { 
                    "uuid": MyAvatar.sessionUUID,
                    "currentHealth": 100,
                    "maxHealth": 100, 
                    "type": "avatar"
            	}
            }));
        }
    }

    this.preload = function (thisID) {  
        entityID = thisID;
        Entities.clickDownOnEntity.connect(clickDownOnEntity);
    };
    
    this.unload = function (thisID) {
        Entities.clickDownOnEntity.disconnect(clickDownOnEntity);
    }
})