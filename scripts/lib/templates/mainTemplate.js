import { createSubDomFromHtml } from "../createSubDomFromHtml.js";

export const mainTemplate = `
<div>
    <div className="setup-section">
        <div className="panels">
            <div id="html-template">
                <h2>Write HTML Template</h2>
                <textarea placeholder="Write your HTML template here...\nWrite 'className' instead of 'class' to set a class.\nWrite a class 'read-only' instead of using HTML 'readonly' (not implemented yet). Write { { keyInData } } (no spaces to active as replacementKey) to replace it with dynamic data from 'data' in 'js-functionality'."></textarea>
            </div>
            <div id="css-rules">
                <h2>Set CSS Rules</h2>
                <ul>
                    <li className="css-rule">
                        <input className="key" placeholder="CSS Key"/>
                        <input className="value" placeholder="CSS Value" value=""/>
                        <input className="addRule" type="button" value="+"/>
                    </li>
                </ul>
            </div>
            <div id="js-functionality">
                <h2>Create JS Functionality</h2>
                <textarea placeholder="Write your JS functions here...\nEnter all your functionality in the variable 'data', everything outside of 'data' scope will be ignored.\ndata = {\n  [key: string]: value: number | string | boolean | function | object\n}"></textarea>
            </div>
        </div>
        <button id="generate" onclick="{{runGenerator}}">Generate HTML</button>
    </div>
    <div className="generated-section">
        <div id="code">
            <h2>HTML</h2>
            <textarea className="read-only" placeholder="Here will be the generated code placed."></textarea>
            <div className="actions">
                <button onclick="{{copyToClipboard}}">Copy To Clipboard</button>
                <button onclick="{{createAnotherTemplate}}">Create Another Template</button>
            </div>
        </div>
        <div id="preview">
            <h2>Preview</h2>
            <div className="preview-container"></div>
        </div>
    </div>
    <script id="logic"></script>
</div>
`

/** @type {HTMLTextAreaElement} */
let jsFunc = null;
/** @type {HTMLScriptElement}  */
let script = null;

export function runGenerator() {
    // alert("running...");

    //<div>divBody<button style="background-color: red;">btnText</button></div>

    // setup CSS Rules here

    // setup JS Functionality here

    if(!jsFunc){
        jsFunc = document.querySelector('#js-functionality > textarea');
        // let preview = document.querySelector('#preview > div');
    
        script = document.createElement('script');

        script.textContent = jsFunc.value;
        document.body.append(script);
    
        jsFunc.addEventListener('change', () => {
            script.textContent = jsFunc.value;
            document.body.removeChild(script);
            document.body.append(script);
        })
    } else {
        script.textContent = jsFunc.value;
        document.body.removeChild(script);
        document.body.append(script);
    }



    // generate result
    
    let generatedSubDom = createSubDomFromHtml(document.getElementById("html-template").querySelector('textarea').value, { runGenerator, ...globalThis });
    
    document.getElementById('code').querySelector('textarea').value = generatedSubDom.outerHTML;
    
    let previewContainer = document.getElementById('preview').querySelector('.preview-container');
    while (previewContainer.hasChildNodes()) {
        previewContainer.removeChild(previewContainer.firstChild);
    }
    previewContainer.append(generatedSubDom);
    updatePreviewStyles();
}

export function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('code').querySelector('textarea').value);
}

export function createAnotherTemplate() {
    document.getElementById("html-template").querySelector('textarea').value = '';
    document.getElementById("js-functionality").querySelector('textarea').value = '';
    let cssRules = document.getElementById('css-rules').querySelector('ul');
    while (cssRules.children.length > 1) {
        cssRules.removeChild(cssRules.firstChild);
    }
    let cssRuleFirst = cssRules.firstChild;
    cssRuleFirst.querySelector('.key').value = '';
    cssRuleFirst.querySelector('.value').value = '';
    let addRuleBtn = cssRuleFirst.querySelector('.addRule');
    addRuleBtn.value = '+';

    document.getElementById('code').querySelector('textarea').value = '';
    debugger
    let previewContainer = document.getElementById('preview').querySelector('.preview-container');
    while (previewContainer.hasChildNodes()) {
        previewContainer.removeChild(previewContainer.firstChild);
    }

}

function readPreviewStyles() {

}

/**
 * 
 * @param {string} cssSelector 
 * @param {string} cssValue 
 */
function updatePreviewStyles_old(cssSelector, cssValue) {
    if (!cssSelector) {
        return;
    }

    let previewContainer = document.getElementById('preview').querySelector('.preview-container');

    // FIND ME FIX ME DELETE ME
    // don't depend on cssSelector or cssValue
    // remember styles
    // everytime do a checkup 
    // any non matching should be rendered/rerendered if changed

    if (!cssValue) {
        previewContainer.querySelectorAll(cssSelector).forEach(x => x.style[key] = undefined);

        return;
    }

    let values = cssValue.split(';');
    values = values.map(x => x.split(':').map(x => x.trim()));

    console.warn(cssSelector, cssValue, values);
    for (let [key, value] of values) {
        key = key.split('-');
        key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);

        previewContainer.querySelectorAll(cssSelector).forEach(x => x.style[key] = value);
    }
}

/** @type {HTMLUListElement} */
let cssRulesElement = null;
/** @typedef {[selector: string, keyValuePairs: string]} cssRule*/
/** @type {[cssRule]} */
let cssRules = [];
/** @type {HTMLDivElement} */
let previewContainer = null;

function updatePreviewStyles() {
    if(cssRulesElement === null){
        previewContainer = document.getElementById('preview').querySelector('.preview-container');
        cssRulesElement = document.getElementById('css-rules').querySelector('ul');

        cssRulesElement.addEventListener('change', (e) => {
            if (e.target.type !== 'text') {
                return;
            }

            let ruleActionBtnIndex = 2;
            let ruleActionBtn = e.target.parentElement.children[ruleActionBtnIndex];
            if(!(ruleActionBtn.type === "button" && ruleActionBtn.className === "removeRule")){
                return;
            }

            let cssRuleIndex = findElementIndex(e.target.parentElement, e.target.parentElement.parentElement);
            let cssRule = cssRules[cssRuleIndex];

            if(e.target.className === 'key'){
                cssRule[0] = e.target.value;
            } else if(e.target.className === 'value'){
                cssRule[1] = e.target.value;
            }

            updatePreviewAddCss(cssRule);

            debugger
            console.error('changed');
        })

        cssRulesElement.addEventListener('click', (e) => {
            e.preventDefault();
    
            if (e.target.type !== 'button') {
                return;
            }

            let ruleIndex = findElementIndex(e.target.parentElement, cssRulesElement);

            debugger
            if(e.target.className === 'addRule'){
                createCssRule();
                let cssRule = cssRules[ruleIndex];
                if(cssRule){
                    console.error("cssRule already has values: " + cssRule)
                }
                cssRule = cssRules[ruleIndex] = [e.target.parentElement.children[0].value || undefined, e.target.parentElement.children[1].value || undefined];
                updatePreviewAddCss(cssRule);
            } else if(e.target.className === 'removeRule'){
                if(ruleIndex === -1){
                    return;
                }
                debugger

                let [cssRule] = cssRules.splice(ruleIndex, 1);
                e.target.parentElement.remove();

                updatePreviewRemoveCss(cssRule);
            }




            debugger
            console.dir(cssRulesElement.children);
            console.error(e.target.parentElement)
        })
    }

    function updatePreviewRemoveCss(cssRule){
        if(!cssRule){
            return;
        }

        let values = cssRule[1].split(';').filter(x => x);
        values = values.map(x => x.split(':').map(x => x.trim()));
    
        console.warn(cssRule[0], cssRules[1], values);
        for (let [key, value] of values) {
            key = key.split('-');
            key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);
    
            // FIND ME FIX ME PATCH ME UPDATE ME
            // replace value should default to 'html code' section
            // if there is already style explicitly written default to it instead of empty string
            debugger
            previewContainer.querySelectorAll(cssRule[0]).forEach(x => x.style[key] = x.style[key].replace(value, ''));
        }
    }

    function updatePreviewAddCss(cssRule){
        if(!cssRule){
            return;
        }

        let values = cssRule[1].split(';').filter(x => x);
        values = values.map(x => x.split(':').map(x => x.trim()));
    
        console.warn(cssRule[0], cssRules[1], values);
        for (let [key, value] of values) {
            key = key.split('-');
            key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);
    
            // FIND ME FIX ME PATCH ME UPDATE ME
            // replace value should default to 'html code' section
            // if there is already style explicitly written default to it instead of empty string
            debugger
            previewContainer.querySelectorAll(cssRule[0]).forEach(x => { if(!x.style[key]){ x.style[key] = value}});
        }
    }

    /** @return {-1 | elementIndexAsPositiveNumber} */
    function findElementIndex(childElement, parentElement){
        let elementIndex = -1;
        let indexCounter = -1;
        while(++indexCounter < parentElement.children.length){
            if(parentElement.children[indexCounter] === childElement){
                elementIndex = indexCounter;
                break;
            }
        }

        return elementIndex;
    }

    function createCssRule() {
        convertAddToRemoveRuleBtn(cssRulesElement.lastChild.querySelector('.addRule'));

        cssRulesElement.append(createEmptyCSSRule());

        function convertAddToRemoveRuleBtn(ruleAddBtn) {
            ruleAddBtn.value = '-';
            ruleAddBtn.className = 'removeRule';
        }

        function createEmptyCSSRule(){
            return createSubDomFromHtml(`
                <li className="css-rule">
                    <input className="key" placeholder="CSS Key"/>
                    <input className="value" placeholder="CSS Value" value=""/>
                    <input className="addRule" type="button" value="+"/>
                </li>
            `
        )
        }

    }

    function removeCssRule() {

    }

}

