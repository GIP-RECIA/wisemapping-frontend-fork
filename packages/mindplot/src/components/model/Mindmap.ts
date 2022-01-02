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
import { $assert, $defined } from '@wisemapping/core-js';
import IMindmap from './IMindmap';
import INodeModel, { NodeModelType } from './INodeModel';
import NodeModel from './NodeModel';
import RelationshipModel from './RelationshipModel';
import ModelCodeName from '../persistence/ModelCodeName';

class Mindmap extends IMindmap {
  _description: string;
  _version: string;
  _id: string;
  _branches: Array<NodeModel>;
  _relationships: Array<RelationshipModel>;

  constructor(id: string, version: string = ModelCodeName.TANGO) {
    super();
    $assert(id, 'Id can not be null');

    this._branches = [];
    this._description = null;
    this._relationships = [];
    this._version = version;
    this._id = id;
  }

  /** */
  getDescription(): string {
    return this._description;
  }

  /** */
  setDescription(value: string) {
    this._description = value;
  }

  /** */
  getId(): string {
    return this._id;
  }

  /** */
  setId(id: string) {
    this._id = id;
  }

  /** */
  getVersion(): string {
    return this._version;
  }

  /** */
  setVersion(version: string): void {
    this._version = version;
  }

  /**
         * @param {mindplot.model.NodeModel} nodeModel
         * @throws will throw an error if nodeModel is null, undefined or not a node model object
         * @throws will throw an error if
         */
  addBranch(nodeModel: NodeModel): void {
    $assert(nodeModel && nodeModel.isNodeModel(), 'Add node must be invoked with model objects');
    const branches = this.getBranches();
    if (branches.length === 0) {
      $assert(nodeModel.getType() === 'CentralTopic', 'First element must be the central topic');
      nodeModel.setPosition(0, 0);
    } else {
      $assert(nodeModel.getType() !== 'CentralTopic', 'Mindmaps only have one cental topic');
    }

    this._branches.push(nodeModel);
  }

  /**
         * @param nodeModel
         */
  removeBranch(nodeModel: INodeModel): void {
    $assert(nodeModel && nodeModel.isNodeModel(), 'Remove node must be invoked with model objects');
    this._branches = this._branches.filter((b) => b !== nodeModel);
  }

  getBranches() {
    return this._branches;
  }

  getRelationships(): Array<RelationshipModel> {
    return this._relationships;
  }


  hasAlreadyAdded(node: NodeModel): boolean {
    let result = false;

    // Check in not connected nodes.
    const branches = this._branches;
    for (let i = 0; i < branches.length; i++) {
      result = branches[i].isChildNode(node);
      if (result) {
        break;
      }
    }
    return result;
  }

  createNode(type: NodeModelType = 'MainTopic', id: number) {
    return new NodeModel(type, this, id);
  }

  /**
   * @param sourceNodeId
   * @param targetNodeId
   * @throws will throw an error if source node is null or undefined
   * @throws will throw an error if target node is null or undefined
   * @return the relationship model created
   */
  createRelationship(sourceNodeId: any, targetNodeId: any) {
    $assert($defined(sourceNodeId), 'from node cannot be null');
    $assert($defined(targetNodeId), 'to node cannot be null');

    return new RelationshipModel(sourceNodeId, targetNodeId);
  }

  /**
   * @param relationship
   */
  addRelationship(relationship: RelationshipModel) {
    this._relationships.push(relationship);
  }

  /**
         * @param relationship
         */
  deleteRelationship(relationship: RelationshipModel) {
    this._relationships = this._relationships.filter((r) => r !== relationship);
  }

  findNodeById(id: any) {
    let result = null;
    for (let i = 0; i < this._branches.length; i++) {
      const branch = this._branches[i];
      result = branch.findNodeById(id);
      if (result) {
        break;
      }
    }
    return result;
  }

  static buildEmpty = (mapId: string) => {
    const result = new Mindmap(mapId);
    const node = result.createNode('CentralTopic', 0);
    result.addBranch(node);
    return result;
  };
}

export default Mindmap;
