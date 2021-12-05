/*
 *    Copyright [2015] [wisemapping]
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
import { $assert } from '@wisemapping/core-js';
import Events from './Events';
import MultilineTextEditor from './MultilineTextEditor';
import { TopicShape } from './model/INodeModel';

const TopicEvent = {
  EDIT: 'editnode',
  CLICK: 'clicknode',
};

class TopicEventDispatcher extends Events {
  constructor(readOnly) 
  {
    super();
    this._readOnly = readOnly;
    this._activeEditor = null;
    this._multilineEditor = new MultilineTextEditor();
  }

  close(update) {
    if (this.isVisible()) {
      this._activeEditor.close(update);
      this._activeEditor = null;
    }
  }

  show(topic, options) {
    this.process(TopicEvent.EDIT, topic, options);
  }

  process(eventType, topic, options) {
    $assert(eventType, 'eventType can not be null');

    // Close all previous open editor ....
    if (this.isVisible()) {
      this.close();
    }

    // Open the new editor ...
    const model = topic.getModel();
    if (
      model.getShapeType() !== TopicShape.IMAGE
      && !this._readOnly
      && eventType === TopicEvent.EDIT
    ) {
      this._multilineEditor.show(topic, options ? options.text : null);
      this._activeEditor = this._multilineEditor;
    } else {
      this.fireEvent(eventType, { model, readOnly: this._readOnly });
    }
  }

  isVisible() {
    return this._activeEditor != null && this._activeEditor.isVisible();
  }
}

TopicEventDispatcher._instance = null;

TopicEventDispatcher.configure = function configure(readOnly) {
  this._instance = new TopicEventDispatcher(readOnly);
};

TopicEventDispatcher.getInstance = function getInstance() {
  return this._instance;
};

export { TopicEvent };
export default TopicEventDispatcher;