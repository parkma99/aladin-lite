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
 * File gui/Stack/Menu.js
 *
 *
 * Author: Matthieu Baumann [CDS, matthieu.baumann@astro.unistra.fr]
 *
 *****************************************************************************/

 import { ActionButton } from "../Widgets/ActionButton.js";
 import targetIcon from '../../../../assets/icons/target.svg';

  
 export class SimbadPointer extends ActionButton {
     // Constructor
     constructor(aladin) {
        super({
            iconURL: targetIcon,
            size: 'medium',
            tooltip: {
                content: 'Want to know what is a specific object ?<br />Use the Simbad pointer tool!',
                position: { direction: 'right' },
            },
            action(o) {
                aladin.fire('simbad');
            }
        })
    }
 }
 