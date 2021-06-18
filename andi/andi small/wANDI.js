//=================================================//
//wANDI: data tables - ANDI Loop A(small code)     //
//Created By Social Security Administration        //
//=================================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create vANDI instance
    var vANDI = new AndiModule("11.1.0", "v");

    //This object class is used to keep track of the tables on the page
    function Tables() {
        this.list = [];             //Stores all tables in an array
        this.count = 0;
        this.tableCount = 0;        //The total number of tables
        this.dataCount = 0;         //The total number of data tables (tables that aren't presentation tables)
        this.tableIndex = -1;       //The array index of the active table
    }
    // NOTE: Extracted preCalculateTableName because it was a long function

    //These variables are for the current table being analyzed (the active table)
    var cellCount = 0;					//The total number of <th> and <td>
    var rowCount = 0;					//The total number of <tr>
    var colCount = 0;					//The total number of columns (maximum number of <th> or <td> in a <tr>)

    // NOTE: Get rid of scopeMode

    //This function will analyze the test page for table related markup relating to accessibility
    vANDI.analyze = function () {
        vANDI.tables = new Tables();
        //Loop through each visible table
        var activeElementFound = false;
        $(TestPageData.allElements).filter("table,[role=table],[role=grid],[role=treegrid]").each(function () {
            //Store this table in the array
            vANDI.tables.list.push($(this));

            if ($(this).isSemantically("[role=table],[role=grid],[role=treegrid]", "table")) {
                vANDI.tables.dataCount++;
            }

            //Determine if this is a refresh of vANDI (there is an active element)
            if (!activeElementFound &&
                ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length)) {
                vANDI.tables.tableIndex = vANDI.tables.tableCount;//set this index to this table
                activeElementFound = true;
            }
            vANDI.tables.tableCount++;
        });

        if (!activeElementFound) {
            vANDI.tables.tableIndex = 0;//Analyze first table
        }
        analyzeTable(vANDI.tables.list[vANDI.tables.tableIndex]);
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
            analyzeTable_ARIA(table, role);
        } else {
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
            var scope;
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
                if (colCount < cells.length) {
                    colCount = cells.length;
                }

                //Figure out colIndex/rowIndex colgroupIndex/rowgroupIndex
                $(cells).each(function loopA() {
                    //Increment cell counters
                    cell = $(this);
                    if ($(cell).is("th")) {
                        thCount++;
                        if (thCount > 1) {
                            hasThRow = true;
                        }
                        if (rowCount > 1) {
                            hasThCol = true;
                        }
                        scope = $(cell).attr("scope");
                        if (scope) {
                            if (scope == "colgroup") {
                                //TODO: more logic here to catch misuse of colgroup
                                colgroupIndex++;
                                $(cell).attr("data-vANDI508-colgroupindex", colgroupIndex);
                                colgroupSegmentation_colgroupsPerRowCounter++;
                            } else if (scope == "rowgroup") {
                                //TODO: more logic here to catch misuse of colgroup
                                rowgroupIndex++;
                                $(cell).attr("data-vANDI508-rowgroupindex", rowgroupIndex);
                            }
                        }
                    } else {
                        tdCount++;
                    }

                    //get colspan
                    //TODO: mark for alert here if value is invalid
                    colspan = $(cell).attr("colspan");
                    if (colspan === undefined) {
                        colspan = 1;
                    } else {
                        colspan = parseInt(colspan);
                    }
                    //get rowspan
                    //TODO: mark for alert here if value is invalid
                    rowspan = $(cell).attr("rowspan");
                    if (rowspan === undefined) {
                        rowspan = 1;
                    } else {
                        rowspan = parseInt(rowspan);
                    }

                    //Increase the rowspanArray length if needed
                    if ((rowspanArray.length === 0) || (rowspanArray[colIndex] === undefined)) {
                        rowspanArray.push(parseInt(rowspan));
                    } else {
                        firstRow = false;
                    }

                    //store colIndex
                    if (!firstRow) {
                        //loop through the rowspanArray until a 1 is found
                        for (var a = colIndex; a < rowspanArray.length; a++) {
                            if (rowspanArray[a] == 1) {
                                break;
                            } else if (rowspanArray[a] > 1) {
                                //there is a rowspan at this colIndex that is spanning over this row
                                //decrement this item in the rowspan array
                                rowspanArray[a]--;
                                //increment the colIndex an extra amount to essentially skip this colIndex location
                                colIndex++;
                            }
                        }
                    }

                    if (colspan < 2) {
                        $(cell).attr("data-vANDI508-colindex", colIndex);
                        rowspanArray[colIndex] = rowspan;
                        colIndex++;
                    } else { //colspan > 1
                        indexValue = "";
                        colIndexPlusColspan = parseInt(colIndex) + colspan;
                        for (var b = colIndex; b < colIndexPlusColspan; b++) {
                            indexValue += b + " ";
                            rowspanArray[colIndex] = rowspan;
                            colIndex++;
                        }
                        $(cell).attr("data-vANDI508-colindex", $.trim(indexValue));
                    }

                    //store rowIndex
                    if (rowspan < 2) {
                        $(cell).attr("data-vANDI508-rowindex", rowIndex);
                    } else {
                        //rowspanArray[colIndex] = rowspan;
                        indexValue = "";
                        rowIndexPlusRowspan = parseInt(rowIndex) + rowspan;
                        for (var c = rowIndex; c < rowIndexPlusRowspan; c++)
                            indexValue += c + " ";
                        $(cell).attr("data-vANDI508-rowindex", $.trim(indexValue));
                    }
                });

                //Determine if table is using colgroupSegmentation
                if (colgroupSegmentation_colgroupsPerRowCounter == 1) {
                    colgroupSegmentation_segments++;
                }
                if (colgroupSegmentation_segments > 1) {
                    colgroupSegmentation = true;
                }

                //There are no more cells in this row, however, the rest of the rowspanArray needs to be decremented.
                //Decrement any additional rowspans from previous rows
                for (var d = colIndex; d < rowspanArray.length; d++) {
                    if (rowspanArray[d] > 1) {
                        rowspanArray[d]--;
                    }
                }
                rowIndex++;
            });

            //FOR THE DATA TABLE...
            //This is a little hack to force the table to go first in the index
            var lastIndex = testPageData.andiElementIndex; //remember the last index
            testPageData.andiElementIndex = 0; //setting this to 0 allows the element to be created at index 1, which places it before the cells
            andiData = new AndiData(table[0]); //create the AndiData object

            andiCheck.commonNonFocusableElementChecks(andiData, $(table));
            //andiCheck.detectDeprecatedHTML($(table));

            if (thCount === 0) {
                if (tdCount === 0) { //No td or th cells
                    alert = [alert_004E];
                } else { //No th cells
                    alert = [alert_0046];
                }
            } else { //Has th cells
                if (AndiModule.activeActionButtons.scopeMode) {
                    if (hasThRow && hasThCol) {
                        scopeRequired = true;
                    }

                    if (scopeRequired) {
                        //Check intersections for scope
                        var xDirectionHasTh, yDirectionHasTh;
                        $(all_th).each(function () {
                            //if this th does not have scope
                            xDirectionHasTh = false;
                            yDirectionHasTh = false;
                            rowIndex = $(this).attr("data-vANDI508-rowindex");
                            colIndex = $(this).attr("data-vANDI508-colindex");
                            cell = $(this);
                            if (!$(this).attr("scope")) {
                                //determine if this is at an intersection of th
                                var xDirectionThCount = 0;
                                var yDirectionThCount = 0;
                                $(all_th).each(function () {
                                    //determine if x direction multiple th at this rowindex
                                    if (rowIndex == $(this).attr("data-vANDI508-rowindex")) {
                                        xDirectionThCount++;
                                    }
                                    if (colIndex == $(this).attr("data-vANDI508-colindex")) {
                                        yDirectionThCount++;
                                    }
                                    if (xDirectionThCount > 1) {
                                        xDirectionHasTh = true;
                                    }
                                    if (yDirectionThCount > 1) {
                                        yDirectionHasTh = true;
                                    }

                                    if (xDirectionHasTh && yDirectionHasTh) {
                                        //This cell is at th intersection and doesn't have scope
                                        if (!$(cell).hasClass("ANDI508-element-danger")) {
                                            $(cell).addClass("ANDI508-element-danger");
                                        }
                                        andiAlerter.throwAlertOnOtherElement($(cell).attr("data-andi508-index"), alert_0047);
                                        return false; //breaks out of the loop
                                    }
                                });
                            }
                        });
                    }
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

        //This function will a table. Only one table at a time
        //Paramaters:
        //	table: the table element
        //	role: the ARIA role (role=table or role=grid or role=treegrid)
        function analyzeTable_ARIA(table, role) {
            //loop through the <table> and set data-* attributes
            //Each cell in a row is given a rowIndex
            //Each cell in a column is given a colIndex

            //The way vANDI analyzes the table is that it begins looking at the cells first
            //to determine if there is any existing scenarios that should trigger an alert.
            //When each cell has been evaluated, it will then attach alerts to the table element.

            //These variables keep track of the <tr>, <th>, <td> on each <table>
            var headerCount = 0;
            var nonHeaderCount = 0;
            var hasHeaderRow = false;		//true when there are two or more th in a row
            var hasHeaderCol = false;		//true when two or more rows contain a th
            var headersMissingRoleCount = 0;//used for alert_004J
            var cellsNotContainedByRow = 0;	//used for alert_004K
            var cell_role = (role === "table") ? "[role=cell]" : "[role=gridcell]";
            //This array is used to keep track of the rowspan of the previous row
            //They will be checked against before assigning the colIndex.
            //This technique is only needed for setting colIndex
            //since the rowIndex is handled more "automatically" by the <tr> tags
            var rowspanArray = [];

            //Cache the visible elements (performance)
            var all_rows = $(table).find("[role=row]").filter(":visible");
            //var all_th = $(all_rows).find("[role=columnheader],[role=rowheader]").filter(":visible");

            //This is a little hack to force the table tag to go first in the index
            //so that it is inspected first with the previous and next buttons.
            //Skip index 0, so that later the table can be placed at 0
            testPageData.andiElementIndex = 1;

            //Loop A (establish the rowIndex/colIndex)
            rowIndex = 0;
            var firstRow = true;
            var x;
            var cells;
            $(all_rows).each(function () {
                //Reset variables for this row
                row = $(this);
                rowCount++;
                colIndex = 0;
                colgroupSegmentation_colgroupsPerRowCounter = 0;

                cells = $(row).find("th,[role=columnheader],[role=rowheader]," + cell_role).filter(":visible");

                //Set colCount
                if (colCount < cells.length) {
                    colCount = cells.length;
                }

                //Figure out colIndex/rowIndex colgroupIndex/rowgroupIndex
                $(cells).each(function loopA() {
                    //Increment cell counters
                    cell = $(this);
                    if ($(cell).is("th,[role=columnheader],[role=rowheader]")) {
                        headerCount++;
                        if (headerCount > 1) {
                            hasHeaderRow = true;
                        }
                        if (rowCount > 1) {
                            hasHeaderCol = true;
                        }
                        if ($(cell).is("th") && !$(cell).is("[role=columnheader],[role=rowheader]")) {
                            //table cell is missing role
                            headersMissingRoleCount++;
                        }
                    } else {
                        nonHeaderCount++;
                    }

                    //get colspan
                    colspan = $(cell).attr("aria-colspan");
                    if (colspan === undefined) {
                        colspan = 1;
                    } else {
                        colspan = parseInt(colspan);
                    }

                    //get rowspan
                    rowspan = $(cell).attr("aria-rowspan");
                    if (rowspan === undefined) {
                        rowspan = 1;
                    } else {
                        rowspan = parseInt(rowspan);
                    }


                    //Increase the rowspanArray length if needed
                    if ((rowspanArray.length === 0) || (rowspanArray[colIndex] === undefined)) {
                        rowspanArray.push(parseInt(rowspan));
                    } else {
                        firstRow = false;
                    }


                    //store colIndex
                    if (!firstRow) {
                        //loop through the rowspanArray until a 1 is found
                        for (var a = colIndex; a < rowspanArray.length; a++) {
                            if (rowspanArray[a] == 1) {
                                break;
                            } else if (rowspanArray[a] > 1) {
                                //there is a rowspan at this colIndex that is spanning over this row
                                //decrement this item in the rowspan array
                                rowspanArray[a]--;
                                //increment the colIndex an extra amount to essentially skip this colIndex location
                                colIndex++;
                            }
                        }
                    }

                    if (colspan < 2) {
                        $(cell).attr("data-vANDI508-colindex", colIndex);
                        rowspanArray[colIndex] = rowspan;
                        colIndex++;
                    } else { //colspan > 1
                        indexValue = "";
                        colIndexPlusColspan = parseInt(colIndex) + colspan;
                        for (var b = colIndex; b < colIndexPlusColspan; b++) {
                            indexValue += b + " ";
                            rowspanArray[colIndex] = rowspan;
                            colIndex++;
                        }
                        $(cell).attr("data-vANDI508-colindex", $.trim(indexValue));
                    }

                    //store rowIndex
                    if (rowspan < 2) {
                        $(cell).attr("data-vANDI508-rowindex", rowIndex);
                    } else {
                        //rowspanArray[colIndex] = rowspan;
                        indexValue = "";
                        rowIndexPlusRowspan = parseInt(rowIndex) + rowspan;
                        for (var c = rowIndex; c < rowIndexPlusRowspan; c++) {
                            indexValue += c + " ";
                        }
                        $(cell).attr("data-vANDI508-rowindex", $.trim(indexValue));
                    }
                });

                //There are no more cells in this row, however, the rest of the rowspanArray needs to be decremented.
                //Decrement any additional rowspans from previous rows
                for (var d = colIndex; d < rowspanArray.length; d++) {
                    if (rowspanArray[d] > 1) {
                        rowspanArray[d]--;
                    }
                }
                rowIndex++;
            });

            //Default to scope mode
            vANDI.hideModeButtons();
            AndiModule.activeActionButtons.scopeMode = true;

            //FOR THE DATA TABLE...
            //This is a little hack to force the table to go first in the index
            var lastIndex = testPageData.andiElementIndex; //remember the last index
            testPageData.andiElementIndex = 0; //setting this to 0 allows the element to be created at index 1, which places it before the cells
            andiData = new AndiData(table[0]); //create the AndiData object

            andiCheck.commonNonFocusableElementChecks(andiData, $(table));

            if (role === "grid") {
                alert = [alert_0233];
            }

            if (all_rows.length === 0) { //no rows
                alert = [alert_004H, [role]];
            } else if (headerCount === 0) {
                if (nonHeaderCount === 0) { //No cell or gridcell
                    alert = [alert_004F, [role, cell_role]];
                } else { //No header cells
                    alert = [alert_004G, [role]];
                }
            }

            //If any header is missing a role, throw alert
            if (headersMissingRoleCount) {
                alert = [alert_004J, [role, headersMissingRoleCount]];
            }

            //If a cell is not contained by a role=row, throw alert
            if (cellsNotContainedByRow) {
                alert = [alert_004K, [role, cellsNotContainedByRow]];
            }

            cellCount = headerCount + nonHeaderCount;

            AndiData.attachDataToElement(table);

            testPageData.andiElementIndex = lastIndex; //set the index back to the last element's index so things dependent on this number don't break
        }
    }
    vANDI.analyze();
}//end init
