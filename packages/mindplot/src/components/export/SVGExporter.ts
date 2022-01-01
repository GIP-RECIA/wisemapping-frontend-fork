
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
import { Mindmap } from "../..";
import Exporter from "./Exporter";

class SVGExporter implements Exporter {
    svgElement: Element;
    constructor(mindmap: Mindmap, svgElement: Element, centerImgage:boolean=false) {
        this.svgElement = svgElement;
    }

    export(): Promise<string> {
        // Replace all images for in-line images ...
        const imagesElements: HTMLCollection = this.svgElement.getElementsByTagName('image');
        let svgTxt:string = new XMLSerializer()
            .serializeToString(this.svgElement);

        // Are namespace declared ?. Otherwise, force the declaration ...
        if(svgTxt.indexOf('xmlns:xlink=')!==-1){
            svgTxt = svgTxt.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
        }

        // Add white background. This is mainly for PNG export ...
        svgTxt = svgTxt.replace('<svg ', '<svg style="background-color:white" ');        

        const blob = new Blob([svgTxt], { type: 'image/svg+xml' });
        const result = URL.createObjectURL(blob);
        return Promise.resolve(result);

    }
}
export default SVGExporter;