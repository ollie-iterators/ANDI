//==========================================//
//mANDI: possible links ANDI                //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var mANDIVersionNumber = "8.2.1";

//create mANDI instance
var mANDI = new AndiModule(mANDIVersionNumber,"m");

andiBar.cleanup(testPage, element);

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element)
        $(element).removeClass("mANDI508-ambiguous");
};

//This function will analyze the test page for link related markup relating to accessibility
mANDI.analyze = function(objectClass){
    //Loop through every visible element and run tests
    $(TestPageData.allElements).each(function(){
        //Analyze elements that might be links
        if ($(this).is("a")) {
            var href = $(this).attr("href");
            if(typeof href === "undefined" && !$(this).attr("tabindex")) {
                andiData = new AndiData(this);
                isLinkKeyboardAccessible(undefined, this);
                objectClass.list.push(new PossibleLink([this], objectClass.list.length + 1, "", "", ""));
                objectClass.elementNums[0] += 1;
                objectClass.elementStrings[0] = "possible links";
                AndiData.attachDataToElement(this);
                //Don't allow element to appear in next/prev flow or hover. Also remove highlight.
                $(this).addClass("ANDI508-exclude-from-inspection").removeClass("ANDI508-highlight");
            }
        }
    });

    //Detect disabled links or buttons
    andiCheck.areThereDisabledElements("links");

    //This function returns true if the link is keyboard accessible
    function isLinkKeyboardAccessible(href, element){
        if(typeof href === "undefined" && !$(element).attr("tabindex")){
            //There is no href and no tabindex
            var name = $(element).attr("name");
            var id = element.id;

            if(element.onclick !== null || $._data(element, "events").click !== undefined){
                //Link is clickable but not keyboard accessible
                andiAlerter.throwAlert(alert_0164);
            }
            //No click event could be detected
            else if(!id && !name){//Link doesn't have id or name
                andiAlerter.throwAlert(alert_0128);
            }
            else{//Link has id or name
                //Determine if the link is an anchor for another link
                var isDefinitelyAnAnchor = false;
                var referencingHref = "";

                //Look through all hrefs to see if any is referencing this element's id or name
                $("#ANDI508-testPage a[href]").each(function(){
                    referencingHref = $(this).attr("href");
                    if(referencingHref.charAt(0) === "#"){
                        if(referencingHref.slice(1) === id || referencingHref.slice(1) === name){
                            isDefinitelyAnAnchor = true;
                            return false; //break out of loop
                        }
                    }
                });
                if(!isDefinitelyAnAnchor){
                    if(element.onclick === null && $._data(element, "events").click === undefined)
                        andiAlerter.throwAlert(alert_0129);
                    else //Link is clickable but not keyboard accessible
                        andiAlerter.throwAlert(alert_0164);
                }
                else if(name){ //name is deprecated
                    andiAlerter.throwAlert(alert_007B, [name]);
                }
                else{
                    andiAlerter.throwAlert(alert_012A); //definitely an anchor, but not focusable
                }
            }
            return false; //not keyboard accessible
        }
        return true;
    }
};

var showStartUpSummaryText = "Discover accessibility markup for <span class='ANDI508-module-name-l'>links</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every link.";
//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"), "viewList");

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData, ["type"]);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This object class is used to store data about each link. Object instances will be placed into an array.
function PossibleLink(elementList, index, nameDescription, alerts, rowClass){
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the links on the page
function PossibleLinks(){
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
    this.ambiguousIndex = 0;
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Links";
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

mANDI.links = new PossibleLinks();
mANDI.tableInfo = new TableInfo();

mANDI.links = andiBar.createObjectValues(mANDI.links, 1);

mANDI.analyze(mANDI.links);
andiBar.results(mANDI.links, mANDI.tableInfo, showStartUpSummaryText);

}//end init
