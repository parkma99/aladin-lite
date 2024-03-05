// Copyright 2013 - UDS/CNRS
// The Aladin Lite program is distributed under the terms
// of the GNU General Public License version 3.
//
// This file is part of Aladin Lite.
//
//    Aladin Lite is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, version 3 of the License.
//
//    Aladin Lite is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    The GNU General Public License is available in COPYING file
//    along with Aladin Lite.
//


/******************************************************************************
 * Aladin Lite project
 *
 * File Aladin.js (main class)
 * Facade to expose Aladin Lite methods
 *
 * Author: Thomas Boch[CDS], Matthieu Baumann[CDS]
 *
 *****************************************************************************/
import { version } from './../../package.json';
import { View } from "./View.js";
import { Utils } from "./Utils";
import { Overlay } from "./Overlay.js";
import { Logger } from "./Logger.js";
import { ProgressiveCat } from "./ProgressiveCat.js";
import { Sesame } from "./Sesame.js";
import { PlanetaryFeaturesNameResolver } from "./PlanetaryFeaturesNameResolver.js";
import { CooFrameEnum } from "./CooFrameEnum.js";
import { MeasurementTable } from "./MeasurementTable.js";
import { ImageSurvey } from "./ImageSurvey.js";
import { Coo } from "./libs/astro/coo.js";
import { CooConversion } from "./CooConversion.js";

import { ProjectionEnum } from "./ProjectionEnum.js";

import { ALEvent } from "./events/ALEvent.js";
import { Color } from './Color.js';
import { ImageFITS } from "./ImageFITS.js";
import { DefaultActionsForContextMenu } from "./DefaultActionsForContextMenu.js";
import { SAMPConnector } from "./vo/samp.js";
import { Reticle } from "./Reticle.js";

// GUI
import { AladinLogo } from "./gui/AladinLogo.js";
import { Location } from "./gui/Location.js";
import { FoV } from "./gui/FoV.js";
import { ShareActionButton } from "./gui/Button/ShareView.js";
import { Menu } from "./gui/Toolbar/Menu.js";
import { ContextMenu } from "./gui/Widgets/ContextMenu.js";
import { Input } from "./gui/Widgets/Input.js";
import { Popup } from "./Popup.js";
import A from "./A.js";
import { StatusBarBox } from "./gui/Box/StatusBarBox.js";
import { FullScreenActionButton } from "./gui/Button/FullScreen.js";
import { ProjectionActionButton } from "./gui/Button/Projection.js";
import { Toolbar } from './gui/Widgets/Toolbar';

/**
 * @typedef {Object} AladinOptions
 * @description Options for configuring the Aladin Lite instance.
 *
 * @property {string} [survey="https://alaskybis.unistra.fr/DSS/DSSColor"] URL or ID of the survey to use
 * @property {string[]} [surveyUrl=["https://alaskybis.unistra.fr/DSS/DSSColor", "https://alasky.unistra.fr/DSS/DSSColor"]]
 *   Array of URLs for the survey images. This replaces the survey parameter.
 * @property {string} [target="0 +0"] - Target coordinates for the initial view.
 * @property {string} [cooFrame="J2000"] - Coordinate frame.
 * @property {number} [fov=60] - Field of view in degrees.
 * @property {string} [backgroundColor="rgb(60, 60, 60)"] - Background color in RGB format.
 *
 * @property {boolean} [showZoomControl=true] - Whether to show the zoom control toolbar.
 * @property {boolean} [showLayersControl=false] - Whether to show the layers control toolbar.
 * @property {boolean} [showOverlayStackControl=true] - Whether to show the overlay stack control toolbar.
 * @property {boolean} [showSurveyStackControl=true] - Whether to show the survey stack control toolbar.
 * @property {boolean} [showFullscreenControl=true] - Whether to show the fullscreen control toolbar.
 * @property {boolean} [showSimbadPointerControl=false] - Whether to show the Simbad pointer control toolbar.
 * @property {boolean} [showCooGridControl=false] - Whether to show the coordinate grid control toolbar.
 * @property {boolean} [showSettingsControl=true] - Whether to show the settings control toolbar.
 *
 * @property {boolean} [showShareControl=false] - Whether to show the share control toolbar.
 * @property {boolean} [showStatusBar=true] - Whether to show the status bar. Enabled by default.

 *
 * @property {boolean} [showFrame=true] - Whether to show the viewport frame.
 * @property {boolean} [showFov=true] - Whether to show the field of view indicator.
 * @property {boolean} [showCooLocation=true] - Whether to show the coordinate location indicator.
 * @property {boolean} [showProjectionControl=true] - Whether to show the projection control toolbar.
 *
 * @property {boolean} [showContextMenu=false] - Whether to show the context menu.
 * @property {boolean} [showReticle=true] - Whether to show the reticle.
 * @property {boolean} [showCatalog=true] - Whether to show the catalog.
 *
 * @property {boolean} [fullScreen=false] - Whether to start in full-screen mode.
 * @property {string} [reticleColor="rgb(178, 50, 178)"] - Color of the reticle in RGB format.
 * @property {number} [reticleSize=22] - Size of the reticle.
 * @property {string} [gridColor="rgb(0, 255, 0)"] - Color of the grid in RGB format.
 * @property {number} [gridOpacity=0.5] - Opacity of the grid (0 to 1).
 * @property {string} [projection="SIN"] - Projection type.
 * @property {boolean} [log=true] - Whether to log events.
 * @property {boolean} [samp=false] - Whether to enable SAMP (Simple Application Messaging Protocol).
 * @property {boolean} [realFullscreen=false] - Whether to use real fullscreen mode.
 * @property {boolean} [pixelateCanvas=true] - Whether to pixelate the canvas.
 */

export let Aladin = (function () {
   /**
     * Creates an instance of the Aladin interactive sky atlas.
     *
     * @class
     * @constructs Aladin
     * @param {string|HTMLElement} aladinDiv - The ID of the HTML element or the HTML element itself
     *                                         where the Aladin sky atlas will be rendered.
     * @param {AladinOptions} requestedOptions - Options to customize the behavior and appearance of the Aladin atlas.
     * @throws {Error} Throws an error if aladinDiv is not provided or is invalid.
     * 
     * @example
     * // Usage example:
     * import { A } from 'aladin-lite';
     *
     * let aladin = A.Aladin('#aladin-lite-div', { option1: 'value1', option2: 'value2' });
     */
    var Aladin = function (aladinDiv, requestedOptions) {
        this.callbacksByEventName = {}; // we store the callback functions (on 'zoomChanged', 'positionChanged', ...) here

        // check that aladinDiv exists, stop immediately otherwise
        if (!aladinDiv) {
            console.error("Aladin div has not been found. Please check its name!");
            return;
        }
        this.wasm = null;
        const self = this;

        // if not options was set, try to retrieve them from the query string
        if (requestedOptions === undefined) {
            requestedOptions = this.getOptionsFromQueryString();
        }
        requestedOptions = requestedOptions || {};


        // 'fov' option was previsouly called 'zoom'
        if ('zoom' in requestedOptions) {
            var fovValue = requestedOptions.zoom;
            delete requestedOptions.zoom;
            requestedOptions.fov = fovValue;
        }
        // merge with default options
        var options = {};
        for (var key in Aladin.DEFAULT_OPTIONS) {
            if (requestedOptions[key] !== undefined) {
                options[key] = requestedOptions[key];
            }
            else {
                options[key] = Aladin.DEFAULT_OPTIONS[key];
            }
        }
        for (var key in requestedOptions) {
            if (Aladin.DEFAULT_OPTIONS[key] === undefined) {
                options[key] = requestedOptions[key];
            }
        }

        this.options = options;

        this.aladinDiv = aladinDiv;

        this.reduceDeformations = true;
        // parent div
        aladinDiv.classList.add("aladin-container");

        // measurement table
        this.measurementTable = new MeasurementTable(this);

        //var location = new Location(locationDiv.find('.aladin-location-text'));

        // set different options
        // Reticle
        this.view = new View(this);

        // Aladin logo
        new AladinLogo(this.aladinDiv);

        this.reticle = new Reticle(this.options, this);
        this.popup = new Popup(this.aladinDiv, this.view);

        this.cacheSurveys = new Map();
        this.ui = [];

        // Background color
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
            this.setBackgroundColor(this.backgroundColor)
        }

        // Grid
        let gridOptions = {
            enabled: false,
            color: (options.gridOptions && options.gridOptions.color && Color.hexToRgb(options.gridOptions.color)) || Aladin.DEFAULT_OPTIONS.gridColor,
            opacity: (options.gridOptions && options.gridOptions.opacity) || Aladin.DEFAULT_OPTIONS.gridOpacity
        };
        if (options && options.showCooGrid) {
            gridOptions.enabled = true;
        }

        this.setCooGrid(gridOptions);

        // Set the projection
        let projection = (options && options.projection) || 'SIN';
        this.setProjection(projection)

        // layers control panel
        // TODO : valeur des checkbox en fonction des options
        ALEvent.LOADING_START.listenedBy(aladinDiv, function (e) {
            let layerControl = aladinDiv.querySelector(".aladin-layersControl");

            if (layerControl) {
                layerControl.style.backgroundImage = 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHdpZHRoPSI0MHB4IiBoZWlnaHQ9IjQwcHgiIHZpZXdCb3g9IjAgMCA0MCA0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjEuNDE0MjE7IiB4PSIwcHgiIHk9IjBweCI+CiAgICA8ZGVmcz4KICAgICAgICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPjwhW0NEQVRBWwogICAgICAgICAgICBALXdlYmtpdC1rZXlmcmFtZXMgc3BpbiB7CiAgICAgICAgICAgICAgZnJvbSB7CiAgICAgICAgICAgICAgICAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDBkZWcpCiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHRvIHsKICAgICAgICAgICAgICAgIC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoLTM1OWRlZykKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgICAgQGtleWZyYW1lcyBzcGluIHsKICAgICAgICAgICAgICBmcm9tIHsKICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogcm90YXRlKDBkZWcpCiAgICAgICAgICAgICAgfQogICAgICAgICAgICAgIHRvIHsKICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogcm90YXRlKC0zNTlkZWcpCiAgICAgICAgICAgICAgfQogICAgICAgICAgICB9CiAgICAgICAgICAgIHN2ZyB7CiAgICAgICAgICAgICAgICAtd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46IDUwJSA1MCU7CiAgICAgICAgICAgICAgICAtd2Via2l0LWFuaW1hdGlvbjogc3BpbiAxLjVzIGxpbmVhciBpbmZpbml0ZTsKICAgICAgICAgICAgICAgIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOwogICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBzcGluIDEuNXMgbGluZWFyIGluZmluaXRlOwogICAgICAgICAgICB9CiAgICAgICAgXV0+PC9zdHlsZT4KICAgIDwvZGVmcz4KICAgIDxnIGlkPSJvdXRlciI+CiAgICAgICAgPGc+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0yMCwwQzIyLjIwNTgsMCAyMy45OTM5LDEuNzg4MTMgMjMuOTkzOSwzLjk5MzlDMjMuOTkzOSw2LjE5OTY4IDIyLjIwNTgsNy45ODc4MSAyMCw3Ljk4NzgxQzE3Ljc5NDIsNy45ODc4MSAxNi4wMDYxLDYuMTk5NjggMTYuMDA2MSwzLjk5MzlDMTYuMDA2MSwxLjc4ODEzIDE3Ljc5NDIsMCAyMCwwWiIgc3R5bGU9ImZpbGw6YmxhY2s7Ii8+CiAgICAgICAgPC9nPgogICAgICAgIDxnPgogICAgICAgICAgICA8cGF0aCBkPSJNNS44NTc4Niw1Ljg1Nzg2QzcuNDE3NTgsNC4yOTgxNSA5Ljk0NjM4LDQuMjk4MTUgMTEuNTA2MSw1Ljg1Nzg2QzEzLjA2NTgsNy40MTc1OCAxMy4wNjU4LDkuOTQ2MzggMTEuNTA2MSwxMS41MDYxQzkuOTQ2MzgsMTMuMDY1OCA3LjQxNzU4LDEzLjA2NTggNS44NTc4NiwxMS41MDYxQzQuMjk4MTUsOS45NDYzOCA0LjI5ODE1LDcuNDE3NTggNS44NTc4Niw1Ljg1Nzg2WiIgc3R5bGU9ImZpbGw6cmdiKDIxMCwyMTAsMjEwKTsiLz4KICAgICAgICA8L2c+CiAgICAgICAgPGc+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0yMCwzMi4wMTIyQzIyLjIwNTgsMzIuMDEyMiAyMy45OTM5LDMzLjgwMDMgMjMuOTkzOSwzNi4wMDYxQzIzLjk5MzksMzguMjExOSAyMi4yMDU4LDQwIDIwLDQwQzE3Ljc5NDIsNDAgMTYuMDA2MSwzOC4yMTE5IDE2LjAwNjEsMzYuMDA2MUMxNi4wMDYxLDMzLjgwMDMgMTcuNzk0MiwzMi4wMTIyIDIwLDMyLjAxMjJaIiBzdHlsZT0iZmlsbDpyZ2IoMTMwLDEzMCwxMzApOyIvPgogICAgICAgIDwvZz4KICAgICAgICA8Zz4KICAgICAgICAgICAgPHBhdGggZD0iTTI4LjQ5MzksMjguNDkzOUMzMC4wNTM2LDI2LjkzNDIgMzIuNTgyNCwyNi45MzQyIDM0LjE0MjEsMjguNDkzOUMzNS43MDE5LDMwLjA1MzYgMzUuNzAxOSwzMi41ODI0IDM0LjE0MjEsMzQuMTQyMUMzMi41ODI0LDM1LjcwMTkgMzAuMDUzNiwzNS43MDE5IDI4LjQ5MzksMzQuMTQyMUMyNi45MzQyLDMyLjU4MjQgMjYuOTM0MiwzMC4wNTM2IDI4LjQ5MzksMjguNDkzOVoiIHN0eWxlPSJmaWxsOnJnYigxMDEsMTAxLDEwMSk7Ii8+CiAgICAgICAgPC9nPgogICAgICAgIDxnPgogICAgICAgICAgICA8cGF0aCBkPSJNMy45OTM5LDE2LjAwNjFDNi4xOTk2OCwxNi4wMDYxIDcuOTg3ODEsMTcuNzk0MiA3Ljk4NzgxLDIwQzcuOTg3ODEsMjIuMjA1OCA2LjE5OTY4LDIzLjk5MzkgMy45OTM5LDIzLjk5MzlDMS43ODgxMywyMy45OTM5IDAsMjIuMjA1OCAwLDIwQzAsMTcuNzk0MiAxLjc4ODEzLDE2LjAwNjEgMy45OTM5LDE2LjAwNjFaIiBzdHlsZT0iZmlsbDpyZ2IoMTg3LDE4NywxODcpOyIvPgogICAgICAgIDwvZz4KICAgICAgICA8Zz4KICAgICAgICAgICAgPHBhdGggZD0iTTUuODU3ODYsMjguNDkzOUM3LjQxNzU4LDI2LjkzNDIgOS45NDYzOCwyNi45MzQyIDExLjUwNjEsMjguNDkzOUMxMy4wNjU4LDMwLjA1MzYgMTMuMDY1OCwzMi41ODI0IDExLjUwNjEsMzQuMTQyMUM5Ljk0NjM4LDM1LjcwMTkgNy40MTc1OCwzNS43MDE5IDUuODU3ODYsMzQuMTQyMUM0LjI5ODE1LDMyLjU4MjQgNC4yOTgxNSwzMC4wNTM2IDUuODU3ODYsMjguNDkzOVoiIHN0eWxlPSJmaWxsOnJnYigxNjQsMTY0LDE2NCk7Ii8+CiAgICAgICAgPC9nPgogICAgICAgIDxnPgogICAgICAgICAgICA8cGF0aCBkPSJNMzYuMDA2MSwxNi4wMDYxQzM4LjIxMTksMTYuMDA2MSA0MCwxNy43OTQyIDQwLDIwQzQwLDIyLjIwNTggMzguMjExOSwyMy45OTM5IDM2LjAwNjEsMjMuOTkzOUMzMy44MDAzLDIzLjk5MzkgMzIuMDEyMiwyMi4yMDU4IDMyLjAxMjIsMjBDMzIuMDEyMiwxNy43OTQyIDMzLjgwMDMsMTYuMDA2MSAzNi4wMDYxLDE2LjAwNjFaIiBzdHlsZT0iZmlsbDpyZ2IoNzQsNzQsNzQpOyIvPgogICAgICAgIDwvZz4KICAgICAgICA8Zz4KICAgICAgICAgICAgPHBhdGggZD0iTTI4LjQ5MzksNS44NTc4NkMzMC4wNTM2LDQuMjk4MTUgMzIuNTgyNCw0LjI5ODE1IDM0LjE0MjEsNS44NTc4NkMzNS43MDE5LDcuNDE3NTggMzUuNzAxOSw5Ljk0NjM4IDM0LjE0MjEsMTEuNTA2MUMzMi41ODI0LDEzLjA2NTggMzAuMDUzNiwxMy4wNjU4IDI4LjQ5MzksMTEuNTA2MUMyNi45MzQyLDkuOTQ2MzggMjYuOTM0Miw3LjQxNzU4IDI4LjQ5MzksNS44NTc4NloiIHN0eWxlPSJmaWxsOnJnYig1MCw1MCw1MCk7Ii8+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4K)';
            }
        });

        ALEvent.LOADING_STOP.listenedBy(aladinDiv, function (e) {
            let layerControl = aladinDiv.querySelector(".aladin-layersControl");

            if (layerControl) {
                layerControl.style.backgroundImage = 'url("data:image/gif;base64,R0lGODlhGQAcAMIAAAAAADQ0NKahocvFxf///wAAAAAAAAAAACH5BAEKAAcALAAAAAAZABwAAANneLoH/hCwyaJ1dDrCuydY1gBfyYUaaZqosq0r+sKxNNP1pe98Hy2OgXBILLZGxWRSBlA6iZjgczrwWa9WIEDA7Xq/R8d3PGaSz97oFs0WYN9wiDZAr9vvYcB9v2fy/3ZqgIN0cYZYCQA7")';
            }
        });

        this.gotoObject(options.target, undefined);

        if (options.log) {
            var params = requestedOptions;
            params['version'] = Aladin.VERSION;
            Logger.log("startup", params);
        }

        if (options.catalogUrls) {
            for (var k = 0, len = options.catalogUrls.length; k < len; k++) {
                this.createCatalogFromVOTable(options.catalogUrls[k]);
            }
        }

        if (options.survey) {
            if (Array.isArray(options.survey)) {
                let i = 0;
                options.survey.forEach((rootURLOrId) => {
                    if (i == 0) {
                        this.setBaseImageLayer(rootURLOrId);
                    } else {
                        this.setOverlayImageLayer(rootURLOrId, Utils.uuidv4());
                    }
                    i++;
                });
            } else {
                this.setBaseImageLayer(options.survey);
            }
        } else if (options.surveyUrl) {
            // Add the image layers
            // For that we check the survey key of options
            // It can be given as a single string or an array of strings
            // for multiple blending surveys
            // take in priority the surveyUrl parameter
            let url;
            if (Array.isArray(options.surveyUrl)) {
                // mirrors given, take randomly one
                let numMirrors = options.surveyUrl.length;
                let id = Math.floor(Math.random() * numMirrors);
                url = options.surveyUrl[id]
            } else {
                url = options.surveyUrl;
            }

            this.setBaseImageLayer(url);
        } else {
            // This case should not happen because if there is no survey given
            // then the surveyUrl pointing to the DSS is given.
        }

        this.view.showCatalog(options.showCatalog);

        // FullScreen toolbar icon
        this.isInFullscreen = false;
        // go to full screen ?
        if (options.fullScreen === true) {
            // strange behaviour to wait for a sec
            self.toggleFullscreen(self.options.realFullscreen);
        }

        // maximize control
        if (options.showFullscreenControl) {
            // react to fullscreenchange event to restore initial width/height (if user pressed ESC to go back from full screen)
            Utils.on(document, 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function (e) {
                var fullscreenElt = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
                if (fullscreenElt === null || fullscreenElt === undefined) {
                    self.aladinDiv.classList.remove('aladin-fullscreen');
    
                    var fullScreenToggledFn = self.callbacksByEventName['fullScreenToggled'];
                    (typeof fullScreenToggledFn === 'function') && fullScreenToggledFn(self.isInFullscreen);
                }
            });
        }

        // set right click context menu
        if (options.showContextMenu) {
            this.contextMenu = new ContextMenu(this);
            this.contextMenu.attach(DefaultActionsForContextMenu.getDefaultActions(this));
        }

        if (options.samp) {
            this.samp = new SAMPConnector(this);
        }

        this._setupUI(options);
    };

    Aladin.prototype._setupUI = function(options) {
        let self = this;

        // Status bar
        if (options.showStatusBar) {
            let statusBarOptions = {};
            if (typeof options.showStatusBar === "object") {
                statusBarOptions = options.showStatusBar;
                
            }
            this.statusBar = new StatusBarBox(this, statusBarOptions);
        }

        let viewport = new Toolbar({
            direction: 'horizontal',
            position: {
                anchor: 'left top'
            }
        }, this);

        // Add the frame control
        if (options.showFrame) {
            let cooFrame = CooFrameEnum.fromString(options.cooFrame, CooFrameEnum.J2000);
            let cooFrameControl = Input.select({
                name: 'frame',
                type: 'select',
                value: cooFrame.label,
                options: [CooFrameEnum.J2000.label, CooFrameEnum.J2000d.label, CooFrameEnum.GAL.label],
                change(e) {
                    self.setFrame(e.target.value)
                },
                tooltip: {
                    content: "Change the frame",
                    position: {
                        direction: 'bottom'
                    }
                }
            });

            cooFrameControl.addClass('aladin-cooFrame');

            viewport.add(cooFrameControl)
        }
        // Add the location info
        if (options.showCooLocation) {
            this.location = new Location(this)
            viewport.add(this.location);
        }
        // Add the FoV info
        viewport.add(new FoV(this, options))

        ////////////////////////////////////////////////////
        let menu = new Menu({
            orientation: 'vertical',
            direction: 'left',
            position: {
                left: '0px',
                top: '3rem'
            }
        }, this);

        // Add the layers control
        if (options.showLayersControl) {
            menu.enable('overlay')
        }
        // Add the simbad pointer control
        if (options.showSimbadPointerControl) {
            menu.enable('simbad')
        }
        // Add the projection control
        let topRightToolbar = new Toolbar({
            orientation: 'horizontal',
            position: {
                anchor: 'right top'
            }
        }, this);
        /*if (options.showProjectionControl) {
            topRightToolbar.add(new ProjectionActionButton(this, {
                openDirection: 'left',
            }))            
        }*/
        // Add the goto control
        /*if (options.showGotoControl) {
            menu.enable('goto')
        }*/
        // Add the coo grid control
        if (options.showCooGridControl) {
            menu.enable('grid')
        }
        // Settings control
        if (options.showSettingsControl) {
            menu.enable('settings')
        }

        this.addUI(viewport);
        this.addUI(menu);

        // share control panel
        if (options.showShareControl) {
            /*let share = new Toolbar({
                orientation: 'horizontal',
                
            }, this);

            share.add()*/
            /*share.add(new SnapshotActionButton({
                tooltip: {
                    content: 'Take a snapshot of your current view',
                    position: {
                        direction: 'top'
                    }
                },
            }, this))*/

            this.addUI(new ShareActionButton(self, {
                position: {
                    anchor: 'left bottom'
                }
            }));
        }

        if (options.showProjectionControl) {
            topRightToolbar.add(new ProjectionActionButton(this))            
        }

        if (options.showFullscreenControl) {
            topRightToolbar.add(new FullScreenActionButton(self))
        }

        this.addUI(topRightToolbar);

        topRightToolbar

        this.menu = menu;
        this.viewportMenu = viewport;

        this._applyMediaQueriesUI()
    }

    Aladin.prototype._applyMediaQueriesUI = function() {
        let self = this;
        function updateLocation() {
            let [lon, lat] = self.wasm.getCenter();
            self.location.update({
                lon: lon,
                lat: lat,
                isViewCenter: true,
                frame: self.view.cooFrame
            }, self);
        }

        function mqMediumSizeFunction(x) {
            if (x.matches) { // If media query matches
                if (self.location) {
                    Location.prec = 2;
                    updateLocation()
                }
            } else {
                if (self.location) {
                    Location.prec = 7;
                    updateLocation()
                }       
            }
        }

        // Create a MediaQueryList object
        var mqMediumSize = window.matchMedia("(max-width: 500px)")

        // Attach listener function on state changes
        mqMediumSize.addEventListener("change", function() {
            mqMediumSizeFunction(mqMediumSize);
        });

        var mqSmallSize = window.matchMedia("(max-width: 410px)")

        /*function mqSmallSizeFunction(x) {
            if (x.matches) { // If media query matches
                self.menu.update({
                    direction: 'right',
                    position: {
                        top: '23px',
                        left: '0px'
                    }
                })
            } else {
                self.menu.update({
                    direction: 'left',
                    position: {
                        top: '23px',
                        left: '0px'
                    }
                })
            }
        }*/

        // Attach listener function on state changes
        /*mqSmallSize.addEventListener("change", function() {
            mqSmallSizeFunction(mqSmallSize);
        });*/

        // Call listener function at run time
        //mqSmallSizeFunction(mqSmallSize);
        mqMediumSizeFunction(mqMediumSize);
    }

    /**** CONSTANTS ****/
    Aladin.VERSION = version;

    Aladin.JSONP_PROXY = "https://alaskybis.cds.unistra.fr/cgi/JSONProxy";
    //Aladin.JSONP_PROXY = "https://alaskybis.unistra.fr/cgi/JSONProxy";

    Aladin.URL_PREVIEWER = 'https://aladin.cds.unistra.fr/AladinLite/';

    // access to WASM libraries
    Aladin.wasmLibs = {};
    Aladin.DEFAULT_OPTIONS = {
        surveyUrl: ["https://alaskybis.unistra.fr/DSS/DSSColor", "https://alasky.unistra.fr/DSS/DSSColor"],
        target: "0 +0",
        cooFrame: "J2000",
        fov: 60,
        backgroundColor: "rgb(60, 60, 60)",
        // Zoom toolbar
        showZoomControl: true,
        // Menu toolbar
        showLayersControl: false,
        showFullscreenControl: true,
        //showGotoControl: false,
        showSimbadPointerControl: false,
        showCooGridControl: false,
        showSettingsControl: false,
        // Share toolbar
        showShareControl: false,

        // Viewport toolbar
        showFrame: true,
        showFov: true,
        showCooLocation: true,
        showProjectionControl: true,

        // Other UI elements
        showContextMenu: false,
        showStatusBar: true,
        // Internal
        showReticle: true,
        showCatalog: true, // TODO: still used ??

        fullScreen: false,
        reticleColor: "rgb(178, 50, 178)",
        reticleSize: 22,
        gridColor: "rgb(0, 255, 0)",
        gridOpacity: 0.5,
        projection: 'SIN',
        log: true,
        samp: false,
        realFullscreen: false,
        pixelateCanvas: true
    };

    // realFullscreen: AL div expands not only to the size of its parent, but takes the whole available screen estate
    Aladin.prototype.toggleFullscreen = function (realFullscreen) {
        let self = this;

        realFullscreen = Boolean(realFullscreen);
        self.isInFullscreen = !self.isInFullscreen;

        if (this.menu) {
            this.menu.closeAll();
        }

        //this.fullScreenBtn.attr('title', isInFullscreen ? 'Restore original size' : 'Full screen');

        if (this.aladinDiv.classList.contains('aladin-fullscreen')) {
            this.aladinDiv.classList.remove('aladin-fullscreen');
        } else {
            this.aladinDiv.classList.add('aladin-fullscreen');
        }

        if (realFullscreen) {
            // go to "real" full screen mode
            if (self.isInFullscreen) {
                var d = this.aladinDiv;

                if (d.requestFullscreen) {
                    d.requestFullscreen();
                }
                else if (d.webkitRequestFullscreen) {
                    d.webkitRequestFullscreen();
                }
                else if (d.mozRequestFullScreen) { // notice the difference in capitalization for Mozilla functions ...
                    d.mozRequestFullScreen();
                }
                else if (d.msRequestFullscreen) {
                    d.msRequestFullscreen();
                }
            }
            // exit from "real" full screen mode
            else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }

        // Delay the fixLayoutDimensions layout for firefox
        /*setTimeout(function () {
            self.view.fixLayoutDimensions();
        }, 1000);*/

        // force call to zoomChanged callback
        var fovChangedFn = self.callbacksByEventName['zoomChanged'];
        (typeof fovChangedFn === 'function') && fovChangedFn(self.view.fov);

        var fullScreenToggledFn = self.callbacksByEventName['fullScreenToggled'];
        (typeof fullScreenToggledFn === 'function') && fullScreenToggledFn(isInFullscreen);
    };

    Aladin.prototype.getOptionsFromQueryString = function () {
        var options = {};
        var requestedTarget = Utils.urlParam('target');
        if (requestedTarget) {
            options.target = requestedTarget;
        }
        var requestedFrame = Utils.urlParam('frame');
        if (requestedFrame && CooFrameEnum[requestedFrame]) {
            options.frame = requestedFrame;
        }
        var requestedSurveyId = Utils.urlParam('survey');
        if (requestedSurveyId && ImageSurvey.getSurveyInfoFromId(requestedSurveyId)) {
            options.survey = requestedSurveyId;
        }
        var requestedZoom = Utils.urlParam('zoom');
        if (requestedZoom && requestedZoom > 0 && requestedZoom < 180) {
            options.zoom = requestedZoom;
        }

        var requestedShowreticle = Utils.urlParam('showReticle');
        if (requestedShowreticle) {
            options.showReticle = requestedShowreticle.toLowerCase() == 'true';
        }

        var requestedCooFrame = Utils.urlParam('cooFrame');
        if (requestedCooFrame) {
            options.cooFrame = requestedCooFrame;
        }

        var requestedFullscreen = Utils.urlParam('fullScreen');
        if (requestedFullscreen !== undefined) {
            options.fullScreen = requestedFullscreen;
        }

        return options;
    };

   /**
     * Sets the field of view (FoV) of the Aladin instance to the specified angle in degrees.
     *
     * @memberof Aladin
     * @param {number} fovDegrees - The angle of the field of view in degrees.
     *
     * @example
     * let aladin = A.aladin('#aladin-lite-div');
     * aladin.setFoV(60);
     */
    Aladin.prototype.setFoV = function (fovDegrees) {
        this.view.setZoom(fovDegrees);
    };

    // @API
    // (experimental) try to adjust the FoV to the given object name. Does nothing if object is not known from Simbad
    Aladin.prototype.adjustFovForObject = function (objectName) {
        var self = this;
        this.getFovForObject(objectName, function (fovDegrees) {
            self.setFoV(fovDegrees);
        });
    };


    Aladin.prototype.getFovForObject = function (objectName, callback) {
        var query = "SELECT galdim_majaxis, V FROM basic JOIN ident ON oid=ident.oidref JOIN allfluxes ON oid=allfluxes.oidref WHERE id='" + objectName + "'";
        var url = '//simbad.u-strasbg.fr/simbad/sim-tap/sync?query=' + encodeURIComponent(query) + '&request=doQuery&lang=adql&format=json&phase=run';

        Utils.fetch({
            url,
            method: 'GET',
            dataType: 'json',
            success: (result) => {
                var defaultFov = 4 / 60; // 4 arcmin
                var fov = defaultFov;
    
                if ('data' in result && result.data.length > 0) {
                    var galdimMajAxis = Utils.isNumber(result.data[0][0]) ? result.data[0][0] / 60.0 : null; // result gives galdim in arcmin
                    var magV = Utils.isNumber(result.data[0][1]) ? result.data[0][1] : null;
    
                    if (galdimMajAxis !== null) {
                        fov = 2 * galdimMajAxis;
                    }
                    else if (magV !== null) {
                        if (magV < 10) {
                            fov = 2 * Math.pow(2.0, (6 - magV / 2.0)) / 60;
                        }
                    }
                }
    
                (typeof callback === 'function') && callback(fov);
            }
        })
    };

    /**
     * Sets the coordinate frame of the Aladin instance to the specified frame.
     *
     * @memberof Aladin
     * @param {string} frameName - The name of the coordinate frame. Possible values: 'J2000', 'J2000d', 'GALACTIC'.
     *
     * @example
     * // Set the coordinate frame to 'J2000'
     * const aladin = A.aladin('#aladin-lite-div');
     * aladin.setFrame('J2000');
     */
    Aladin.prototype.setFrame = function (frameName) {
        if (!frameName) {
            return;
        }
        var newFrame = CooFrameEnum.fromString(frameName, CooFrameEnum.J2000);
        if (newFrame == this.view.cooFrame) {
            return;
        }

        this.view.changeFrame(newFrame);

        var frameChangedFunction = this.callbacksByEventName['cooFrameChanged'];
        if (typeof frameChangedFunction === 'function') {
            frameChangedFunction(newFrame.label);
        }
    };

    /**
     * Sets the projection of the Aladin instance to the specified type.
     *
     * @memberof Aladin
     * @param {string} projection The type of projection to set. Possible values
     * <br>"TAN" (Gnomonic projection)
     * <br>"STG" (Stereographic projection)
     * <br>"SIN" (Orthographic projection)
     * <br>"ZEA" (Zenital equal-area projection)
     * <br>"MER" (Mercator projection)
     * <br>"AIT" (Hammer-Aitoff projection)
     * <br>"MOL" (Mollweide projection)
    *
    * @example
    * // Set the projection to 'orthographic'
    * let aladin = A.aladin('#aladin-lite-div');
    * aladin.setProjection('SIN');
    */
    Aladin.prototype.setProjection = function (projection) {
        if (!projection) {
            return;
        }
        this.view.setProjection(projection);

        ALEvent.PROJECTION_CHANGED.dispatchedTo(this.aladinDiv, {projection: projection});
    };

    /**
     * Append a message to the status bar with a specific duration
     *
     * @memberof Aladin
     * @param {Object} options - The message to display
     * @param {string} options.id - The id of the message, is useful for removing unlimited time messages
     * @param {string} options.message - The message to display
     * @param {string|number} options.duration - The duration of the message. Accepts a time in milliseconds or 'unlimited'
     * @param {string} options.type - The type of the message. Can be 'loading', 'tooltip', 'info'
     */
    Aladin.prototype.appendStatusBarMessage = function(options) {
        if (this.statusBar) {
            this.statusBar.appendMessage(options)
        }
    };

    Aladin.prototype.getProjectionName = function() {
        const self = this;

        let projName = undefined;
        for (let key in ProjectionEnum) {
            if (ProjectionEnum[key] == self.view.projection) {
                projName = key;
                break;
            }
        };

        return projName;
    };``

    /**
     * Returns the current coordinate system: possible values are 'J2000', 'J2000d', and 'Galactic' .
     *
     * @memberof Aladin
     * @returns {string} The current coordinate system: possible values are 'J2000', 'J2000d', and 'Galactic' .
     *
     * @example
     * const aladin = A.aladin('#aladin-lite-div', {cooFrame: 'galactic'});
     * let cooFrame = aladin.getFrame();
     * assert(cooFrame, 'galactic')
     */
    Aladin.prototype.getFrame = function() {
        return this.view.cooFrame.label;
    }

    /**
     * Moves the Aladin instance to the specified astronomical object.
     *
     * @memberof Aladin
     * @param {string} targetName - The name or identifier of the astronomical object to move to.
     * @param {Object} [callbackOptions] - Optional callback options.
     * @param {function} [callbackOptions.success] - The callback function to execute on successful navigation.
     * @param {function} [callbackOptions.error] - The callback function to execute on error during navigation.
     *
     * @example
     * // Move to the astronomical object named 'M42' with callbacks
     * const aladinInstance = A.aladin('#aladin-lite-div');
     * aladinInstance.gotoObject('M42', {
     *   success: () => {
     *     console.log('Successfully moved to M42.');
     *   },
     *   error: (err) => {
     *     console.error('Error moving to M42:', err);
     *   }
     * });
     */
    Aladin.prototype.gotoObject = function (targetName, callbackOptions) {
        let successCallback = undefined;
        let errorCallback   = undefined;
        if (typeof callbackOptions === 'object') {
            if (callbackOptions.hasOwnProperty('success')) {
                successCallback = callbackOptions.success;
            }
            if (callbackOptions.hasOwnProperty('error')) {
                errorCallback = callbackOptions.error;
            }
        }
        // this is for compatibility reason with the previous method signature which was function(targetName, errorCallback)
        else if (typeof callbackOptions === 'function') {
            errorCallback = callbackOptions;
        }

        var isObjectName = /[a-zA-Z]/.test(targetName);

        // try to parse as a position
        if (!isObjectName) {
            var coo = new Coo();

            coo.parse(targetName);
            // Convert from view coo sys to icrs
            const [ra, dec] = this.wasm.viewToICRSCooSys(coo.lon, coo.lat);
            this.view.pointTo(ra, dec);

            (typeof successCallback === 'function') && successCallback(this.getRaDec());
        }
        // ask resolution by Sesame
        else {
            var self = this;
            // sky case
            (async () => {
                let baseImageLayer;
                if (this.getBaseImageLayer()) {
                    baseImageLayer = await this.getBaseImageLayer().query;
                }
                if (this.getBaseImageLayer() === undefined || !baseImageLayer.isPlanetaryBody()) {
                    Sesame.resolve(targetName,
                        function (data) { // success callback
                            // Location given in icrs at J2000
                            const coo = data.coo;
                            self.view.pointTo(coo.jradeg, coo.jdedeg);
    
                            (typeof successCallback === 'function') && successCallback(self.getRaDec());
                        },
                        function (data) { // errror callback
                            if (console) {
                                console.log("Could not resolve object name " + targetName);
                                console.log(data);
                            }
                            (typeof errorCallback === 'function') && errorCallback();
                        }
                    );
                }
                // planetary case
                else {
                    const body = baseImageLayer.properties.hipsBody;
                    PlanetaryFeaturesNameResolver.resolve(targetName, body,
                        function (data) { // success callback
                            self.view.pointTo(data.lon, data.lat);
    
                            (typeof successCallback === 'function') && successCallback(self.getRaDec());
                        },
                        function (data) { // error callback
                            if (console) {
                                console.log("Could not resolve object name " + targetName);
                                console.log(data);
                            }
                            (typeof errorCallback === 'function') && errorCallback();
                        }
                    );
                }
            })();
        }
    };

   /**
     * Moves the Aladin instance to the specified position.
     *
     * @memberof Aladin
     * @param {number} lon - longitude in degrees
     * @param {number} lat - latitude in degrees
     * @param {string} frame - Optional callback options.
     *
     * @example
     * // Move to position 
     * const aladin = A.aladin('#aladin-lite-div');
     * aladin.gotoPosition(20, 10, "galactic");
     */
    Aladin.prototype.gotoPosition = function (lon, lat, frame = undefined) {
        var radec;
        // convert the frame from string to CooFrameEnum
        if (frame) {
            frame = CooFrameEnum.fromString(this.options.cooFrame, CooFrameEnum.J2000);
        }
        // both are CooFrameEnum
        let positionGivenFrame = frame || this.view.cooFrame;
        // First, convert to J2000 if needed
        if (positionGivenFrame === CooFrameEnum.GAL) {
            radec = CooConversion.GalacticToJ2000([lon, lat]);
        } else {
            radec = [lon, lat];
        }

        this.view.pointTo(radec[0], radec[1]);
    };

    var idTimeoutAnim;
    var doAnimation = function (aladin) {
        if (idTimeoutAnim) {
            clearTimeout(idTimeoutAnim)
        }

        var params = aladin.animationParams;
        if (params == null || !params['running']) {
            return;
        }
        var now = new Date().getTime();
        // this is the animation end: set the view to the end position, and call complete callback
        if (now > params['end']) {
            aladin.gotoRaDec(params['raEnd'], params['decEnd']);

            if (params['complete']) {
                params['complete']();
            }

            return;
        }

        // compute current position
        var fraction = (now - params['start']) / (params['end'] - params['start']);
        var curPos = intermediatePoint(params['raStart'], params['decStart'], params['raEnd'], params['decEnd'], fraction);
        var curRa = curPos[0];
        var curDec = curPos[1];
        //var curRa =  params['raStart'] + (params['raEnd'] - params['raStart']) * (now-params['start']) / (params['end'] - params['start']);
        //var curDec = params['decStart'] + (params['decEnd'] - params['decStart']) * (now-params['start']) / (params['end'] - params['start']);

        aladin.gotoRaDec(curRa, curDec);

        idTimeoutAnim = setTimeout(function () { doAnimation(aladin); }, 10);
    };

    /*
     * Stop all animations that have been initiated  by animateToRaDec or by zoomToFoV
     * @API
     *
     */
    Aladin.prototype.stopAnimation = function () {
        if (this.zoomAnimationParams) {
            this.zoomAnimationParams['running'] = false;
        }
        if (this.animationParams) {
            this.animationParams['running'] = false;
        }
    }

    /*
     * animate smoothly from the current position to the given ra, dec
     *
     * the total duration (in seconds) of the animation can be given (otherwise set to 5 seconds by default)
     *
     * complete: a function to call once the animation has completed
     *
     * @API
     *
     */
    Aladin.prototype.animateToRaDec = function (ra, dec, duration, complete) {
        duration = duration || 5;

        this.animationParams = null;

        var animationParams = {};
        animationParams['start'] = new Date().getTime();
        animationParams['end'] = new Date().getTime() + 1000 * duration;
        var raDec = this.getRaDec();
        animationParams['raStart'] = raDec[0];
        animationParams['decStart'] = raDec[1];
        animationParams['raEnd'] = ra;
        animationParams['decEnd'] = dec;
        animationParams['complete'] = complete;
        animationParams['running'] = true;

        this.animationParams = animationParams;

        doAnimation(this);
    };

    var doZoomAnimation = function (aladin) {
        var params = aladin.zoomAnimationParams;
        if (params == null || !params['running']) {
            return;
        }
        var now = new Date().getTime();
        // this is the zoom animation end: set the view to the end fov, and call complete callback
        if (now > params['end']) {
            aladin.setFoV(params['fovEnd']);

            if (params['complete']) {
                params['complete']();
            }

            return;
        }

        // compute current position
        var fraction = (now - params['start']) / (params['end'] - params['start']);
        var curFov = params['fovStart'] + (params['fovEnd'] - params['fovStart']) * Math.sqrt(fraction);

        aladin.setFoV(curFov);

        setTimeout(function () { doZoomAnimation(aladin); }, 50);
    };
    /*
     * zoom smoothly from the current FoV to the given new fov to the given ra, dec
     *
     * the total duration (in seconds) of the animation can be given (otherwise set to 5 seconds by default)
     *
     * complete: a function to call once the animation has completed
     *
     * @API
     *
     */
    Aladin.prototype.zoomToFoV = function (fov, duration, complete) {
        duration = duration || 5;

        this.zoomAnimationParams = null;

        var zoomAnimationParams = {};
        zoomAnimationParams['start'] = new Date().getTime();
        zoomAnimationParams['end'] = new Date().getTime() + 1000 * duration;
        var fovArray = this.getFov();
        zoomAnimationParams['fovStart'] = Math.max(fovArray[0], fovArray[1]);
        zoomAnimationParams['fovEnd'] = fov;
        zoomAnimationParams['complete'] = complete;
        zoomAnimationParams['running'] = true;

        this.zoomAnimationParams = zoomAnimationParams;
        doZoomAnimation(this);
    };



    /**
     *  Compute intermediate point between points (lng1, lat1) and (lng2, lat2)
     *  at distance fraction times the total distance (fraction between 0 and 1)
     *
     *  Return intermediate points in degrees
     *
     */
    function intermediatePoint(lng1, lat1, lng2, lat2, fraction) {
        function degToRad(d) {
            return d * Math.PI / 180;
        }
        function radToDeg(r) {
            return r * 180 / Math.PI;
        }
        var lat1 = degToRad(lat1);
        var lng1 = degToRad(lng1);
        var lat2 = degToRad(lat2);
        var lng2 = degToRad(lng2);
        var d = 2 * Math.asin(
            Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)),
                2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
        var A = Math.sin((1 - fraction) * d) / Math.sin(d);
        var B = Math.sin(fraction * d) / Math.sin(d);
        var x = A * Math.cos(lat1) * Math.cos(lng1) + B *
            Math.cos(lat2) * Math.cos(lng2);
        var y = A * Math.cos(lat1) * Math.sin(lng1) + B *
            Math.cos(lat2) * Math.sin(lng2);
        var z = A * Math.sin(lat1) + B * Math.sin(lat2);
        var lon = Math.atan2(y, x);
        var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) +
            Math.pow(y, 2)));

        return [radToDeg(lon), radToDeg(lat)];
    };




    /**
     * Gets the current [Right Ascension, Declination] position of the center of the Aladin view.
     *
     * This method returns the celestial coordinates of the center of the Aladin view in the International
     * Celestial Reference System (ICRS) or J2000 equatorial coordinates.
     *
     * @memberof Aladin
     * @returns {number[]} - An array representing the [Right Ascension, Declination] coordinates in degrees.
     *                       The first element is the Right Ascension (RA), and the second element is the Declination (Dec).
     */
    Aladin.prototype.getRaDec = function () {
        let radec = this.wasm.getCenter(); // This is given in the frame of the view
        // We must convert it to ICRS
        const radec_j2000 = this.wasm.viewToICRSCooSys(radec[0], radec[1]);

        if (radec_j2000[0]<0) {
            return [radec_j2000[0] + 360.0, radec_j2000[1]];
        }

        return radec_j2000;
    };

    /**
     * point to a given position, expressed as a ra,dec coordinate
     *
     * @API
     */
    Aladin.prototype.gotoRaDec = function (ra, dec) {
        this.view.pointTo(ra, dec);
    };

    Aladin.prototype.showHealpixGrid = function (show) {
        this.view.showHealpixGrid(show);
    };

    Aladin.prototype.healpixGrid = function () {
        return this.view.displayHpxGrid;
    };

    Aladin.prototype.showSurvey = function (show) {
        this.view.showSurvey(show);
    };
    Aladin.prototype.showCatalog = function (show) {
        this.view.showCatalog(show);
    };
    Aladin.prototype.showReticle = function (show) {
        this.reticle.update({show})
    };

    Aladin.prototype.getReticle = function () {
        return this.reticle;
    };

    // these 4 methods should be merged into a unique "add" method
    Aladin.prototype.addCatalog = function (catalog) {
        this.view.addCatalog(catalog);

        ALEvent.GRAPHIC_OVERLAY_LAYER_ADDED.dispatchedTo(this.aladinDiv, {layer: catalog});
    };

    Aladin.prototype.addOverlay = function (overlay) {
        this.view.addOverlay(overlay);

        ALEvent.GRAPHIC_OVERLAY_LAYER_ADDED.dispatchedTo(this.aladinDiv, {layer: overlay});
    };

    Aladin.prototype.addMOC = function (moc) {
        this.view.addMOC(moc);
    };

    Aladin.prototype.addUI = function (ui) {
        this.ui.push(ui);
        ui.attachTo(this.aladinDiv)
    };

    // @API
    Aladin.prototype.findLayerByUUID = function(uuid) {
        const result = this.view.allOverlayLayers.filter(layer => layer.uuid===uuid);
        if (result.length==0) {
            return null;
        }

        return result[0];
    }

    Aladin.prototype.removeLayers = function () {
        this.view.removeLayers();
    };

    // @API
    Aladin.prototype.removeLayer = function(layer) {
        this.view.removeLayer(layer);
    };

    // @oldAPI
    Aladin.prototype.createImageSurvey = function(id, name, rootUrl, cooFrame, maxOrder, options = {}) {
        let cfg = this.cacheSurveys.get(id);
        if (!cfg) {
            // Add the cooFrame and maxOrder given by the user
            // to the list of options passed to the ImageSurvey constructor
            if (cooFrame) {
                options.cooFrame = cooFrame;
            }

            if (maxOrder) {
                options.maxOrder = maxOrder;
            }

            cfg = {id, name, rootUrl, options};
            this.cacheSurveys.set(id, cfg);
        } else {
            cfg = Utils.clone(cfg)
        }
        return new ImageSurvey(cfg.id, cfg.name, cfg.rootUrl, this.view, cfg.options);
    };

    Aladin.prototype.createImageFITS = function(url, name, options = {}, successCallback = undefined, errorCallback = undefined) {
        try {
            url = new URL(url);
        } catch(e) {
            // The url could be created
            url = Utils.getAbsoluteURL(url)
            url = new URL(url);
        }

        // Do not use proxy with CORS headers until we solve that: https://github.com/MattiasBuelens/wasm-streams/issues/20
        //url = Utils.handleCORSNotSameOrigin(url);

        let cfg = this.cacheSurveys.get(url);
        if (!cfg) {
            cfg = {url, name, options, successCallback, errorCallback}
            this.cacheSurveys.set(url, cfg);
        } else {
            cfg = Utils.clone(cfg)
        }

        return new ImageFITS(cfg.url, cfg.name, this.view, cfg.options, cfg.successCallback, cfg.errorCallback);
    };

    Aladin.prototype.newImageSurvey = function(rootUrlOrId, options) {
        const idOrUrl = rootUrlOrId;
        // Check if the survey has already been added
        // Create a new ImageSurvey
        const name = idOrUrl;

        return this.createImageSurvey(idOrUrl, name, idOrUrl, null, null, options);
    }

    Aladin.prototype.addNewImageLayer = function() {
        let layerName = Utils.uuidv4();
        // A HIPS_LAYER_ADDED will be called after the hips is added to the view
        this.setOverlayImageLayer('CDS/P/DSS2/color', layerName);
    }

    // @param imageSurvey : ImageSurvey object or image survey identifier
    // @api
    // @old
    Aladin.prototype.setImageLayer = function(imageLayer) {
        this.setBaseImageLayer(imageLayer);
    };

    Aladin.prototype.setImageSurvey = Aladin.prototype.setImageLayer;

    // @param imageSurvey : ImageSurvey object or image survey identifier
    // @api
    // @old
    Aladin.prototype.setBackgroundColor = function(rgb) {
        

        this.backgroundColor = new Color(rgb);
        // Once the wasm is ready, send the color to change it

        ALEvent.AL_USE_WASM.dispatchedTo(document.body, {callback: (wasm) => {
            wasm.setBackgroundColor(this.backgroundColor);
            ALEvent.BACKGROUND_COLOR_CHANGED.dispatchedTo(this.aladinDiv, {color: this.backgroundColor});
        }})
    };

    Aladin.prototype.getBackgroundColor = function() {
        return this.backgroundColor;
    };

    // @api
    Aladin.prototype.removeImageLayer = function(layer) {
        this.view.removeImageLayer(layer);
    };


    Aladin.prototype.setBaseImageLayer = function(idOrSurvey) {
        return this.setOverlayImageLayer(idOrSurvey, "base");
    };

    // @api
    Aladin.prototype.getBaseImageLayer = function () {
        return this.view.getImageLayer("base");
    };

    // @api
    Aladin.prototype.setOverlayImageLayer = function (idOrUrlOrImageLayer, layer = "overlay") {
        let imageLayer;
        // 1. User gives an ID
        if (typeof idOrUrlOrImageLayer === "string") {
            const idOrUrl = idOrUrlOrImageLayer;
            // Check if the survey has already been added
            // Create a new ImageSurvey
            /*let isUrl = false;
            if (idOrUrl.includes("http")) {
                isUrl = true;
            }
            const name = idOrUrl;

            if (isUrl) {
                const url = idOrUrl;
                const id = url;
                // Url
                imageLayer = this.createImageSurvey(idOrUrl, name, idOrUrl, null, null);
            } else {
                const id = idOrUrl;
                // ID
                imageLayer = this.createImageSurvey(idOrUrl, name, idOrUrl, null, null);
            }*/
            const name = idOrUrl;
            imageLayer = this.createImageSurvey(idOrUrl, name, idOrUrl, null, null);
        // 2. User gives a non resolved promise
        } else {
            imageLayer = idOrUrlOrImageLayer;
        }

        return this.view.setOverlayImageLayer(imageLayer, layer);
    };

    // @api
    Aladin.prototype.getOverlayImageLayer = function(layer = "overlay") {
        const survey = this.view.getImageLayer(layer);
        return survey;
    };

    // @api
    Aladin.prototype.increaseZoom = function () {
        this.view.increaseZoom(0.01);
    };

    Aladin.prototype.decreaseZoom = function () {
        this.view.decreaseZoom(0.01);
    };

    Aladin.prototype.setRotation = function(rotation) {
        this.view.setRotation(rotation);
    }

    // @api
    // Set the current layer that is targeted
    // Rightclicking for changing the cuts is done the targeted layer
    Aladin.prototype.selectLayer = function (layer) {
        this.view.selectLayer(layer);
    }

    Aladin.prototype.getSelectedLayer = function () {
        return this.view.selectedLayer;
    }

    // Get the list of overlays
    Aladin.prototype.getOverlays = function () {
        return this.view.allOverlayLayers;
    }

    // Get the list of overlays
    Aladin.prototype.getImageOverlays = function () {
        return this.view.overlayLayers;
    }

    Aladin.prototype.isHpxGridDisplayed = function () {
        return this.view.displayHpxGrid;
    }

    Aladin.prototype.isReticleDisplayed = function () {
        return this.reticle.isVisible();
    }

    Aladin.prototype.createProgressiveCatalog = function (url, frame, maxOrder, options) {
        return new ProgressiveCat(url, frame, maxOrder, options);
    };

    Aladin.prototype.createOverlay = function (options) {
        return new Overlay(options);
    };

    // Select corresponds to rectangular selection
    Aladin.AVAILABLE_CALLBACKS = [
        'select',

        'objectClicked',
        'objectHovered',
        'objectHoveredStop',

        'footprintClicked',
        'footprintHovered',

        'positionChanged',
        'zoomChanged',

        'click',
        'rightClickMove',
        'mouseMove',

        'fullScreenToggled',
        'cooFrameChanged'
    ];
    // API
    //
    // setting callbacks
    Aladin.prototype.on = function (what, myFunction) {
        if (Aladin.AVAILABLE_CALLBACKS.indexOf(what) < 0) {
            return;
        }

        this.callbacksByEventName[what] = myFunction;

        if (what === "positionChanged") {
            // tell the backend about that callback
            // because it needs to be called when the inertia is done
            ALEvent.AL_USE_WASM.dispatchedTo(document.body, {callback: (wasm) => {
                let myFunctionThrottled = Utils.throttle(
                    myFunction,
                    View.CALLBACKS_THROTTLE_TIME_MS,
                );

                wasm.setCallbackPositionChanged(myFunctionThrottled);
            }})
        }
    };

    Aladin.prototype.addListener = function(alEventName, customFn) {
        new ALEvent(alEventName).listenedBy(this.aladinDiv, customFn);
    };

    Aladin.prototype.selectObjects = function(objects) {
        this.view.selectObjects(objects)
    };

    /**
     * Enters selection mode
     *
     * @memberof Aladin
     * @param {string} mode=rect - The mode of selection, can be either, 'rect', 'poly', or 'circle'
     * @param {function} callback - A function called once the selection has been done
    *
    * @example
    * // Creates and add a MOC from the user polygonal selection
    * aladin.select('poly', p => {
    *    try {
    *        let ra = []
    *        let dec = []
    *        for (const v of p.vertices) {
    *            let [lon, lat] = aladin.pix2world(v.x, v.y);
    *            ra.push(lon)
    *            dec.push(lat)
    *        }
    *
    *        let moc = A.MOCFromPolygon(
    *            {ra, dec},
    *            {name: 'poly', lineWidth: 3.0, color: 'pink'},
    *        );
    *        aladin.addMOC(moc)
    *    } catch(_) {
    *        alert('Selection covers a region out of the projection definition domain.');
    *    }
    *})
    */
    Aladin.prototype.select = async function (mode = 'rect', callback) {
        await this.reticle.loaded;

        // Default callback selects objects
        callback = callback || ((selection) => {
            this.view.selectObjects(selection);
        });

        this.fire('selectstart', {mode, callback});
    };

    Aladin.prototype.fire = function (what, params) {
        if (what === 'selectstart') {
            const {mode, callback} = params;
            this.view.startSelection(mode, callback);
        }
        else if (what === 'simbad') {
            this.view.setMode(View.TOOL_SIMBAD_POINTER);
        } else if (what === 'default') {
            this.view.setMode(View.PAN);
        }
    };

    Aladin.prototype.hideBoxes = function () {
        if (this.boxes) {
            for (var k = 0; k < this.boxes.length; k++) {
                if (typeof this.boxes[k].hide === "function") {
                    this.boxes[k].hide();
                }
            }
        }
    };

    // TODO : LayerBox (or Stack?) must be extracted as a separate object
    Aladin.prototype.showLayerBox = function () {
        this.stack.showImageLayerBox();
    };

    /**
     * Sets the coordinate grid options for the Aladin Lite view.
     *
     * This method allows you to customize the appearance of the coordinate grid in the Aladin Lite view.
     *
     * @memberof Aladin
     *
     * @param {Object} options - Options to customize the coordinate grid.
     * @param {string} [options.color] - The color of the coordinate grid.
     * @param {number} [options.opacity] - The opacity of the coordinate grid (value between 0 and 1).
     * @param {number} [options.labelSize] - The size of the coordinate grid labels in pixels.
     * @param {number} [options.thickness] - The thickness of the coordinate grid lines.
     * @param {boolean} [options.enabled] - If true, the coordinate grid is enabled; otherwise, it is disabled.
     *
     * @example
     * // Set the coordinate grid color to red
     * aladin.setCooGrid({ color: 'red' });
     *
     * // Enable the coordinate grid
     * aladin.setCooGrid({ enabled: true });
     */
    Aladin.prototype.setCooGrid = function(options) {
        if (options.color) {
            // 1. the user has maybe given some
            options.color = new Color(options.color)
            // 3. convert from 0-255 to 0-1
            options.color.r /= 255;
            options.color.g /= 255;
            options.color.b /= 255;
        }

        this.view.setGridConfig(options);
    }

    Aladin.prototype.getGridOptions = function() {
        return this.view.getGridConfig();
    }

    Aladin.prototype.showCooGrid = function () {
        this.view.setGridConfig({enabled: true});
    };

    Aladin.prototype.hideCooGrid = function() {
        this.view.setGridConfig({enabled: false});
    }

    Aladin.prototype.layerByName = function (name) {
        var c = this.view.allOverlayLayers;
        for (var k = 0; k < c.length; k++) {
            if (name == c[k].name) {
                return c[k];
            }
        }
        return null;
    };

    // TODO : integrate somehow into API ?
    Aladin.prototype.exportAsPNG = function (downloadFile = false) {
        (async () => {
            const url = await this.getViewDataURL();
            if (downloadFile) {
                Utils.download(url, "screenshot");
            } else {
                // open a new window
                var w = window.open();
                w.document.write('<img src="' + url + '" width="' + this.view.width + 'px">');
                w.document.title = 'Aladin Lite snapshot';
            }
        })();
    };

    /**
     * Return the current view as a data URL (base64-formatted string)
     * Parameters:
     * - options (optional): object with attributs
     *     * format (optional): 'image/png' or 'image/jpeg'
     *     * width: width in pixels of the image to output
     *     * height: height in pixels of the image to output
     *
     * @API
    */
    Aladin.prototype.getViewDataURL = async function (options) {
        var options = options || {};
        // support for old API signature
        if (typeof options !== 'object') {
            var imgFormat = options;
            options = { format: imgFormat };
        }
        const canvasDataURL = await this.view.getCanvasDataURL(options.format, options.width, options.height);
        return canvasDataURL;
    }

    /**
     * Return the current view WCS as a key-value dictionary
     * Can be useful in coordination with getViewDataURL
     *
     * NOTE + TODO : Rotations are not implemented yet
     * 
     * @API
    */
    Aladin.prototype.getViewWCS = function () {
        // get general view properties
        const center = this.wasm.getCenter();
        const fov = this.getFov();
        const width = this.view.width;
        const height = this.view.height;

        // get values common for all
        let cdelt1 = fov[0] / width;
        const cdelt2 = fov[1] / height;
        const projectionName = this.getProjectionName();

        if (projectionName == "FEYE")
            return "Fish eye projection is not supported by WCS standards.";

        // reversed longitude case
        if (this.getBaseImageLayer().longitudeReversed) {
            cdelt1 = -cdelt1;
        }

        // solar system object dict from planetary fits standard
        // https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2018EA000388
        const solarSystemObjects = {
            "earth": "EA",
            "moon": "SE",
            "mercury": "ME",
            "venus": "VE",
            "mars": "MA",
            "jupiter": "JU",
            "saturn": "SA",
            "uranus": "UR",
            "neptune": "NE",
            // satellites other than the Moon
            "satellite": "ST" // not findable in the hips properties?
        };

        // we define a generic LON LAT keyword for unknown body types
        let cooType1 = "LON--";
        let cooType2 = "LAT--";

        // just in case it would be equatorial
        let radecsys;

        if (this.getBaseImageLayer().isPlanetaryBody()) {
            const body = this.getBaseImageLayer().properties.hipsBody
            if (body in solarSystemObjects) {
                cooType1 = `${solarSystemObjects[body]}LN-`;
                cooType2 = `${solarSystemObjects[body]}LT-`;
            }
           
        } else {
            switch (this.getFrame()) {
                case "J2000":
                case "J2000d":
                    cooType1 = "RA---";
                    cooType2 = "DEC--";
                    radecsys = "ICRS    ";
                    break;
                case "Galactic":
                    cooType1 = "GLON-";
                    cooType2 = "GLAT-";
            }
        }

        const WCS = {
            NAXIS: 2,
            NAXIS1: width,
            NAXIS2: height,
            CRPIX1: width / 2 + 0.5,
            CRPIX2: height / 2 + 0.5,
            CRVAL1: center[0],
            CRVAL2: center[1],
            CTYPE1: cooType1 + projectionName,
            CTYPE2: cooType2 + projectionName,
            CUNIT1: "deg     ",
            CUNIT2: "deg     ",
            CDELT1: cdelt1,
            CDELT2: cdelt2
        };

        // handle the case of equatorial coordinates that need 
        // the radecsys keyword
        if (radecsys == "ICRS    ")
            WCS.RADECSYS = radecsys;

        return WCS;
    }

    /** restrict FOV range
     * @API
     * @param minFOV in degrees when zoom in at max
     * @param maxFOV in degrees when zoom out at max
    */
    Aladin.prototype.setFovRange = Aladin.prototype.setFOVRange = function (minFOV, maxFOV) {
        if (minFOV > maxFOV) {
            var tmp = minFOV;
            minFOV = maxFOV;
            maxFOV = tmp;
        }

        this.view.minFOV = minFOV;
        this.view.maxFOV = maxFOV;

    };

    /**
     * Transform pixel coordinates to world coordinates.
     *
     * The origin (0,0) of pixel coordinates is at the top-left corner of the Aladin Lite view.
     *
     * @memberof Aladin
     *
     * @param {number} x - The x-coordinate in pixel coordinates.
     * @param {number} y - The y-coordinate in pixel coordinates.
     *
     * @returns {number[]} - An array representing the [Right Ascension, Declination] coordinates in degrees.
     * 
     * @throws {Error} Throws an error if an issue occurs during the transformation.
     */
    Aladin.prototype.pix2world = function (x, y) {
        const [ra, dec] = this.view.wasm.screenToWorld(x, y);

        if (ra < 0) {
            return [ra + 360.0, dec];
        }

        return [ra, dec];
    };

    /**
     * Transform world coordinates to pixel coordinates in the view.
     *
     * @memberof Aladin
     *
     * @param {number} ra - The Right Ascension (RA) coordinate in degrees.
     * @param {number} dec - The Declination (Dec) coordinate in degrees.
     *
     * @returns {number[]} - An array representing the [x, y] coordinates in pixel coordinates in the view.
     *
     * @throws {Error} Throws an error if an issue occurs during the transformation.
     */
    Aladin.prototype.world2pix = function (ra, dec) {
        return this.view.wasm.worldToScreen(ra, dec);
    };

     /**
     * Get the angular distance in degrees between two locations
     *
     * @memberof Aladin
     *
     * @param {number} x1 - The x-coordinate of the first pixel coordinates.
     * @param {number} y1 - The y-coordinate of the first pixel coordinates.
     * @param {number} x2 - The x-coordinate of the second pixel coordinates.
     * @param {number} y2 - The y-coordinate of the second pixel coordinates.
     *
     * @returns {number} - The angular distance between the two pixel coordinates in degrees
     *
     * @throws {Error} Throws an error if an issue occurs during the transformation.
     */
    Aladin.prototype.angularDist = function (x1, y1, x2, y2) {
        const [ra1, dec1] = this.pix2world(x1, y1);
        const [ra2, dec2] = this.pix2world(x2, y2);

        return this.wasm.angularDist(ra1, dec1, ra2, dec2);
    };

    /**
     * Gets a set of points along the current Field of View (FoV) corners.
     *
     * @memberof Aladin
     *
     * @param {number} nbSteps - The number of points to return along each side (the total number of points returned is 4 * nbSteps).
     *
     * @returns {number[][]} - A set of positions along the current FoV with the following format: [[ra1, dec1], [ra2, dec2], ..., [ra_n, dec_n]].
     *                         The positions will be given in degrees
     * 
     * @throws {Error} Throws an error if an issue occurs during the transformation.
     *
     */
    Aladin.prototype.getFovCorners = function (nbSteps) {
        // default value: 1
        if (!nbSteps || nbSteps < 1) {
            nbSteps = 1;
        }

        var points = [];
        var x1, y1, x2, y2;
        for (var k = 0; k < 4; k++) {
            x1 = (k == 0 || k == 3) ? 0 : this.view.width - 1;
            y1 = (k < 2) ? 0 : this.view.height - 1;
            x2 = (k < 2) ? this.view.width - 1 : 0;
            y2 = (k == 1 || k == 2) ? this.view.height - 1 : 0;

            for (var step = 0; step < nbSteps; step++) {
                let radec = this.wasm.screenToWorld(x1 + step / nbSteps * (x2 - x1), y1 + step / nbSteps * (y2 - y1));
                points.push(radec);
            }
        }

        return points;

    };

    /**
     * Gets the current Field of View (FoV) size in degrees as a 2-element array.
     *
     * @memberof Aladin
     *
     * @returns {number[]} - A 2-element array representing the current FoV size in degrees. The first element is the FoV width,
     *                       and the second element is the FoV height.
     */
    Aladin.prototype.getFov = function () {
        // can go up to 1000 deg
        var fovX = this.view.fov;
        var s = this.getSize();

        // constrain to the projection definition domain
        fovX = Math.min(fovX, this.view.projection.fov);
        var fovY = s[1] / s[0] * fovX;

        fovY = Math.min(fovY, 180);
        // TODO : take into account AITOFF projection where fov can be larger than 180

        return [fovX, fovY];
    };

    /**
     * Returns the size in pixels for the Aladin view
     *
     * @memberof Aladin
     *
     * @returns {number[]} - A 2-element array representing the current Aladin view size in pixels. The first element is the width,
     *                       and the second element is the height.
     */
    Aladin.prototype.getSize = function () {
        return [this.view.width, this.view.height];
    };

    /**
     * @API
     *
     * @return the jQuery object representing the DIV element where the Aladin Lite instance lies
     */
    Aladin.prototype.getParentDiv = function () {
        return this.aladinDiv;
    };

    // @API
    /*
    * return a Box GUI element to insert content
    */
    /*Aladin.prototype.box = function (options) {
        var box = new Box(options);
        box.$parentDiv.appendTo(this.aladinDiv);

        return box;
    };*/

    // @API
    /*
    * show popup at ra, dec position with given title and content
    *
    * If circleRadius, the corresponding circle will also be plotted
    */
    Aladin.prototype.showPopup = function (ra, dec, title, content, circleRadius) {
        this.view.catalogForPopup.removeAll();
        this.view.overlayForPopup.removeAll();

        let marker;
        if (circleRadius !== undefined) {
            this.view.overlayForPopup.add(A.circle(ra, dec, circleRadius, {fillColor: 'rgba(255, 0, 0, 0.2)'}));
            marker = A.marker(ra, dec, { popupTitle: title, popupDesc: content, useMarkerDefaultIcon: true });
        }
        else {
            marker = A.marker(ra, dec, { popupTitle: title, popupDesc: content, useMarkerDefaultIcon: false });
        }

        this.view.catalogForPopup.addSources(marker);

        this.view.overlayForPopup.show();
        this.view.catalogForPopup.show();

        this.popup.setTitle(title);
        this.popup.setText(content);

        this.popup.setSource(marker);
        this.popup.show();
    };

    // @API
    /*
    * hide popup
    */
    Aladin.prototype.hidePopup = function () {
        this.popup.hide();
    };

    // @API
    /*
    * return a URL allowing to share the current view
    */
    Aladin.prototype.getShareURL = function () {
        var radec = this.getRaDec();
        var coo = new Coo();
        coo.prec = 7;
        coo.lon = radec[0];
        coo.lat = radec[1];

        return Aladin.URL_PREVIEWER + '?target=' + encodeURIComponent(coo.format('s')) +
            '&fov=' + this.getFov()[0].toFixed(2) + '&survey=' + encodeURIComponent(this.getBaseImageLayer().id || this.getBaseImageLayer().rootUrl);
    };

    // @API
    /*
    * return, as a string, the HTML embed code
    */
    Aladin.prototype.getEmbedCode = function () {
        var radec = this.getRaDec();
        var coo = new Coo();
        coo.prec = 7;
        coo.lon = radec[0];
        coo.lat = radec[1];

        var survey = this.getBaseImageLayer().url;
        var fov = this.getFov()[0];
        let s = '';
        const NL = "\n";
        s += '<div id="aladin-lite-div" style="width:400px;height:400px;"></div>' + NL;
        s += '<script src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js" charset="utf-8"></script>' + NL;
        s += '<script>' + NL;
        s += "let aladin;" + NL + "A.init.then(() => {" + NL + "   aladin = A.aladin('#aladin-lite-div', {survey: '" + survey + "', fov: " + fov.toFixed(2) + ', target: "' + coo.format('s') + '"});' + NL + '});' + NL;
        s += '</script>';

        return s;
    };

/**
 * Display a JPEG image in the Aladin Lite view.
 *
 * @memberof Aladin
 *
 * @param {string} url - The URL of the JPEG image.
 * @param {Object} options - Options to customize the display. Can include the following properties:
 * @param {string} options.label  - A label for the displayed image.
 * @param {number} options.order - The desired HEALPix order format.
 * @param {boolean} options.nocache - True if you want to disable the cache
 * @param {number} options.transparency - Opacity of the image rendered in aladin lite. Between 0 and 1.
 * @param {Function} successCallback - The callback function to be executed on a successful display.
 *      The callback gives the ra, dec, and fov of the image;
 * @param {Function} errorCallback - The callback function to be executed if an error occurs during display.
 * 
 * @example
 * aladin.displayJPG(
 *  // the JPG to transform to HiPS
 *   'https://noirlab.edu/public/media/archives/images/large/noirlab1912a.jpg',
 *   {
 *       transparency: 0.6,
 *       label: 'NOIRLab image'
 *   },
 *   (ra, dec, fov) => {
 *      // your code here
 *   })
 *);
 */
    Aladin.prototype.displayFITS = function (
        url,
        options,
        successCallback,
        errorCallback,
        layer = "base"
    ) {
        successCallback = successCallback || ((ra, dec, fov, _) => {
            this.gotoRaDec(ra, dec);
            this.setFoV(fov);
        });
        const imageFits = this.createImageFITS(url, url, options, successCallback, errorCallback);
        return this.setOverlayImageLayer(imageFits, layer);
    };

/**
 * Display a JPEG image in the Aladin Lite view.
 *
 * @memberof Aladin
 *
 * @param {string} url - The URL of the JPEG image.
 * @param {Object} options - Options to customize the display. Can include the following properties:
 * @param {string} options.label  - A label for the displayed image.
 * @param {number} options.order - The desired HEALPix order format.
 * @param {boolean} options.nocache - True if you want to disable the cache
 * @param {number} options.transparency - Opacity of the image rendered in aladin lite. Between 0 and 1.
 * @param {Function} successCallback - The callback function to be executed on a successful display.
 *      The callback gives the ra, dec, and fov of the image;
 * @param {Function} errorCallback - The callback function to be executed if an error occurs during display.
 * 
 * @example
 * aladin.displayJPG(
 *  // the JPG to transform to HiPS
 *   'https://noirlab.edu/public/media/archives/images/large/noirlab1912a.jpg',
 *   {
 *       transparency: 0.6,
 *       label: 'NOIRLab image'
 *   },
 *   (ra, dec, fov) => {
 *      // your code here
 *   })
 *);
 */
    Aladin.prototype.displayJPG = Aladin.prototype.displayPNG = function (url, options, successCallback, errorCallback) {
        options = options || {};
        options.color = true;
        options.label = options.label || "JPG/PNG image";
        options.outputFormat = 'png';

        options = options || {};

        var data = { url };
        if (options.color) {
            data.color = true;
        }
        if (options.outputFormat) {
            data.format = options.outputFormat;
        }
        if (options.order) {
            data.order = options.order;
        }
        if (options.nocache) {
            data.nocache = options.nocache;
        }
        let self = this;

        const request = ( url, params = {}, method = 'GET' ) => {
            let options = {
                method
            };
            if ( 'GET' === method ) {
                url += '?' + ( new URLSearchParams( params ) ).toString();
            } else {
                options.body = JSON.stringify( params );
            }

            return fetch( url, options ).then( response => response.json() );
        };
        const get = ( url, params ) => request( url, params, 'GET' );

        get('https://alasky.unistra.fr/cgi/fits2HiPS', data)
            .then(async (response) => {
                if (response.status != 'success') {
                    console.error('An error occured: ' + response.message);
                    if (errorCallback) {
                        errorCallback(response.message);
                    }
                    return;
                }
                var label = options.label;
                var meta = response.data.meta;

                const survey = self.createImageSurvey(response.data.url, label, response.data.url);
                self.setOverlayImageLayer(survey, "overlay");

                var transparency = (options && options.transparency) || 1.0;
                survey.setOpacity(transparency);

                var executeDefaultSuccessAction = true;
                if (successCallback) {
                    executeDefaultSuccessAction = successCallback(meta.ra, meta.dec, meta.fov);
                }
                if (executeDefaultSuccessAction === true) {
                    self.wasm.setCenter(meta.ra, meta.dec);
                    self.setFoV(meta.fov);
                }

                // TODO! set an image survey once the already loaded surveys
                // are READY! Otherwise it can lead to some congestion and avoid
                // downloading the base tiles of the other surveys loading!
                // This has to be fixed in the backend but a fast fix is just to wait
                // before setting a new image survey
            });
    };

    /*
    Aladin.prototype.setReduceDeformations = function (reduce) {
        this.reduceDeformations = reduce;
        this.view.requestRedraw();
    }
    */

    return Aladin;
})();
