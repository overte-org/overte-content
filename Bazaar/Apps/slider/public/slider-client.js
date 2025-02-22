//
//  slider-client.js
//
//  Created by kasenvr@gmail.com on 12 Jul 2020
//  Copyright 2020 Vircadia and contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    // VARIABLES
    var presentationChannel = "default-presentation-channel";
    var lastMessageSentOrReceivedData = null;
    var readyToSendAgain = true;
    var defaultUserData = {
        presentationChannel: presentationChannel,
        atp: {
            use: false,
            path: ''
        }
    };
    var dataToSave = {};
    
    // We use a timeout because it's possible the server hasn't fully saved our data to userData or ATP.
    var PROCESSING_MSG_DEBOUNCE_TIME = 500; // 500ms
    // Upon receiving a message, we will wait before allowing any updates 
    // to be sent as it's possible our app will try to send a repeat of the 
    // same message that was sent to all clients prior. 
    // This will result in a loop if we do not prevent it.
    var SENDING_MESSAGE_DEBOUNCE_TIME = 800; // 800ms

    // APP EVENT AND MESSAGING ROUTING
    
    function onWebAppEventReceived(sendingEntityID, event) {
        if (sendingEntityID === _this.entityID) {
            var eventJSON = JSON.parse(event);
            if (eventJSON.app === "slider-client-web") { // This is our web app!
                // print("inventory.js received a web event: " + event);
                // Window.alert("Sending... " + eventJSON.data.slidesChecksum);
                if (eventJSON.command === "ready" || eventJSON.command === "web-to-script-request-sync") {
                    // console.info("Got init request message.");
                    initializeSliderClientApp();
                }
        
                if (eventJSON.command === "web-to-script-upload-state") {
                    // This data has to be stringified because userData only takes JSON strings and not actual objects.
                    // console.log("web-to-script-upload-state" + JSON.stringify(eventJSON.data));
                    presentationChannel = eventJSON.data.presentationChannel;
                    // console.log("########################### SAVING STATE.");
                    dataToSave = eventJSON.data;
                    saveState(dataToSave);
                }
                    
                if (eventJSON.command === "web-to-script-slide-changed") {
                    // console.log("web-to-script-slide-changed:" + eventJSON.data);
                    // dataToSave.currentSlideState = {};
                    // dataToSave.currentSlideState.slide = eventJSON.data.slide;
                    // dataToSave.currentSlideState.slideDeck = eventJSON.data.slideDeck;
                    // 
                    // saveState(dataToSave);

                    var dataPacket = {
                        command: "display-slide",
                        data: eventJSON.data
                    }
                    sendMessage(dataPacket);
                }
                
                if (eventJSON.command === "web-to-script-notify-to-update") {
                    var dataPacket = {
                        command: "update-from-storage",
                        data: eventJSON.data
                    }
                    // Window.alert('notifying to update');
                    sendMessage(dataPacket);
                }
                
                if (eventJSON.command === "web-to-script-check-for-edit-rights") {
                    sendToWeb("script-to-web-can-edit", canEdit());
                }
            }
        }
    }

    function sendToWeb(command, data) {
        var dataToSend = {
            "app": "slider-client-app",
            "command": command,
            "data": data
        };
        Entities.emitScriptEvent(_this.entityID, JSON.stringify(dataToSend));
    }

    function sendMessage(dataToSend) {
        dataToSend.data.senderEntityID = _this.entityID;
        dataToSend.data.senderUUID = MyAvatar.sessionUUID;
        // console.log("Sending message from client, data:" + JSON.stringify(dataToSend.data));
        // console.log("On channel:" + presentationChannel);
        // console.log("lastMessageSentOrReceivedData: "+ JSON.stringify(lastMessageSentOrReceivedData));
        if (dataToSend.command === "display-slide") {
            // console.log("Sending display-slide command");
            if (lastMessageSentOrReceivedData) {
                // console.log("CLEAR 1");
                if (dataToSend.data.currentSlide != lastMessageSentOrReceivedData.currentSlide ||
                    dataToSend.data.slideDeck != lastMessageSentOrReceivedData.slideDeck ||
                    dataToSend.data.slide.slide != lastMessageSentOrReceivedData.slide.slide
                ) {
                    // console.log("CLEAR 2: SENDING");
                    lastMessageSentOrReceivedData = dataToSend.data;
                    Messages.sendMessage(presentationChannel, JSON.stringify(dataToSend));
                }
            } else {
                // console.log("BYPASS 1: SENDING");
                lastMessageSentOrReceivedData = dataToSend.data;
                Messages.sendMessage(presentationChannel, JSON.stringify(dataToSend));
            }
        }
        
        if (dataToSend.command === "update-from-storage") {
            Messages.sendMessage(presentationChannel, JSON.stringify(dataToSend));
        }
    }
    
    function onMessageReceived(channel, message, sender, localOnly) {
        if (channel === presentationChannel) {
            var messageJSON = JSON.parse(message);
            if (messageJSON.command === "display-slide" ) { // We are receiving a slide.
                // if (messageJSON.data.senderEntityID === _this.entityID && MyAvatar.sessionUUID != sender) {
                //     // We got a message that this entity changed a slide, so let's update all instances of this entity for everyone.
                //     Script.setTimeout(function () {
                //         // Window.alert("Receiving... " + messageJSON.data.slidesChecksum);
                //         lastMessageSentOrReceivedData = messageJSON.data;
                //         sendToWeb('script-to-web-latest-slides-checksum', messageJSON.data.slidesChecksum);
                //         sendToWeb('script-to-web-update-slide-state', messageJSON.data);
                //         console.log("PASSING MESSAGE IN.");
                //         console.log("lastMessageSentOrReceivedData: "+ JSON.stringify(lastMessageSentOrReceivedData));
                //     }, PROCESSING_MSG_DEBOUNCE_TIME);
                // }
                // console.log("FULL MESSAGE RECEIVED, DISPLAY-SLIDE: " + JSON.stringify(messageJSON.data));
                // console.log("Who are they?" + sender);
                // console.log("Who are we? " + MyAvatar.sessionUUID);
            }
            
            if (messageJSON.command === "update-from-storage" ) { // We are being told to update from storage.
                if (messageJSON.data.senderEntityID === _this.entityID && MyAvatar.sessionUUID != sender) {
                    // We got a message that this entity changed a slide, so let's update all instances of this entity for everyone.
                    Script.setTimeout(function () {
                        sendToWeb('script-to-web-latest-slides-checksum', messageJSON.data.slidesChecksum);
                        sendToWeb('script-to-web-needs-syncing');
                    }, PROCESSING_MSG_DEBOUNCE_TIME);
                }
                console.log("FULL MESSAGE RECEIVED, UPDATE FROM STORAGE: " + JSON.stringify(messageJSON.data));
                console.log("Who are they?" + sender);
                console.log("Who are we? " + MyAvatar.sessionUUID);
            }

            print("Message received on Slider Presenter App:");
            print("- channel: " + channel);
            print("- message: " + message);
            print("- sender: " + sender);
            print("- localOnly: " + localOnly);
        }
    }
    
    // FUNCTIONS
    
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
            setDefaultUserData();
        }

        return userData;
    }
    
    function updateFromStorage () {
        sendToWeb("script-to-web-updating-from-storage", "");

        var retrievedUserData = Entities.getEntityProperties(_this.entityID).userData;
        if (retrievedUserData != "") {
            retrievedUserData = JSON.parse(retrievedUserData);
        }

        // console.log("THIS IS OUR RETRIEVAL PATH: " + retrievedUserData.atp.path);
        // console.log("IS VALID PATH: " + Assets.isValidFilePath(retrievedUserData.atp.path));

        if (retrievedUserData.atp && retrievedUserData.atp.use === true) {
            Assets.getAsset(
                {
                    url: retrievedUserData.atp.path,
                    responseType: "json"
                },
                function (error, result) {
                    if (error) {
                        // print("ERROR: Slide data not downloaded, bootstrapping for ATP use: "+ error);

                        sendToWeb("script-to-web-initialize", { userData: retrievedUserData });
                    } else {
                        if (result != "") {
                            // console.log("STRINGIFIED: " + JSON.stringify(result));
                            // result = JSON.parse(result);
                        }
                        
                        print("Retrieved DATA from from ATP.");
                        // print("Retrieved DATA FROM ATP: " + JSON.stringify(result.response));
                        
                        if (result.presentationChannel) {
                            // console.log("Triggering an update for presentation channel to:" + retrievedUserData.presentationChannel);
                            updatePresentationChannel(result.response.presentationChannel)
                        }

                        sendToWeb("script-to-web-initialize", { userData: result.response });
                    }
                }
            );
        } else {
            if (retrievedUserData.presentationChannel) {
                // console.log("Triggering an update for presentation channel to:" + retrievedUserData.presentationChannel);
                updatePresentationChannel(retrievedUserData.presentationChannel)
            }
            print("Retrieved DATA from userData.");
            // print("Retrieved DATA FROM USERDATA: " + retrievedUserData);
            sendToWeb("script-to-web-initialize", { userData: retrievedUserData });
        }
    }
    
    function initializeSliderClientApp () {
        sendToWeb("script-to-web-can-edit", canEdit());
        updateFromStorage();
    }
    
    function canEdit () {
        return Entities.canWriteAssets();
    }
    
    function debounceSend() {
        if(readyToSendAgain) {
            // console.log("Ready.");
            readyToSendAgain = false;
            Script.setTimeout(function() {
                readyToSendAgain = true;
            }, SENDING_MESSAGE_DEBOUNCE_TIME);
            return true;
        } else {
            // console.log("Not ready.");
            return false;
        }
    }
    
    function updatePresentationChannel (newChannel) {
        Messages.unsubscribe(presentationChannel);
        presentationChannel = newChannel;
        Messages.subscribe(presentationChannel);
    }
    
    function saveState (data) {
        // console.log("SAVING STATE: " + JSON.stringify(data));
        // Window.alert("SAVING STATE");
        if (!canEdit()) {
            return;    
        }

        if (data.atp && data.atp.use === true) {
            // If ATP is activated, save there...
            // console.log("SAVING TO ATP!");
            
            Assets.putAsset(
                {
                    data: JSON.stringify(data),
                    path: data.atp.path
                },
                function (error, result) {
                    if (error) {
                        print("ERROR: Slider data not uploaded or mapping not set: " + error);
                        sendToWeb("script-to-web-upload-failed", {});
                    } else {
                        sendToWeb("script-to-web-upload-succeeded", {});
                    }
                }
            );

            // Disable reapplying the ATP for now, some weird bug...
            // We want to add the latest ATP state back in whenever syncing.
            var retrievedUserData = Entities.getEntityProperties(_this.entityID).userData;
            if (retrievedUserData != "") {
                retrievedUserData = JSON.parse(retrievedUserData);
            }

            retrievedUserData.atp = data.atp;
            
            Entities.editEntity(_this.entityID, { "userData": JSON.stringify(retrievedUserData) });
        } else {
            // If ATP is not active, save all to userData...
            // console.log("NOT SAVING TO ATP!");
            // console.log("data.atp - " + JSON.stringify(data.atp));
            Entities.editEntity(_this.entityID, { "userData": JSON.stringify(data) });
            sendToWeb("script-to-web-upload-succeeded", {});
        }
    }
    
    // Standard preload and unload, initialize the entity script here.
    
    this.preload = function (ourID) {
        this.entityID = ourID;
        
        getAndParseUserData();
        
        Entities.webEventReceived.connect(onWebAppEventReceived);
        Messages.messageReceived.connect(onMessageReceived);
        Messages.subscribe(presentationChannel);
    };
    
    this.unload = function(entityID) {
        Entities.webEventReceived.disconnect(onWebAppEventReceived);
        Messages.messageReceived.disconnect(onMessageReceived);
        Messages.unsubscribe(presentationChannel);
    };
    
});
