//==========================================//
//nANDI: buttons ANDI                       //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var nANDIVersionNumber = "8.2.1";

//create nANDI instance
var nANDI = new AndiModule(nANDIVersionNumber,"n");

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element)
        $(element).removeClass("nANDI508-ambiguous");
};

//Alert icons for the links list table
//Ignore the jslint warning about the "new" declaration. It is needed.
var alertIcons = new function(){//new is intentional
    this.danger_noAccessibleName = makeIcon("danger","No accessible name");
    this.warning_nonUnique = makeIcon("warning","Non-Unique: same name as another button");
    this.warning_tabOrder = makeIcon("warning","Element not in tab order");

    function makeIcon(alertLevel, titleText){
        //The sortPriority number allows alert icon sorting
        var sortPriority = "3"; //default to caution
        if(alertLevel=="warning")
            sortPriority = "2";
        else if(alertLevel=="danger")
            sortPriority = "1";
        return "<img src='"+icons_url+alertLevel+".png' alt='"+alertLevel+"' title='Accessibility Alert: "+titleText+"' /><i>"+sortPriority+" </i>";
    }
};

AndiModule.initActiveActionButtons({
    viewButtonsList:false,
    highlightNonUniqueButtons:false
});

nANDI.viewList_tableReady = false;

//This function will analyze the test page for link related markup relating to accessibility
nANDI.analyze = function(objectClass){

    //Variables used to build the links/buttons list array.
    var href, nameDescription, alerts, target, linkPurpose, accesskey, alertIcon, alertObject, relatedElement, nonUniqueIndex, ambiguousIndex;

    //Loop through every visible element and run tests
    $(TestPageData.allElements).each(function(){
        //ANALYZE BUTTONS
        if($(this).isSemantically(["button"],"button,:button,:submit,:reset,:image")){

            if(!andiCheck.isThisElementDisabled(this)){
                nANDI.buttons.count++;

                andiData = new AndiData(this);

                nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                alerts = "";
                alertIcon = "";
                alertObject = "";

                if(andiData.accesskey)
                    accesskey = andiData.accesskey;
                else
                    accesskey = "";

                if(nameDescription){
                    //Seach through Buttons Array for same name
                    nonUniqueIndex = scanForNonUniqueness(this, nameDescription);

                    //role=button
                    if(andiData.role==="button"){
                        isElementInTabOrder(this,"button");
                    }

                    if(!alerts)
                        //Add this for sorting purposes
                        alerts = "<i>4</i>";
                }
                else{
                    //No accessible name or description
                    alerts = alertIcons.danger_noAccessibleName;
                    nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                }

                andiCheck.commonFocusableElementChecks(andiData,$(this));
                nANDI.buttons.elementNums[0] += 1;
                nANDI.buttons.elementStrings[0] = "buttons";
                AndiData.attachDataToElement(this);

                //create Button object and add to array
                nANDI.buttons.list.push(new Button([this], objectClass.list.length + 1, ""));
            }
        }
    });

    //Detect disabled buttons
    andiCheck.areThereDisabledElements("buttons");

    //This function searches the button list for non-uniqueness.
    function scanForNonUniqueness(element, nameDescription){
        for(var y=0; y<nANDI.buttons.list.length; y++){
            if(nameDescription.toLowerCase() == nANDI.buttons.list[y].nameDescription.toLowerCase()){ //nameDescription matches

                alertIcon = alertIcons.warning_nonUnique;
                alertObject = alert_0200;

                //Throw the alert
                if(!nANDI.buttons.list[y].alerts.includes(alertIcon)){
                    //Throw alert on first instance only one time
                    andiAlerter.throwAlertOnOtherElement(nANDI.buttons.list[y].index,alertObject);
                    nANDI.buttons.list[y].alerts = alertIcon;
                }

                //Set the nonUniqueIndex
                var m; //will store the nonUniqueIndex for this match
                //Does the first instance already have a nonUniqueIndex?
                relatedElement = $(nANDI.buttons.list[y].element);
                if(nANDI.buttons.list[y].nonUniqueIndex){
                    //Yes. Copy the nonUniqueIndex from the first instance
                    m = nANDI.buttons.list[y].nonUniqueIndex;
                    nANDI.buttons.elementNums[1] += 1;
                    nANDI.buttons.elementStrings[1] = "non-unique buttons";
                }
                else{
                    //No. increment nonUniqueIndex and add it to the first instance.
                    nANDI.buttons.elementNums[1] = nANDI.buttons.elementNums[1] + 2;
                    nANDI.buttons.elementStrings[1] = "non-unique buttons";
                    nANDI.buttons.nonUniqueIndex++;
                    m = nANDI.buttons.nonUniqueIndex;
                    nANDI.buttons.list[y].nonUniqueIndex = m;
                    $(relatedElement).addClass("nANDI508-ambiguous");
                }

                $(element).addClass("nANDI508-ambiguous");
                alerts += alertIcon;
                andiAlerter.throwAlert(alertObject);
                return m;//prevents alert from being thrown more than once on an element
            }
        }
        return false;
    }

    //This function determines if an element[role] is in tab order
    function isElementInTabOrder(element, role){
        if(!!$(element).prop("tabIndex") && !$(element).is(":tabbable")){//Element is not tabbable and has no tabindex
            //Throw Alert: Element with role=link|button not in tab order
            alerts += alertIcons.warning_tabOrder;
            andiAlerter.throwAlert(alert_0125, [role]);
        }
    }

    //this function will normalize the accessible name and description so that the raw string can be analyzed.
    function getNameDescription(name, desc){
        var n = "";
        var d = "";
        if(name)
            n = andiUtility.normalizeOutput(name);
        if(desc){
            d = andiUtility.normalizeOutput(desc);
            if(n === d) //matchingTest
                d = "";
            else
                d = " " + d; //add space
        }
        return n + d;
    }
};

var showStartUpSummaryText = "Discover accessibility markup for <span class='ANDI508-module-name-l'>buttons</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every button.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
nANDI.results = function(objectClass){
    andiBar.updateResultsSummary("Buttons Found: "+nANDI.buttons.elementNums[0]);

    if(nANDI.buttons.elementNums[1] > 0){
        //highlightNonUniqueButtons
        $("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightNonUniqueButtons-button' aria-label='Highlight "+nANDI.buttons.elementNums[1]+" Non-Unique Buttons' aria-pressed='false'>"+nANDI.buttons.elementNums[1]+" non-unique buttons"+findIcon+"</button>");

        //highlightNonUniqueButtons Button
        $("#ANDI508-highlightNonUniqueButtons-button").click(function(){
            var testPage = $("#ANDI508-testPage");
            if(!$(testPage).hasClass("nANDI508-highlightAmbiguous")){
                //On
                $("#nANDI508-listButtons-tab-all").click();
                $("#ANDI508-testPage").addClass("nANDI508-highlightAmbiguous");
                andiOverlay.overlayButton_on("find",$(this));
                AndiModule.activeActionButtons.highlightNonUniqueButtons = true;
            }
            else{
                //Off
                $("#ANDI508-testPage").removeClass("nANDI508-highlightAmbiguous");
                andiOverlay.overlayButton_off("find",$(this));
                AndiModule.activeActionButtons.highlightNonUniqueButtons = false;
            }
            andiResetter.resizeHeights();
            return false;
        });
    }

    $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewButtonsList-button' class='ANDI508-viewOtherResults-button' aria-label='View Buttons List' aria-expanded='false'>"+listIcon+"view buttons list</button>");

    //View Button List Button
    $("#ANDI508-viewButtonsList-button").click(function(){
        if(!nANDI.viewList_tableReady){
            nANDI.viewList_buildTable("buttons");
            nANDI.viewList_attachEvents();
            nANDI.viewList_attachEvents_buttons();
            nANDI.viewList_tableReady = true;
        }
        nANDI.viewList_toggle("buttons", this);
        andiResetter.resizeHeights();
        return false;
    });

    //Show Startup Summary
    if(!andiBar.focusIsOnInspectableElement()){
        andiBar.showElementControls();
        andiBar.showStartUpSummary(showStartUpSummaryText,true);
    }

    andiAlerter.updateAlertList();

    AndiModule.engageActiveActionButtons([
        "highlightNonUniqueButtons"
    ]);

    $("#ANDI508").focus();
};

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

//This function builds the table for the view list
nANDI.viewList_buildTable = function(mode){
    var tableHTML = "";
    var rowClasses, tabsHTML;
    var appendHTML = "<div id='nANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='nANDI508-viewList-tabs'>";
    var nextPrevHTML = "<button id='nANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='"+andiHotkeyList.key_prev.key+"'><img src='"+icons_url+"prev.png' alt='' /></button>"+
        "<button id='nANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='"+andiHotkeyList.key_next.key+"'><img src='"+icons_url+"next.png' alt='' /></button>"+
        "</div>"+
        "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='"+mode+" List' tabindex='-1'><thead><tr>";

    //BUILD BUTTON LIST TABLE
    for(var b=0; b<nANDI.buttons.list.length; b++){
        //determine if there is an alert
        rowClasses = "";
        if(nANDI.buttons.list[b].alerts.includes("Alert"))
            rowClasses += "ANDI508-table-row-alert ";

        tableHTML += "<tr class='" + $.trim(rowClasses) + "'>"+
            "<th scope='row'>"+nANDI.buttons.list[b].index+"</th>"+
            "<td class='ANDI508-alert-column'>"+nANDI.buttons.list[b].alerts+"</td>"+
            "<td><a href='javascript:void(0)' data-andi508-relatedindex='"+nANDI.buttons.list[b].index+"'>"+nANDI.buttons.list[b].nameDescription+"</a></td>"+
            "<td>"+nANDI.buttons.list[b].accesskey+"</td>"+
            "</tr>";
    }

    tabsHTML = "<button id='nANDI508-listButtons-tab-all' aria-label='View All Buttons' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all buttons</button>";

    appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='button number'>#<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:75%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Accesskey <i aria-hidden='true'></i></a></th>";

    $("#ANDI508-additionalPageResults").append(appendHTML+"</tr></thead><tbody>"+tableHTML+"</tbody></table></div></div>");

};

//This function hide/shows the view list
nANDI.viewList_toggle = function(mode, btn){
    if($(btn).attr("aria-expanded") === "false"){
        //show List, hide alert list
        $("#ANDI508-alerts-list").hide();
        andiSettings.minimode(false);
        $(btn)
            .addClass("ANDI508-viewOtherResults-button-expanded")
            .html(listIcon+"hide "+mode+" list")
            .attr("aria-expanded","true")
            .find("img").attr("src",icons_url+"list-on.png");
        $("#nANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
        AndiModule.activeActionButtons.viewButtonsList = true;
    }
    else{
        //hide List, show alert list
        $("#nANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
        //$("#ANDI508-resultsSummary").show();
        $("#ANDI508-alerts-list").show();
        $(btn)
            .removeClass("ANDI508-viewOtherResults-button-expanded")
            .html(listIcon+"view "+mode+" list")
            .attr("aria-expanded","false");
        AndiModule.activeActionButtons.viewButtonsList = false;
    }
};

//This function attaches the click,hover,focus events to the items in the view list
nANDI.viewList_attachEvents = function(){
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
    $("#nANDI508-viewList-button-next").click(function(){
        //Get class name based on selected tab
        var selectedTabClass = $("#nANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
    $("#nANDI508-viewList-button-prev").click(function(){
        //Get class name based on selected tab
        var selectedTabClass = $("#nANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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

//This function attaches click events to the items specific to the Buttons view list
nANDI.viewList_attachEvents_buttons = function(){
    $("#nANDI508-listButtons-tab-all").click(function(){
        nANDI.viewList_selectTab(this);
        $("#ANDI508-viewList-table tbody tr").show();
        //Remove All (glowing) Highlights
        $("#ANDI508-testPage").removeClass("nANDI508-highlightAmbiguous");
        //Turn Off Ambiguous Button
        andiOverlay.overlayButton_off("find",$("#ANDI508-highlightNonUniqueButtons-button"));
        andiResetter.resizeHeights();
        return false;
    });
};

//This function handles the selection of a tab.
nANDI.viewList_selectTab = function(tab){
    $("#nANDI508-viewList-tabs button").removeClass().attr("aria-selected","false");
    $(tab).addClass("ANDI508-tab-active").attr("aria-selected","true");
};

//This object class is used to store data about each button. Object instances will be placed into an array.
function Button(elementList, index, rowClass){
    this.elementList = elementList;
    this.index = index;
    this.columnValues = [elementList, index];
    this.rowClass = rowClass;
}

//This object class is used to keep track of the buttons on the page
function Buttons(){
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.nonUniqueIndex = 0;
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Buttons";
    this.cssProperties  = [];
    this.buttonTextList = [];
    this.tabsTextList   = []
}

nANDI.buttons = new Buttons();
nANDI.tableInfo = new TableInfo();

nANDI.buttons = andiBar.createObjectValues(nANDI.buttons, 2);

nANDI.analyze(nANDI.buttons);
//nANDI.results(nANDI.buttons);
andiBar.results(nANDI.buttons, nANDI.tableInfo, [], showStartUpSummaryText);

}//end init
