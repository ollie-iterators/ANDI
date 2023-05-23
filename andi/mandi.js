//==========================================//
//mANDI: possible links ANDI                //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var mANDIVersionNumber = "8.2.1";

//create mANDI instance
var mANDI = new AndiModule(mANDIVersionNumber,"m");

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
                objectClass.list.push(new Link([this], objectClass.list.length + 1, "", "", ""));
                mANDI.links.elementNums[0] += 1;
                mANDI.links.elementStrings[0] = "possible links";
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
    if($(element).hasClass("ANDI508-element")){

        //Highlight the row in the links list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"));

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData,
            [
                "rel",
                "download",
                "media",
                "target",
                "type"
            ]
        );

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function attaches the click,hover,focus events to the items in the view list
mANDI.viewList_attachEvents = function(){
    //Add focus click to each link (output) in the table
    $("#ANDI508-viewList-table td a[data-andi508-relatedindex]").each(function(){
        andiFocuser.addFocusClick($(this));
        var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + $(this).attr("data-andi508-relatedindex") + "]").first();
        andiLaser.createLaserTrigger($(this),$(relatedElement));
        $(this)
        .hover(function(){
            if(!event.shiftKey)
                AndiModule.inspect(relatedElement[0]);
        })
        .focus(function(){
            AndiModule.inspect(relatedElement[0]);
        });
    });

    //This will define the click logic for the table sorting.
    //Table sorting does not use aria-sort because .removeAttr("aria-sort") crashes in old IE
    $("#ANDI508-viewList-table th a").click(function(){
        var table = $(this).closest("table");
        $(table).find("th").find("i").html("")
            .end().find("a"); //remove all arrow

        var rows = $(table).find("tr:gt(0)").toArray().sort(sortCompare($(this).parent().index()));
        this.asc = !this.asc;
        if(!this.asc){
            rows = rows.reverse();
            $(this).attr("title","descending")
                .parent().find("i").html("&#9650;"); //up arrow
        }
        else{
            $(this).attr("title","ascending")
                .parent().find("i").html("&#9660;"); //down arrow
        }
        for(var i=0; i<rows.length; i++){
            $(table).append(rows[i]);
        }

        //Table Sort Functionality
        function sortCompare(index){
            return function(a, b){
                var valA = getCellValue(a, index);
                var valB = getCellValue(b, index);
                return !isNaN(valA) && !isNaN(valB) ? valA - valB : valA.localeCompare(valB);
            };
            function getCellValue(row, index){
                return $(row).children("td,th").eq(index).text();
            }
        }
    });

    //Define listLinks next button
    $("#mANDI508-viewList-button-next").click(function(){
        //Get class name based on selected tab
        var selectedTabClass = $("#mANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
        var focusGoesOnThisIndex;

        if(index == testPageData.andiElementIndex || isNaN(index)){
            //No link being inspected yet, get first element according to selected tab
            focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-andi508-index");
            andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to first
        }
        else{
            //Find the next element with class from selected tab and data-andi508-index
            //This will skip over elements that may have been removed from the DOM
            for(var x=index; x<testPageData.andiElementIndex; x++){
                //Get next element within set of selected tab type
                if($("#ANDI508-testPage ."+selectedTabClass+"[data-andi508-index='"+(x + 1)+"']").length){
                    focusGoesOnThisIndex = x + 1;
                    andiFocuser.focusByIndex(focusGoesOnThisIndex);
                    break;
                }
            }
        }

        //Highlight the row in the links list that associates with this element
        andiBar.viewList_rowHighlight(focusGoesOnThisIndex);
        $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function(){
            this.scrollIntoView();
        });

        return false;
    });

    //Define listLinks prev button
    $("#mANDI508-viewList-button-prev").click(function(){
        //Get class name based on selected tab
        var selectedTabClass = $("#mANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
        var firstElementInListIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-andi508-index");
        var focusGoesOnThisIndex;

        if(isNaN(index)){ //no active element yet
            //get first element according to selected tab
            andiFocuser.focusByIndex(firstElementInListIndex); //loop back to first
            focusGoesOnThisIndex = firstElementInListIndex;
        }
        else if(index == firstElementInListIndex){
            //Loop to last element in list
            focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).last().attr("data-andi508-index");
            andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to last
        }
        else{
            //Find the previous element with class from selected tab and data-andi508-index
            //This will skip over elements that may have been removed from the DOM
            for(var x=index; x>0; x--){
                //Get next element within set of selected tab type
                if($("#ANDI508-testPage ."+selectedTabClass+"[data-andi508-index='"+(x - 1)+"']").length){
                    focusGoesOnThisIndex = x - 1;
                    andiFocuser.focusByIndex(focusGoesOnThisIndex);
                    break;
                }
            }
        }

        //Highlight the row in the links list that associates with this element
        andiBar.viewList_rowHighlight(focusGoesOnThisIndex);
        $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function(){
            this.scrollIntoView();
        });

        return false;
    });
};

//This function attaches click events to the items specific to the Links view list
mANDI.viewList_attachEvents_links = function(){
    //Define next tab button
    $("#ANDI508-viewList-table button.mANDI508-nextTab").each(function(){
        $(this).click(function(){
            var allElementsInTestPage = $("#ANDI508-testPage *");
            var idRef = $(this).attr("data-andi508-relatedid");
            var anchorTargetElement = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
            var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
            for(var x=anchorTargetElementIndex; x<allElementsInTestPage.length; x++){
                if($(allElementsInTestPage).eq(x).is(":tabbable")){
                    $(allElementsInTestPage).eq(x).focus();
                    break;
                }
            }
        });
    });
};

//This function handles the selection of a tab.
mANDI.viewList_selectTab = function(tab){
    $("#mANDI508-viewList-tabs button").removeClass().attr("aria-selected","false");
    $(tab).addClass("ANDI508-tab-active").attr("aria-selected","true");
};

//This function returns true if the href is a link that fires a script
mANDI.isScriptedLink = function(href){
    if(typeof href == "string"){
        //broken up into three substrings so its not flagged in jslint
        return(href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
    }//else
    return false;
};

//This object class is used to store data about each link. Object instances will be placed into an array.
function Link(elementList, index, nameDescription, alerts, rowClass){
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the links on the page
function Links(){
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
    this.ambiguousIndex = 0;
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Links";
    this.cssProperties  = [];
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

mANDI.links = new Links();
mANDI.tableInfo = new TableInfo();

mANDI.links = andiBar.createObjectValues(mANDI.links, 1);

mANDI.analyze(mANDI.links);
andiBar.results(mANDI.links, mANDI.tableInfo, [], showStartUpSummaryText);

}//end init
