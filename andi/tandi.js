//=========================================//
//tANDI: presentation tables ANDI          //
//Created By Social Security Administration//
//=========================================//

function init_module(){

var tandiVersionNumber = "11.2.1";

//create tANDI instance
var tANDI = new AndiModule(tandiVersionNumber,"t");

//Delimeter for the the header cells
tANDI.associatedHeaderCellsDelimeter = " <span aria-hidden='true'>|</span> ";

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
        if(tableCountTotal <= 1)
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
        if(tableCountTotal <= 1)
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
var tableCountTotal = 0;			//The total number of tables
var presentationTablesCount = 0;	//The total number of presentation tables
var tableArray = [];				//Stores all tables in an array
var activeTableIndex = -1;			//The array index of the active table

//These variables are for the current table being analyzed (the active table)
var cellCount = 0;					//The total number of <th> and <td>
var rowCount = 0;					//The total number of <tr>
var colCount = 0;					//The total number of columns (maximum number of <th> or <td> in a <tr>)

AndiModule.initActiveActionButtons({
    scopeMode:true, //default, false == headersIdMode
    markup:false,
    viewTableList:false,
    modeButtonsVisible:false
});

//This function will analyze the test page for table related markup relating to accessibility
tANDI.analyze = function(objectClass){
    if(TestPageData.page_using_table){
        //Loop through each visible table
        var activeElementFound = false;
        $(TestPageData.allElements).filter("table,[role=table],[role=grid],[role=treegrid]").each(function(){
            //Store this table in the array
            tableArray.push($(this));

            //Is this a presentation table?
            if($(this).isSemantically(["presentation","none"])){
                //It's a presentation table
                presentationTablesCount++;
            }
            else if(!$(this).isSemantically(["table","grid","treegrid"],"table")){
                //It table with a non-typical role
                presentationTablesCount++;
            }

            //Determine if this is a refresh of tANDI (there is an active element)
            if(!activeElementFound &&
                ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length ))
            {
                activeTableIndex = tableCountTotal;//set this index to this table
                activeElementFound = true;
            }

            tableCountTotal++;
        });

        //If the page has tables
        if(tableCountTotal > 0){

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
            analyzeTable(tableArray[activeTableIndex]);

            //If there are more than one table and prevTable/nextTable buttons haven't yet been added
            if(tableCountTotal > 1 && $("#ANDI508-prevTable-button").length === 0){
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
                    activeTableIndex = tableArray.length-1;
                else
                    activeTableIndex--;
                tANDI.reset();
                analyzeTable(tableArray[activeTableIndex]);
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
                if(activeTableIndex == tableArray.length-1)
                    activeTableIndex = 0;
                else
                    activeTableIndex++;

                tANDI.reset();
                analyzeTable(tableArray[activeTableIndex]);
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
    }
};

//This function updates the results in the ANDI Bar
tANDI.results = function(objectClass){

    //Update Results Summary text depending on the active table type (data or presentation)
    andiBar.updateResultsSummary("Tables: "+tableCountTotal+" (presentation tables: "+presentationTablesCount+")");

    if(tableCountTotal > 0){
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
    }

    andiBar.showElementControls();
    if(!andiBar.focusIsOnInspectableElement())
        andiBar.showStartUpSummary("Only <span class='ANDI508-module-name-t'>presentation tables</span> were found on this page, no data tables.",true);
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

    var associatedHeaderCellsText = (!$(element).is("table,[role=table],[role=grid],[role=treegrid]")) ? grabHeadersAndHighlightRelatedCells(element) : "";

    var elementData = $(element).data("andi508");

    if(associatedHeaderCellsText){
        associatedHeaderCellsText = "<span class='ANDI508-display-headerText'>" + associatedHeaderCellsText + "</span>";
        elementData.components.headerText = associatedHeaderCellsText;
    }

    var addOnProps = AndiData.getAddOnProps(element, elementData,
        [
            ["scope", $(element).attr("scope")],
            ["id", element.id],
            "colspan",
            "rowspan",
            "aria-colcount",
            "aria-rowcount",
            "aria-colindex",
            "aria-rowindex"
        ]);

    andiBar.displayOutput(elementData, element, addOnProps);

    //insert the associatedHeaderCellsText into the output if there are no danger alerts
    if(associatedHeaderCellsText && elementData.dangers.length === 0){
        var outputText = document.getElementById("ANDI508-outputText");
        $(outputText).html(associatedHeaderCellsText + " " + $(outputText).html());
    }

    andiBar.displayTable(elementData, element, addOnProps);

    //This function will grab associated header cells and add highlights
    function grabHeadersAndHighlightRelatedCells(element){
        var accumulatedHeaderText = "";
        var accumulatedHeaderTextArray = []; //will store each text block so it can be compared against
        var table = $(element).closest("table,[role=table],[role=grid],[role=treegrid]");
        var rowIndex = $(element).attr("data-tandi508-rowindex");
        var colIndex = $(element).attr("data-tandi508-colindex");
        var colgroupIndex = $(element).attr("data-tandi508-colgroupindex");
        var rowgroupIndex = $(element).attr("data-tandi508-rowgroupindex");

        //Update activeTableIndex to this element's table.
        //activeTableIndex = $(table).attr("data-andi508-index") - 1;

        //Find Related <th> cells
        //==HEADERS/ID MODE==//
        if(!AndiModule.activeActionButtons.scopeMode){
            //if the inspected element has headers attribute
            var headers = $.trim($(element).attr("headers"));
            var idsArray;
            if(headers){
                idsArray = headers.split(" ");
                var referencedElement;
                for (var x=0; x<idsArray.length; x++){
                    //Can the id be found somewhere on the page?
                    referencedElement = document.getElementById(idsArray[x]);

                    if( $(referencedElement).html() !== undefined &&
                        ($(referencedElement).is("th") || $(referencedElement).is("td")) &&
                        $(referencedElement).closest("table").is(table)
                    ){	//referencedElement exists, is a table cell, and is within the same table
                        addHighlight(referencedElement, true);
                    }
                }
            }
            //if the inspected element is a th, find the id references
            if($(element).is("th")){
                var id = $(element).attr("id");
                if(id){
                    $(table).find("th.ANDI508-element:not(.tANDI508-highlight),td.ANDI508-element:not(.tANDI508-highlight)").filter(":visible").each(function(){
                        headers = $(this).attr("headers");
                        if(headers){
                            idsArray = headers.split(" ");
                            for (var x=0; x<idsArray.length; x++){
                                if(id == idsArray[x])
                                    addHighlight(this);
                            }
                        }
                    });
                }
            }
        }
        //==SCOPE MODE==//
        else if(AndiModule.activeActionButtons.scopeMode){

            //Create vars for the looping that's about to happen
            var s, ci, ri;
            var row_index_matches, col_index_matches, isSameColgroup, isSameRowgroup;

            //if inspected element is a td
            if($(element).is("td")){
                //Highlight associating <th> for this <td>
                $(table).find("th.ANDI508-element").filter(":visible").each(function(){
                    s = $(this).attr("scope");
                    ci = $(this).attr("data-tandi508-colindex");
                    ri = $(this).attr("data-tandi508-rowindex");

                    //get associated th from col
                    if(s != "row" && s != "rowgroup" &&
                        (!colgroupIndex || (colgroupIndex == $(this).attr("data-tandi508-colgroupindex"))) &&
                        index_match(colIndex, ci) && !index_match(rowIndex, ri) )
                    {
                        addHighlight(this, true);
                    }
                    //get associated th from row
                    else if(s != "col" && s != "colgroup" &&
                        (!rowgroupIndex || (rowgroupIndex == $(this).attr("data-tandi508-rowgroupindex"))) &&
                        index_match(rowIndex, ri) && !index_match(colIndex, ci) )
                    {
                        addHighlight(this, true);
                    }
                });
            }
            //if inspected element is a th
            else if($(element).is("th")){
                //Highlight associating <th> and <td> for this <th>
                var scope = $(element).attr("scope");
                var cgi, rgi;
                $(table).find("th.ANDI508-element,td.ANDI508-element").filter(":visible").each(function(){
                    s = $(this).attr("scope");
                    ci = $(this).attr("data-tandi508-colindex");
                    ri = $(this).attr("data-tandi508-rowindex");
                    cgi = $(this).attr("data-tandi508-colgroupindex");
                    rgi = $(this).attr("data-tandi508-rowgroupindex");
                    row_index_matches = index_match(rowIndex, ri);
                    col_index_matches = index_match(colIndex, ci);
                    isSameColgroup = (!colgroupIndex || colgroupIndex == cgi);
                    isSameRowgroup = (!rowgroupIndex || rowgroupIndex == rgi);
                    if($(this).is("th") && s){
                        //get associated th from column
                        if(col_index_matches && !row_index_matches){
                            if( isSameColgroup && (s == "col" || s == "colgroup") ){
                                addHighlight(this, true);
                            }
                        }
                        //get associated th from row
                        else if(row_index_matches && !col_index_matches){
                            if( isSameRowgroup && (s == "row" || s == "rowgroup") ){
                                addHighlight(this, true);
                            }
                        }
                    }

                    if(scope){
                        //th has scope
                        if(isSameColgroup && scope === "col" && col_index_matches){
                            addHighlight(this);
                        }
                        else if(scope === "row" && row_index_matches){
                            addHighlight(this);
                        }
                        else if(isSameColgroup && scope === "colgroup" && col_index_matches){
                            if($(element).parent().attr("data-tandi508-colgroupsegment")){
                                if(colgroupIndex == cgi)
                                    addHighlight(this);
                            }
                            else
                                addHighlight(this);
                        }
                        else if(scope === "rowgroup" && row_index_matches && rowgroupIndex == rgi)
                            addHighlight(this);
                    }
                    else{
                        //th has no scope
                        //**Assumed associations - this is where it gets sketchy**
                        if($(this).is("td")){
                            if(col_index_matches || row_index_matches)
                                addHighlight(this);
                        }
                        //No scope assumptions relating to other th
                        else if($(this).is("th")){
                            if(rowIndex === "0" && col_index_matches)
                                addHighlight(this);
                        }
                    }

                });
            }
            else if(
                ( $(element).getValidRole() === "cell" && $(table).getValidRole() === "table" ) ||
                ( $(element).getValidRole() === "gridcell" && ($(table).getValidRole() === "grid" || $(table).getValidRole() === "treegrid") )
            ){
                $(table).find("[role=columnheader].ANDI508-element,[role=rowheader].ANDI508-element").filter(":visible").each(function(){
                    ci = $(this).attr("data-tandi508-colindex");
                    ri = $(this).attr("data-tandi508-rowindex");
                    //alert(colIndex+" "+rowIndex+" |"+ci+ri)
                    //Highlight associating columnheader for this cell
                    if(index_match(colIndex, ci) && !index_match(rowIndex, ri) )
                    {
                        addHighlight(this, true);
                    }
                    //Highlight associating rowheader for this cell
                    if(index_match(rowIndex, ri) && !index_match(colIndex, ci) )
                    {
                        addHighlight(this, true);
                    }
                });
            }
            else if($(element).is("[role=columnheader],[role=rowheader]")){
                s = ($(element).is("[role=columnheader]")) ? "col" : "row";
                $(table).find(".ANDI508-element").filter(":visible").each(function(){
                    ci = $(this).attr("data-tandi508-colindex");
                    ri = $(this).attr("data-tandi508-rowindex");
                    row_index_matches = index_match(rowIndex, ri);
                    col_index_matches = index_match(colIndex, ci);

                    if($(this).is("[role=columnheader]")){
                        //get associated th from columnheaders in this col
                        if(col_index_matches && !row_index_matches){
                            addHighlight(this, true);
                        }
                    }
                    else if($(this).is("[role=rowheader]")){
                        //get associated th from rowheaders in this row
                        if(row_index_matches && !col_index_matches){
                            addHighlight(this, true);
                        }
                    }

                    if(s === "col"){
                        //highlight cells in this col
                        if(col_index_matches){
                            addHighlight(this);
                        }
                    }
                    else{ // s === "row"
                        //highlight cells in this row
                        if(row_index_matches){
                            addHighlight(this);
                        }
                    }

                });
            }
        }

        //This functoin will add the highlight to the element
        //if updateAssociatedHeaderCellsText is true it will add the text to the header cells
        function addHighlight(element, updateAssociatedHeaderCellsText){
            $(element).addClass("tANDI508-highlight");
            if(updateAssociatedHeaderCellsText){
                var text = andiUtility.formatForHtml(andiUtility.getVisibleInnerText(element));
                //Check if this block of text has already been added (duplicate header)
                if(accumulatedHeaderTextArray.indexOf(text) === -1){
                    accumulatedHeaderTextArray.push(text);
                    accumulatedHeaderText += text + tANDI.associatedHeaderCellsDelimeter;
                }
            }
        }
        return accumulatedHeaderText;
    }
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

    rowCount = 0;
    colCount = 0;
    var row, cell;
    var colIndex, rowIndex, colspan, rowspan;
    var rowIndexPlusRowspan, colIndexPlusColspan;
    var indexValue;
    var child;

    //loop through the <table> and set data-* attributes
    //Each cell in a row is given a rowIndex
    //Each cell in a column is given a colIndex

    //The way tANDI analyzes the table is that it begins looking at the cells first
    //to determine if there is any existing scenarios that should trigger an alert.
    //When each cell has been evaluated, it will then attach alerts to the table element.

    //This array is used to keep track of the rowspan of the previous row
    //They will be checked against before assigning the colIndex.
    //This technique is only needed for setting colIndex
    //since the rowIndex is handled more "automatically" by the <tr> tags
    var rowspanArray = [];

    //Cache the visible elements (performance)
    var all_rows = $(table).find("tr").filter(":visible");
    var all_th = $(all_rows).find("th").filter(":visible");
    var all_cells = $(all_rows).find("th,td").filter(":visible");

    //==PRESENTATION TABLE==//
    andiData = new AndiData(table[0]);
    andiCheck.commonNonFocusableElementChecks(andiData, $(table));

    var presentationTablesShouldNotHave = "";

    if($(table).find("caption").filter(":visible").first().length)
        presentationTablesShouldNotHave += "a &lt;caption&gt;, ";

    if($(all_th).first().length)
        presentationTablesShouldNotHave += "&lt;th&gt; cells, ";

    cellCount = 0;

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
    for(var x=0; x<tableArray.length; x++){
        appendHTML += "<tr";
        //Highlight the select table
        if($(tableArray[x]).hasClass("ANDI508-element"))
            appendHTML += " class='ANDI508-table-row-inspecting' aria-selected='true'";

        tableName = preCalculateTableName(tableArray[x]);

        appendHTML += "><th scope='role'>"+parseInt(x+1)+"</th><td>"+
            "<a href='javascript:void(0)' data-andi508-relatedtable='"+x+"'>"+
            tableName[0]+"</a></td><td style='font-family:monospace'>"+tableName[1]+"</td></tr>";
    }

    //Insert into ANDI Bar
    appendHTML += "</tbody></table></div></div>";
    $("#ANDI508-additionalPageResults").append(appendHTML);

    //This function precalculates the table name
    //Returns an array with the tableName and the namingMethodUsed
    function preCalculateTableName(table){
        var tableName, namingMethod;

        tableName = "<span style='font-style:italic'>Presentation Table</span>";
        namingMethod = "";

        return [tableName,namingMethod];

        function cleanUp(text){
            return andiUtility.formatForHtml($.trim(text));
        }

        //This function gets the text from the aria-labelledby references
        //TODO: some code is being duplicated here. Difference here is that alerts aren't needed
        function grabTextFromAriaLabelledbyReferences(element){
            var ids = $.trim($(element).attr("aria-labelledby"));//get the ids to search for
            var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
            var accumulatedText = "";//this variable is going to store what is found. And will be returned
            var referencedElement, referencedElementText;
            //Traverse through the array
            for(var x=0; x<idsArray.length; x++){
                //Can the aria list id be found somewhere on the page?
                if(idsArray[x] !== ""){
                    referencedElement = document.getElementById(idsArray[x]);
                    referencedElementText = "";
                    if($(referencedElement).attr("aria-label"))//Yes, this id was found and it has an aria-label
                        referencedElementText += andiUtility.formatForHtml($(referencedElement).attr("aria-label"));
                    else if($(referencedElement).html() !== undefined)//Yes, this id was found and the reference contains something
                        referencedElementText += andiUtility.formatForHtml(andiUtility.getVisibleInnerText(referencedElement, true));
                    //Add to accumulatedText
                    accumulatedText += referencedElementText + " ";
                }
            }
            return $.trim(accumulatedText);
        }
    }
};

//This function attaches the click,hover,focus events to the items in the view list
tANDI.viewList_attachEvents = function(){
    //Add focus click to each link (output) in the table
    $("#ANDI508-viewList-table td a").each(function(){
        andiLaser.createLaserTrigger($(this),$(tableArray[$(this).attr("data-andi508-relatedtable")]));
    })
    .click(function(){//Jump to this table
        //Make this link appear selected
        tANDI.reset();
        activeTableIndex = $(this).attr("data-andi508-relatedtable");
        analyzeTable(tableArray[activeTableIndex]);
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
        if(testPageData.numberOfAccessibilityAlertsFound > 0)
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

//This function returns true if any index match is found.
//The colIndex/rowIndex could contain a space delimited array
function index_match(a,b){
    var match = false;
    var	aX = buildArrayOnIndex(a);
    var	bY = buildArrayOnIndex(b);

    //compare
    for(var x=0; x<aX.length; x++){
        for(var y=0; y<bY.length; y++){
            if(aX[x] == bY[y]){
                match = true;
                break;
            }
        }
    }
    return match;
}

//This function will build an array based on the value passed in.
//If it is space delimited it returns an array greater than 1.
//If it is not space delimited it returns an array of length 1.
//This is mainly done to fix an IE7 bug with array handling.
function buildArrayOnIndex(value){
    if(value.toString().includes(" "))
        return value.split(" ");
    else
        return [value];
}

//This object class is used to store data about each presentation table. Object instances will be placed into an array.
function PresentationTable(element, index, role, name, rowClass) {
    this.element      = element;
    this.index        = index;
    this.role         = role;
    this.name         = name;
    this.columnValues = [element, index, role, name];
    this.rowClass     = rowClass;
}

//This object class is used to keep track of the presentation tables on the page
function PresentationTables() {
    this.list        = []; //Stores all tables in an array
    this.count       = 0;  //The total number of presentation tables
    this.index       = 1;
    this.columnNames = ["element", "index", "role", "name"];
}

tANDI.presentationTables = new PresentationTables();

//analyze tables
tANDI.analyze(tANDI.presentationTables);
tANDI.results(tANDI.presentationTables);

AndiModule.engageActiveActionButtons([
    "viewTableList",
    "markup"
]);

}//end init
