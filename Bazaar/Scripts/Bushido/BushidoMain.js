/*
    BushidoMain.js

    Created by Kalila L. on Feb 8 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This is a server entity script that manages state for combat mechanics in virtual worlds.
*/

(function () {
    // Modules
    var BushidoMakotoVE = Script.require('./core/BushidoMakotoVE.js');
    
    // Constants
    var BUSHIDO_MASTER_SERVER_CHANNEL = 'BUSHIDO-MASTER';
    var BUSHIDO_LOGGING_PREFIX = 'BUSHIDO-MASTER';
    
    // Variables
    var combatants = {};
    
    function killCombatant (uuid) {
        if (combatants[uuid].type === 'entity') {
            renderHitMessage(uuid, 'DIE');
            Messages.sendMessage(BUSHIDO_MASTER_SERVER_CHANNEL, JSON.stringify({
                'command': 'master-server-to-script-notify-combatant-death',
                'data': {
                    'uuid': uuid
                }
            }));
        } else if (combatants[uuid].type === 'avatar') {
            renderHitMessage(uuid, 'DIE');
            Messages.sendMessage(BUSHIDO_MASTER_SERVER_CHANNEL, JSON.stringify({
                'command': 'master-server-to-script-notify-combatant-death',
                'data': {
                    'uuid': uuid
                }
            }));
        }
    }
    
    function removeCombatant (uuid) {
        Messages.sendMessage(BUSHIDO_MASTER_SERVER_CHANNEL, JSON.stringify({
            'command': 'master-server-to-script-notify-combatant-removed',
            'data': {
                'uuid': uuid
            }
        }));

        delete combatants[uuid];
    }
    
    function registerCombatant (combatantData) {
        combatants[combatantData.uuid] = {
            'currentHealth': combatantData.currentHealth,
            'maxHealth': combatantData.maxHealth,
            'type': combatantData.type
        };
        
        BushidoMakotoVE.sendCombatantsList(combatants);
        sendCombatantInfo(combatantData.uuid);
    }
    
    function requestRegisterHit (requestorID, combatantData) {
        if (BushidoMakotoVE.requestHitValidation(requestorID, combatantData)) {
            if ((combatants[combatantData.uuid].currentHealth - combatantData.removeHealth) <= 0) {
                combatants[combatantData.uuid].currentHealth = 0;
                sendCombatantInfo(combatantData.uuid);
                killCombatant(combatantData.uuid);
            } else {
                combatants[combatantData.uuid].currentHealth = combatants[combatantData.uuid].currentHealth - combatantData.removeHealth;
                sendCombatantInfo(combatantData.uuid);
                renderHitMessage(combatantData.uuid, '-' + combatantData.removeHealth);
            }
        } else {
            console.info(BUSHIDO_LOGGING_PREFIX, 'MakotoVE failed validity check for hit on', combatantData.uuid, 'from', requestorID, '.');
        }
    }
    
    function renderHitMessage (uuid, text) {
        var beginPosition;
        
        if (combatants[uuid].type === 'entity') {
            beginPosition = Entities.getEntityProperties(uuid, ['position']).position;
            if (!beginPosition) {
                console.info(BUSHIDO_LOGGING_PREFIX, 'Failed to find entity with ID', uuid, '.');
            }
        } else if (combatants[uuid].type === 'avatar') {
            beginPosition = AvatarList.getAvatar(uuid).position;
        }

        var entity = Entities.addEntity({
            type: 'Text',
            position: beginPosition,
            text: text,
            billboardMode: 'yaw',
            dimensions: {x: 0.55, y: 0.25, z: 0.01},
            unlit: true,
            backgroundAlpha: 0.0,
            collisionless: true,
            lineHeight: 0.2,
            dynamic: true,
            localVelocity: {x: 0, y: 1, z: 0},
            grab: {
                grabbable: false
            },
            lifetime: 5  // Delete after 5 seconds
        });
    }
    
    function sendCombatantInfo (uuid) {
        Messages.sendMessage(BUSHIDO_MASTER_SERVER_CHANNEL, JSON.stringify({
            'command': 'master-server-to-script-send-combatant-info',
            'data': {
                'uuid': uuid,
                'combatant': combatants[uuid]
            }
        }));
    }
    
    function onMessageReceived (channel, message, sender, localOnly) {
        if (channel === BUSHIDO_MASTER_SERVER_CHANNEL) {
            var parsedMessage = JSON.parse(message);

            if (parsedMessage.command === 'script-to-master-server-register-combatant') {
                registerCombatant(parsedMessage.data);
            }
            
            if (parsedMessage.command === 'script-to-master-server-request-hit') {
                requestRegisterHit(parsedMessage.data);
            }
            
            if (parsedMessage.command === 'script-to-master-server-get-combatant-info') {
                sendCombatantInfo(parsedMessage.data.uuid);
            }
        }
    }

    this.unload = function (entityID) {  
        console.info(BUSHIDO_LOGGING_PREFIX, 'Stopping BUSHIDO-MASTER Server.')
        Messages.unsubscribe(BUSHIDO_MASTER_SERVER_CHANNEL);
        Messages.messageReceived.disconnect(onMessageReceived);
        console.info(BUSHIDO_LOGGING_PREFIX, 'No longer listening on channel', BUSHIDO_MASTER_SERVER_CHANNEL, '.');
    };
    
    console.info(BUSHIDO_LOGGING_PREFIX, 'Starting BUSHIDO-MASTER Server.')
    Messages.subscribe(BUSHIDO_MASTER_SERVER_CHANNEL);
    Messages.messageReceived.connect(onMessageReceived);
    console.info(BUSHIDO_LOGGING_PREFIX, 'Listening on channel', BUSHIDO_MASTER_SERVER_CHANNEL, '.');
})