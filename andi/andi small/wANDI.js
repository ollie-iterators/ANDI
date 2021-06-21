//=========================================//
//wANDI: data tables ANDI (short code)     //
//Created By Social Security Administration//
//=========================================//

function init_module() {

    var wANDIVersionNumber = "11.1.0";

    //create wANDI instance
    var wANDI = new AndiModule(wANDIVersionNumber, "w");

    //a scope at this depth level triggers an alert
    wANDI.scopeLevelLimit = 4;

    //Delimeter for the the header cells
    wANDI.associatedHeaderCellsDelimeter = " <span aria-hidden='true'>|</span> ";

    //These variables are for the page
    var tableCountTotal = 0;			//The total number of tables
    var dataTablesCount = 0;			//The total number of data tables (tables that aren't presentation tables)
    var tableArray = [];				//Stores all tables in an array
    var activeTableIndex = -1;			//The array index of the active table

    //These variables are for the current table being analyzed (the active table)
    var cellCount = 0;					//The total number of <th> and <td>
    var rowCount = 0;					//The total number of <tr>
    var colCount = 0;					//The total number of columns (maximum number of <th> or <td> in a <tr>)

    //This function will analyze the test page for table related markup relating to accessibility
    wANDI.analyze = function () {
        //Loop through each visible table
        var activeElementFound = false;
        $(TestPageData.allElements).filter("table,[role=table],[role=grid],[role=treegrid]").each(function () {
            //Store this table in the array
            tableArray.push($(this));

            if ($(this).isSemantically("[role=table],[role=grid],[role=treegrid]", "table")) {
                //It's a data table
                dataTablesCount++;
            }

            //Determine if this is a refresh of wANDI (there is an active element)
            if (!activeElementFound &&
                ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length)) {
                activeTableIndex = tableCountTotal;//set this index to this table
                activeElementFound = true;
            }

            tableCountTotal++;
        });

        if (!activeElementFound)
            activeTableIndex = 0;//Analyze first table
        analyzeTable(tableArray[activeTableIndex]);
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
        var rowIndexPlusRowspan, colIndexPlusColspan;
        var indexValue;
        var child;

        if (role === "table" || ((role === "grid" || role === "treegrid") && $(table).find("[role=gridcell]").first().length)) {
            //if role=table or role=grid and has a descendent with role=gridcell
        }
        else {
            //loop through the <table> and set data-* attributes
            //Each cell in a row is given a rowIndex
            //Each cell in a column is given a colIndex

            //The way wANDI analyzes the table is that it begins looking at the cells first
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
            var colgroupSegmentation = false;
            var colgroupSegmentation_segments = 0;
            var colgroupSegmentation_colgroupsPerRowCounter = 0;

            //This array is used to keep track of the rowspan of the previous row
            //They will be checked against before assigning the colIndex.
            //This technique is only needed for setting colIndex
            //since the rowIndex is handled more "automatically" by the <tr> tags
            var rowspanArray = [];

            //Cache the visible elements (performance)
            var all_rows = $(table).find("tr").filter(":visible");
            var all_th = $(all_rows).find("th").filter(":visible");
            var all_cells = $(all_rows).find("th,td").filter(":visible");

            //==DATA TABLE==//
            //This is a little hack to force the table tag to go first in the index
            //so that it is inspected first with the previous and next buttons.
            //Skip index 0, so that later the table can be placed at 0
            testPageData.andiElementIndex = 1;

            //Loop A (establish the rowIndex/colIndex)
            rowIndex = 0;
            var firstRow = true;

            var cells;
            $(all_rows).each(function () {
                //Reset variables for this row
                row = $(this);
                rowCount++;
                colIndex = 0;
                colgroupSegmentation_colgroupsPerRowCounter = 0;

                cells = $(row).find("th,td").filter(":visible");

                //Set colCount
                if (colCount < cells.length)
                    colCount = cells.length;

                //Figure out colIndex/rowIndex colgroupIndex/rowgroupIndex
                $(cells).each(function loopA() {
                    //Increment cell counters
                    cell = $(this);
                    if ($(cell).is("th")) {
                        thCount++;
                        if (thCount > 1)
                            hasThRow = true;
                        if (rowCount > 1)
                            hasThCol = true;

                        scope = $(cell).attr("scope");
                        if (scope) {
                            if (scope == "colgroup") {
                                //TODO: more logic here to catch misuse of colgroup
                                colgroupIndex++;
                                $(cell).attr("data-wANDI508-colgroupindex", colgroupIndex);
                                colgroupSegmentation_colgroupsPerRowCounter++;
                            }
                            else if (scope == "rowgroup") {
                                //TODO: more logic here to catch misuse of colgroup
                                rowgroupIndex++;
                                $(cell).attr("data-wANDI508-rowgroupindex", rowgroupIndex);
                            }
                        }
                    }
                    else {
                        tdCount++;
                    }

                    //get colspan
                    //TODO: mark for alert here if value is invalid
                    colspan = $(cell).attr("colspan");
                    if (colspan === undefined)
                        colspan = 1;
                    else
                        colspan = parseInt(colspan);

                    //get rowspan
                    //TODO: mark for alert here if value is invalid
                    rowspan = $(cell).attr("rowspan");
                    if (rowspan === undefined)
                        rowspan = 1;
                    else
                        rowspan = parseInt(rowspan);

                    //Increase the rowspanArray length if needed
                    if ((rowspanArray.length === 0) || (rowspanArray[colIndex] === undefined))
                        rowspanArray.push(parseInt(rowspan));
                    else
                        firstRow = false;

                    //store colIndex
                    if (!firstRow) {
                        //loop through the rowspanArray until a 1 is found
                        for (var a = colIndex; a < rowspanArray.length; a++) {
                            if (rowspanArray[a] == 1)
                                break;
                            else if (rowspanArray[a] > 1) {
                                //there is a rowspan at this colIndex that is spanning over this row
                                //decrement this item in the rowspan array
                                rowspanArray[a]--;
                                //increment the colIndex an extra amount to essentially skip this colIndex location
                                colIndex++;
                            }
                        }
                    }

                    if (colspan < 2) {
                        $(cell).attr("data-wANDI508-colindex", colIndex);
                        rowspanArray[colIndex] = rowspan;
                        colIndex++;
                    }
                    else {//colspan > 1
                        indexValue = "";
                        colIndexPlusColspan = parseInt(colIndex) + colspan;
                        for (var b = colIndex; b < colIndexPlusColspan; b++) {
                            indexValue += b + " ";
                            rowspanArray[colIndex] = rowspan;
                            colIndex++;
                        }
                        $(cell).attr("data-wANDI508-colindex", $.trim(indexValue));
                    }

                    //store rowIndex
                    if (rowspan < 2) {
                        $(cell).attr("data-wANDI508-rowindex", rowIndex);
                    }
                    else {
                        //rowspanArray[colIndex] = rowspan;
                        indexValue = "";
                        rowIndexPlusRowspan = parseInt(rowIndex) + rowspan;
                        for (var c = rowIndex; c < rowIndexPlusRowspan; c++)
                            indexValue += c + " ";
                        $(cell).attr("data-wANDI508-rowindex", $.trim(indexValue));
                    }
                });

                //Determine if table is using colgroupSegmentation
                if (colgroupSegmentation_colgroupsPerRowCounter == 1)
                    colgroupSegmentation_segments++;
                if (colgroupSegmentation_segments > 1)
                    colgroupSegmentation = true;

                //There are no more cells in this row, however, the rest of the rowspanArray needs to be decremented.
                //Decrement any additional rowspans from previous rows
                for (var d = colIndex; d < rowspanArray.length; d++) {
                    if (rowspanArray[d] > 1)
                        rowspanArray[d]--;
                }
                rowIndex++;
            });

            //Loop B - colgroup/rowgroup segementation
            if (colgroupSegmentation || rowgroupIndex > 0) {
                var lastColgroupIndex, colgroupsInThisRow, c;
                var lastRowgroupIndex, lastRowgroupRowSpan = 1;
                $(all_rows).each(function loopB() {
                    row = $(this);
                    if (colgroupSegmentation) {
                        colgroupsInThisRow = 0;
                        $(row).find("th,td").filter(":visible").each(function () {
                            if ($(this).attr("scope") == "colgroup") {
                                colgroupsInThisRow++;
                                //store this colgroupIndex to temp variable
                                c = $(this).attr("data-wANDI508-colgroupindex");
                            }
                            else if (lastColgroupIndex)
                                //set this cell's colgroupIndex
                                $(this).attr("data-wANDI508-colgroupindex", lastColgroupIndex);
                        });

                        if (colgroupsInThisRow === 1) {
                            lastColgroupIndex = c;
                            $(row).attr("data-wANDI508-colgroupsegment", "true");
                        }
                    }
                    if (rowgroupIndex > 0) {
                        $(row).find("th,td").filter(":visible").each(function () {
                            //Rowgroup
                            if ($(this).attr("scope") == "rowgroup") {
                                lastRowgroupIndex = $(this).attr("data-wANDI508-rowgroupindex");
                                //Get rowspan
                                lastRowgroupRowSpan = $(this).attr("rowspan");
                                if (!lastRowgroupRowSpan)
                                    lastRowgroupRowSpan = 1;
                            }
                            else if (lastRowgroupIndex && lastRowgroupRowSpan > 0)
                                $(this).attr("data-wANDI508-rowgroupindex", lastRowgroupIndex);
                        });
                        //Decrement lastRowgroupRowSpan
                        lastRowgroupRowSpan--;
                    }

                });
            }

            //Loop C (grab the accessibility components)
            $(all_cells).each(function loopC() {
                cell = $(this);

                //scope
                scope = $(cell).attr("scope");
                headers = $(cell).attr("headers");

                if (headers)
                    tableHasHeaders = true;

                if (scope && $(cell).is("th")) {

                    if (scope == "row" || scope == "rowgroup") {
                        tableHasScopes = true;

                        //Determine if there are "too many" scope rows
                        if (!tooManyScopeRowLevels) {
                            colIndex = $(cell).attr("data-wANDI508-colindex");
                            for (var f = 0; f <= 4; f++) {
                                if (!scopeRowLevel[f] || (!scopeRowLevel[f] && (scopeRowLevel[f - 1] != colIndex))) {
                                    //scope found at this colIndex
                                    scopeRowLevel[f] = colIndex;
                                    break;
                                }
                                else if ((f == wANDI.scopeLevelLimit) && (colIndex >= f))
                                    //scope levelLimit has been exceeeded
                                    tooManyScopeRowLevels = true;
                            }
                        }
                    }
                    else if (scope == "col" || scope == "colgroup") {
                        tableHasScopes = true;

                        //Determine if there are too many scope columns
                        if (!tooManyScopeColLevels) {
                            rowIndex = $(cell).attr("data-wANDI508-rowindex");
                            for (var g = 0; g <= wANDI.scopeLevelLimit; g++) {
                                if (!scopeColLevel[g] || (!scopeColLevel[g] && (scopeColLevel[g - 1] != rowIndex))) {
                                    //scope found at this rowIndex
                                    scopeColLevel[g] = rowIndex;
                                    break;
                                }
                                else if ((g == wANDI.scopeLevelLimit) && (rowIndex >= g))
                                    //scope levelLimit has been exceeeded
                                    tooManyScopeColLevels = true;
                            }
                        }
                    }
                }

                //FOR EACH CELL...
                //Determine if cell has a child element (link, form element, img)
                child = $(cell).find("a,button,input,select,textarea,img").first();

                //Grab accessibility components from the cell
                andiData = new AndiData(cell[0]);

                if (child.length) {
                    //Also grab accessibility components from the child
                    //andiData.grabComponents($(child), true);//overwrite with components from the child, except for innerText
                    //Do alert checks for the child
                    andiCheck.commonFocusableElementChecks(andiData, $(child));
                }
                else//Do alert checks for the cell
                    andiCheck.commonNonFocusableElementChecks(andiData, $(cell));

                if (scope) {
                    //andiData.grab_scope($(cell));
                    //Only throw scope alerts if in "scope mode"
                    if (tooManyScopeRowLevels)
                        andiAlerter.throwAlert(alert_0043, [wANDI.scopeLevelLimit, "row"]);
                    if (tooManyScopeColLevels)
                        andiAlerter.throwAlert(alert_0043, [wANDI.scopeLevelLimit, "col"]);
                    andiCheck.detectDeprecatedHTML($(cell));
                    if (scope !== "col" && scope !== "row" && scope !== "colgroup" && scope !== "rowgroup")//scope value is invalid
                        andiAlerter.throwAlert(alert_007C, [scope]);
                }

                if (headers)
                    wANDI.grab_headers(cell, andiData, table);

                //If this is not the upper left cell
                if ($(cell).is("th") && !andiData.accName && !($(this).attr("data-wANDI508-rowindex") === "1" && $(this).attr("data-wANDI508-colindex") === "1"))
                    //Header cell is empty
                    andiAlerter.throwAlert(alert_0132);

                AndiData.attachDataToElement(cell);
            });

            //FOR THE DATA TABLE...
            //This is a little hack to force the table to go first in the index
            var lastIndex = testPageData.andiElementIndex; //remember the last index
            testPageData.andiElementIndex = 0; //setting this to 0 allows the element to be created at index 1, which places it before the cells
            andiData = new AndiData(table[0]); //create the AndiData object

            andiCheck.commonNonFocusableElementChecks(andiData, $(table));
            //andiCheck.detectDeprecatedHTML($(table));

            if (thCount === 0) {
                if (tdCount === 0)//No td or th cells
                    andiAlerter.throwAlert(alert_004E);
                else//No th cells
                    andiAlerter.throwAlert(alert_0046);
            }
            else {
                //Has th cells
                if (hasThRow && hasThCol)
                    scopeRequired = true;

                if (!tableHasScopes) {
                    //Table Has No Scopes
                    if (tableHasHeaders)//No Scope, Has Headers
                        andiAlerter.throwAlert(alert_004B);
                    else//No Scope, No Headers
                        andiAlerter.throwAlert(alert_0048);
                }

                if (scopeRequired) {
                    //Check intersections for scope
                    var xDirectionHasTh, yDirectionHasTh;
                    $(all_th).each(function () {
                        //if this th does not have scope
                        xDirectionHasTh = false;
                        yDirectionHasTh = false;
                        rowIndex = $(this).attr("data-wANDI508-rowindex");
                        colIndex = $(this).attr("data-wANDI508-colindex");
                        cell = $(this);
                        if (!$(this).attr("scope")) {
                            //determine if this is at an intersection of th
                            var xDirectionThCount = 0;
                            var yDirectionThCount = 0;
                            $(all_th).each(function () {
                                //determine if x direction multiple th at this rowindex
                                if (rowIndex == $(this).attr("data-wANDI508-rowindex"))
                                    xDirectionThCount++;
                                if (colIndex == $(this).attr("data-wANDI508-colindex"))
                                    yDirectionThCount++;

                                if (xDirectionThCount > 1)
                                    xDirectionHasTh = true;
                                if (yDirectionThCount > 1)
                                    yDirectionHasTh = true;

                                if (xDirectionHasTh && yDirectionHasTh) {
                                    //This cell is at th intersection and doesn't have scope
                                    if (!$(cell).hasClass("ANDI508-element-danger"))
                                        $(cell).addClass("ANDI508-element-danger");
                                    andiAlerter.throwAlertOnOtherElement($(cell).attr("data-andi508-index"), alert_0047);
                                    return false; //breaks out of the loop
                                }
                            });
                        }
                    });
                }
                if (!tableHasHeaders) {
                    //Table Has No Headers
                    if (tableHasScopes)
                        //No Headers, Has Scope
                        andiAlerter.throwAlert(alert_004C);
                    else
                        //No Headers, No Scope
                        andiAlerter.throwAlert(alert_004A);
                }

                if (tableHasHeaders && tableHasScopes) {
                    //Table is using both scopes and headers
                    andiAlerter.throwAlert(alert_0049);
                }
            }

            cellCount = thCount + tdCount;

            AndiData.attachDataToElement(table);

            testPageData.andiElementIndex = lastIndex; //set the index back to the last element's index so things dependent on this number don't break
        }
        $(table).find("[andi508-temporaryhide]").each(function () {
            $(this)
                .css("display", $(this).attr("andi508-temporaryhide"))
                .removeAttr("andi508-temporaryhide");
        });
    }

    wANDI.grab_headers = function (element, elementData, table) {
        var headers = $.trim($(element).attr("headers"));
        var headersText = "";
        if (headers !== undefined) {
            if (!$(element).is("th") && !$(element).is("td"))
                andiAlerter.throwAlert(alert_0045);
            else
                headers = getHeadersReferences(element, headers, table);
        }
        //stores the actual vaule of the headers, not the parsed (grabbed) headersText
        elementData.components.headers = headers;

        function getHeadersReferences(element, headers, table) {
            var idsArray = headers.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
            var accumulatedText = "";//this variable is going to store what is found. And will be returned
            var message, splitMessage = "";
            var referencedElement, referencedElementText;
            var missingReferences = [];
            var displayHeaders = "";
            var tableIds = $(table).find("[id]"); //array of all elements within the table that have an id
            var tableThIds = $(table).find("th[id]"); //array of all th cells within the table that have an id

            //Traverse through the array
            for (var x = 0; x < idsArray.length; x++) {
                //Can the aria list id be found somewhere on the page?
                if (idsArray[x] !== "") {

                    //Set the referenced element (only looking for the id within the same table)
                    referencedElement = undefined; //set to undefined

                    //Loop through all elements within the table that have an id
                    $.each(tableIds, function () {
                        if (this.id === idsArray[x]) {
                            referencedElement = this;
                            return;
                        }
                    });

                    referencedElementText = "";

                    if ($(referencedElement).html() !== undefined && $(referencedElement).closest("table").is(table)) {
                        //element with id was found within the same table
                        if ($(referencedElement).is("td")) //referenced element is a td
                            andiAlerter.throwAlert(alert_0067, [idsArray[x]]);
                        else if (!$(referencedElement).is("th"))//referenced element is not a th
                            andiAlerter.throwAlert(alert_0066, [idsArray[x]]);
                        else {//referenced element is a th
                            //Check if this is referencing a duplicate id within the same table
                            areThereAnyDuplicateIds_headers(idsArray[x], tableThIds);
                            referencedElementText += andiUtility.getVisibleInnerText(referencedElement);
                        }
                    }
                    else {//referenced element was not found or was not within the same table
                        referencedElement = document.getElementById(idsArray[x]); //search within entire document for this id

                        if ($(referencedElement).html() !== undefined) {
                            andiAlerter.throwAlert(alert_0062, [idsArray[x]]); //referenced element is in another table
                        }
                        else //No, this id was not found at all, add to list.
                            missingReferences.push(idsArray[x]);
                    }

                    if (referencedElementText !== "") //Add referenceId
                        displayHeaders += andiLaser.createLaserTarget(referencedElement, "<span class='ANDI508-display-id'>#" + idsArray[x] + "</span>");

                    //Add to accumulatedText
                    accumulatedText += referencedElementText + " ";
                }
            }//end for loop
            andiCheck.areThereMissingReferences("headers", missingReferences);

            if ($.trim(accumulatedText) === "")
                //ALL of the headers references do not return any text
                andiAlerter.throwAlert(alert_0068);

            return displayHeaders;

            //This function will search the table for th cells with duplicate ids.
            function areThereAnyDuplicateIds_headers(id, tableThIds) {
                if (id && tableThIds.length > 1) {
                    var idMatchesFound = 0;
                    //loop through tableThIds and compare
                    for (z = 0; z < tableThIds.length; z++) {
                        if (id === tableThIds[z].id) {
                            idMatchesFound++;
                            if (idMatchesFound === 2) break; //duplicate found so stop searching, for performance
                        }
                    }
                    if (idMatchesFound > 1) {//Duplicate Found
                        var message = "[headers] attribute is referencing a duplicate id [id=" + id + "] within the same table";
                        andiAlerter.throwAlert(alert_0011, [message]);
                    }
                }
            }
        }
    };

    //analyze tables
    wANDI.analyze();

}//end init
