//==========================================//
//bANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var bANDIVersionNumber = "4.3.1";

//create bANDI instance
var bANDI = new AndiModule(bANDIVersionNumber,"b");

AndiModule.cleanup = function(testPage, element){
    if (element) {
        var elementAttrs = $(element).getAttributeNames();
        var attributesToRemove = "";
        for (var e = 0; e < elementAttrs.length; e += 1) {
            if (elementAttrs[e].includes("data-andi508-")) {
                if (attributesToRemove == "") {
                    attributesToRemove = elementAttrs[e];
                } else {
                    attributesToRemove += " " + elementAttrs[e];
                }
            }
        }
        $(element).removeAttr(attributesToRemove);
    }
};

//This function will analyze the test page for graphics/image related markup relating to accessibility
bANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).is(":focusable,canvas")){
            andiData = new AndiData(this);

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            objectClass.list.push(new Attribute([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "list elements";
            AndiData.attachDataToElement(this);
        }

        //For all elements on the page

        if ($(this).is("label")) {
            objectClass.elementNums[2] += 1;
            objectClass.elementStrings[2] = "label tags"
        }

        attributesToFind = ["title", "role", "lang"];
        for (var a = 0; a < attributesToFind.length; a++) {
            var attributeValue = $.trim($(this).attr(attributesToFind[a]));
            if (attributeValue) {
                objectClass.elementNums[a] += 1;
                objectClass.elementStrings[a] = "elements with " + attributesToFind[a] + "attributes";
            }
        }
    });
};

var showStartUpSummaryText = "List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (ol, ul, li, dl, dd, dt, role=list, role=listitem) are appropriately applied.";
//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"), "viewList");

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function will overlay the reading order sequence.
AndiOverlay.prototype.overlayReadingOrder = function(){
    //Elements that should be excluded from the scan, hidden elements will automatically be filtered out
    var exclusions = "option,script,style,noscript";
    //Elements that should be included in the scan even if they don't have innerText
    var inclusions = "select,input,textarea";

    var readingSequence = 0;
    var overlayObject;

    traverseReadingOrder(document.getElementById("ANDI508-testPage"));

    //This recursive function traverses the dom tree and inserts the reading order overlay
    //It distinguishes between element nodes and text nodes
    //It will check for aria-hidden=true (with inheritance)
    function traverseReadingOrder(element, ariaHidden){

        //Check for aria-hidden=true
        ariaHidden = (ariaHidden || $(element).attr("aria-hidden") === "true") ? true : false;

        for(var z=0; z<element.childNodes.length; z++){

            //if child is an element object that is visible
            if(element.childNodes[z].nodeType === 1){
                if(!$(element.childNodes[z]).is(exclusions) && $(element.childNodes[z]).is(":shown")){
                    if($(element.childNodes[z]).is(inclusions)){//no need to look at this element's childNodes
                        insertReadingOrder(ariaHidden, element.childNodes[z]);
                        z++;//because a new node was inserted, the indexes changed
                    }
                    else{//recursion here:
                        traverseReadingOrder(element.childNodes[z], ariaHidden);
                    }
                }
            }
            //else if child is a text node
            else if(element.childNodes[z].nodeType === 3){
                if($.trim(element.childNodes[z].nodeValue) !== ""){
                    //Found some text
                    insertReadingOrder(ariaHidden, element.childNodes[z]);
                    z++;//because a new node was inserted, the indexes changed
                }
            }
        }

        //this function inserts the reading order overlay
        //if it's hidden using aria-hidden it will insert an alert overlay
        function insertReadingOrder(ariaHidden, node){
            if(ariaHidden){
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-readingOrder", "X", "hidden from screen reader using aria-hidden=true");
            }
            else{
                readingSequence++;
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-readingOrder", readingSequence);
            }
            andiOverlay.insertAssociatedOverlay(node, overlayObject);
        }
    }
};

bANDI.results = function(){

    var moreDetails = "<button id='ANDI508-pageTitle-button'>page title</button>"+
        "<button id='ANDI508-pageLanguage-button'>page language</button>";

    var moduleActionButtons = "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

    $("#ANDI508-module-actions").html(moduleActionButtons);

    //Define the page title button
    $("#ANDI508-pageTitle-button").click(function(){
        andiOverlay.overlayButton_on("overlay",$(this));
        if(document.title)
            alert("The page title is: "+document.title);
        else
            alert("There is no page title.");
        andiOverlay.overlayButton_off("overlay",$(this));
    });

    //Define the page language button
    $("#ANDI508-pageLanguage-button").click(function(){
        andiOverlay.overlayButton_on("overlay",$(this));
        //get the lang attribute from the HTML element
        var htmlLangAttribute = $.trim($("html").first().prop("lang"));
        //pop up the lang value of the HTML element
        if(htmlLangAttribute)
            alert("The <html> element has a lang attribute value of: "+htmlLangAttribute+".");
        else
            alert("The <html> element does not have a lang attribute.");
        andiOverlay.overlayButton_off("overlay",$(this));
    });

    //Deselect all mode buttons
    $("#ANDI508-module-actions button.bANDI508-mode").attr("aria-selected","false");
};

//This object class is used to store data about each list. Object instances will be placed into an array.
function Attribute(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the certain headers on the page
function Attributes() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Attributes";
    this.buttonTextList = ["Reading Order", "Label Tags", "Title Attributes", "Role Attributes", "Lang Attributes"];
    this.tabsTextList   = [];
}

bANDI.attributes = new Attributes();
bANDI.tableInfo = new TableInfo();

bANDI.attributes = andiBar.createObjectValues(bANDI.attributes, 2);

bANDI.analyze(bANDI.attributes);
bANDI.results(); // TODO: Make the "Reading Order", "Role Attributes" and "Lang Attributes" buttons work
andiBar.results(bANDI.attributes, bANDI.tableInfo, showStartUpSummaryText);

}//end init
