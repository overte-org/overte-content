/*
    BushidoMakotoVE.js
    Bushido Makoto Validation Engine

    Created by Kalila L. on Feb 18 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This is a server entity module that determines validity of claims by combatants.
*/

(function () {
    // Constants
    var BUSHIDO_MASTER_SERVER_CHANNEL = 'BUSHIDO-MASTER';
    var BUSHIDO_MAKOTO_VE_LOGGING_PREFIX = 'BUSHIDO-MAKOTO-VE';
    
    var ACCEPTABLE_HIT_DISTANCE = 50; // 50m

    var AVATAR_COMBATANT_OVERWATCH_CENTER = { x: 0, y: 0, z: 0 };
    var AVATAR_COMBATANT_OVERWATCH_RANGE = 9999; // 9999m
    var AVATAR_COMBATANT_OVERWATCH_INTERVAL = 500; // 500 ms

    var ENTITY_COMBATANT_OVERWATCH_CENTER = { x: 0, y: 0, z: 0 };
    var ENTITY_COMBATANT_OVERWATCH_RANGE = 9999; // 9999m
    var ENTITY_COMBATANT_OVERWATCH_INTERVAL = 500; // 500 ms
    
    // Variables
    var combatants = {};
    var avatarCombatantTimer;
    var entityCombatantTimer;

    function requestHitValidation (requestorID, combatantData) {
        if (!combatants[combatantData.uuid]) {
            console.info(BUSHIDO_MAKOTO_VE_LOGGING_PREFIX, 'Combatant cannot be found:', combatantData.uuid);
            return false;
        } else if (combatants[combatantData.uuid].position) {
            console.info(BUSHIDO_MAKOTO_VE_LOGGING_PREFIX, 'Failed to validate position for hit combatant:', combatantData.uuid);
            return false;
        }
        
        if (!combatants[requestorID]) {
            console.info(BUSHIDO_MAKOTO_VE_LOGGING_PREFIX, 'Combatant cannot be found:', combatantData.uuid);
            return false;
        } else if (!combatants[requestorID].position) {
            console.info(BUSHIDO_MAKOTO_VE_LOGGING_PREFIX, 'Failed to validate position for requestor combatant:', requestorID);
            return false;
        }
        
        if (Vec3.distance(combatants[requestorID].position, combatants[combatantData.uuid].position) <= ACCEPTABLE_HIT_DISTANCE) {
            return true;
        } else {
            return false;
        }

        // temporary...
        return true;
    }
    
    function processAvatarCombatantOverwatch () {
        var getAvatarsInRange = AvatarList.getAvatarsInRange(AVATAR_COMBATANT_OVERWATCH_CENTER, AVATAR_COMBATANT_OVERWATCH_RANGE);

        for (var i = 0; i < getAvatarsInRange.length; i++) {
            if (combatants[getAvatarsInRange[i]]) {
                combatants[getAvatarsInRange[i]].position = AvatarList.getAvatar(getAvatarsInRange[i]).position;
            }
        }
    }
    
    function processEntityCombatantOverwatch () {
        var getEntitiesInRange = Entities.findEntites(ENTITY_COMBATANT_OVERWATCH_CENTER, ENTITY_COMBATANT_OVERWATCH_RANGE);

        for (var i = 0; i < getEntitiesInRange.length; i++) {
            if (combatants[getEntitiesInRange[i]]) {
                combatants[getEntitiesInRange[i]].position = Entities.getEntityProperties(getEntitiesInRange[i], ['position']).position;
            }
        }
    }
    
    function queueAvatarCombatantOverwatch () {
        avatarCombatantTimer = Script.setTimeout(function () {
            if (combatants !== {}) {
                processAvatarCombatantOverwatch();
            }

            queueAvatarCombatantOverwatch();
        }, AVATAR_COMBATANT_OVERWATCH_INTERVAL);
    }
    
    function queueEntityCombatantOverwatch () {
        entityCombatantTimer = Script.setTimeout(function () {
            if (combatants !== {}) {
                processEntityCombatantOverwatch();
            }

            queueEntityCombatantOverwatch();
        }, ENTITY_COMBATANT_OVERWATCH_INTERVAL);
    }
    
    function receiveCombatantsList (receivedCombatantsList) {
        combatants = receivedCombatantsList;
    }
    
    function startup() {
        queueAvatarCombatantOverwatch();
        queueEntityCombatantOverwatch();
    }

    startup();

    Script.scriptEnding.connect(function () {
        Script.clearTimeout(avatarCombatantTimer);
        Script.clearTimeout(entityCombatantTimer);
    });
    
    module.exports = {
        requestHitValidation: requestHitValidation,
        sendCombatantsList: receiveCombatantsList
    }
})