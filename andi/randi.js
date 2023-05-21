//==========================================//
//rANDI: landmarks ANDI                     //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var rANDIVersionNumber = "4.3.0";

//create rANDI instance
var rANDI = new AndiModule(rANDIVersionNumber,"r");

//This function will analyze the test page for graphics/image related markup relating to accessibility
rANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["banner","complementary","contentinfo","form","main","navigation","search","region"],"main,header,footer,nav,form,aside")){
            //Add to the landmarks array
            objectClass.list.push(new Landmark([this], objectClass.list.length + 1, "", "", ""));

            andiData = new AndiData(this);

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            AndiData.attachDataToElement(this);
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "landmarks";
        }

        //For all elements on the page
        if($.trim($(this).attr("role")))
            objectClass.elementNums[2] += 1;
            objectClass.elementStrings[2] = "elements with role attributes";
        if($.trim($(this).prop("lang")))
            objectClass.elementNums[1] += 1;
            objectClass.elementStrings[1] = "elements with lang attributes";
    });
};

var showStartUpSummaryText = "Landmark structure found.<br />Ensure that each <span class='ANDI508-module-name-s'>landmark</span> is applied appropriately to the corresponding section of the page.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
rANDI.results = function(){

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
    $("#ANDI508-module-actions button.rANDI508-mode").attr("aria-selected","false");
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

//This object class is used to store data about each landmark. Object instances will be placed into an array.
function Landmark(elementList, index, nameDescription, alert, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alert           = alert;
    this.columnValues    = [elementList, index, nameDescription, alert];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the landmarks on the page
function Landmarks() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["element", "index", "nameDescription"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableModuleName = "rANDI";
    this.tableMode       = "Landmarks";
    this.cssProperties   = [];
    this.buttonTextList  = ["Reading Order", "Role Attributes", "Lang Attributes"];
    this.tabsTextList    = [];
}

rANDI.landmarks = new Landmarks();
rANDI.tableInfo = new TableInfo();

rANDI.landmarks = andiBar.createObjectValues(rANDI.landmarks, 3);

rANDI.analyze(rANDI.landmarks);
andiBar.results(rANDI.landmarks, rANDI.tableInfo, [], showStartUpSummaryText);

}//end init
