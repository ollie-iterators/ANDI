//=========================================//
//uANDI: strange presentation tables ANDI  //
//Created By Social Security Administration//
//=========================================//

function init_module(){

var uANDIVersionNumber = "11.2.1";

//create uANDI instance
var uANDI = new AndiModule(uANDIVersionNumber,"t");

//Delimeter for the the header cells
uANDI.associatedHeaderCellsDelimeter = " <span aria-hidden='true'>|</span> ";

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
        $(element).removeClass("uANDI508-highlight").removeAttr("data-uANDI508-rowindex data-uANDI508-colindex data-uANDI508-rowgroupindex data-uANDI508-colgroupindex");
    else{
        $(testPage).find("tr[data-uANDI508-colgroupsegment]").removeAttr("data-uANDI508-colgroupsegment");
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
var dataTablesCount = 0;			//The total number of data tables (tables that aren't presentation tables)
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
uANDI.analyze = function(objectClass){
    if(TestPageData.page_using_table){
        //Loop through each visible table
        var activeElementFound = false;
        $(TestPageData.allElements).filter("table,[role=table],[role=grid],[role=treegrid]").each(function(){
            //Store this table in the array
            objectClass.list.push(new PresentationTable([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "presentation tables";

            //Is this a presentation table?
            if($(this).isSemantically(["presentation","none"])){
                //It's a presentation table
                presentationTablesCount++;
            }
            if($(this).isSemantically(["table","grid","treegrid"],"table")){
                //It's a data table
                dataTablesCount++;
            }
            else{
                //It table with a non-typical role
                presentationTablesCount++;
            }

            //Determine if this is a refresh of uANDI (there is an active element)
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
                uANDI.reset();
                analyzeTable(tableArray[activeTableIndex]);
                uANDI.results();
                andiFocuser.focusByIndex(1);
                uANDI.redoMarkup();
                uANDI.viewList_highlightSelectedTable(activeTableIndex, true);
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

                uANDI.reset();
                analyzeTable(tableArray[activeTableIndex]);
                uANDI.results();
                andiFocuser.focusByIndex(1);
                uANDI.redoMarkup();
                uANDI.viewList_highlightSelectedTable(activeTableIndex, true);
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

var showStartUpSummaryText = "Only <span class='ANDI508-module-name-t'>presentation tables</span> were found on this page, no data tables.";
//This function updates the results in the ANDI Bar
uANDI.results = function(objectClass){

    //Update Results Summary text depending on the active table type (data or presentation)
    andiBar.updateResultsSummary("Presentation Tables: "+presentationTablesCount);

    if(tableCountTotal > 0){
        if(!uANDI.viewList_buttonAppended){
            $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewTableList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view table list</button>");

            //viewTableList Button
            $("#ANDI508-viewTableList-button").click(function(){
                if(!uANDI.viewList_tableReady){
                    uANDI.viewList_buildTable();
                    uANDI.viewList_attachEvents();
                    uANDI.viewList_tableReady = true;
                }
                uANDI.viewList_toggle(this);
                andiResetter.resizeHeights();
                return false;
            });

            uANDI.viewList_buttonAppended = true;
        }
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

    //Remove other uANDI highlights
    $("#ANDI508-testPage .uANDI508-highlight").removeClass("uANDI508-highlight");
    //Highlight This Element
    $(element).addClass("uANDI508-highlight");

    var elementData = $(element).data("andi508");

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
    andiBar.displayTable(elementData, element, addOnProps);
};

//This function will remove uANDI markup from every table and rebuild the alert list
uANDI.reset = function(){
    var testPage = document.getElementById("ANDI508-testPage");

    //Every ANDI508-element
    $(testPage).find(".ANDI508-element").each(function(){
        $(this)
            .removeClass("uANDI508-highlight")
            .removeAttr("data-andi508-index data-uANDI508-rowindex data-uANDI508-colindex data-uANDI508-colgroupindex data-uANDI508-rowgroupindex")
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
uANDI.hideModeButtons = function(){
    AndiModule.activeActionButtons.modeButtonsVisible = false;
    $("#ANDI508-scopeMode-button").add("#ANDI508-headersIdMode-button").add($("#ANDI508-markup-button").prev())
        .addClass("ANDI508-module-action-hidden");
};
//This function shows the scopeMode headersIdMode buttons
uANDI.showModeButtons = function(mode){
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

    //loop through the <table> and set data-* attributes
    //Each cell in a row is given a rowIndex
    //Each cell in a column is given a colIndex

    //The way uANDI analyzes the table is that it begins looking at the cells first
    //to determine if there is any existing scenarios that should trigger an alert.
    //When each cell has been evaluated, it will then attach alerts to the table element.

    //These variables keep track of properties of the table

    if($.trim(role) && role !== "table" && role !== "grid" && role !== "treegrid"){
        //==TABLE WITH NONTYPICAL ROLE==//
        andiData = new AndiData(table[0]);
        andiAlerter.throwAlert(alert_004I,[role]);
        AndiData.attachDataToElement(table);
    }
    $(table).find("[andi508-temporaryhide]").each(function(){
        $(this)
            .css("display", $(this).attr("andi508-temporaryhide"))
            .removeAttr("andi508-temporaryhide");
    });
}

uANDI.viewList_tableReady = false;
uANDI.viewList_buttonAppended = false;

//This function will build the Table List html and inject into the ANDI Bar
uANDI.viewList_buildTable = function(){

    //Build scrollable container and table head
    var appendHTML = "<div id='uANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'>"+
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
        var role = $(table).getValidRole();
        if(role === "presentation" || role === "none"){
            tableName = "<span style='font-style:italic'>Presentation Table</span>";
            namingMethod = "";
        }
        else if(role && role !== "table" && role !== "grid" && role !== "treegrid"){
            tableName = "<span style='font-style:italic'>Not Recognized as a Data Table</span>";
            namingMethod = "";
        }
        else{
            tableName = grabTextFromAriaLabelledbyReferences(table);
            namingMethod = "aria-labelledby";
            if(!tableName){
                tableName = cleanUp($(table).attr("aria-label"));
                namingMethod = "aria-label";
            }
            if(!tableName){
                tableName = cleanUp($(table).find("caption").filter(":visible").first().text());
                namingMethod = "&lt;caption&gt;";
            }
            if(!tableName){
                tableName = cleanUp($(table).attr("summary"));
                namingMethod = "summary";
            }
            if(!tableName){
                tableName = cleanUp($(table).attr("title"));
                namingMethod = "title";
            }

            //No Name, check if preceeded by heading
            if(!tableName){
                var prevElement = $(table).prev();
                if($(prevElement).is("h1,h2,h3,h4,h5,h6")){
                    tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='"+icons_url+"caution.png' /> "+
                        "Data Table with No Name, but Preceded by Heading: </span>"+
                        cleanUp($(prevElement).text());
                    namingMethod = "&lt;"+$(prevElement).prop("tagName").toLowerCase()+"&gt;";
                }
            }

            //No Name
            if(!tableName){
                tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='"+icons_url+"caution.png' /> "+
                "Data Table with No Name</span>";
                namingMethod = "<span class='ANDI508-display-caution'>None</span>";
            }
        }
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
uANDI.viewList_attachEvents = function(){
    //Add focus click to each link (output) in the table
    $("#ANDI508-viewList-table td a").each(function(){
        andiLaser.createLaserTrigger($(this),$(tableArray[$(this).attr("data-andi508-relatedtable")]));
    })
    .click(function(){//Jump to this table
        //Make this link appear selected
        uANDI.reset();
        activeTableIndex = $(this).attr("data-andi508-relatedtable");
        analyzeTable(tableArray[activeTableIndex]);
        uANDI.results();
        andiFocuser.focusByIndex(1);
        uANDI.redoMarkup();
        uANDI.viewList_highlightSelectedTable(activeTableIndex, false);
        andiResetter.resizeHeights();
        return false;
    });
};

//This function highlights the active table in the table list
//index: refers to the index of the table in the tableArray
uANDI.viewList_highlightSelectedTable = function(index, scrollIntoView){
    if(uANDI.viewList_tableReady){
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
uANDI.viewList_toggle = function(btn){
    if($(btn).attr("aria-expanded") === "false"){
        //show List, hide alert list
        $("#ANDI508-alerts-list").hide();
        andiSettings.minimode(false);
        $(btn)
            .addClass("ANDI508-viewOtherResults-button-expanded")
            .html(listIcon+"hide table list")
            .attr("aria-expanded","true")
            .find("img").attr("src",icons_url+"list-on.png");
        $("#uANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
        AndiModule.activeActionButtons.viewTableList = true;
    }
    else{
        //hide List, show alert list
        $("#uANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
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
    $("#ANDI508-testPage [data-uANDI508-colindex]").each(function(){
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
uANDI.redoMarkup = function(){
    if(AndiModule.activeActionButtons.markup){
        andiOverlay.overlayButton_off("overlay",$("#ANDI508-markup-button"));
        andiOverlay.removeOverlay("ANDI508-overlay-tableMarkup");
        $("#ANDI508-markup-button").click();
    }
};

uANDI.grab_headers = function(element, elementData, table){
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
function PresentationTable(elementList, index, role, name, rowClass) {
    this.elementList  = elementList;
    this.index        = index;
    this.role         = role;
    this.name         = name;
    this.columnValues = [elementList, index, role, name];
    this.rowClass     = rowClass;
}

//This object class is used to keep track of the presentation tables on the page
function PresentationTables() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["element", "index", "role", "name"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode = "Presentation Tables";
    this.cssProperties = [];
    this.buttonTextList = [];
    this.tabsTextList = [];
}

uANDI.presentationTables = new PresentationTables();
uANDI.tableInfo = new TableInfo();

//analyze tables
uANDI.analyze(uANDI.presentationTables);
uANDI.results(uANDI.presentationTables);

AndiModule.engageActiveActionButtons([
    "viewTableList",
    "markup"
]);

}//end init
