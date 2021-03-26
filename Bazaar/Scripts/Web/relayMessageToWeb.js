/*
    relayMessageToWeb.js

    Created by Kalila L. on Mar 26 2021
    Copyright 2021 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will relay a message to the specified web entity.

    Example Message:

    Messages.sendMessage('main-production-channel', JSON.stringify({
        command: 'script-to-script-relay-to-web',
        data: {
            name: 'web1',
            message: {
                command: 'script-to-web-set-effect', 
                data: { 
                    effect: 'color_changing_bg' 
                }
            }
        }
    }));

*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;
    
    var currentChannel;
    
    var DEFAULT_NAME = 'web1';
    var DEFAULT_CHANNEL = 'main-production-channel';

    // User Data Functionality

    var defaultUserData = {
        'targetWebEntity': Uuid.NULL,
        'options': {
            'name': DEFAULT_NAME,
            'channel': DEFAULT_CHANNEL
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
    
    function relayToWeb (message, userData) {
        var userData = getAndParseUserData();

        Entities.emitScriptEvent(userData.targetWebEntity, JSON.stringify({
            'command': message.command,
            'data': message.data
        }));
    }
    
    function onMessageReceived (channel, message, sender, localOnly) {
        if (channel === currentChannel) {
            var userData = getAndParseUserData();
            var parsedMessage = JSON.parse(message);
            
            if (parsedMessage.command === 'script-to-script-relay-to-web') {
                if (parsedMessage.data.name === userData.options.name) {
                    relayToWeb(parsedMessage.data.message, userData);
                }
            }
        }
    }

    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;

        var userData = getAndParseUserData(); // preload defaults if they don't already exist...
        
        Messages.subscribe(userData.options.channel);
        currentChannel = userData.options.channel;
        Messages.messageReceived.connect(onMessageReceived);
    };

    this.unload = function (entityID) {
        Messages.unsubscribe(userData.options.channel);
        Messages.messageReceived.disconnect(onMessageReceived);
    };

});