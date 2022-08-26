/*
 *    Copyright [2021] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 *   It is basically the Apache License, Version 2.0 (the "License") plus the
 *   "powered by wisemapping" text requirement on every single page;
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the license at
 *
 *       http://www.wisemapping.org/license
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
import jquery from 'jquery';
import {} from './components/widget/ToolbarNotifier';
import PersistenceManager from './components/PersistenceManager';
import LocalStorageManager from './components/LocalStorageManager';
import MindplotWebComponent from './components/MindplotWebComponent';

console.log('loading static mindmap in read-only');

const globalAny: any = global;
globalAny.jQuery = jquery;

// WebComponent registration
customElements.define('mindplot-component', MindplotWebComponent);
// Configure designer options ...
const historyId = global.historyId ? `${global.historyId}/` : '';
const persistence: PersistenceManager = new LocalStorageManager(
  `/c/restful/maps/{id}/${historyId}document/xml${!global.isAuth ? '-pub' : ''}`,
  true,
);
// Obtain map zoom from query param if it was specified...
const params = new URLSearchParams(window.location.search.substring(1));

const zoomParam = Number.parseFloat(params.get('zoom'));

const webComponent: MindplotWebComponent = document.getElementById(
  'mindmap-comp',
) as MindplotWebComponent;
webComponent.buildDesigner(persistence);
webComponent.loadMap(global.mapId);
