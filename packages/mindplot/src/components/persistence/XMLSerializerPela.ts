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
import { $assert, $defined, createDocument } from '@wisemapping/core-js';
import { Point } from '@wisemapping/web2d';
import Mindmap from '../model/Mindmap';
import { TopicShape } from '../model/INodeModel';
import ConnectionLine from '../ConnectionLine';
import FeatureModelFactory from '../model/FeatureModelFactory';
import NodeModel from '../model/NodeModel';
import { FeatureType } from '../model/FeatureModel';
import RelationshipModel from '../model/RelationshipModel';
import XMLMindmapSerializer from './XMLMindmapSerializer';

class XMLSerializerPela implements XMLMindmapSerializer {
  private static MAP_ROOT_NODE = 'map';

  private _idsMap: Record<number, Element>;

  toXML(mindmap: Mindmap): Document {
    $assert(mindmap, 'Can not save a null mindmap');

    const document = createDocument();

    // Store map attributes ...
    const mapElem = document.createElement('map');
    const name = mindmap.getId();
    if ($defined(name)) {
      mapElem.setAttribute('name', this.rmXmlInv(name));
    }
    const version = mindmap.getVersion();
    if ($defined(version)) {
      mapElem.setAttribute('version', version);
    }

    document.appendChild(mapElem);

    // Create branches ...
    const topics = mindmap.getBranches();
    topics.forEach((topic) => {
      const topicDom = this._topicToXML(document, topic);
      mapElem.appendChild(topicDom);
    });

    // Create Relationships
    const relationships = mindmap.getRelationships();
    relationships.forEach((relationship) => {
      if (
        mindmap.findNodeById(relationship.getFromNode()) !== null
                && mindmap.findNodeById(relationship.getToNode()) !== null
      ) {
        // Isolated relationships are not persisted ....
        const relationDom = XMLSerializerPela._relationshipToXML(document, relationship);
        mapElem.appendChild(relationDom);
      }
    });

    return document;
  }

  _topicToXML(document: Document, topic: NodeModel) {
    const parentTopic = document.createElement('topic');

    // Set topic attributes...
    if (topic.getType() === 'CentralTopic') {
      parentTopic.setAttribute('central', 'true');
    } else {
      const pos = topic.getPosition();
      parentTopic.setAttribute('position', `${pos.x},${pos.y}`);

      const order = topic.getOrder();
      if (typeof order === 'number' && Number.isFinite(order)) {
        parentTopic.setAttribute('order', order.toString());
      }
    }

    const text = topic.getText();
    if ($defined(text)) {
      this._noteTextToXML(document, parentTopic, text);
    }

    const shape = topic.getShapeType();
    if ($defined(shape)) {
      parentTopic.setAttribute('shape', shape);

      if (shape === TopicShape.IMAGE) {
        const size = topic.getImageSize();
        parentTopic.setAttribute(
          'image',
          `${size.width},${size.height}:${topic.getImageUrl()}`,
        );
      }
    }

    if (topic.areChildrenShrunken() && topic.getType() !== 'CentralTopic') {
      parentTopic.setAttribute('shrink', 'true');
    }

    // Font properties ...
    const id = topic.getId();
    parentTopic.setAttribute('id', id.toString());

    let font = '';

    const fontFamily = topic.getFontFamily();
    font += `${fontFamily || ''};`;

    const fontSize = topic.getFontSize();
    font += `${fontSize || ''};`;

    const fontColor = topic.getFontColor();
    font += `${fontColor || ''};`;

    const fontWeight = topic.getFontWeight();
    font += `${fontWeight || ''};`;

    const fontStyle = topic.getFontStyle();
    font += `${fontStyle || ''};`;

    if (
      $defined(fontFamily)
            || $defined(fontSize)
            || $defined(fontColor)
            || $defined(fontWeight)
            || $defined(fontStyle)
    ) {
      parentTopic.setAttribute('fontStyle', font);
    }

    const bgColor = topic.getBackgroundColor();
    if ($defined(bgColor)) {
      parentTopic.setAttribute('bgColor', bgColor);
    }

    const brColor = topic.getBorderColor();
    if ($defined(brColor)) {
      parentTopic.setAttribute('brColor', brColor);
    }

    const metadata = topic.getMetadata();
    if ($defined(metadata)) {
      parentTopic.setAttribute('metadata', metadata);
    }

    // Serialize features ...
    const features = topic.getFeatures();
    features.forEach((feature) => {
      const featureType = feature.getType();
      const featureDom = document.createElement(featureType);
      const attributes = feature.getAttributes();

      const attributesKeys = Object.keys(attributes);
      for (let attrIndex = 0; attrIndex < attributesKeys.length; attrIndex++) {
        const key = attributesKeys[attrIndex];
        const value = attributes[key];
        if (key === 'text') {
          const cdata = document.createCDATASection(this.rmXmlInv(value));
          featureDom.appendChild(cdata);
        } else {
          featureDom.setAttribute(key, this.rmXmlInv(value));
        }
      }
      parentTopic.appendChild(featureDom);
    });

    // CHILDREN TOPICS
    const childTopics = topic.getChildren();
    childTopics.forEach((childTopic) => {
      const childDom = this._topicToXML(document, childTopic);
      parentTopic.appendChild(childDom);
    });

    return parentTopic;
  }

  _noteTextToXML(document: Document, elem: Element, text: string) {
    if (text.indexOf('\n') === -1) {
      elem.setAttribute('text', this.rmXmlInv(text));
    } else {
      const textDom = document.createElement('text');
      const cdata = document.createCDATASection(this.rmXmlInv(text));
      textDom.appendChild(cdata);
      elem.appendChild(textDom);
    }
  }

  static _relationshipToXML(document: Document, relationship: RelationshipModel) {
    const result = document.createElement('relationship');
    result.setAttribute('srcTopicId', relationship.getFromNode().toString());
    result.setAttribute('destTopicId', relationship.getToNode().toString());

    const lineType = relationship.getLineType();
    result.setAttribute('lineType', lineType.toString());
    if (lineType === ConnectionLine.CURVED || lineType === ConnectionLine.SIMPLE_CURVED) {
      if ($defined(relationship.getSrcCtrlPoint())) {
        const srcPoint = relationship.getSrcCtrlPoint();
        result.setAttribute(
          'srcCtrlPoint',
          `${Math.round(srcPoint.x)},${Math.round(srcPoint.y)}`,
        );
      }
      if ($defined(relationship.getDestCtrlPoint())) {
        const destPoint = relationship.getDestCtrlPoint();
        result.setAttribute(
          'destCtrlPoint',
          `${Math.round(destPoint.x)},${Math.round(destPoint.y)}`,
        );
      }
    }
    result.setAttribute('endArrow', String(relationship.getEndArrow()));
    result.setAttribute('startArrow', String(relationship.getStartArrow()));
    return result;
  }

  /**
     * @param dom
     * @param mapId
     * @throws will throw an error if dom is null or undefined
     * @throws will throw an error if mapId is null or undefined
     * @throws will throw an error if the document element is not consistent with a wisemap's root
     * element
     */
  loadFromDom(dom: Document, mapId: string) {
    $assert(dom, 'dom can not be null');
    $assert(mapId, 'mapId can not be null');

    const rootElem = dom.documentElement;

    // Is a wisemap?.
    $assert(
      rootElem.tagName === XMLSerializerPela.MAP_ROOT_NODE,
      `This seem not to be a map document. Found tag: ${rootElem.tagName}`,
    );

    this._idsMap = {};
    // Start the loading process ...
    const version = rootElem.getAttribute('version') || 'pela';
    const mindmap = new Mindmap(mapId, version);

    // Add all the topics nodes ...
    const childNodes = Array.from(rootElem.childNodes);
    const topicsNodes = childNodes
      .filter(
        (child: ChildNode) => child.nodeType === 1 && (child as Element).tagName === 'topic',
      )
      .map((c) => c as Element);
    topicsNodes.forEach((child) => {
      const topic = this._deserializeNode(child, mindmap);
      mindmap.addBranch(topic);
    });

    // Then all relationshops, they are connected to topics ...
    const relationshipsNodes = childNodes
      .filter(
        (child: ChildNode) => child.nodeType === 1 && (child as Element).tagName === 'relationship',
      )
      .map((c) => c as Element);
    relationshipsNodes.forEach((child) => {
      try {
        const relationship = XMLSerializerPela._deserializeRelationship(child, mindmap);
        mindmap.addRelationship(relationship);
      } catch (e) {
        console.error(e);
      }
    });

    // Clean up from the recursion ...
    this._idsMap = null;
    mindmap.setId(mapId);
    return mindmap;
  }

  _deserializeNode(domElem: Element, mindmap: Mindmap) {
    const type = domElem.getAttribute('central') != null ? 'CentralTopic' : 'MainTopic';

    // Load attributes...
    let id: number | null = null;
    if ($defined(domElem.getAttribute('id'))) {
      id = Number.parseInt(domElem.getAttribute('id'), 10);
    }

    if (this._idsMap[id]) {
      id = null;
    } else {
      this._idsMap[id] = domElem;
    }

    const topic = mindmap.createNode(type, id);

    // Set text property is it;s defined...
    const text = domElem.getAttribute('text');
    if ($defined(text) && text) {
      topic.setText(text);
    }

    const fontStyle = domElem.getAttribute('fontStyle');
    if ($defined(fontStyle) && fontStyle) {
      const font = fontStyle.split(';');

      if (font[0]) {
        topic.setFontFamily(font[0]);
      }

      if (font[1]) {
        topic.setFontSize(Number.parseInt(font[1], 10));
      }

      if (font[2]) {
        topic.setFontColor(font[2]);
      }

      if (font[3]) {
        topic.setFontWeight(font[3]);
      }

      if (font[4]) {
        topic.setFontStyle(font[4]);
      }
    }

    const shape = domElem.getAttribute('shape');
    if ($defined(shape)) {
      topic.setShapeType(shape);

      if (shape === TopicShape.IMAGE) {
        const image = domElem.getAttribute('image');
        const size = image.substring(0, image.indexOf(':'));
        const url = image.substring(image.indexOf(':') + 1, image.length);
        topic.setImageUrl(url);

        const split = size.split(',');
        topic.setImageSize(Number.parseInt(split[0], 10), Number.parseInt(split[1], 10));
      }
    }

    const bgColor = domElem.getAttribute('bgColor');
    if ($defined(bgColor)) {
      topic.setBackgroundColor(bgColor);
    }

    const borderColor = domElem.getAttribute('brColor');
    if ($defined(borderColor)) {
      topic.setBorderColor(borderColor);
    }

    const order = domElem.getAttribute('order');
    if ($defined(order) && order !== 'NaN') {
      // Hack for broken maps ...
      topic.setOrder(parseInt(order, 10));
    }

    const isShrink = domElem.getAttribute('shrink');
    // Hack: Some production maps has been stored with the central topic collapsed. This is a bug.
    if ($defined(isShrink) && type !== 'CentralTopic') {
      topic.setChildrenShrunken(Boolean(isShrink));
    }

    const position = domElem.getAttribute('position');
    if ($defined(position)) {
      const pos = position.split(',');
      topic.setPosition(Number.parseInt(pos[0], 10), Number.parseInt(pos[1], 10));
    }

    const metadata = domElem.getAttribute('metadata');
    if ($defined(metadata)) {
      topic.setMetadata(metadata);
    }

    // Creating icons and children nodes
    const children = Array.from(domElem.childNodes);
    children.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const elem = child as Element;
        if (elem.tagName === 'topic') {
          const childTopic = this._deserializeNode(elem, mindmap);
          childTopic.connectTo(topic);
        } else if (FeatureModelFactory.isSupported(elem.tagName)) {
          // Load attributes ...
          const namedNodeMap = elem.attributes;
          const attributes: Record<string, string> = {};

          for (let j = 0; j < namedNodeMap.length; j++) {
            const attribute = namedNodeMap.item(j);
            attributes[attribute.name] = attribute.value;
          }

          // Has text node ?.
          const textAttr = XMLSerializerPela._deserializeTextAttr(elem);
          if (textAttr) {
            attributes.text = textAttr;
          }

          // Create a new element ....
          const featureType = elem.tagName as FeatureType;
          const feature = FeatureModelFactory.createModel(featureType, attributes);
          topic.addFeature(feature);
        } else if (elem.tagName === 'text') {
          const nodeText = XMLSerializerPela._deserializeNodeText(child);
          topic.setText(nodeText);
        }
      }
    });

    return topic;
  }

  static _deserializeTextAttr(domElem: Element): string {
    let value = domElem.getAttribute('text');
    if (!$defined(value)) {
      const children = domElem.childNodes;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.CDATA_SECTION_NODE) {
          value = child.nodeValue;
        }
      }
    } else {
      // Notes must be decoded ...
      value = unescape(value);

      // Hack for empty nodes ...
      if (value === '') {
        value = ' ';
      }
    }

    return value;
  }

  static _deserializeNodeText(domElem) {
    const children = domElem.childNodes;
    let value = null;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === Node.CDATA_SECTION_NODE) {
        value = child.nodeValue;
      }
    }
    return value;
  }

  static _deserializeRelationship(domElement, mindmap) {
    const srcId = Number.parseInt(domElement.getAttribute('srcTopicId'), 10);
    const destId = Number.parseInt(domElement.getAttribute('destTopicId'), 10);
    const lineType = Number.parseInt(domElement.getAttribute('lineType'), 10);
    const srcCtrlPoint = domElement.getAttribute('srcCtrlPoint');
    const destCtrlPoint = domElement.getAttribute('destCtrlPoint');

    // If for some reason a relationship lines has source and dest nodes the same, don't import it.
    if (srcId === destId) {
      throw new Error('Invalid relationship, dest and source are equals');
    }
    // Is the connections points valid ?. If it's not, do not load the relationship ...
    if (mindmap.findNodeById(srcId) == null || mindmap.findNodeById(destId) == null) {
      throw new Error('Transition could not created, missing node for relationship');
    }

    const model = mindmap.createRelationship(srcId, destId);
    model.setLineType(lineType);
    if ($defined(srcCtrlPoint) && srcCtrlPoint !== '') {
      model.setSrcCtrlPoint(Point.fromString(srcCtrlPoint));
    }
    if ($defined(destCtrlPoint) && destCtrlPoint !== '') {
      model.setDestCtrlPoint(Point.fromString(destCtrlPoint));
    }
    model.setEndArrow('false');
    model.setStartArrow('true');
    return model;
  }

  /**
     * This method ensures that the output String has only
     * valid XML unicode characters as specified by the
     * XML 1.0 standard. For reference, please see
     * <a href="http://www.w3.org/TR/2000/REC-xml-20001006#NT-Char">the
     * standard</a>. This method will return an empty
     * String if the input is null or empty.
     *
     * @param in The String whose non-valid characters we want to remove.
     * @return The in String, stripped of non-valid characters.
     */
  // eslint-disable-next-line class-methods-use-this
  rmXmlInv(str) {
    if (str == null || str === undefined) return null;

    let result = '';
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (
        c === 0x9
                || c === 0xa
                || c === 0xd
                || (c >= 0x20 && c <= 0xd7ff)
                || (c >= 0xe000 && c <= 0xfffd)
                || (c >= 0x10000 && c <= 0x10ffff)
      ) {
        result += str.charAt(i);
      }
    }
    return result;
  }
}

export default XMLSerializerPela;
