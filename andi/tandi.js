//=========================================//
//tANDI: presentation tables ANDI          //
//Created By Social Security Administration//
//=========================================//

function init_module(){

var tandiVersionNumber = "11.2.1";

//create tANDI instance
var tANDI = new AndiModule(tandiVersionNumber,"t");

//This function updates the Active Element Inspector when mouseover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.hoverability = function(event){
    //When hovering, inspect the cells of the data table, not the table itself. Unless it's a presentation table
    if(!event.shiftKey && !$(this).is("table:not([role=presentation],[role=none]),[role=table],[role=grid],[role=treegrid]") )
        AndiModule.inspect(this);
};

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element)
        $(element).removeClass("tANDI508-highlight").removeAttr("data-tandi508-rowindex data-tandi508-colindex data-tandi508-rowgroupindex data-tandi508-colgroupindex");
    else{
        $(testPage).find("tr[data-tandi508-colgroupsegment]").removeAttr("data-tandi508-colgroupsegment");
        $("#ANDI508-prevTable-button").remove();
        $("#ANDI508-nextTable-button").remove();
    }
};

//Override Previous Element Button to jump to and analyze the previous table:
$("#ANDI508-button-prevElement").off("click").click(function(){
    var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
    if(isNaN(index)){ //no active element yet
        activeTableIndex = 0;
        andiFocuser.focusByIndex(testPageData.andiElementIndex); //first element
    }
    else if(index == 1){
        if(tANDI.presentationTables.list.length <= 1)
            //If there is only 1 table, loop back to last cell
            andiFocuser.focusByIndex(testPageData.andiElementIndex);
        else{
            //Analyze previous table
            $("#ANDI508-prevTable-button").click();
            //Focus on last cell
            andiFocuser.focusByIndex(testPageData.andiElementIndex);
        }
    }
    else
        //Go to previous element in this table
        andiFocuser.focusByIndex(index - 1);
});

//Override Next Element Button to jump to and analyze the next table:
$("#ANDI508-button-nextElement").off("click").click(function(){
    var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
    if(index == testPageData.andiElementIndex || isNaN(index)){
        if(tANDI.presentationTables.list.length <= 1)
            //If there is only 1 table, loop back to first cell
            andiFocuser.focusByIndex(1);
        else
            //Analyze previous table
            $("#ANDI508-nextTable-button").click();
    }
    else
        //Go to next element in this table
        andiFocuser.focusByIndex(index + 1);
});

//These variables are for the page
var activeTableIndex = -1;			//The array index of the active table

AndiModule.initActiveActionButtons({
    scopeMode:true, //default, false == headersIdMode
    markup:false,
    viewTableList:false,
    modeButtonsVisible:false
});

//This function will analyze the test page for table related markup relating to accessibility
tANDI.analyze = function(objectClass){
    //Loop through each visible table
    var activeElementFound = false;
    $(TestPageData.allElements).filter("[role=presentation],[role=none]").each(function(){
        if($(this).isSemantically(["presentation","none"])){
            objectClass.list.push(new PresentationTable([this], objectClass.list.length + 1, "", "", ""));
            andiBar.getAttributes(objectClass, objectClass.list.length - 1);
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "presentation tables";
        }

        //Determine if this is a refresh of tANDI (there is an active element)
        if(!activeElementFound &&
            ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length ))
        {
            activeTableIndex = objectClass.elementNums[0];//set this index to this table
            activeElementFound = true;
        }
    });

    //If the page has tables
    if(objectClass.elementNums[0] > 0){

        var moduleActionButtons = "";

        //Scope Mode / Headers/ID Mode buttons
        moduleActionButtons += "<button id='ANDI508-scopeMode-button' aria-pressed='";
        moduleActionButtons += (AndiModule.activeActionButtons.scopeMode)? "true' class='ANDI508-module-action-active'" : "false'";
        moduleActionButtons += ">scope mode</button><button id='ANDI508-headersIdMode-button' aria-pressed='";
        moduleActionButtons += (!AndiModule.activeActionButtons.scopeMode)? "true' class='ANDI508-module-action-active'" : "false'";
        moduleActionButtons += ">headers/id mode</button>";

        //Markup Overlay Button
        moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-markup-button' aria-label='Markup Overlay' aria-pressed='false'>markup"+overlayIcon+"</button>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        if(!activeElementFound)
            activeTableIndex = 0;//Analyze first table
        analyzeTable(objectClass.list[activeTableIndex].elementList[0]);

        //If there are more than one table and prevTable/nextTable buttons haven't yet been added
        if(objectClass.elementNums[0] > 1 && $("#ANDI508-prevTable-button").length === 0){
            //Add "prev table" and "next table" buttons
            $("#ANDI508-elementControls").append(
                "<button id='ANDI508-prevTable-button' aria-label='Previous Table' title='Analyze Previous Table'><img src='"+icons_url+"prev-table.png' alt='' /></button> "+
                "<button id='ANDI508-nextTable-button' aria-label='Next Table' title='Analyze Next Table'><img src='"+icons_url+"next-table.png' alt='' /></button>"
            );
        }

        //Define scopeMode button functionality
        $("#ANDI508-scopeMode-button").click(function(){
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.scopeMode = true;
            AndiModule.activeActionButtons.modeButtonsVisible = true;
            AndiModule.launchModule("t");
            andiResetter.resizeHeights();
            return false;
        });

        //Define headersIdMode button functionality
        $("#ANDI508-headersIdMode-button").click(function(){
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.scopeMode = false;
            AndiModule.activeActionButtons.modeButtonsVisible = true;
            AndiModule.launchModule("t");
            andiResetter.resizeHeights();
            return false;
        });

        //Define markup button functionality
        $("#ANDI508-markup-button").click(function(){
            if($(this).attr("aria-pressed")=="false"){
                andiOverlay.overlayButton_on("overlay",$(this));
                andiOverlay.overlayTableMarkup();
                AndiModule.activeActionButtons.markup = true;
            }
            else{
                andiOverlay.overlayButton_off("overlay",$(this));
                andiOverlay.removeOverlay("ANDI508-overlay-tableMarkup");
                AndiModule.activeActionButtons.markup = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define prevTable button functionality
        $("#ANDI508-prevTable-button")
        .click(function(){
            if(activeTableIndex < 0)
                //focus on first table
                activeTableIndex = 0;
            else if(activeTableIndex === 0)
                activeTableIndex = objectClass.list.length-1;
            else
                activeTableIndex--;
            tANDI.reset();
            analyzeTable(objectClass.list[activeTableIndex].elementList[0]);
            tANDI.results();
            andiFocuser.focusByIndex(1);
            tANDI.redoMarkup();
            tANDI.viewList_highlightSelectedTable(activeTableIndex, true);
            andiResetter.resizeHeights();
            return false;
        })
        .mousedown(function(){
            $(this).addClass("ANDI508-module-action-active");
        })
        .mouseup(function(){
            $(this).removeClass("ANDI508-module-action-active");
        });

        //Define nextTable button functionality
        $("#ANDI508-nextTable-button")
        .click(function(){
            if(activeTableIndex == objectClass.list.length-1)
                activeTableIndex = 0;
            else
                activeTableIndex++;

            tANDI.reset();
            analyzeTable(objectClass.list[activeTableIndex].elementList[0]);
            tANDI.results();
            andiFocuser.focusByIndex(1);
            tANDI.redoMarkup();
            tANDI.viewList_highlightSelectedTable(activeTableIndex, true);
            andiResetter.resizeHeights();
            return false;
        })
        .mousedown(function(){
            $(this).addClass("ANDI508-module-action-active");
        })
        .mouseup(function(){
            $(this).removeClass("ANDI508-module-action-active");
        });
    }
};

var showStartUpSummaryText = "Only <span class='ANDI508-module-name-t'>presentation tables</span> were found on this page, no data tables.";
//This function updates the results in the ANDI Bar
tANDI.results = function(objectClass){
    if(!tANDI.viewList_buttonAppended){
        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewTableList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view table list</button>");

        //viewTableList Button
        $("#ANDI508-viewTableList-button").click(function(){
            if(!tANDI.viewList_tableReady){
                tANDI.viewList_buildTable();
                tANDI.viewList_attachEvents();
                tANDI.viewList_tableReady = true;
            }
            tANDI.viewList_toggle(this);
            andiResetter.resizeHeights();
            return false;
        });

        tANDI.viewList_buttonAppended = true;
    }

    andiBar.showElementControls();
    if(!andiBar.focusIsOnInspectableElement())
        andiBar.showStartUpSummary(showStartUpSummaryText,true);
    else
        $("#ANDI508-pageAnalysis").show();

    andiAlerter.updateAlertList();
    if(!AndiModule.activeActionButtons.viewTableList && testPageData.numberOfAccessibilityAlertsFound > 0)
        $("#ANDI508-alerts-list").show();
    else
        $("#ANDI508-alerts-list").hide();
};

//This function will inspect a table or table cell
AndiModule.inspect = function(element){
    andiBar.prepareActiveElementInspection(element);

    //Remove other tANDI highlights
    $("#ANDI508-testPage .tANDI508-highlight").removeClass("tANDI508-highlight");
    //Highlight This Element
    $(element).addClass("tANDI508-highlight");

    var elementData = $(element).data("andi508");

    var addOnProps = AndiData.getAddOnProps(element, elementData);

    andiBar.displayOutput(elementData, element, addOnProps);
    andiBar.displayTable(elementData, element, addOnProps);
};

//This function will remove tANDI markup from every table and rebuild the alert list
tANDI.reset = function(){
    var testPage = document.getElementById("ANDI508-testPage");

    //Every ANDI508-element
    $(testPage).find(".ANDI508-element").each(function(){
        $(this)
            .removeClass("tANDI508-highlight")
            .removeAttr("data-andi508-index data-tandi508-rowindex data-tandi508-colindex data-tandi508-colgroupindex data-tandi508-rowgroupindex")
            .removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
            .removeData("ANDI508")
            .off("focus",AndiModule.focusability)
            .off("mouseenter",AndiModule.hoverability);
    });

    andiLaser.cleanupLaserTargets(testPage);

    $("#ANDI508-alerts-list").html("");

    testPageData = new TestPageData(); //get fresh test page data
};

//This function hides the scopeMode headersIdMode buttons
tANDI.hideModeButtons = function(){
    AndiModule.activeActionButtons.modeButtonsVisible = false;
    $("#ANDI508-scopeMode-button").add("#ANDI508-headersIdMode-button").add($("#ANDI508-markup-button").prev())
        .addClass("ANDI508-module-action-hidden");
};
//This function shows the scopeMode headersIdMode buttons
tANDI.showModeButtons = function(mode){
    AndiModule.activeActionButtons.modeButtonsVisible = true;
    var scopeModeButton = document.getElementById("ANDI508-scopeMode-button");
    var headersIdButton = document.getElementById("ANDI508-headersIdMode-button");

    //activeButton
    $((mode === "scope") ? scopeModeButton : headersIdButton)
        .addClass("ANDI508-module-action-active").attr("aria-pressed","true");

    //inactiveButton
    $((mode === "scope") ? headersIdButton : scopeModeButton)
        .removeClass("ANDI508-module-action-active").attr("aria-pressed","false");

    //show the buttons
    $(scopeModeButton).add(headersIdButton).add($("#ANDI508-markup-button").prev())
        .removeClass("ANDI508-module-action-hidden");
};

//This function will a table. Only one table at a time
function analyzeTable(table){

    var role = $(table).getValidRole();

    //temporarily hide any nested tables so they don't interfere with analysis
    $(table).find("table,[role=table],[role=grid],[role=treegrid]").each(function(){
        $(this)
            .attr("andi508-temporaryhide", $(this).css("display"))
            .css("display","none");
    });

    //Cache the visible elements (performance)
    var all_rows = $(table).find("tr").filter(":visible");
    var all_th = $(all_rows).find("th").filter(":visible");
    var all_cells = $(all_rows).find("th,td").filter(":visible");

    //==PRESENTATION TABLE==//
    andiData = new AndiData(table);
    andiCheck.commonNonFocusableElementChecks(andiData, $(table));

    var presentationTablesShouldNotHave = "";

    if($(table).find("caption").filter(":visible").first().length)
        presentationTablesShouldNotHave += "a &lt;caption&gt;, ";

    if($(all_th).first().length)
        presentationTablesShouldNotHave += "&lt;th&gt; cells, ";

    var cellCount = 0;

    var presTableWithScope = false;
    var presTableWithHeaders = false;
    $(all_cells).each(function(){
        cellCount++;
        if($(this).attr("scope"))
            presTableWithScope = true;
        if($(this).attr("headers"))
            presTableWithHeaders = true;
    });

    if(presTableWithScope)
        presentationTablesShouldNotHave += "cells with [scope] attributes, ";
    if(presTableWithHeaders)
        presentationTablesShouldNotHave += "cells with [headers] attributes, ";

    if($(table).attr("summary"))
        presentationTablesShouldNotHave += "a [summary] attribute, ";

    if(presentationTablesShouldNotHave)
        andiAlerter.throwAlert(alert_0041, [presentationTablesShouldNotHave.slice(0,-2)]);

    AndiData.attachDataToElement(table);

    tANDI.hideModeButtons();
    AndiModule.activeActionButtons.scopeMode = true;

    $(table).find("[andi508-temporaryhide]").each(function(){
        $(this)
            .css("display", $(this).attr("andi508-temporaryhide"))
            .removeAttr("andi508-temporaryhide");
    });
}

tANDI.viewList_tableReady = false;
tANDI.viewList_buttonAppended = false;

//This function will build the Table List html and inject into the ANDI Bar
tANDI.viewList_buildTable = function(){

    //Build scrollable container and table head
    var appendHTML = "<div id='tANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'>"+
        "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='List of Tables' tabindex='-1'><thead><tr>"+
        "<th scope='col' style='width:10%'>#</th>"+
        "<th scope='col' style='width:75%'>Table&nbsp;Name</th>"+
        "<th scope='col' style='width:15%'>Naming&nbsp;Method</th>"+
        "</tr></thead><tbody>";

    //Build table body
    var tableName;
    for(var x=0; x<tANDI.presentationTables.list.length; x++){
        appendHTML += "<tr";
        //Highlight the select table
        if($(objectClass.list[x].elementList[0]).hasClass("ANDI508-element"))
            appendHTML += " class='ANDI508-table-row-inspecting' aria-selected='true'";

        tableName = ["<span style='font-style:italic'>Presentation Table</span>", ""];

        appendHTML += "><th scope='role'>"+parseInt(x+1)+"</th><td>"+
            "<a href='javascript:void(0)' data-andi508-relatedtable='"+x+"'>"+
            tableName[0]+"</a></td><td style='font-family:monospace'>"+tableName[1]+"</td></tr>";
    }

    //Insert into ANDI Bar
    appendHTML += "</tbody></table></div></div>";
    $("#ANDI508-additionalPageResults").append(appendHTML);
};

//This function attaches the click,hover,focus events to the items in the view list
tANDI.viewList_attachEvents = function(){
    //Add focus click to each link (output) in the table
    $("#ANDI508-viewList-table td a").each(function(){
        andiLaser.createLaserTrigger($(this),$(vANDI.presentationTables.list[$(this).attr("data-andi508-relatedtable")].elementList[0]));
    })
    .click(function(){//Jump to this table
        //Make this link appear selected
        tANDI.reset();
        activeTableIndex = $(this).attr("data-andi508-relatedtable");
        analyzeTable(vANDI.presentationTables.list[activeTableIndex].elementList[0]);
        tANDI.results();
        andiFocuser.focusByIndex(1);
        tANDI.redoMarkup();
        tANDI.viewList_highlightSelectedTable(activeTableIndex, false);
        andiResetter.resizeHeights();
        return false;
    });
};

//This function highlights the active table in the table list
//index: refers to the index of the table in the tableArray
tANDI.viewList_highlightSelectedTable = function(index, scrollIntoView){
    if(tANDI.viewList_tableReady){
        var activeTableFound = false;
        $("#ANDI508-viewList-table td a").each(function(){
            if(!activeTableFound && $(this).attr("data-andi508-relatedtable") == index){
                //this is the active table
                $(this).attr("aria-selected","true").closest("tr").addClass("ANDI508-table-row-inspecting");
                if(scrollIntoView)
                    this.scrollIntoView();
                activeTableFound = true;
            }
            else//not the active table
                $(this).removeAttr("aria-selected").closest("tr").removeClass();
        });
    }
};

//This function hide/shows the view list
tANDI.viewList_toggle = function(btn){
    if($(btn).attr("aria-expanded") === "false"){
        //show List, hide alert list
        $("#ANDI508-alerts-list").hide();
        andiSettings.minimode(false);
        $(btn)
            .addClass("ANDI508-viewOtherResults-button-expanded")
            .html(listIcon+"hide table list")
            .attr("aria-expanded","true")
            .find("img").attr("src",icons_url+"list-on.png");
        $("#tANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
        AndiModule.activeActionButtons.viewTableList = true;
    }
    else{
        //hide List, show alert list
        $("#tANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
        //$("#ANDI508-resultsSummary").show();
        $("#ANDI508-alerts-list").show();
        $(btn)
            .removeClass("ANDI508-viewOtherResults-button-expanded")
            .html(listIcon+"view table list")
            .attr("aria-expanded","false");
        AndiModule.activeActionButtons.viewTableList = false;
    }
};

//This function will overlay the table markup.
AndiOverlay.prototype.overlayTableMarkup = function(){
    var scope, headers, id, role, markupOverlay;
    $("#ANDI508-testPage [data-tandi508-colindex]").each(function(){
        scope = $(this).attr("scope");
        headers = $(this).attr("headers");
        id = this.id;
        role = $(this).attr("role");

        markupOverlay = $(this).prop("tagName").toLowerCase();

        if(role)
            markupOverlay += " role=" + role;
        if(id)
            markupOverlay += " id=" + id;
        if(headers)
            markupOverlay += " headers=" + headers;
        if(scope)
            markupOverlay += " scope=" + scope;

        $(this).prepend(andiOverlay.createOverlay("ANDI508-overlay-tableMarkup", markupOverlay));
    });
};

//This function will detect if markup button should be re-pressed
tANDI.redoMarkup = function(){
    if(AndiModule.activeActionButtons.markup){
        andiOverlay.overlayButton_off("overlay",$("#ANDI508-markup-button"));
        andiOverlay.removeOverlay("ANDI508-overlay-tableMarkup");
        $("#ANDI508-markup-button").click();
    }
};

tANDI.grab_headers = function(element, elementData, table){
    var headers = $.trim($(element).attr("headers"));
    if(headers !== undefined){
        if(!$(element).is("th") && !$(element).is("td"))
            andiAlerter.throwAlert(alert_0045);
        else
            headers = getHeadersReferences(element, headers, table);
    }
    //stores the actual vaule of the headers, not the parsed (grabbed) headersText
    elementData.components.headers = headers;

    function getHeadersReferences(element, headers, table){
        var idsArray = headers.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
        var accumulatedText = "";//this variable is going to store what is found. And will be returned
        var splitMessage = "";
        var referencedElement, referencedElementText;
        var missingReferences = [];
        var displayHeaders = "";
        var tableIds = $(table).find("[id]"); //array of all elements within the table that have an id
        var tableThIds = $(table).find("th[id]"); //array of all th cells within the table that have an id

        //Traverse through the array
        for(var x=0;x<idsArray.length;x++){
            //Can the aria list id be found somewhere on the page?
            if(idsArray[x] !== ""){

                //Set the referenced element (only looking for the id within the same table)
                referencedElement = undefined; //set to undefined

                //Loop through all elements within the table that have an id
                $.each(tableIds,function(){
                    if(this.id === idsArray[x]){
                        referencedElement = this;
                        return;
                    }
                });

                referencedElementText = "";

                if($(referencedElement).html() !== undefined && $(referencedElement).closest("table").is(table)){
                    //element with id was found within the same table
                    if($(referencedElement).is("td")) //referenced element is a td
                        andiAlerter.throwAlert(alert_0067, [idsArray[x]]);
                    else if(!$(referencedElement).is("th"))//referenced element is not a th
                        andiAlerter.throwAlert(alert_0066, [idsArray[x]]);
                    else{//referenced element is a th
                        //Check if this is referencing a duplicate id within the same table
                        areThereAnyDuplicateIds_headers(idsArray[x], tableThIds);
                        referencedElementText += andiUtility.getVisibleInnerText(referencedElement);
                    }
                }
                else{//referenced element was not found or was not within the same table
                    referencedElement = document.getElementById(idsArray[x]); //search within entire document for this id

                    if($(referencedElement).html() !== undefined){
                        andiAlerter.throwAlert(alert_0062, [idsArray[x]]); //referenced element is in another table
                    }
                    else //No, this id was not found at all, add to list.
                        missingReferences.push(idsArray[x]);
                }

                if(referencedElementText !== "") //Add referenceId
                    displayHeaders += andiLaser.createLaserTarget(referencedElement, "<span class='ANDI508-display-id'>#"+idsArray[x]+"</span>");

                //Add to accumulatedText
                accumulatedText += referencedElementText + " ";
            }
        }//end for loop
        andiCheck.areThereMissingReferences("headers", missingReferences);

        if($.trim(accumulatedText) === "")
            //ALL of the headers references do not return any text
            andiAlerter.throwAlert(alert_0068);

        return displayHeaders;

        //This function will search the table for th cells with duplicate ids.
        function areThereAnyDuplicateIds_headers(id, tableThIds){
            if(id && tableThIds.length > 1){
                var idMatchesFound = 0;
                //loop through tableThIds and compare
                for (z=0; z<tableThIds.length; z++){
                    if(id === tableThIds[z].id){
                        idMatchesFound++;
                        if(idMatchesFound === 2) break; //duplicate found so stop searching, for performance
                    }
                }
                if(idMatchesFound > 1){//Duplicate Found
                    var message = "[headers] attribute is referencing a duplicate id [id="+id+"] within the same table";
                    andiAlerter.throwAlert(alert_0011, [message]);
                }
            }
        }
    }
};

//This object class is used to store data about each presentation table. Object instances will be placed into an array.
function PresentationTable(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the presentation tables on the page
function PresentationTables() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Presentation Tables";
    this.cssProperties  = [];
    this.buttonTextList = ["Table Markup"];
    this.tabsTextList   = [];
}

tANDI.presentationTables = new PresentationTables();
tANDI.tableInfo = new TableInfo();

tANDI.presentationTables = andiBar.createObjectValues(tANDI.presentationTables, 1);

//analyze tables
tANDI.analyze(tANDI.presentationTables);
//tANDI.results(tANDI.presentationTables);
andiBar.results(tANDI.presentationTables, tANDI.tableInfo, [], showStartUpSummaryText);

AndiModule.engageActiveActionButtons([
    "viewTableList",
    "markup"
]);

}//end init
