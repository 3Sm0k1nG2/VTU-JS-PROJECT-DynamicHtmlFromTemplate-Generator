class HTMLElementInfo {
    /** @type {HTMLElementTagNameMap} */
    htmlElementName = undefined;
    /** @type {{}} */
    htmlElementArguments = {};
    /** @type {{tagOpen : {startIndex: number, endIndex: number}, tagClose : {startIndex: number, endIndex: number} | null}} */
    indeces = {
        tagOpen: {
            startIndex: -1,
            endIndex: -1
        },
        tagClose: null
    }
}

class InvalidHTMLError extends Error {
    /** @param {(string | undefined)} message */
    constructor(message = undefined) {
        super("InvalidHTMLError: " + message);
    }
}


class HTMLReader {
    /** @private */
    _triggerChars = {
        openTag: '<',
        closeTag: '>',
        closeTagSpan: '/',
        whitespace: ' ',
        equals: '='
    }

    /** 
     * @private
     * @param {{ message?: string charI?: number }}
     */
    _throwInvalidHTMLError({ message = 'Invalid html received', charI = undefined }) {
        throw new InvalidHTMLError(`${charI ? `(charIndex: ${charI}) ` : ''}${message}`);
    }

    /** @throws {InvalidHtmlError} Will throw an error if passed html is invalid.*/
    ReadHTML_foreach_old(html = '<div><button onclick="{{onClick}}" onclick="{{onClick}}">Click me</button><button onclick="{{onClick}}" onclick="{{onClick}}">Click me</button></div>') {
        if (!html?.startsWith(this._triggerChars.openTag)) {
            this._throwInvalidHTMLError(0)
        }

        let fragment = document.createDocumentFragment();

        let tagClose;       // <div>
        let tagSpanClose;   // <div></div>

        // let content = [
        //     { html, element },
        // ];

        /** @type {[HTMLElementInfo]} */
        let stack = [];

        let pointer = {
            stackI: -1,
            isInTag: false,
            isInTagSpan: false
        }

        let shouldCloseTagSpan = false;

        let argument = '';
        let value = '';
        let hasHtmlElementName = false;

        let textContent = '';
        let htmlElementInfo = null;
        debugger
        let charI = 0;
        for (charI in html) {
            charI = Number(charI);
            let char = html[charI];

            switch (char) {
                case this._triggerChars.openTag:
                    if (pointer.isInTag) {
                        this._throwInvalidHTMLError(charI);
                    }

                    pointer.isInTag = true;

                    if (!pointer.isInTagSpan) {
                        htmlElementInfo = new HTMLElementInfo();
                        stack.push(htmlElementInfo);

                        pointer.stackI++;
                        pointer.isInTagSpan = true;
                        shouldCloseTagSpan = false;

                        htmlElementInfo.indeces.tagOpen.startIndex = charI;
                        hasHtmlElementName = false;
                    }

                    continue;
                case this._triggerChars.closeTag:
                    if (!pointer.isInTag) {
                        break;
                    }

                    pointer.isInTag = false;

                    if (shouldCloseTagSpan) {
                        shouldCloseTagSpan = false;
                        pointer.isInTagSpan = false;
                        if (htmlElementInfo.indeces.tagClose) {
                            htmlElementInfo.indeces.tagClose.endIndex = charI;
                        }

                        htmlElementInfo = null;
                        argument = '';
                        value = '';
                        textContent = '';
                    } else {
                        htmlElementInfo.indeces.tagOpen.endIndex = charI;
                        htmlElementInfo.indeces.tagClose = {
                            startIndex: -1,
                            endIndex: -1
                        }
                    }

                    if (!hasHtmlElementName) {
                        htmlElementInfo.htmlElementName = value.toLocaleLowerCase();
                        value = '';
                        hasHtmlElementName = true;
                        continue;
                    }

                    continue;
                case this._triggerChars.closeTagSpan:
                    if (!pointer.isInTag) {
                        break;
                    }

                    if (
                        html[charI + 1] !== this._triggerChars.closeTag
                        && html[charI - 1] !== this._triggerChars.openTag
                    ) {
                        this._throwInvalidHTMLError(charI);
                    }

                    htmlElementInfo.htmlElementArguments.textContent = textContent;
                    textContent = '';
                    shouldCloseTagSpan = true;

                    if (html[charI - 1] === this._triggerChars.openTag) {
                        if (htmlElementInfo.indeces.tagClose) {
                            htmlElementInfo.indeces.tagClose.startIndex = charI - 1;
                        }
                    }

                    continue;
                case this._triggerChars.whitespace:
                    if (!pointer.isInTag) {
                        break;
                    }

                    if (!hasHtmlElementName) {
                        htmlElementInfo.htmlElementName = value.toLocaleLowerCase();
                        value = '';
                        hasHtmlElementName = true;
                        continue;
                    }

                    if (argument) {
                        htmlElementInfo.htmlElementArguments[argument.toLocaleLowerCase()] = value;

                        argument = '';
                        value = '';
                    }

                    continue;
                case this._triggerChars.equals:
                    if (!pointer.isInTag) {
                        break;
                    }

                    argument = value;
                    value = '';

                    continue;
            }

            if (pointer.isInTag) {
                value += char;
            } else if (pointer.isInTagSpan) {
                textContent += char;
            } else {
                this._throwInvalidHTMLError(charI);
            }
        }

        console.log(stack);
        return fragment;
    }

    /** @throws {InvalidHtmlError} Will throw an error if passed html is invalid.*/
    ReadHTML_while_old(html = '<div className="red-color container"><div><button onclick="{{onClick}}" onclick="{{onClick}}">Click me</button><button onclick="{{onClick}}" onclick="{{onClick}}">Click me</button></div></div>') {
        if (html.length === 0) {
            this._throwInvalidHTMLError({ charI: 0, message: 'Received empty html' });
        }

        let fragment = document.createDocumentFragment();
        let elements = [];

        let tags = this._splitHTMLToTags(html);
        let formatedTags = this._formatAsTags(tags);
        let tagDatas = this._formatAsTagData(formatedTags);
        // TO BE IMPLEMENTED, FIND ME, FIX ME, FINISH ME
        let htmlElements = this._formatAsHtmlElements(tagDatas);

        for (let el in htmlElements) {
            fragment.append(el);
        }

        console.log(tags);
        console.log(formatedTags);
        console.log(tagDatas);
        console.log(htmlElements);

        return fragment;
    }



    /** 
     * @private 
     * @argument {string} html 
     * */
    _splitHTMLToTags(html) {
        let isInTag = false;

        let charI = 0;
        let chars = [];

        let tagI = 0;
        let tags = [];


        while (charI < html.length) {
            let char = html[charI];
            chars.push(char);

            switch (char) {
                case this._triggerChars.openTag: {
                    if (isInTag) {
                        this._throwInvalidHTMLError({ charI: 0, message: 'Cannot add tag in tag' });
                    }

                    isInTag = true;

                    let nextChar = html[charI + 1];
                    if (nextChar === this._triggerChars.closeTagSpan) {
                        let openTag = chars.pop();
                        if (chars.length) {
                            tags[tagI] = chars.join('');
                            chars = [openTag];
                            tagI++;
                        } else {
                            chars = [openTag];
                        }
                    }

                    break;
                }
                case this._triggerChars.closeTag: {
                    if (!isInTag) {
                        break;
                    }
                    isInTag = false;

                    if (chars.length) {
                        tags[tagI] = chars.join('');
                        chars = [];
                        tagI++;
                    }

                    break;
                }
                case this._triggerChars.closeTagSpan: {

                    break;
                }
            }

            charI++;
        }

        return tags;
    }

    /** 
    * @private 
    * @argument {[string]} tags 
    * */
    _formatAsTags(tags) {
        /** @type {[Tag]} */
        let formatedTags = [];

        let tagI = 0;

        while (tagI < tags.length) {
            let tag = tags[tagI];

            /** @type {Tag} */
            let formatedTag = {
                raw: undefined,
                isTag: false,
                isCloseTag: false,
                isTextContent: false
            }

            formatedTag.raw = tag;
            if (tag.startsWith(this._triggerChars.openTag) && tag.endsWith(this._triggerChars.closeTag)) {
                formatedTag.isTag = true;
                formatedTag.isCloseTag = tag[1] === this._triggerChars.closeTagSpan;
            } else {
                formatedTag.isTextContent = true;
            }


            tagI++;
            formatedTags.push(formatedTag);
        }

        return formatedTags;
    }

    /**
     * @param {[Tag]} tags 
     */
    _formatAsTagData(tags) {
        let tagI = 0;
        let tag = null;

        let tagName = undefined;

        /** @type {[TagData]} */
        let tagDatas = [];
        /** @type {TagData} */
        let tagData = {
            arguments: {},
            endI: -1,
            startI: -1,
            name: undefined
        };
        let tagDataI = -1;

        let swapCounter = 1;

        while (tagI < tags.length) {
            tag = tags[tagI];

            if (tag.isTag) {
                if (tag.isCloseTag) {
                    tagName = tag.raw.slice(2, -1);
                    if (tagName === tagData.name) {
                        tagData.endI = tagI;

                        // for(let i = tagData.startI; i <= tagData.endI; i++){
                        //     delete tags[i];
                        // }

                        tagData = tagDatas[tagDataI - swapCounter];
                        swapCounter++;
                    }
                } else {
                    tagDataI++;
                    tagDatas[tagDataI] = {
                        arguments: {},
                        endI: -1,
                        startI: -1,
                        name: undefined
                    };
                    tagData = tagDatas[tagDataI];

                    let data = tag.raw.slice(1, -1);
                    data = data.split(' ');
                    tagName = data.shift();

                    tagData.name = tagName;
                    tagData.startI = tagI;

                    for (let d of data) {
                        let [key, value] = d.split('=');
                        tagData.arguments[key] = value.slice(1, -1);
                    }
                }
            } else {
                tagData.arguments.textContent = tag.raw;
            }

            tagI++;
        }

        return tagDatas;
    }

    /**
 * @param {[TagData]} tagDatas 
 * @returns {[HTMLElement]}
 */
    _formatAsHtmlElements(tagDatas) {
        /** @type {[HTMLElement]} */
        let HTMLElements = [];

        for(let tagData of tagDatas){
            let HTMLElement = document.createElement(tagData.name);
            for(let [key, value] of Object.entries(tagData.arguments)){
                HTMLElement[key] = value;
            }
            HTMLElements.push(HTMLElement);
        }

        return HTMLElements;
    }
}

let htmlReader = new HTMLReader();
htmlReader.ReadHTML();

/** 
 * @typedef {{ 
*  raw: string, 
*  isTag: boolean, 
*  isCloseTag: boolean, 
*  isTextContent: boolean 
* }} Tag
*/

/**
* @typedef {{
*  name: keyof HTMLElementTagNameMap,
*  arguments: {[key: string]: string},
* }} TagDataExport
*/

/**
* @typedef {{
*  name: string,
*  startI: number,
*  endI: number,
*  arguments: {[key: string]: string}
* }} TagData
*/
