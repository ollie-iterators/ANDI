//==========================================//
//qANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var qANDIVersionNumber = "4.3.0";

//create qANDI instance
var qANDI = new AndiModule(qANDIVersionNumber,"r");

//This function will analyze the test page for graphics/image related markup relating to accessibility
qANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["listitem","list"],"ol,ul,li,dl,dd,dt")){
            //Add to the lists array
            objectClass.list.push(new List([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "list elements";

            if($(this).isSemantically(["list"],"ol,ul,dl")){
                if ($(this).is("ul")) {
                    objectClass.elementNums[2] += 1;
                    objectClass.elementNums[2] = "ul elements";
                } else if ($(this).is("ol")) {
                    objectClass.elementNums[1] += 1;
                    objectClass.elementNums[1] = "ol elements";
                } else if ($(this).is("dl")) {
                    objectClass.elementNums[4] += 1;
                    objectClass.elementNums[4] = "dl elements";
                } else {
                    objectClass.elementNums[7] += 1;
                    objectClass.elementNums[7] = "list role elements";
                }
                objectClass.elementNums[9] += 1;
                objectClass.elementNums[9] = "lists found";
            }

            andiData = new AndiData(this);

            //Is the listitem contained by an appropriate list container?
            if($(this).is("[role=listitem]")){
                objectClass.elementNums[8] += 1;
                objectClass.elementStrings[8] = "listitem role elements";
                if(!$(this).closest("[role=list]").length)
                    andiAlerter.throwAlert(alert_0079, ["[role=listitem]","[role=list]"]);
            }
            else if($(this).is("li")){
                objectClass.elementNums[3] += 1;
                objectClass.elementNums[3] = "li elements";
                var listContainer = $(this).closest("ol,ul");
                if(!$(listContainer).length){
                    andiAlerter.throwAlert(alert_0079, ["&lt;li&gt;","&lt;ol&gt; or &lt;ul&gt;"]);
                }
                else{ //check if listContainer is still semantically a list
                    var listContainer_role = $(listContainer).getValidRole();
                    if(listContainer_role && listContainer_role !== "list")
                        andiAlerter.throwAlert(alert_0194, [listContainer_role]);
                }
            }
            else if($(this).is("dd,dt") && !$(this).closest("dl").length){//Is the dl,dt contained by a dl?
                if ($(this).is("dd")) {
                    objectClass.elementNums[5] += 1;
                    objectClass.elementNums[6] = "dd elements";
                } else if ($(this).is("dt")) {
                    objectClass.elementNums[6] += 1;
                    objectClass.elementStrings[6] = "dt elements";
                }

                andiAlerter.throwAlert(alert_007A);
            }

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            AndiData.attachDataToElement(this);
        }

        //For all elements on the page
        if($.trim($(this).attr("role")))
            objectClass.elementNums[11] += 1;
            objectClass.elementStrings[11] = "elements with role attributes";
        if($.trim($(this).prop("lang")))
            objectClass.elementNums[10] += 1;
            objectClass.elementStrings[10] = "elements with lang attributes";
    });
};

var showStartUpSummaryText = "List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (ol, ul, li, dl, dd, dt, role=list, role=listitem) are appropriately applied.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
qANDI.results = function(){

    var moreDetails = "<button id='ANDI508-pageTitle-button'>page title</button>"+
        "<button id='ANDI508-pageLanguage-button'>page language</button>";

    var moduleActionButtons = "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

    $("#ANDI508-module-actions").html(moduleActionButtons);

    andiBar.initializeModuleActionGroups();

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
    $("#ANDI508-module-actions button.qANDI508-mode").attr("aria-selected","false");
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if($(element).hasClass("ANDI508-element")){
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

//This object class is used to store data about each list. Object instances will be placed into an array.
function List(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the certain headers on the page
function Lists() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["element", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableModuleName = "qANDI";
    this.tableMode       = "Lists";
    this.cssProperties   = [];
    this.buttonTextList  = ["Reading Order", "Role Attributes", "Lang Attributes"];
    this.tabsTextList    = [];
}

qANDI.lists = new Lists();
qANDI.tableInfo = new TableInfo();

qANDI.lists = andiBar.createObjectValues(qANDI.lists, 12);

qANDI.analyze(qANDI.lists);
andiBar.results(qANDI.lists, qANDI.tableInfo, [], showStartUpSummaryText);

}//end init
