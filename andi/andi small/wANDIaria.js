//=========================================//
//wANDIaria: data tables (analyze table aria) ANDI //
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
            analyzeTable_ARIA(table, role);
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

            //The way wANDI analyzes the table is that it begins looking at the cells first
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
            var all_cells = $(table).find("[role=columnheader],[role=rowheader]," + cell_role).filter(":visible");

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
                if (colCount < cells.length)
                    colCount = cells.length;

                //Figure out colIndex/rowIndex colgroupIndex/rowgroupIndex
                $(cells).each(function loopA() {
                    //Increment cell counters
                    cell = $(this);
                    if ($(cell).is("th,[role=columnheader],[role=rowheader]")) {
                        headerCount++;
                        if (headerCount > 1)
                            hasHeaderRow = true;
                        if (rowCount > 1)
                            hasHeaderCol = true;

                        if ($(cell).is("th") && !$(cell).is("[role=columnheader],[role=rowheader]")) {
                            //table cell is missing role
                            headersMissingRoleCount++;
                        }
                    }
                    else {
                        nonHeaderCount++;
                    }

                    //get colspan
                    colspan = $(cell).attr("aria-colspan");
                    if (colspan === undefined)
                        colspan = 1;
                    else
                        colspan = parseInt(colspan);

                    //get rowspan
                    rowspan = $(cell).attr("aria-rowspan");
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

                //There are no more cells in this row, however, the rest of the rowspanArray needs to be decremented.
                //Decrement any additional rowspans from previous rows
                for (var d = colIndex; d < rowspanArray.length; d++) {
                    if (rowspanArray[d] > 1)
                        rowspanArray[d]--;
                }
                rowIndex++;
            });

            //Loop C (grab the accessibility components for each cell)
            $(all_cells).each(function loopC() {
                cell = $(this);

                if (isContainedByRowRole(cell)) {//Is the cell contained by an element with role=row?
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

                    //If this is not the upper left cell
                    if ($(cell).is("[role=columnheader],[role=rowheader]") && !andiData.accName && !($(this).attr("data-wANDI508-rowindex") === "1" && $(this).attr("data-wANDI508-colindex") === "1"))
                        //Header cell is empty
                        andiAlerter.throwAlert(alert_0132);

                    AndiData.attachDataToElement(cell);
                }
                else {
                    console.log("ALERT: table cell is not contained by role=row")
                }
            });

            //FOR THE DATA TABLE...
            //This is a little hack to force the table to go first in the index
            var lastIndex = testPageData.andiElementIndex; //remember the last index
            testPageData.andiElementIndex = 0; //setting this to 0 allows the element to be created at index 1, which places it before the cells
            andiData = new AndiData(table[0]); //create the AndiData object

            andiCheck.commonNonFocusableElementChecks(andiData, $(table));

            if (role === "grid")
                andiAlerter.throwAlert(alert_0233);

            if (all_rows.length === 0)//no rows
                andiAlerter.throwAlert(alert_004H, [role]);
            else if (headerCount === 0) {
                if (nonHeaderCount === 0)//No cell or gridcell
                    andiAlerter.throwAlert(alert_004F, [role, cell_role]);
                else//No header cells
                    andiAlerter.throwAlert(alert_004G, [role]);
            }

            //If any header is missing a role, throw alert
            if (headersMissingRoleCount)
                andiAlerter.throwAlert(alert_004J, [role, headersMissingRoleCount]);

            //If a cell is not contained by a role=row, throw alert
            if (cellsNotContainedByRow)
                andiAlerter.throwAlert(alert_004K, [role, cellsNotContainedByRow]);

            cellCount = headerCount + nonHeaderCount;

            AndiData.attachDataToElement(table);

            testPageData.andiElementIndex = lastIndex; //set the index back to the last element's index so things dependent on this number don't break

            //This function determines if the cell is contained by an element with role=row
            //  and if that row is within the current table
            function isContainedByRowRole(cell) {
                var containingRow = $(cell).closest("[role=row]");
                var isContainedByRow = false;
                if (containingRow) {
                    //Check if the containing row is part of this table's role=row elements
                    $(all_rows).each(function () {
                        if ($(this).is(containingRow)) {
                            isContainedByRow = true;
                            return false; //break out of each loop
                        }
                    });
                }
                if (!isContainedByRow)
                    cellsNotContainedByRow++;
                return isContainedByRow;
            }
        }
    }

    //analyze tables
    wANDI.analyze();

}//end init
