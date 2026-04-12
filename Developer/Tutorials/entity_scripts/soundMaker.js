//
//  Copyright 2016 High Fidelity, Inc.
//  Copyright 2026 Overte e.V.
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function(){
    "use strict"

    const soundURL ='http://content.overte.org/Developer/Tutorials/soundMaker/bell.wav';
    let ringSound;

    this.preload = function(entityID) {
        print("preload("+entityID+")");
        ringSound = SoundCache.getSound(soundURL);
    };

    this.clickDownOnEntity = function(entityID, mouseEvent) { 
        const bellPosition = Entities.getEntityProperties(entityID).position;
        print("clickDownOnEntity()...");
        Audio.playSound(ringSound,  {
            position: bellPosition,
            volume: 0.2
            });
    };

})
