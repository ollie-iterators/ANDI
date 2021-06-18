//=========================================//
//vANDI: presentation tables ANDI          //
//Created By Social Security Administration//
//=========================================//

function init_module() {

    var vandiVersionNumber = "11.1.0";

    //create vANDI instance
    var vANDI = new AndiModule(vandiVersionNumber, "v");

    //a scope at this depth level triggers an alert
    vANDI.scopeLevelLimit = 4;

    //Delimeter for the the header cells
    vANDI.associatedHeaderCellsDelimeter = " <span aria-hidden='true'>|</span> ";

    //This function updates the Active Element Inspector when mouseover is on a given to a highlighted element.
    //Holding the shift key will prevent inspection from changing.
    AndiModule.hoverability = function (event) {
        //When hovering, inspect the cells of the data table, not the table itself. Unless it's a presentation table
        if (!event.shiftKey && !$(this).is("table:not([role=presentation],[role=none]),[role=table],[role=grid],[role=treegrid]"))
            AndiModule.inspect(this);
    };

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeClass("vANDI508-highlight").removeAttr("data-vandi508-rowindex data-vandi508-colindex data-vandi508-rowgroupindex data-vandi508-colgroupindex");
        } else {
            $(testPage).find("tr[data-vandi508-colgroupsegment]").removeAttr("data-vandi508-colgroupsegment");
            $("#ANDI508-prevTable-button").remove();
            $("#ANDI508-nextTable-button").remove();
        }
    };

    //Override Previous Element Button to jump to and analyze the previous table:
    $("#ANDI508-button-prevElement").off("click").click(function () {
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
        if (isNaN(index)) { //no active element yet
            activeTableIndex = 0;
            andiFocuser.focusByIndex(testPageData.andiElementIndex); //first element
        } else if (index == 1) {
            if (tableCountTotal <= 1) { //If there is only 1 table, loop back to last cell
                andiFocuser.focusByIndex(testPageData.andiElementIndex);
            } else { //Analyze previous table
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
    $("#ANDI508-button-nextElement").off("click").click(function () {
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
        if (index == testPageData.andiElementIndex || isNaN(index)) {
            if (tableCountTotal <= 1)
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
        scopeMode: true, //default, false == headersIdMode
        markup: false,
        viewTableList: false,
        modeButtonsVisible: false
    });

    //This function will analyze the test page for table related markup relating to accessibility
    vANDI.analyze = function () {
        if (TestPageData.page_using_table) {
            //Loop through each visible table
            var activeElementFound = false;
            $(TestPageData.allElements).filter("table").each(function () {
                //Store this table in the array
                tableArray.push($(this));

                //Is this a presentation table?
                if ($(this).is("[role=presentation],[role=none]")) {
                    //It's a presentation table
                    presentationTablesCount++;
                } else if ($(this).isSemantically("", "table")) {
                    //It's a data table
                    dataTablesCount++;
                } else {
                    //It table with a non-typical role
                    presentationTablesCount++;
                }

                //Determine if this is a refresh of vANDI (there is an active element)
                if (!activeElementFound &&
                    ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length)) {
                    activeTableIndex = tableCountTotal;//set this index to this table
                    activeElementFound = true;
                }

                tableCountTotal++;
            });

            //If the page has tables

            var moduleActionButtons = "";

            //Scope Mode / Headers/ID Mode buttons
            moduleActionButtons += "<button id='ANDI508-scopeMode-button' aria-pressed='";
            moduleActionButtons += (AndiModule.activeActionButtons.scopeMode) ? "true' class='ANDI508-module-action-active'" : "false'";
            moduleActionButtons += ">scope mode</button><button id='ANDI508-headersIdMode-button' aria-pressed='";
            moduleActionButtons += (!AndiModule.activeActionButtons.scopeMode) ? "true' class='ANDI508-module-action-active'" : "false'";
            moduleActionButtons += ">headers/id mode</button>";

            //Markup Overlay Button
            moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-markup-button' aria-label='Markup Overlay' aria-pressed='false'>markup" + overlayIcon + "</button>";

            $("#ANDI508-module-actions").html(moduleActionButtons);

            if (!activeElementFound)
                activeTableIndex = 0;//Analyze first table
            analyzeTable(tableArray[activeTableIndex]);

            //If there are more than one table and prevTable/nextTable buttons haven't yet been added
            if (tableCountTotal > 1 && $("#ANDI508-prevTable-button").length === 0) {
                //Add "prev table" and "next table" buttons
                $("#ANDI508-elementControls").append(
                    "<button id='ANDI508-prevTable-button' aria-label='Previous Table' title='Analyze Previous Table'><img src='" + icons_url + "prev-table.png' alt='' /></button> " +
                    "<button id='ANDI508-nextTable-button' aria-label='Next Table' title='Analyze Next Table'><img src='" + icons_url + "next-table.png' alt='' /></button>"
                );
            }

            //Define scopeMode button functionality
            $("#ANDI508-scopeMode-button").click(function () {
                andiResetter.softReset($("#ANDI508-testPage"));
                AndiModule.activeActionButtons.scopeMode = true;
                AndiModule.activeActionButtons.modeButtonsVisible = true;
                AndiModule.launchModule("u");
                andiResetter.resizeHeights();
                return false;
            });

            //Define headersIdMode button functionality
            $("#ANDI508-headersIdMode-button").click(function () {
                andiResetter.softReset($("#ANDI508-testPage"));
                AndiModule.activeActionButtons.scopeMode = false;
                AndiModule.activeActionButtons.modeButtonsVisible = true;
                AndiModule.launchModule("u");
                andiResetter.resizeHeights();
                return false;
            });

            //Define markup button functionality
            $("#ANDI508-markup-button").click(function () {
                if ($(this).attr("aria-pressed") == "false") {
                    andiOverlay.overlayButton_on("overlay", $(this));
                    andiOverlay.overlayTableMarkup();
                    AndiModule.activeActionButtons.markup = true;
                } else {
                    andiOverlay.overlayButton_off("overlay", $(this));
                    andiOverlay.removeOverlay("ANDI508-overlay-tableMarkup");
                    AndiModule.activeActionButtons.markup = false;
                }
                andiResetter.resizeHeights();
                return false;
            });

            //Define prevTable button functionality
            $("#ANDI508-prevTable-button")
                .click(function () {
                    if (activeTableIndex < 0) { //focus on first table
                        activeTableIndex = 0;
                    } else if (activeTableIndex === 0) {
                        activeTableIndex = tableArray.length - 1;
                    } else {
                        activeTableIndex--;
                    }
                    vANDI.reset();
                    analyzeTable(tableArray[activeTableIndex]);
                    vANDI.results();
                    andiFocuser.focusByIndex(1);
                    vANDI.redoMarkup();
                    vANDI.viewList_highlightSelectedTable(activeTableIndex, true);
                    andiResetter.resizeHeights();
                    return false;
                })
                .mousedown(function () {
                    $(this).addClass("ANDI508-module-action-active");
                })
                .mouseup(function () {
                    $(this).removeClass("ANDI508-module-action-active");
                });

            //Define nextTable button functionality
            $("#ANDI508-nextTable-button")
                .click(function () {
                    if (activeTableIndex == tableArray.length - 1)
                        activeTableIndex = 0;
                    else
                        activeTableIndex++;

                    vANDI.reset();
                    analyzeTable(tableArray[activeTableIndex]);
                    vANDI.results();
                    andiFocuser.focusByIndex(1);
                    vANDI.redoMarkup();
                    vANDI.viewList_highlightSelectedTable(activeTableIndex, true);
                    andiResetter.resizeHeights();
                    return false;
                })
                .mousedown(function () {
                    $(this).addClass("ANDI508-module-action-active");
                })
                .mouseup(function () {
                    $(this).removeClass("ANDI508-module-action-active");
                });
        }
    };

    //This function updates the results in the ANDI Bar
    vANDI.results = function () {

        //Update Results Summary text depending on the active table type (data or presentation)
        andiBar.updateResultsSummary("Tables: " + tableCountTotal + " (data tables: " + dataTablesCount + ", presentation tables: " + presentationTablesCount + ")");

        if (tableCountTotal > 0) {
            if (!vANDI.viewList_buttonAppended) {
                $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewTableList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view table list</button>");

                //viewTableList Button
                $("#ANDI508-viewTableList-button").click(function () {
                    if (!vANDI.viewList_tableReady) {
                        vANDI.viewList_buildTable();
                        vANDI.viewList_attachEvents();
                        vANDI.viewList_tableReady = true;
                    }
                    vANDI.viewList_toggle(this);
                    andiResetter.resizeHeights();
                    return false;
                });

                vANDI.viewList_buttonAppended = true;
            }
        }

        if (dataTablesCount > 0) {
            andiBar.showElementControls();
            if (!andiBar.focusIsOnInspectableElement()) {
                var startupMessage = "Discover accessibility markup for <span class='ANDI508-module-name-t'>tables</span> by tabbing to or hovering over the table cells. " +
                    "Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every data table cell. ";
                if (dataTablesCount + presentationTablesCount > 1)
                    startupMessage += "Tables should be tested one at a time - Press the next table button <img src='" + icons_url + "next-table.png' style='width:12px' alt='' /> to cycle through the tables.";
                andiBar.showStartUpSummary(startupMessage, true);
            }
            else
                $("#ANDI508-pageAnalysis").show();
        } else if (presentationTablesCount > 0) {
            andiBar.showElementControls();
            if (!andiBar.focusIsOnInspectableElement()) {
                andiBar.showStartUpSummary("Only <span class='ANDI508-module-name-t'>presentation tables</span> were found on this page, no data tables.", true);
            } else {
                $("#ANDI508-pageAnalysis").show();
            }
        }
        andiAlerter.updateAlertList();
        if (!AndiModule.activeActionButtons.viewTableList && testPageData.numberOfAccessibilityAlertsFound > 0)
            $("#ANDI508-alerts-list").show();
        else
            $("#ANDI508-alerts-list").hide();
    };

    //This function will inspect a table or table cell
    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);

        //Remove other vANDI highlights
        $("#ANDI508-testPage .vANDI508-highlight").removeClass("vANDI508-highlight");
        //Highlight This Element
        $(element).addClass("vANDI508-highlight");

        var associatedHeaderCellsText = (!$(element).is("table,[role=table],[role=grid],[role=treegrid]")) ? grabHeadersAndHighlightRelatedCells(element) : "";

        var elementData = $(element).data("andi508");

        if (associatedHeaderCellsText) {
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
                "aria-rowindex",
                "aria-colspan",
                "aria-rowspan"
            ]);

        andiBar.displayOutput(elementData, element, addOnProps);

        //insert the associatedHeaderCellsText into the output if there are no danger alerts
        if (associatedHeaderCellsText && elementData.dangers.length === 0) {
            var outputText = document.getElementById("ANDI508-outputText");
            $(outputText).html(associatedHeaderCellsText + " " + $(outputText).html());
        }

        andiBar.displayTable(elementData, element, addOnProps);

        //This function will grab associated header cells and add highlights
        function grabHeadersAndHighlightRelatedCells(element) {
            var accumulatedHeaderText = "";
            var accumulatedHeaderTextArray = []; //will store each text block so it can be compared against
            var table = $(element).closest("table,[role=table],[role=grid],[role=treegrid]");
            var rowIndex = $(element).attr("data-vandi508-rowindex");
            var colIndex = $(element).attr("data-vandi508-colindex");
            var colgroupIndex = $(element).attr("data-vandi508-colgroupindex");
            var rowgroupIndex = $(element).attr("data-vandi508-rowgroupindex");

            //Update activeTableIndex to this element's table.
            //activeTableIndex = $(table).attr("data-andi508-index") - 1;

            //Find Related <th> cells
            //==HEADERS/ID MODE==//
            if (!AndiModule.activeActionButtons.scopeMode) {
                //if the inspected element has headers attribute
                var headers = $.trim($(element).attr("headers"));
                var idsArray;
                if (headers) {
                    idsArray = headers.split(" ");
                    var referencedElement;
                    for (var x = 0; x < idsArray.length; x++) {
                        //Can the id be found somewhere on the page?
                        referencedElement = document.getElementById(idsArray[x]);

                        if ($(referencedElement).html() !== undefined &&
                            ($(referencedElement).is("th") || $(referencedElement).is("td")) &&
                            $(referencedElement).closest("table").is(table)
                        ) {	//referencedElement exists, is a table cell, and is within the same table
                            addHighlight(referencedElement, true);
                        }
                    }
                }
                //if the inspected element is a th, find the id references
                if ($(element).is("th")) {
                    var id = $(element).attr("id");
                    if (id) {
                        $(table).find("th.ANDI508-element:not(.vANDI508-highlight),td.ANDI508-element:not(.vANDI508-highlight)").filter(":visible").each(function () {
                            headers = $(this).attr("headers");
                            if (headers) {
                                idsArray = headers.split(" ");
                                for (var x = 0; x < idsArray.length; x++) {
                                    if (id == idsArray[x])
                                        addHighlight(this);
                                }
                            }
                        });
                    }
                }
                //==SCOPE MODE==//
            } else if (AndiModule.activeActionButtons.scopeMode) {

                //Create vars for the looping that's about to happen
                var s, ci, ri;
                var row_index_matches, col_index_matches, isSameColgroup, isSameRowgroup;

                //if inspected element is a td
                if ($(element).is("td")) {
                    //Highlight associating <th> for this <td>
                    $(table).find("th.ANDI508-element").filter(":visible").each(function () {
                        s = $(this).attr("scope");
                        ci = $(this).attr("data-vandi508-colindex");
                        ri = $(this).attr("data-vandi508-rowindex");

                        //get associated th from col
                        if (s != "row" && s != "rowgroup" &&
                            (!colgroupIndex || (colgroupIndex == $(this).attr("data-vandi508-colgroupindex"))) &&
                            index_match(colIndex, ci) && !index_match(rowIndex, ri)) {
                            addHighlight(this, true);
                            //get associated th from row
                        } else if (s != "col" && s != "colgroup" &&
                            (!rowgroupIndex || (rowgroupIndex == $(this).attr("data-vandi508-rowgroupindex"))) &&
                            index_match(rowIndex, ri) && !index_match(colIndex, ci)) {
                            addHighlight(this, true);
                        }
                    });
                    //if inspected element is a th
                } else if ($(element).is("th")) {
                    //Highlight associating <th> and <td> for this <th>
                    var scope = $(element).attr("scope");
                    var cgi, rgi;
                    $(table).find("th.ANDI508-element,td.ANDI508-element").filter(":visible").each(function () {
                        s = $(this).attr("scope");
                        ci = $(this).attr("data-vandi508-colindex");
                        ri = $(this).attr("data-vandi508-rowindex");
                        cgi = $(this).attr("data-vandi508-colgroupindex");
                        rgi = $(this).attr("data-vandi508-rowgroupindex");
                        row_index_matches = index_match(rowIndex, ri);
                        col_index_matches = index_match(colIndex, ci);
                        isSameColgroup = (!colgroupIndex || colgroupIndex == cgi);
                        isSameRowgroup = (!rowgroupIndex || rowgroupIndex == rgi);
                        if ($(this).is("th") && s) {
                            //get associated th from column
                            if (col_index_matches && !row_index_matches) {
                                if (isSameColgroup && (s == "col" || s == "colgroup")) {
                                    addHighlight(this, true);
                                }
                                //get associated th from row
                            } else if (row_index_matches && !col_index_matches) {
                                if (isSameRowgroup && (s == "row" || s == "rowgroup")) {
                                    addHighlight(this, true);
                                }
                            }
                        }

                        if (scope) { //th has scope
                            if (isSameColgroup && scope === "col" && col_index_matches) {
                                addHighlight(this);
                            } else if (scope === "row" && row_index_matches) {
                                addHighlight(this);
                            } else if (isSameColgroup && scope === "colgroup" && col_index_matches) {
                                if ($(element).parent().attr("data-vandi508-colgroupsegment")) {
                                    if (colgroupIndex == cgi)
                                        addHighlight(this);
                                } else {
                                    addHighlight(this);
                                }
                            } else if (scope === "rowgroup" && row_index_matches && rowgroupIndex == rgi)
                                addHighlight(this);
                        } else { //th has no scope
                            //**Assumed associations - this is where it gets sketchy**
                            if ($(this).is("td")) {
                                if (col_index_matches || row_index_matches)
                                    addHighlight(this);
                            } else if ($(this).is("th")) { //No scope assumptions relating to other th
                                if (rowIndex === "0" && col_index_matches)
                                    addHighlight(this);
                            }
                        }

                    });
                } else if (
                    ($(element).is("[role=cell]") && $(table).attr("role") === "table") ||
                    ($(element).is("[role=gridcell]") && ($(table).attr("role") === "grid" || $(table).attr("role") === "treegrid"))
                ) {
                    $(table).find("[role=columnheader].ANDI508-element,[role=rowheader].ANDI508-element").filter(":visible").each(function () {
                        ci = $(this).attr("data-vandi508-colindex");
                        ri = $(this).attr("data-vandi508-rowindex");
                        //alert(colIndex+" "+rowIndex+" |"+ci+ri)
                        //Highlight associating columnheader for this cell
                        if (index_match(colIndex, ci) && !index_match(rowIndex, ri)) {
                            addHighlight(this, true);
                        }
                        //Highlight associating rowheader for this cell
                        if (index_match(rowIndex, ri) && !index_match(colIndex, ci)) {
                            addHighlight(this, true);
                        }
                    });
                } else if ($(element).is("[role=columnheader],[role=rowheader]")) {
                    s = ($(element).is("[role=columnheader]")) ? "col" : "row";
                    $(table).find(".ANDI508-element").filter(":visible").each(function () {
                        ci = $(this).attr("data-vandi508-colindex");
                        ri = $(this).attr("data-vandi508-rowindex");
                        row_index_matches = index_match(rowIndex, ri);
                        col_index_matches = index_match(colIndex, ci);

                        if ($(this).is("[role=columnheader]")) {
                            //get associated th from columnheaders in this col
                            if (col_index_matches && !row_index_matches) {
                                addHighlight(this, true);
                            }
                        }
                        else if ($(this).is("[role=rowheader]")) {
                            //get associated th from rowheaders in this row
                            if (row_index_matches && !col_index_matches) {
                                addHighlight(this, true);
                            }
                        }

                        if (s === "col") {
                            //highlight cells in this col
                            if (col_index_matches) {
                                addHighlight(this);
                            }
                        }
                        else { // s === "row"
                            //highlight cells in this row
                            if (row_index_matches) {
                                addHighlight(this);
                            }
                        }

                    });
                }
            }

            //This functoin will add the highlight to the element
            //if updateAssociatedHeaderCellsText is true it will add the text to the header cells
            function addHighlight(element, updateAssociatedHeaderCellsText) {
                $(element).addClass("vANDI508-highlight");
                if (updateAssociatedHeaderCellsText) {
                    var text = andiUtility.formatForHtml(andiUtility.getVisibleInnerText(element));
                    //Check if this block of text has already been added (duplicate header)
                    if (accumulatedHeaderTextArray.indexOf(text) === -1) {
                        accumulatedHeaderTextArray.push(text);
                        accumulatedHeaderText += text + vANDI.associatedHeaderCellsDelimeter;
                    }
                }
            }
            return accumulatedHeaderText;
        }
    };

    //This function will remove vANDI markup from every table and rebuild the alert list
    vANDI.reset = function () {
        var testPage = document.getElementById("ANDI508-testPage");

        //Every ANDI508-element
        $(testPage).find(".ANDI508-element").each(function () {
            $(this)
                .removeClass("vANDI508-highlight")
                .removeAttr("data-andi508-index data-vandi508-rowindex data-vandi508-colindex data-vandi508-colgroupindex data-vandi508-rowgroupindex")
                .removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
                .removeData("ANDI508")
                .off("focus", AndiModule.focusability)
                .off("mouseenter", AndiModule.hoverability);
        });

        andiLaser.cleanupLaserTargets(testPage);

        $("#ANDI508-alerts-list").html("");

        testPageData = new TestPageData(); //get fresh test page data
    };

    //This function hides the scopeMode headersIdMode buttons
    vANDI.hideModeButtons = function () {
        AndiModule.activeActionButtons.modeButtonsVisible = false;
        $("#ANDI508-scopeMode-button").add("#ANDI508-headersIdMode-button").add($("#ANDI508-markup-button").prev())
            .addClass("ANDI508-module-action-hidden");
    };
    //This function shows the scopeMode headersIdMode buttons
    vANDI.showModeButtons = function (mode) {
        AndiModule.activeActionButtons.modeButtonsVisible = true;
        var scopeModeButton = document.getElementById("ANDI508-scopeMode-button");
        var headersIdButton = document.getElementById("ANDI508-headersIdMode-button");

        //activeButton
        $((mode === "scope") ? scopeModeButton : headersIdButton)
            .addClass("ANDI508-module-action-active").attr("aria-pressed", "true");

        //inactiveButton
        $((mode === "scope") ? headersIdButton : scopeModeButton)
            .removeClass("ANDI508-module-action-active").attr("aria-pressed", "false");

        //show the buttons
        $(scopeModeButton).add(headersIdButton).add($("#ANDI508-markup-button").prev())
            .removeClass("ANDI508-module-action-hidden");
    };

    //This function will a table. Only one table at a time
    function analyzeTable(table) {

        var role = $.trim($(table).attr("role"));

        //temporarily hide any nested tables so they don't interfere with analysis
        $(table).find("table,[role=table],[role=grid],[role=treegrid]").each(function () {
            $(this)
                .attr("andi508-temporaryhide", $(this).css("display"))
                .css("display", "none");
        });

        rowCount = 0;
        colCount = 0;
        var row, cell;
        var colIndex, rowIndex, colspan, rowspan;
        var child;

        //loop through the <table> and set data-* attributes
        //Each cell in a row is given a rowIndex
        //Each cell in a column is given a colIndex

        //The way vANDI analyzes the table is that it begins looking at the cells first
        //to determine if there is any existing scenarios that should trigger an alert.
        //When each cell has been evaluated, it will then attach alerts to the table element.

        //These variables keep track of properties of the table

        var thCount = 0;
        var tdCount = 0;
        var hasThRow = false;		//true when there are two or more th in a row
        var hasThCol = false;		//true when two or more rows contain a th
        var scopeRequired = false;	//true when scope is required for this table
        var tableHasScopes = false;	//true when cells in the table have scope
        var tableHasHeaders = false;//true when cells in the table have headers
        var scope, headers;
        var tooManyScopeRowLevels = false;
        var scopeRowLevel = ["", "", ""];
        var tooManyScopeColLevels = false;
        var scopeColLevel = ["", "", ""];
        var colgroupIndex = 0;
        var rowgroupIndex = 0;

        //Cache the visible elements (performance)
        var all_rows = $(table).find("tr").filter(":visible");
        var all_th = $(all_rows).find("th").filter(":visible");
        var all_cells = $(all_rows).find("th,td").filter(":visible");

        if (role === "presentation" || role === "none") {
            //==PRESENTATION TABLE==//
            andiData = new AndiData(table[0]);
            andiCheck.commonNonFocusableElementChecks(andiData, $(table));

            var presentationTablesShouldNotHave = "";

            if ($(table).find("caption").filter(":visible").first().length)
                presentationTablesShouldNotHave += "a &lt;caption&gt;, ";

            if ($(all_th).first().length)
                presentationTablesShouldNotHave += "&lt;th&gt; cells, ";

            cellCount = 0;

            var presTableWithScope = false;
            var presTableWithHeaders = false;
            $(all_cells).each(function () {
                cellCount++;
                if ($(this).attr("scope"))
                    presTableWithScope = true;
                if ($(this).attr("headers"))
                    presTableWithHeaders = true;
            });

            if (presTableWithScope)
                presentationTablesShouldNotHave += "cells with [scope] attributes, ";
            if (presTableWithHeaders)
                presentationTablesShouldNotHave += "cells with [headers] attributes, ";

            if ($(table).attr("summary"))
                presentationTablesShouldNotHave += "a [summary] attribute, ";

            if (presentationTablesShouldNotHave)
                andiAlerter.throwAlert(alert_0041, [presentationTablesShouldNotHave.slice(0, -2)]);

            AndiData.attachDataToElement(table);

            vANDI.hideModeButtons();
            AndiModule.activeActionButtons.scopeMode = true;
        }
        else if ($.trim(role) && role !== "table" && role !== "grid" && role !== "treegrid") {
            //==TABLE WITH NONTYPICAL ROLE==//
            andiData = new AndiData(table[0]);
            andiAlerter.throwAlert(alert_004I, [role]);
            AndiData.attachDataToElement(table);
        }

        $(table).find("[andi508-temporaryhide]").each(function () {
            $(this)
                .css("display", $(this).attr("andi508-temporaryhide"))
                .removeAttr("andi508-temporaryhide");
        });
    }

    vANDI.viewList_tableReady = false;
    vANDI.viewList_buttonAppended = false;

    //This function will build the Table List html and inject into the ANDI Bar
    vANDI.viewList_buildTable = function () {

        //Build scrollable container and table head
        var appendHTML = "<div id='vANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='List of Tables' tabindex='-1'><thead><tr>" +
            "<th scope='col' style='width:10%'>#</th>" +
            "<th scope='col' style='width:75%'>Table&nbsp;Name</th>" +
            "<th scope='col' style='width:15%'>Naming&nbsp;Method</th>" +
            "</tr></thead><tbody>";

        //Build table body
        var tableName;
        for (var x = 0; x < tableArray.length; x++) {
            appendHTML += "<tr";
            //Highlight the select table
            if ($(tableArray[x]).hasClass("ANDI508-element"))
                appendHTML += " class='ANDI508-table-row-inspecting' aria-selected='true'";

            tableName = preCalculateTableName(tableArray[x]);

            appendHTML += "><th scope='role'>" + parseInt(x + 1) + "</th><td>" +
                "<a href='javascript:void(0)' data-andi508-relatedtable='" + x + "'>" +
                tableName[0] + "</a></td><td style='font-family:monospace'>" + tableName[1] + "</td></tr>";
        }

        //Insert into ANDI Bar
        appendHTML += "</tbody></table></div></div>";
        $("#ANDI508-additionalPageResults").append(appendHTML);

        //This function precalculates the table name
        //Returns an array with the tableName and the namingMethodUsed
        function preCalculateTableName(table) {
            var tableName, namingMethod;
            var role = $.trim($(table).attr("role"));
            if (role === "presentation" || role === "none") {
                tableName = "<span style='font-style:italic'>Presentation Table</span>";
                namingMethod = "";
            }
            else if (role && role !== "table" && role !== "grid" && role !== "treegrid") {
                tableName = "<span style='font-style:italic'>Not Recognized as a Data Table</span>";
                namingMethod = "";
            }
            else {
                tableName = grabTextFromAriaLabelledbyReferences(table);
                namingMethod = "aria-labelledby";
                if (!tableName) {
                    tableName = cleanUp($(table).attr("aria-label"));
                    namingMethod = "aria-label";
                }
                if (!tableName) {
                    tableName = cleanUp($(table).find("caption").filter(":visible").first().text());
                    namingMethod = "&lt;caption&gt;";
                }
                if (!tableName) {
                    tableName = cleanUp($(table).attr("summary"));
                    namingMethod = "summary";
                }
                if (!tableName) {
                    tableName = cleanUp($(table).attr("title"));
                    namingMethod = "title";
                }

                //No Name, check if preceeded by heading
                if (!tableName) {
                    var prevElement = $(table).prev();
                    if ($(prevElement).is("h1,h2,h3,h4,h5,h6")) {
                        tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='" + icons_url + "caution.png' /> " +
                            "Data Table with No Name, but Preceded by Heading: </span>" +
                            cleanUp($(prevElement).text());
                        namingMethod = "&lt;" + $(prevElement).prop("tagName").toLowerCase() + "&gt;";
                    }
                }

                //No Name
                if (!tableName) {
                    tableName = "<span class='ANDI508-display-caution'><img alt='Caution: ' src='" + icons_url + "caution.png' /> " +
                        "Data Table with No Name</span>";
                    namingMethod = "<span class='ANDI508-display-caution'>None</span>";
                }
            }
            return [tableName, namingMethod];

            function cleanUp(text) {
                return andiUtility.formatForHtml($.trim(text));
            }

            //This function gets the text from the aria-labelledby references
            //TODO: some code is being duplicated here. Difference here is that alerts aren't needed
            function grabTextFromAriaLabelledbyReferences(element) {
                var ids = $.trim($(element).attr("aria-labelledby"));//get the ids to search for
                var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
                var accumulatedText = "";//this variable is going to store what is found. And will be returned
                var referencedId, referencedElement, referencedElementText;
                //Traverse through the array
                for (var x = 0; x < idsArray.length; x++) {
                    //Can the aria list id be found somewhere on the page?
                    if (idsArray[x] !== "") {
                        referencedElement = document.getElementById(idsArray[x]);
                        referencedElementText = "";
                        if ($(referencedElement).attr("aria-label"))//Yes, this id was found and it has an aria-label
                            referencedElementText += andiUtility.formatForHtml($(referencedElement).attr("aria-label"));
                        else if ($(referencedElement).html() !== undefined)//Yes, this id was found and the reference contains something
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
    vANDI.viewList_attachEvents = function () {
        //Add focus click to each link (output) in the table
        $("#ANDI508-viewList-table td a").each(function () {
            andiLaser.createLaserTrigger($(this), $(tableArray[$(this).attr("data-andi508-relatedtable")]));
        })
            .click(function () {//Jump to this table
                //Make this link appear selected
                vANDI.reset();
                activeTableIndex = $(this).attr("data-andi508-relatedtable");
                analyzeTable(tableArray[activeTableIndex]);
                vANDI.results();
                andiFocuser.focusByIndex(1);
                vANDI.redoMarkup();
                vANDI.viewList_highlightSelectedTable(activeTableIndex, false);
                andiResetter.resizeHeights();
                return false;
            });
    };

    //This function highlights the active table in the table list
    //index: refers to the index of the table in the tableArray
    vANDI.viewList_highlightSelectedTable = function (index, scrollIntoView) {
        if (vANDI.viewList_tableReady) {
            var activeTableFound = false;
            $("#ANDI508-viewList-table td a").each(function () {
                if (!activeTableFound && $(this).attr("data-andi508-relatedtable") == index) {
                    //this is the active table
                    $(this).attr("aria-selected", "true").closest("tr").addClass("ANDI508-table-row-inspecting");
                    if (scrollIntoView)
                        this.scrollIntoView();
                    activeTableFound = true;
                }
                else//not the active table
                    $(this).removeAttr("aria-selected").closest("tr").removeClass();
            });
        }
    };

    //This function hide/shows the view list
    vANDI.viewList_toggle = function (btn) {
        if ($(btn).attr("aria-expanded") === "false") {
            //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide table list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#vANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            AndiModule.activeActionButtons.viewTableList = true;
        }
        else {
            //hide List, show alert list
            $("#vANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();
            if (testPageData.numberOfAccessibilityAlertsFound > 0)
                $("#ANDI508-alerts-list").show();
            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view table list")
                .attr("aria-expanded", "false");
            AndiModule.activeActionButtons.viewTableList = false;
        }
    };

    //This function will overlay the table markup.
    AndiOverlay.prototype.overlayTableMarkup = function () {
        var scope, headers, id, role, markupOverlay;
        $("#ANDI508-testPage [data-vandi508-colindex]").each(function () {
            scope = $(this).attr("scope");
            headers = $(this).attr("headers");
            id = this.id;
            role = $(this).attr("role");

            markupOverlay = $(this).prop("tagName").toLowerCase();

            if (role)
                markupOverlay += " role=" + role;
            if (id)
                markupOverlay += " id=" + id;
            if (headers)
                markupOverlay += " headers=" + headers;
            if (scope)
                markupOverlay += " scope=" + scope;

            $(this).prepend(andiOverlay.createOverlay("ANDI508-overlay-tableMarkup", markupOverlay));
        });
    };

    //This function will detect if markup button should be re-pressed
    vANDI.redoMarkup = function () {
        if (AndiModule.activeActionButtons.markup) {
            andiOverlay.overlayButton_off("overlay", $("#ANDI508-markup-button"));
            andiOverlay.removeOverlay("ANDI508-overlay-tableMarkup");
            $("#ANDI508-markup-button").click();
        }
    };

    //This function returns true if any index match is found.
    //The colIndex/rowIndex could contain a space delimited array
    function index_match(a, b) {
        var match = false;
        var aX = buildArrayOnIndex(a);
        var bY = buildArrayOnIndex(b);

        //compare
        for (var x = 0; x < aX.length; x++) {
            for (var y = 0; y < bY.length; y++) {
                if (aX[x] == bY[y]) {
                    match = true;
                    break;
                }
            }
        }
        return match;
    }
    //This function returns true if any indexes in "a" are greater than "b".
    //The colIndex/rowIndex could contain a space delimited array
    function index_greaterThan(a, b) {
        var greaterThan = false;
        var aX = buildArrayOnIndex(a);
        var bY = buildArrayOnIndex(b);

        //compare
        for (var x = 0; x < a.length; x++) {
            for (var y = 0; y < b.length; y++) {
                if (aX[x] > bY[y]) {
                    greaterThan = true;
                    break;
                }
            }
        }
        return greaterThan;
    }

    //This function will build an array based on the value passed in.
    //If it is space delimited it returns an array greater than 1.
    //If it is not space delimited it returns an array of length 1.
    //This is mainly done to fix an IE7 bug with array handling.
    function buildArrayOnIndex(value) {
        if (value.toString().includes(" "))
            return value.split(" ");
        else
            return [value];
    }

    //analyze tables
    vANDI.analyze();
    vANDI.results();

    AndiModule.engageActiveActionButtons([
        "viewTableList",
        "markup"
    ]);

}//end init
