/*
    BushidoTestGun.js

    Created by Basinsky
    Copyright 2020 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

var UPDATE_MS = 20;
var reset = false;
var RESET_TIME = 200;
var myPosition;
var myRotation;
var PICK_FILTERS = Picks.PICK_ENTITIES | Picks.PICK_AVATARS | Picks.PICK_PRECISE;
var pickID;
var gunID;
var pickDesktopID;
var injector;
var playerHUD;
var isGunEquiped = false;
var isShooting = false;
var isPointing = false;    
var gunHelperID;
var gunURL = "https://bas-skyspace.ams3.digitaloceanspaces.com/MurderGame/gun.fbx?" + Date.now();
var gunID; 
var shootSound = SoundCache.getSound("https://bas-skyspace.ams3.digitaloceanspaces.com/MurderGame/GUN-SHOT3.mp3");
var swooshSound = SoundCache.getSound("https://bas-skyspace.ams3.digitaloceanspaces.com/MurderGame/419341__wizardoz__swoosh.wav");   
              
function equipGun() {           
    var RIGHT_HAND_INDEX = MyAvatar.getJointIndex("RightHand");
    playSound("swoosh");
    print("RIGHT_HAND_INDEX "+ RIGHT_HAND_INDEX);
    var localRot = generateQuatFromDegreesViaRadians (71.87 , 92 , -16.92);
    if (gunURL && !isGunEquiped) {      
        gunID = Entities.addEntity( {
            type: "Model",
            name: "MurderGameGun",
            modelURL: gunURL,
            parentID: MyAvatar.sessionUUID,
            parentJointIndex: RIGHT_HAND_INDEX,
            localPosition: { x: 0.0179, y: 0.1467, z: 0.0305 },
            localRotation: localRot,
            localDimensions: { x: 0.0323, y: 0.1487, z: 0.2328 },                            
            color: { red: 200, green: 0, blue: 20 }, 
            collisionless: true,               
            dynamic: false,                
            lifetime: -1,
            userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false}}" 
        },"avatar");

        gunHelperID = Entities.addEntity({
            type: "Sphere",
            name: "MurderGameGunHelper",
            parentID: gunID,
            collisionless: true,
            visible: false,
            localPosition: { x: -0.0078, y: 0.0547, z: -0.1525 },
            localDimensions: { x: 0.2, y: 0.2, z: 0.05 },
            color: { red: 255, green: 0, blue: 0 },
            userData: "{ \"grabbableKey\": { \"grabbable\": false, \"triggerable\": false}}", 
            lifetime: -1 // Delete after 5 minutes.
        },"avatar");
        if (HMD.active) { 
            pickID = Picks.createPick(PickType.Ray, { 
                parentID: gunHelperID,
                direction: Vec3.UNIT_NEG_Z,       
                filter: PICK_FILTERS,
                enabled: true
            });
            Picks.setIgnoreItems(pickID, [gunID,gunHelperID]);
        }
        if (!HMD.active) {
            pickDesktopID = Picks.createPick(PickType.Ray, { 
                joint: "Mouse",                      
                filter: PICK_FILTERS,
                enabled: true
            });
        }
        // report gunID back to serverscript
       isGunEquiped = true;           
    }          
} 

function unEquipGun() {
    playSound("swoosh");
    Entities.deleteEntity(gunID)
    MyAvatar.endReaction("point");
    isGunEquiped = false;
    isShooting = false;
    isPointing = false;
}

function generateQuatFromDegreesViaRadians(rotxdeg,rotydeg,rotzdeg) {
    var rotxrad = (rotxdeg/180)*Math.PI;
    var rotyrad = (rotydeg/180)*Math.PI;
    var rotzrad = (rotzdeg/180)*Math.PI;          
    var newRotation = Quat.fromPitchYawRollRadians(rotxrad,rotyrad,rotzrad); 
    return newRotation;
}


function playSound(newSound) {   
    var injectorOptions = {
        position: MyAvatar.position,
        volume: 0.1,
        localOnly: false            
    };

    if ( newSound === "shoot") {
        effectSound = shootSound;
        injectorOptions = {
            position: MyAvatar.position,
            volume: 0.1,
            localOnly: false                
        }     
    }

    if ( newSound === "swoosh") {
        effectSound = swooshSound;
        injectorOptions = {
            position: MyAvatar.position,
            volume: 0.1,
            localOnly: false                
        }      
    }
    Audio.playSound(effectSound, injectorOptions);  
}

function createEntityHitEffect(position) {
    print(JSON.stringify(position));
    var sparks = Entities.addEntity({
        type: "ParticleEffect",
        position: position,
        lifetime: 4,
        "name": "Sparks Emitter",
        "color": {
            red: 228,
            green: 128,
            blue: 12
        },
        "maxParticles": 1000,
        "lifespan": 0.2,
        "emitRate": 1000,
        "emitSpeed": 1,
        "speedSpread": 0,
        "emitOrientation": {
            "x": -0.4,
            "y": 1,
            "z": -0.2,
            "w": 0.7071068286895752
        },
        "emitDimensions": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "polarStart": 0,
        "polarFinish": Math.PI,
        "azimuthStart": -3.1415927410125732,
        "azimuthFinish": 2,
        "emitAcceleration": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "accelerationSpread": {
            "x": 0,
            "y": 0,
            "z": 0
        },
        "particleRadius": 0.12,
        "radiusSpread": 0.04,
        "radiusStart": 0.04,
        "radiusFinish": 0.06,
        "colorSpread": {
            red: 100,
            green: 100,
            blue: 20
        },
        "alpha": 1,
        "alphaSpread": 0,
        "alphaStart": 0,
        "alphaFinish": 0,
        "additiveBlending": true,
        "textures": "https://bas-skyspace.ams3.digitaloceanspaces.com/MurderGame/star.png"
    },"avatar");

    Script.setTimeout(function() {
        Entities.editEntity(sparks, {
            isEmitting: false
        });
    }, 100);
}
function keyPressEvent(event) {   
    switch (event.text) {
        case "k":
            if (reset) {
                equipGun();
                print("equip Gun");
            }                                           
            break;         
        case "l":
            if (reset) {
                unEquipGun();
                print("unEquip Gun");
            }                                           
        break;                                                          
    }
}

// handle pickrays
Script.setInterval(function() {
    if (isGunEquiped) {                           
        if (!HMD.active) {                                             
            if (isPointing === false) {
                MyAvatar.beginReaction("point");
                isPointing = true;
            }
            var desktopResult = Picks.getPrevPickResult(pickDesktopID);
            if (desktopResult.intersects) {
                var infront = false;
                if (isPointing) {
                    infront = MyAvatar.setPointAt(desktopResult.intersection);
                }
                if (isShooting && infront) {
                    isShooting = false; 
                    playSound("shoot");
                    createEntityHitEffect(desktopResult.intersection);
                    Messages.sendMessage('BUSHIDO-MASTER', JSON.stringify({
                        'command': 'script-to-master-server-request-hit',
                        'data': {
                            'uuid': desktopResult.objectID,
                            'removeHealth': 5,
                            'preText': '',
                            'appendText': ''
                        }
                    }));
                    print("desktop intersects " + desktopResult.objectID);
                }               
            }
        }
        if (HMD.active) {
            if (isPointing) {                                
                MyAvatar.endReaction("point");
                isPointing = false;
            }               
            var result = Picks.getPrevPickResult(pickID);
            if (result.intersects) {
                if (isShooting) {
                    playSound("shoot");
                    createEntityHitEffect(result.intersection);
                    Messages.sendMessage('BUSHIDO-MASTER', JSON.stringify({
                        'command': 'script-to-master-server-request-hit',
                        'data': {
                            'uuid': result.objectID,
                            'removeHealth': 5,
                            'preText': '',
                            'appendText': ''
                        }
                    }));
                    print("intersects " + result.objectID);
                    isShooting = false; 
                }               
            }
        }                           
    }
}, UPDATE_MS);

Script.setInterval(function () {
    reset = true;    
}, RESET_TIME);

function onInputEvent(input, value) {    
    if (input === Controller.Standard.RT && value > 0.9 && reset === true) {
        reset = false;             
        isShooting = true; 
        print("shootweapon");           
    }        
} 

function onMouseEvent(event) {    
    if (event.isLeftButton && reset) {
        if (isPointing) {
            isShooting = true;
        }
        reset = false;
        print("shootweapon");           
    }        
}

function onMessageReceived (channel, message, sender, localOnly) {
    if (channel === 'BUSHIDO-MASTER') {
        var parsedMessage = JSON.parse(message);

        if (parsedMessage.command === 'master-server-to-script-send-combatant-info' && parsedMessage.data.uuid === MyAvatar.sessionUUID) {
            MyAvatar.displayName = parsedMessage.data.combatant.currentHealth;
        }
        
        if (parsedMessage.command === 'master-server-to-script-notify-combatant-death' && parsedMessage.data.uuid === MyAvatar.sessionUUID) {
            MyAvatar.displayName = 'Dead';
        }
    }
}

Script.scriptEnding.connect(function () {  
    Controller.mousePressEvent.disconnect(onMouseEvent);       
    Controller.inputEvent.disconnect(onInputEvent);       
    Controller.keyPressEvent.disconnect(keyPressEvent);
    Picks.removePick(pickID); 
    Picks.removePick(pickDesktopID);
    Messages.unsubscribe('BUSHIDO-MASTER');
    Messages.messageReceived.disconnect(onMessageReceived);
});     

Controller.keyPressEvent.connect(keyPressEvent);
Controller.mousePressEvent.connect(onMouseEvent);
Controller.inputEvent.connect(onInputEvent);   
Messages.subscribe('BUSHIDO-MASTER');
Messages.messageReceived.connect(onMessageReceived);