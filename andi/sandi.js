//==========================================//
//sANDI: live regions ANDI                  //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var sANDIVersionNumber = "4.3.0";

//create sANDI instance
var sANDI = new AndiModule(sANDIVersionNumber,"s");

//This function will analyze the test page for graphics/image related markup relating to accessibility
sANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["alert","status","log","marquee","timer"],"[aria-live=polite],[aria-live=assertive]")){
            //Add to the live regions array
            objectClass.list.push(new LiveRegion([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "live regions";

            andiData = new AndiData(this);

            if($(this).isContainerElement()){
                var innerText = andiUtility.getVisibleInnerText(this);
                if(innerText){
                    //For live regions, screen readers only use the innerText
                    //override the accName to just the innerText
                    andiData.accName = "<span class='ANDI508-display-innerText'>"+innerText+"</span>";
                }
                else{//no visible innerText
                    andiAlerter.throwAlert(alert_0133);
                    andiData.accName = "";
                }
                //accDesc should not appear in output
                delete andiData.accDesc;
            }
            else//not a container element
                andiAlerter.throwAlert(alert_0184);
            if($(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length)
                andiAlerter.throwAlert(alert_0182);
            AndiData.attachDataToElement(this);
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

var showStartUpSummaryText = "<span class='ANDI508-module-name-s'>Live regions</span> found.<br />Discover the Output of the <span class='ANDI508-module-name-s'>live regions</span> by hovering over the highlighted areas or using the next/previous buttons. For updated Output, refresh ANDI whenever the Live Region changes.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
sANDI.results = function(){

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
    $("#ANDI508-module-actions button.sANDI508-mode").attr("aria-selected","false");
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if($(element).hasClass("ANDI508-element")){
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");

        var addOnProps = AndiData.getAddOnProps(element, elementData,
            [
                getDefault_ariaLive(element, elementData),
                getDefault_ariaAtomic(element, elementData),
                "aria-busy",
                "aria-relevant"
            ]);

        andiBar.displayTable(elementData, element, addOnProps);

        //Copy from the AC table
        var innerText = $("#ANDI508-accessibleComponentsTable td.ANDI508-display-innerText").first().html();
        if(innerText){
            elementData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
        }

        andiBar.displayOutput(elementData, element, addOnProps);
    }

    //This function assumes the default values of aria-live based on the element's role as defined by spec
    function getDefault_ariaLive(element, elementData){
        var val = $.trim($(element).attr("aria-live"));
        if(!val){
            if(elementData.role === "alert")
                val = "assertive";
            else if(elementData.role === "log" || elementData.role === "status")
                val = "polite";
            else if(elementData.role === "marquee" || elementData.role === "timer")
                val = "off";
            else return; //no default
        }
        return ["aria-live", val];
    }

    //This function assumes the default values of aria-atomic based on the element's role as defined by spec
    function getDefault_ariaAtomic(element, elementData){
        var val = $.trim($(element).attr("aria-atomic"));
        if(!val){
            if(elementData.role === "alert" || elementData.role === "status")
                val = "true";
            else if(elementData.role === "log" || elementData.role === "marquee" || elementData.role === "timer")
                val = "false";
            else return; //no default
        }
        return ["aria-atomic", val];
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

//This object class is used to store data about each live region. Object instances will be placed into an array.
function LiveRegion(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the live regions on the page
function LiveRegions() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["element", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableModuleName = "sANDI";
    this.tableMode       = "Live Regions";
    this.cssProperties   = [];
    this.buttonTextList  = ["Reading Order", "Role Attributes", "Lang Attributes"];
    this.tabsTextList    = [];
}

sANDI.liveRegions = new LiveRegions();
sANDI.tableInfo = new TableInfo();

sANDI.liveRegions = andiBar.createObjectValues(sANDI.liveRegions, 3);

sANDI.analyze(sANDI.liveRegions);
andiBar.results(sANDI.liveRegions, sANDI.tableInfo, [], showStartUpSummaryText);

}//end init
