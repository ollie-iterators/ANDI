//=========================================//
//wANDI: data tables ANDI (small code)     //
//Created By Social Security Administration//
//=========================================//
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

    // TODO: Work on understanding why alerts are found in wANDI small code files. If there is no way
    // to not get the alert_ in the file, then remove the alert from the code

    //These variables are for the current table being analyzed (the active table)
    var cellCount = 0;					//The total number of <th> and <td>
    var rowCount = 0;					//The total number of <tr>
    var colCount = 0;					//The total number of columns (maximum number of <th> or <td> in a <tr>)

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
        var colIndex, rowIndex;

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
            var colgroupIndex = 0;
            var rowgroupIndex = 0;
            var colgroupSegmentation = false;

            //Cache the visible elements (performance)
            var all_rows = $(table).find("tr").filter(":visible");
            var all_th = $(all_rows).find("th").filter(":visible");
            //==DATA TABLE==//
            //This is a little hack to force the table tag to go first in the index
            //so that it is inspected first with the previous and next buttons.
            //Skip index 0, so that later the table can be placed at 0
            testPageData.andiElementIndex = 1;

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
                                c = $(this).attr("data-vANDI508-colgroupindex");
                            } else if (lastColgroupIndex) { //set this cell's colgroupIndex
                                $(this).attr("data-vANDI508-colgroupindex", lastColgroupIndex);
                            }
                        });

                        if (colgroupsInThisRow === 1) {
                            lastColgroupIndex = c;
                            $(row).attr("data-vANDI508-colgroupsegment", "true");
                        }
                    }
                    if (rowgroupIndex > 0) {
                        $(row).find("th,td").filter(":visible").each(function () {
                            if ($(this).attr("scope") == "rowgroup") { //Rowgroup
                                lastRowgroupIndex = $(this).attr("data-vANDI508-rowgroupindex");
                                //Get rowspan
                                lastRowgroupRowSpan = $(this).attr("rowspan");
                                if (!lastRowgroupRowSpan) {
                                    lastRowgroupRowSpan = 1;
                                }
                            } else if (lastRowgroupIndex && lastRowgroupRowSpan > 0) {
                                $(this).attr("data-vANDI508-rowgroupindex", lastRowgroupIndex);
                            }
                        });
                        //Decrement lastRowgroupRowSpan
                        lastRowgroupRowSpan--;
                    }
                });
            }

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
            var nonHeaderCount = 0
            var headersMissingRoleCount = 0;//used for alert_004J
            var cellsNotContainedByRow = 0;	//used for alert_004K
            var cell_role = (role === "table") ? "[role=cell]" : "[role=gridcell]";

            //Cache the visible elements (performance)
            var all_rows = $(table).find("[role=row]").filter(":visible");
            //var all_th = $(all_rows).find("[role=columnheader],[role=rowheader]").filter(":visible");

            //This is a little hack to force the table tag to go first in the index
            //so that it is inspected first with the previous and next buttons.
            //Skip index 0, so that later the table can be placed at 0
            testPageData.andiElementIndex = 1;

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
