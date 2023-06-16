//==========================================//
//hANDI: hidden content ANDI 				//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var handiVersionNumber = "4.0.3";

//TODO: report whether an element should be visible or invisible to a screen reader

//create hANDI instance
var hANDI = new AndiModule(handiVersionNumber,"h");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.hoverability = function(event){
    if(!event.shiftKey && $(this).hasClass("ANDI508-forceReveal")) //check for holding shift key
        AndiModule.inspect(this);
};

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element){
        $(element).removeAttr("data-andi508-hidingtechniques").removeClass("ANDI508-forceReveal ANDI508-forceReveal-Display ANDI508-forceReveal-Visibility ANDI508-forceReveal-Position ANDI508-forceReveal-Opacity ANDI508-forceReveal-Overflow ANDI508-forceReveal-FontSize ANDI508-forceReveal-TextIndent");
    }
    else
        $(testPage).find(".hANDI508-hasHiddenCssContent").removeClass("hANDI508-hasHiddenCssContent");
};

AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"), "viewList");

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        var hidingTechniques = $(element).attr("data-andi508-hidingtechniques");
        $("#ANDI508-additionalElementDetails").html("");
        if(hidingTechniques)
            $("#ANDI508-additionalElementDetails").append(hidingTechniques);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

var prevNextBtnsVisible = false;

if(!prevNextBtnsVisible){
    andiBar.hideElementControls();
}

//This function returns true if the element contains elements that might need accessibility testing, false if not.
hANDI.containsTestableContent = function(element){
    var needsTesting = true;
    var isContainerElement = $(element).isContainerElement();
    var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";

    //Does this element contain content that needs testing
    if(isContainerElement &&
        ($.trim($(element).html()) === "" ||
            ($.trim($(element).text()) === "" &&
                $(element).find(elementsNeedingTesting).length === 0 )))
    {
        needsTesting = false; //this element doesn't need testing
    }
    //Is this element one that needs testing?
    else if(!isContainerElement && $(element).is(elementsNeedingTesting)){
        needsTesting = false; //this element doesn't need testing
    }

    return needsTesting;
};

//This function will analyze the test page for elements hidden using CSS
hANDI.analyze = function(objectClass){
    var elementCss;
    $(TestPageData.allElements).not("area,base,basefont,datalist,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function(){
        elementCss = "";

        if(hANDI.containsTestableContent(this)){
            if($(this).css("display")=="none"){
                //element display is none
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "display:none"
                $(this).addClass("ANDI508-forceReveal-Display");
                elementCss += "display:none; ";
            }
            if($(this).css("visibility")=="hidden"){
                //element visibility is hidden
                objectClass.elementNums[2] += 1;
                objectClass.elementStrings[2] = "visibility:hidden"
                $(this).addClass("ANDI508-forceReveal-Visibility");
                elementCss += "visibility:hidden; ";
            }
            if($(this).css("position")=="absolute" && ($(this).offset().left < 0 || $(this).offset().top < 0)){
                //element is positioned offscreen
                objectClass.elementNums[3] += 1;
                objectClass.elementStrings[3] = "position:absolute"
                $(this).addClass("ANDI508-forceReveal-Position");
                elementCss += "position:absolute; ";
            }
            if($(this).css("opacity")=="0"){
                //element opacity is zero
                objectClass.elementNums[4] += 1;
                objectClass.elementStrings[4] = "opacity:0"
                $(this).addClass("ANDI508-forceReveal-Opacity");
                elementCss += "opacity:0; ";
            }
            //if element has innerText
            if($(this).isContainerElement() && $.trim($(this).text())){
                if($(this).css("overflow")=="hidden" &&
                    (parseInt($(this).css("height"))<=1 || parseInt($(this).css("width"))<=1))
                {
                    //element has overflow hidden and a small height or width
                    objectClass.elementNums[5] += 1;
                    objectClass.elementStrings[5] = "overflow:hidden"
                    $(this).addClass("ANDI508-forceReveal-Overflow");
                    elementCss += "overflow:hidden; ";
                }
                if(parseInt($(this).css("font-size")) === 0){
                    //element font-size is 0
                    objectClass.elementNums[6] += 1;
                    objectClass.elementStrings[6] = "font-size:0"
                    $(this).addClass("ANDI508-forceReveal-FontSize");
                    elementCss += "font-size:0; ";
                }
            }
            if(parseInt($(this).css("text-indent")) < -998){ //-998 chosen because a common technique is to position at -999 to make text offscreen
                //element has a text-indent that makes it off screen
                objectClass.elementNums[7] += 1;
                objectClass.elementStrings[7] = "text-indent"
                $(this).addClass("ANDI508-forceReveal-TextIndent");
                elementCss += "text-indent:"+$(this).css("text-indent")+"; ";
            }
        }

        if(elementCss !== ""){
            //create data-andi508-hidingtechniques
            if(elementCss !== ""){
                elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
                $(this).attr("data-andi508-hidingtechniques", elementCss);
            }

            andiData = new AndiData(this, true);
            objectClass.list.push(new HiddenElement([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "hidden elements";
            AndiData.attachDataToElement(this);
        }
    });

    hANDI.detectCssInjectedContent(objectClass);

    if($("#ANDI508-testPage .hANDI508-hasHiddenCssContent").first().length)
        andiAlerter.throwAlert(alert_0220,alert_0220.message, 0);
};

//This function will detect content hidden using css :before :after content.
//Current screen readers will not read text injected using this method in some browsers.
hANDI.detectCssInjectedContent = function(objectClass){
    var before_content, before_style, after_content, after_style, hasHiddenCSSContent, cssDisplay;

    //Loop through every element on the page
    for(var x=0; x<TestPageData.allVisibleElements.length; x++){
        hasHiddenCSSContent = false; //reset to false
        cssDisplay = "";

        before_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":before");
        if(before_style){
            before_content = before_style.getPropertyValue("content");
            if(hasContent(before_content)){ //element has injected content using ::before
                if(isVisible(before_style)){ //pseudoElement is visible
                    hasHiddenCSSContent = true;
                    cssDisplay += before_content + " ";
                }
            }
        }

        after_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":after");
        if(after_style){
            after_content = after_style.getPropertyValue("content");
            if(hasContent(after_content)){ //element has injected content using ::after
                if(isVisible(after_style)){ //pseudoElement is visible
                    hasHiddenCSSContent = true;
                    cssDisplay += after_content;
                }
            }
        }

        if(hasHiddenCSSContent){
            objectClass.elementNums[8] += 1;
            objectClass.elementStrings[8] = "elements with CSS"
            $(TestPageData.allVisibleElements[x]).addClass("hANDI508-hasHiddenCssContent");
        }
    }

    //This function will return true if content exists
    function hasContent(content){
        if(content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"" && content !== "\" \""){//content is not empty
            return true;
        }
        return false;
    }

    //This function returns true if the style of an element is not hidden
    //TODO: Can this be replaced by getting the pseudo element and reusing :shown ?
    function isVisible(style){
        if(	style.getPropertyValue("visibility") === "hidden" ||
            style.getPropertyValue("display") === "none" ||
            ( style.getPropertyValue("height") === "0" && style.getPropertyValue("width") === "0" )
        ){
            return false;
        }
        return true;
    }
};

var showStartUpSummaryText = "Discover <span class='ANDI508-module-name-h'>hidden content</span> that should be tested for accessibility using other ANDI modules. Use the style toggle buttons to force the hidden content to be revealed. The revealed content will not remain revealed after changing modules. ";
showStartUpSummaryText += "Content injected with CSS may be invisible to a screen reader.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
hANDI.buildNewButton = function(){
    var moduleActionButtons = "<button id='ANDI508-ariaHiddenScan-button' aria-label='aria-hidden scan' aria-pressed='false'>aria-hidden scan</button>";

    $("#ANDI508-module-actions").append(moduleActionButtons);

    $("#ANDI508-ariaHiddenScan-button").click(function(){
        if($(this).attr("aria-pressed") === "false"){
            alert('aria-hidden="true" was found on ' + $("#ANDI508-testPage [aria-hidden]").length + ' elements');
            andiOverlay.overlayButton_on("overlay",$(this));
            $("#ANDI508-testPage").addClass("hANDI508-highlightAriaHidden");
            AndiModule.activeActionButtons.highlightAriaHidden = true;
        }
        else{
            $("#ANDI508-testPage").removeClass("hANDI508-highlightAriaHidden");
            andiOverlay.overlayButton_off("find",$(this));
            AndiModule.activeActionButtons.highlightAriaHidden = false;
        }
        andiResetter.resizeHeights();
        return false;
    });
};

//Previous Element Button override
$("#ANDI508-button-prevElement").off("click").click(function(){
    var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

    if(isNaN(index))//there is no active element, so focus on last force-revealed element
        andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").last().attr("data-andi508-index")));
    else{
        var prevElement;

        //Find the previous element with data-andi508-index
        //This will skip over elements that may have been removed from the DOM and are not force revealed
        for(var x=index; x>0; x--){
            prevElement = $("#ANDI508-testPage [data-andi508-index='"+(x - 1)+"']");
            if($(prevElement).length && $(prevElement).hasClass("ANDI508-forceReveal")){
                andiFocuser.focusByIndex(x - 1);
                break;
            }
        }
    }
});

//Next Element Button override
$("#ANDI508-button-nextElement").off("click").click(function(){
    //get the active element
    var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

    if(isNaN(index))//there is no active element, so focus on first force-revealed element
        andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").first().attr("data-andi508-index")));
    else{
        var nextElement;
        //Find the next element with data-andi508-index
        //This will skip over elements that may have been removed from the DOM and are not force revealed
        for(var x=index; x<testPageData.andiElementIndex; x++){
            nextElement = $("#ANDI508-testPage [data-andi508-index='"+(x + 1)+"']");
            if($(nextElement).length && $(nextElement).hasClass("ANDI508-forceReveal")){
                andiFocuser.focusByIndex(x + 1);
                break;
            }
        }
    }
});

//This object class is used to store data about each hidden element. Object instances will be placed into an array.
function HiddenElement(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the hidden elements on the page
function HiddenElements() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Hidden Elements";
    this.buttonTextList = ["Force Reveal All", "Force Reveal Display", "Force Reveal Visibility", "Force Reveal Position", "Force Reveal Overflow", "Force Reveal Font Size", "Force Reveal Text Indent", "Force Reveal Opacity", "Title Attributes", "Highlight CSS Content"];
    this.tabsTextList   = [];
}

hANDI.hiddenElements = new HiddenElements();
hANDI.tableInfo = new TableInfo();

hANDI.hiddenElements = andiBar.createObjectValues(hANDI.hiddenElements, 9);

hANDI.analyze(hANDI.hiddenElements);
andiBar.results(hANDI.hiddenElements, hANDI.tableInfo, showStartUpSummaryText);
hANDI.buildNewButton();

}//end init
