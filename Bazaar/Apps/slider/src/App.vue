<!--
//
//  App.vue
//
//  Created by kasenvr@gmail.com on 11 Jul 2020
//  Copyright 2020 Vircadia and contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
-->

<template>
    <v-app id="inspire">
        <v-navigation-drawer
            v-model="drawer"
            app
        >
            <v-list>
                <v-subheader>ADD</v-subheader>
                <v-list-item :disabled="!canEdit" link @click="addSlidesByURLDialogShow = !addSlidesByURLDialogShow">
                    <v-list-item-action>
                    <v-icon>mdi-plus</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Add Slide</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item link disabled @click="uploadSlidesDialogShow = !uploadSlidesDialogShow">
                    <v-list-item-action>
                    <v-icon>mdi-upload</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Upload Slide</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-subheader>MANAGE</v-subheader>
                <v-list-item :disabled="!canEdit" link @click="manageSlidesDialogShow = !manageSlidesDialogShow">
                    <v-list-item-action>
                    <v-icon>mdi-pencil</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Manage Slides</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item :disabled="!canEdit" link @click="changeSlideDeckDialogShow = !changeSlideDeckDialogShow">
                    <v-list-item-action>
                    <v-icon>mdi-database</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Slide Deck</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-subheader>DISPLAY</v-subheader>
                <v-list-item :disabled="!canEdit" link @click="changePresentationChannelDialogShow = !changePresentationChannelDialogShow">
                    <v-list-item-action>
                    <v-icon>mdi-remote</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Presentation Channel</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-subheader>IMPORT/EXPORT</v-subheader>
                <v-list-item :disabled="!canEdit" link @click="importExportDialogShow = !importExportDialogShow; parseSlideDataIntoDialog()">
                    <v-list-item-action>
                    <v-icon>mdi-swap-vertical-bold</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Import / Export Data</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar
            app
            color="primary"
            dark
        >
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>Presenter Panel</v-toolbar-title>
            <v-spacer></v-spacer>
            <div v-show="slides[slideDeck].length > 0">
                <v-btn 
                    :disabled="!canEdit" 
                    medium 
                    fab 
                    @click="currentSlide--"
                >
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <span class="mx-4">{{ currentSlide + 1 }} / {{ slides[slideDeck].length }}</span>
                <v-btn 
                    :disabled="!canEdit" 
                    medium 
                    fab 
                    @click="currentSlide++"
                >
                    <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
            </div>
        </v-app-bar>
        
        <!-- Main Slider Control Area -->

        <v-main>
            <v-container
                class="fill-height"
                fluid
            >
                <v-carousel 
                    v-model="currentSlide" 
                    height="100%"
                    :hide-delimiters="!canEdit"
                    :show-arrows="canEdit"
                >
                    <v-carousel-item
                        v-for="(slide, index) in slides[slideDeck]"
                        track-by="$index"
                        :key="index"
                        height="100%"
                    >
                        <v-img
                            :src="slide.slide"
                            height="87vh"
                            class="grey darken-4"
                            lazy-src="./assets/logo.png"
                            contain
                        >
                            <template v-slot:placeholder>
                                <v-row
                                    class="fill-height ma-0"
                                    align="center"
                                    justify="center"
                                >
                                    <v-progress-circular size="128" width="16" indeterminate color="blue lighten-4"></v-progress-circular>
                                </v-row>
                            </template>
                        </v-img>
                    </v-carousel-item>
                </v-carousel>
            </v-container>
        </v-main>

        <!-- End Main Slider Control Area -->
        
        <!-- Add Slide by URL Dialog -->

        <v-dialog v-model="addSlidesByURLDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Add Slide</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="red darken-1" @click="addSlidesByURLDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="green darken-1" @click="addSlidesByURLDialogShow = false; addSlideByURL()">Add</v-btn>
                </v-toolbar>

                <v-text-field
                    placeholder="Enter URL Here"
                    v-model="addSlideByURLSlideField"
                    filled
                ></v-text-field>
                <v-text-field
                    placeholder="Enter A Clickable Link Here (optional)"
                    v-model="addSlideByURLLinkField"
                    filled
                ></v-text-field>
            </v-card>
        </v-dialog>
        
        <!-- Add Slide by URL Dialog -->
        
        <!-- Add Slide by Upload Dialog -->
        
        <v-dialog v-model="uploadSlidesDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Upload Slide</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="red darken-1" @click="uploadSlidesDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="green darken-1" @click="uploadSlidesDialogShow = false; uploadSlide()">Upload</v-btn>
                </v-toolbar>
                <v-file-input
                    v-model="uploadSlidesDialogFiles"
                    :rules="uploadSlidesDialogRules"
                    :multiple="true"
                    accept="image/png, image/jpeg"
                    placeholder="Pick an image to upload as a slide"
                    prepend-icon="mdi-image-search"
                    label="Slide"
                ></v-file-input>
            </v-card>
        </v-dialog>
        
        <v-snackbar
            v-model="uploadSlidesFailedSnackbar"
            absolute
            centered
            color="red"
            elevation="24"
        >
            Upload Failed: {{ uploadSlidesFailedError }}
        </v-snackbar>
        
        <v-overlay
            opacity="0.9"
            v-model="uploadProcessingOverlay"
        >
            <v-btn
                icon
                @click="uploadProcessingOverlay = false"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
            <br />
            <v-progress-circular indeterminate color="blue" size="64"></v-progress-circular>
        </v-overlay>

        <!-- Add Slide by Upload Dialog -->
        
        <!-- Manage Slides Dialog -->
        
        <v-dialog v-model="manageSlidesDialogShow" persistent fullscreen>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Manage Slides for {{ slideDeck }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="green" @click="manageSlidesDialogShow = false">Done</v-btn>
                </v-toolbar>
                <v-list subheader :three-line="true">
                    <v-subheader>{{ slides[slideDeck].length }} Slides</v-subheader>

                    <v-list-item
                        v-for="(slide, i) in slides[slideDeck]"
                        :key="i"
                    >
                        <v-list-item-avatar size="64">
                            <v-img :src="slide.slide"></v-img>
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-subtitle>Slide {{i + 1}}</v-list-item-subtitle>
                            <v-text-field
                                label="Slide Link"
                                single-line
                                dense
                                v-model="slide.link"
                            ></v-text-field>
                            <v-list-item-title><span class="text-caption">Slide Image Source</span> {{slide.slide}}</v-list-item-title>
                        </v-list-item-content>

                        <v-list-item-icon>
                            <v-btn :disabled="i === 0" @click="rearrangeSlide(i, 'up')" color="blue" class="mx-2" fab medium>
                                <v-icon>mdi-arrow-collapse-up</v-icon>
                            </v-btn>
                            <v-btn :disabled="i === slides.length - 1" @click="rearrangeSlide(i, 'down')" color="blue" class="mx-2" fab medium>
                                <v-icon>mdi-arrow-collapse-down</v-icon>
                            </v-btn>
                            <v-btn @click="confirmDeleteSlideDialogShow = true; confirmDeleteSlideDialogWhich = i" color="red" class="mx-2" fab medium>
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </v-list-item-icon>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-dialog>
        
        <!-- Manage Slides Dialog -->
        
        <!-- Change Presentation Channel Dialog -->
        
        <v-dialog v-model="changePresentationChannelDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Change Presentation Channel</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="red darken-1" @click="changePresentationChannelDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="green darken-1" @click="changePresentationChannelDialogShow = false; changePresentationChannel()">Update</v-btn>
                </v-toolbar>

                <v-text-field
                    placeholder="Enter channel here"
                    v-model="changePresentationChannelDialogText"
                    filled
                ></v-text-field>
                
                <v-footer>
                    <v-spacer></v-spacer>
                    <div>Current Channel: <b>{{ presentationChannel }}</b></div>
                </v-footer>
            </v-card>
        </v-dialog>
        
        <!-- Change Presentation Channel Dialog -->
        
        <!-- Change Slide Deck Dialog -->
        
        <v-dialog v-model="changeSlideDeckDialogShow" persistent fullscreen>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Change Slide Deck</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="green darken-1" @click="changeSlideDeckDialogShow = false">Done</v-btn>
                </v-toolbar>

                <v-list subheader>
                    <v-subheader>{{ Object.keys(slides).length }} Slide Decks</v-subheader>
                    <v-list-item
                        v-for="(deck, i, index) in slides"
                        track-by="$index"
                        :key="index"
                    >
                        <v-list-item-avatar size="64">
                            <v-img :src="deck[0].slide"></v-img>
                        </v-list-item-avatar>

                        <v-list-item-content>
                            <v-list-item-subtitle>Deck {{ i }}</v-list-item-subtitle>
                            <v-list-item-title>{{ slides[i][0].slide }}</v-list-item-title>
                        </v-list-item-content>

                        <v-list-item-icon>
                            <v-btn @click="changeSlideDeckDialogShow = false; slideDeck = i" color="green" class="mx-2" fab medium>
                                <v-icon>mdi-cursor-default-click</v-icon>
                            </v-btn>
                            <!-- <v-btn :disabled="index === 0" @click="rearrangeSlideDeck(i, 'up')" color="blue" class="mx-2" fab medium>
                                <v-icon>mdi-arrow-collapse-up</v-icon>
                            </v-btn>
                            <v-btn :disabled="index === Object.keys(slides).length - 1" @click="rearrangeSlideDeck(i, 'down')" color="blue" class="mx-2" fab medium>
                                <v-icon>mdi-arrow-collapse-down</v-icon>
                            </v-btn> -->
                            <v-btn :disabled="i === slideDeck || i === 'default'" @click="confirmDeleteSlideDeckDialogShow = true; confirmDeleteSlideDeckDialogWhich = i" color="red" class="mx-2" fab medium>
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </v-list-item-icon>
                    </v-list-item>
                </v-list>

                <v-footer>
                    <v-text-field
                        placeholder="Create new slide deck here"
                        v-model="changeSlideDeckDialogText"
                        filled
                    >
                        <template slot="append-outer">
                            <v-btn class="mx-2" color="green darken-1" @click="addSlideDeck()">Add</v-btn>
                        </template>
                    </v-text-field>
                    <v-spacer></v-spacer>
                    <div>Current Slide Deck: <b>{{ slideDeck }}</b></div>
                </v-footer>
            </v-card>
        </v-dialog>
        
        <!-- Change Slide Deck Dialog -->
        
        <!-- Confirm Delete Slide Dialog -->
        
        <v-dialog v-model="confirmDeleteSlideDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Delete Slide</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="primary" @click="confirmDeleteSlideDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="red darken-1" @click="confirmDeleteSlideDialogShow = false; deleteSlide(confirmDeleteSlideDialogWhich)">Delete</v-btn>
                </v-toolbar>

                <v-card-title>Are you sure you want to delete slide {{ confirmDeleteSlideDialogWhich + 1 }}?</v-card-title>
                <v-card-subtitle>You cannot undo this action.</v-card-subtitle>
            </v-card>
        </v-dialog>
        
        <!-- Confirm Delete Slide Dialog -->
        
        <!-- Confirm Delete Slide Deck Dialog -->
        
        <v-dialog v-model="confirmDeleteSlideDeckDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Delete Slide Deck</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="primary" @click="confirmDeleteSlideDeckDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="red darken-1" @click="confirmDeleteSlideDeckDialogShow = false; deleteSlideDeck(confirmDeleteSlideDeckDialogWhich)">Delete</v-btn>
                </v-toolbar>

                <v-card-title>Are you sure you want to delete the slide desk {{ confirmDeleteSlideDeckDialogWhich }}?</v-card-title>
                <v-card-subtitle>You cannot undo this action.</v-card-subtitle>
            </v-card>
        </v-dialog>
        
        <!-- Confirm Delete Slide Deck Dialog -->
        
        <!-- Import Export Data Dialog -->

        <v-dialog v-model="importExportDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Import</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="red darken-1" @click="importExportDialogShow = false">Close</v-btn>
                    <v-btn class="mx-2" color="green darken-1" @click="importExportDialogShow = false; importSlideDataFromDialog()">Import</v-btn>
                </v-toolbar>

                <v-textarea
                    v-model="importExportDialogSlideData"
                    filled
                ></v-textarea>
            </v-card>
        </v-dialog>
        
        <!-- Import Export Data Dialog -->
        
        <!-- Sync Failed Dialog -->

        <v-dialog v-model="syncFailedDialogShow" persistent>
            <v-card>
                <v-toolbar>
                    <v-toolbar-title>Slides Failed to Sync</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn class="mx-2" color="green darken-1" @click="manuallyAttemptToSync()">Retry</v-btn>
                </v-toolbar>

                <v-card-title>You can retry syncing the slides yourself.</v-card-title>
                <!-- <v-card-subtitle>Last Received Checksum: {{ lastReceivedSlidesChecksum }}<br/>Current Checksum: {{ computeGetCurrentSlidesHash }}</v-card-subtitle>
                <v-card-subtitle>{{ computeSlides }}</v-card-subtitle> -->
            </v-card>
        </v-dialog>
        
        <!-- Sync Failed Dialog -->
        
        <v-footer
            color="primary"
            app
        >
            <span>Current Slide Deck: <b>{{ slideDeck }}</b></span>
            <v-spacer></v-spacer>
            <span v-text="isSyncing ? 'Syncing Data' : 'Synced'" class="mr-2"></span>
            <v-progress-circular
                v-show="isSyncing"
                indeterminate
                color="red"
            ></v-progress-circular>
            <v-icon
                v-show="!isSyncing && isSynced"
                large
                color="green"
            >
                mdi-check-bold
            </v-icon>
        </v-footer>
    </v-app>
</template>

<script>
var vue_this;

function browserDevelopment() {
    if (typeof EventBridge !== 'undefined') {
        return false; // We are in Vircadia.
    } else {
        return true; // We are in the browser, probably for development purposes.
    }
}

if (!browserDevelopment()) {
    // eslint-disable-next-line
    EventBridge.scriptEventReceived.connect(function(receivedCommand) {
        // console.log("receivedCommand:" + receivedCommand);

        receivedCommand = JSON.parse(receivedCommand);
        // alert("RECEIVED COMMAND:" + receivedCommand.command)
        if (receivedCommand.app === 'slider-client-app') {
        // We route the data based on the command given.
            if (receivedCommand.command === 'script-to-web-initialize') {
                // alert("SLIDES RECEIVED ON APP:" + JSON.stringify(receivedCommand.data));
                vue_this.initializeWebApp(receivedCommand.data);
            }

            if (receivedCommand.command === 'script-to-web-channel') {
                vue_this.receiveChannelUpdate(receivedCommand.data);
            }
            
            if (receivedCommand.command === 'script-to-web-update-slide-state') {
                vue_this.updateSlideState(receivedCommand.data);
            }
            
            if (receivedCommand.command === 'script-to-web-updating-from-storage') {
                vue_this.isSyncing = true;
            }
            
            if (receivedCommand.command === 'script-to-web-can-edit') {
                vue_this.canEdit = receivedCommand.data;
            }
            
            if (receivedCommand.command === 'script-to-web-latest-slides-checksum') {
                console.log("script-to-web-latest-slides-checksum" + JSON.stringify(receivedCommand.data));
                vue_this.lastReceivedSlidesChecksum = receivedCommand.data;
            }
        }
    });
}


export default {
    props: {
        source: String,
    },
    data: () => ({
        drawer: null,
        slides: {
            'default': [
                {
                    'link': "https://vircadia.com/",
                    'slide': './assets/logo.png'
                }
            ]
            // 'Slide Deck 1': [
            //     'https://wallpapertag.com/wallpaper/full/d/5/e/154983-anime-girl-wallpaper-hd-1920x1200-for-hd.jpg',
            //     'https://wallpapertag.com/wallpaper/full/7/3/0/234884-anime-girls-wallpaper-3840x2160-ipad.jpg',
            //     'http://getwallpapers.com/wallpaper/full/2/7/b/596546.jpg',
            //     'https://images4.alphacoders.com/671/671041.jpg'
            // ],
            // 'Slide Deck 2': [
            //     'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapersite.com%2Fimages%2Fwallpapers%2Fquna-2560x1440-phantasy-star-online-2-4k-2336.jpg&f=1&nofb=1',
            //     'https://hdqwalls.com/wallpapers/anime-girl-aqua-blue-4k-gu.jpg',
            //     'https://images3.alphacoders.com/729/729085.jpg',
            //     'https://mangadex.org/images/groups/9766.jpg?1572281708'
            // ]
        },
        currentSlide: 0,
        presentationChannel: 'default-presentation-channel',
        slideDeck: 'default',
        // Add Slides Dialog
        addSlidesByURLDialogShow: false,
        addSlideByURLSlideField: '',
        addSlideByURLLinkField: '',
        // Upload Slides Dialog
        uploadSlidesDialogShow: false,
        uploadSlidesDialogImgBBAPIKey: '3c004374cf70ad588aad5823ac2baaca', // Make this pull from UserData later.
        uploadSlidesDialogImgBBExpiry: 0, // Image expiry time: 0 = never. 43200 = 12 hours.
        uploadSlidesDialogFiles: null,
        uploadSlidesFailedSnackbar: false,
        uploadSlidesFailedError: '',
        uploadProcessingOverlay: false,
        uploadSlidesDialogRules: [
            // value => !value || value.size < 10000000 || 'Image size should be less than 10MB!'
        ],
        // Manage Slides Dialog
        manageSlidesDialogShow: false,
        // Change Presentation Channel Dialog
        changePresentationChannelDialogShow: false,
        changePresentationChannelDialogText: '',
        // Change Slide Deck Dialog
        changeSlideDeckDialogShow: false,
        changeSlideDeckDialogText: '',
        // Confirm Delete Slide Deck Dialog
        confirmDeleteSlideDeckDialogShow: false,
        confirmDeleteSlideDeckDialogWhich: '',
        // Confirm Delete Slide Dialog
        confirmDeleteSlideDialogShow: false,
        confirmDeleteSlideDialogWhich: '',
        // Import Export Data Dialog
        importExportDialogShow: false,
        importExportDialogSlideData: '',
        // Sync Failed Dialog
        syncFailedDialogShow: false,
        // DEBOUNCER
        readyToSendAgain: true,
        // Sync State
        isSyncing: false,
        isSynced: true,
        lastReceivedSlidesChecksum: null,
        timesAttemptedToSync: 0,
        MAX_ATTEMPTS_TO_SYNC: 7,
        TIME_BETWEEN_SYNC_ATTEMPTS: 500, // ms
        // Data Handling
        atp: {
            'use': null,
            'path': null
        },
        canEdit: false,
    }),
    computed: {
        computeGetCurrentSlidesHash: function () {
            return this.getCurrentSlidesHash();
        },
        computeSlides: function () {
            return JSON.stringify(this.slides);
        }
    },
    watch: {
        currentSlide: function (newSlide, oldSlide) {
            if (newSlide !== oldSlide) {
                this.uploadState(this.slides);
                this.sendSlideChange(newSlide);
            }
        },
        slideDeck: function (newDeck, oldDeck) {
            if (newDeck !== oldDeck) {
                this.currentSlide = 0;
            }
        },
        presentationChannel: function () {
            this.uploadState(this.slides);
        },
        slides: {
            handler: function () {
                if (this.debounceProcessing() === true) {
                    this.uploadState(this.slides);
                }
            },
            deep: true
        },
        isSyncing: function () {
            this.canEdit = !this.isSyncing;
            // console.log("Is Syncing: " + this.isSyncing);
        },
        drawer: function (newState) {
            if (newState === true) {
                this.checkForEditRights();
            }
        }
    },
    methods: {
        initializeWebApp: function (data) {
            // The data should already be parsed.
            // console.log("DATA RECEIVED ON INIT:" + JSON.stringify(data));
            var parsedUserData = data.userData; 

            // We are receiving the full slides, including slideDecks within.
            this.importSlidesFromObject(parsedUserData.slides);

            if (parsedUserData.presentationChannel) {
                this.presentationChannel = parsedUserData.presentationChannel;
            }

            if (parsedUserData.currentSlideState) {
                this.currentSlide = parsedUserData.currentSlideState.currentSlide;
                this.slideDeck = parsedUserData.currentSlideState.slideDeck;
            }

            if (parsedUserData.atp) {
                // console.log("setting ATP: " + parsedUserData.atp.use + parsedUserData.atp.path);
                this.atp = parsedUserData.atp;
            }

            this.checkIfSynced();
        },
        deleteSlide: function (slideIndex) {
            this.slides[this.slideDeck].splice(slideIndex, 1);

            if (this.slides[this.slideDeck].length === 0) {
                this.manageSlidesDialogShow = false; // Hide the dialog if the user has deleted the last of the slides.
            }
        },
        deleteSlideDeck: function (slideDeckKey) {
            this.$delete(this.slides, slideDeckKey);
        },
        addSlideDeck: function () {
            this.$set(this.slides, this.changeSlideDeckDialogText, [
                {
                    'link': "https://vircadia.com/",
                    'slide': './assets/logo.png'
                }
            ]);
        },
        addSlideByURL: function () {
            var objectToPush = {
                'link': this.addSlideByURLLinkField,
                'slide': this.addSlideByURLSlideField
            }
            this.slides[this.slideDeck].push(objectToPush);
            vue_this.currentSlide = vue_this.slides[vue_this.slideDeck].length - 1; // The array starts at 0, so the length will always be +1, so we account for that.
            this.addSlideByURLSlideField = '';
            this.addSlideByURLLinkField = '';
        },
        uploadSlide: function () {
            // ImgBB Upload
            if (this.uploadSlidesDialogFiles) {
                for (var image of this.uploadSlidesDialogFiles) {
                    var urlToPost;
                    let imageFiles = new FormData();
                    imageFiles.append('image', image);
                    
                    if (this.uploadSlidesDialogImgBBExpiry !== 0) {
                        urlToPost = 'https://api.imgbb.com/1/upload?expiration=' 
                            + this.uploadSlidesDialogImgBBExpiry 
                            + '&key=' 
                            + this.uploadSlidesDialogImgBBAPIKey;
                    } else {
                        urlToPost = 'https://api.imgbb.com/1/upload?key='
                            + this.uploadSlidesDialogImgBBAPIKey;
                    }
                    
                    this.imgBBUpload(urlToPost, imageFiles)
                }
            }
        },
        imgBBUpload: function (urlToPost, imageFiles) {
            vue_this.uploadProcessingOverlay = true;
            window.$.ajax({
                type: 'POST',
                url: urlToPost,
                data: imageFiles,
                processData: false,
                contentType: false,
            })
                .done(function (result) {
                    vue_this.uploadSlidesDialogFiles = null; // Reset the file upload dialog field.
                    vue_this.uploadProcessingOverlay = false;
                    var objectToPush = {
                        'link': '',
                        'slide': result.data.display_url
                    }
                    vue_this.slides[vue_this.slideDeck].push(objectToPush);
                    vue_this.currentSlide = vue_this.slides[vue_this.slideDeck].length - 1; // The array starts at 0, so the length will always be +1, so we account for that.
                    // console.info('success:', result);
                    return true;
                })
                .fail(function (result) {
                    vue_this.uploadSlidesDialogFiles = null; // Reset the file upload dialog field.
                    vue_this.uploadProcessingOverlay = false;
                    vue_this.uploadSlidesFailedSnackbar = true;
                    vue_this.uploadSlidesFailedError = result.responseJSON.error.message;
                    // console.info('fail:', result);
                    return true;
                })
        },
        rearrangeSlide: function (slideIndex, direction) {
            var newPosition;
            
            if (direction === "up") {
                newPosition = slideIndex - 1; // Up means lower in the array... up the list.
            } else if (direction === "down") {
                newPosition = slideIndex + 1; // Down means higher in the array... down the list.
            }
            
            var slideToMove = this.slides[this.slideDeck].splice(slideIndex, 1)[0];
            this.slides[this.slideDeck].splice(newPosition, 0, slideToMove);
        },
        // rearrangeSlideDeck: function (slideDeckIndex, direction) {
        //     var newPosition;
        // 
        //     if (direction === "up") {
        //         newPosition = slideDeckIndex - 1; // Up means lower in the array... up the list.
        //     } else if (direction === "down") {
        //         newPosition = slideDeckIndex + 1; // Down means higher in the array... down the list.
        //     }
        // 
        // 
        // },
        // BEGIN Import Export Data Dialog
        parseSlideDataIntoDialog: function () {
            if (JSON.stringify(this.slides)) {
                this.importExportDialogSlideData = JSON.stringify(this.slides);
            }
        },
        importSlideDataFromDialog: function () {
            if (JSON.parse(this.importExportDialogSlideData)) {
                this.importSlidesFromObject(JSON.parse(this.importExportDialogSlideData));
            }
        },
        // END Import Export Data Dialog
        importSlidesFromObject: function (objectToImport) {
            this.slideDeck = Object.getOwnPropertyNames(objectToImport)[0];
            for (let i in objectToImport) {
                this.$set(this.slides, i, objectToImport[i]);
            }
        },
        changePresentationChannel: function () {
            this.presentationChannel = this.changePresentationChannelDialogText;
            this.changePresentationChannelDialogText = '';
        },
        receiveChannelUpdate: function (data) {
            this.presentationChannel = data;
        },
        updateSlideState: function (data) {
            // This function receives the message from sendSlideChange
            // console.log("OKAY: " + this.slides[data.slideDeck]);
            // console.log("WELL: " + this.slides[data.slideDeck][data.currentSlide]);
            if (this.slides[data.slideDeck] && this.slides[data.slideDeck][data.currentSlide]) {
                this.slideDeck = data.slideDeck;
                this.currentSlide = data.currentSlide;
            }
        },
        sendSlideChange: function (slideIndex) {
            if (this.slides[this.slideDeck]) {
                this.sendAppMessage("web-to-script-slide-changed", {
                    'slide': this.slides[this.slideDeck][slideIndex],
                    'slideDeck': this.slideDeck,
                    'currentSlide': this.currentSlide
                });
            }
        },
        sendNoticeToUpdateState: function () {
            this.sendAppMessage("web-to-script-notify-to-update", {});
        },
        checkForEditRights: function () {
            this.sendAppMessage("web-to-script-check-for-edit-rights", {});
        },
        checkIfSynced: function () {
            if (this.lastReceivedSlidesChecksum !== null && this.getCurrentSlidesHash() !== this.lastReceivedSlidesChecksum) {
                this.retrySyncing();
            } else {
                this.isSyncing = false;
                this.syncFailedDialogShow = false;
                this.isSynced = true;
            }
        },
        retrySyncing: function () {
            if (this.timesAttemptedToSync < this.MAX_ATTEMPTS_TO_SYNC) {
                setTimeout(function(){
                    vue_this.sendAppMessage('web-to-script-request-sync', {});
                    vue_this.timesAttemptedToSync++;
                }, vue_this.TIME_BETWEEN_SYNC_ATTEMPTS);
            } else {
                this.syncFailedDialogShow = true;
            }
        },
        manuallyAttemptToSync: function () {
            vue_this.sendAppMessage('web-to-script-request-sync', {});
        },
        getCurrentSlidesHash: function () {
            if (this.slides) {
                return this.stringToHash(JSON.stringify(this.slides));
            } else {
                return 0;
            }
        },
        stringToHash: function (string) {       
            var hash = 0; 

            if (string.length == 0) return hash; 

            for (var i = 0; i < string.length; i++) { 
                var char = string.charCodeAt(i); 
                hash = ((hash << 5) - hash) + char; 
                hash = hash & hash; 
            } 

            return hash; 
        },
        debounceProcessing: function () {
            if (this.readyToSendAgain) {
                // console.log("Ready.");
                this.readyToSendAgain = false;
                setTimeout(function() {
                    vue_this.readyToSendAgain = true;
                    vue_this.uploadState(this.slides);
                }, 1000); // 1 second
                return true;
            } else {
                // console.log("Not ready.");
                return false;
            }
        },
        uploadState: function (slidesToSync) {
            if (!slidesToSync) {
                slidesToSync = this.slides;
            }

            this.sendAppMessage("web-to-script-upload-state", { 
                "slides": slidesToSync, 
                "presentationChannel": this.presentationChannel,
                "currentSlideState": {
                    "currentSlide": this.currentSlide,
                    "slideDeck": this.slideDeck
                },
                "atp": this.atp
            });
        },
        sendAppMessage: function(command, data) {
            data.slidesChecksum = this.getCurrentSlidesHash();

            var JSONtoSend = {
                "app": "slider-client-web",
                "command": command,
                "data": data
            };
            
            if (!browserDevelopment()) {
                // eslint-disable-next-line
                EventBridge.emitWebEvent(JSON.stringify(JSONtoSend));
            } else {
                // alert(JSON.stringify(JSONtoSend));
            }
        }
    },
    created: function () {
        vue_this = this;

        this.sendAppMessage("ready", {});
    }
}
</script>