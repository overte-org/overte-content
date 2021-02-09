/*
    BushidoMain.js

    Created by Kalila L. on Feb 8 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This is a server entity script that manages game logic for combat games.
*/

(function () {
    var BUSHIDO_SERVER_CHANNEL = 'BUSHIDO-MASTER';
    var combatants = {};
    
    function killCombatant (uuid) {
        if (combatants[uuid].type === 'entity') {
            Entities.deleteEntity(uuid);
        } else if (combatants[uuid].type === 'avatar') {
            renderHitMessage(uuid, 'DIE');
        }
        
        delete combatants[uuid];
    }
    
    function renderHitMessage (uuid, text) {
        var beginPosition;

        if (combatants[uuid].type === 'entity') {
            beginPosition = Entities.getEntityProperties(uuid, ['position']).position;
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
            lifetime: 3.5  // Delete after 3.5 seconds
        });
    }
    
    function onMessageReceived (channel, message, sender, localOnly) {
        if (channel === BUSHIDO_SERVER_CHANNEL) {
            var parsedMessage = JSON.parse(message);

            if (parsedMessage.command === 'script-to-server-register-combatant') {
                combatants[parsedMessage.data.uuid] = {
                    'currentHealth': parsedMessage.data.currentHealth,
                    'maxHealth': parsedMessage.data.maxHealth,
                    'type': parsedMessage.data.type
                };
            }
            
            if (parsedMessage.command === 'script-to-server-register-hit') {
                if (combatants[parsedMessage.data.uuid]) {
                    if ((combatants[parsedMessage.data.uuid].currentHealth - parsedMessage.data.removeHealth) <= 0) {
                        killCombatant(parsedMessage.data.uuid);
                    } else {
                        combatants[parsedMessage.data.uuid].currentHealth = combatants[parsedMessage.data.uuid].currentHealth - parsedMessage.data.removeHealth;
                        renderHitMessage(parsedMessage.data.uuid, '-' + parsedMessage.data.removeHealth);
                    }
                }
            }
        }
    }

    this.unload = function (entityID) {  
        console.log('Stopping BUSHIDO-MASTER Server.')
        Messages.unsubscribe(BUSHIDO_SERVER_CHANNEL);
        Messages.messageReceived.disconnect(onMessageReceived);
    };
    
    console.log('Starting BUSHIDO-MASTER Server.')
    Messages.subscribe(BUSHIDO_SERVER_CHANNEL);
    Messages.messageReceived.connect(onMessageReceived);
})