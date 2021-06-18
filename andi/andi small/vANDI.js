//======================================================//
//vANDI: presentation tables ANDI - Loop A (small code) //
//Created By Social Security Administration             //
//======================================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create vANDI instance
    var vANDI = new AndiModule("11.1.0", "v");

    //This object class is used to keep track of the tables on the page
    function Tables() {
        this.list = [];             //Stores all tables in an array
        this.count = 0;
        this.tableCount = 0;        //The total number of tables
        this.presentationCount = 0; //The total number of presentation tables
        this.tableIndex = -1;       //The array index of the active table
    }

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
        $(TestPageData.allElements).filter("table").each(function () {
            //Store this table in the array
            vANDI.tables.list.push($(this));

            //Is this a presentation table?
            if ($(this).is("[role=presentation],[role=none]")) { //It's a presentation table
                vANDI.tables.presentationCount++;
            } else { //It table with a non-typical role
                vANDI.tables.presentationCount++;
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
        $(table).find("table,[role=treegrid]").each(function () {
            $(this)
                .attr("andi508-temporaryhide", $(this).css("display"))
                .css("display", "none");
        });

        rowCount = 0;
        colCount = 0;

        //loop through the <table> and set data-* attributes

        //The way vANDI analyzes the table is that it begins looking at the cells first
        //to determine if there is any existing scenarios that should trigger an alert.
        //When each cell has been evaluated, it will then attach alerts to the table element.

        //Cache the visible elements (performance)
        var all_rows = $(table).find("tr").filter(":visible");
        var all_th = $(all_rows).find("th").filter(":visible");
        var all_cells = $(all_rows).find("th,td").filter(":visible");

        if (role === "presentation" || role === "none") {
            //==PRESENTATION TABLE==//
            andiData = new AndiData(table[0]);
            andiCheck.commonNonFocusableElementChecks(andiData, $(table));

            var presentationTablesShouldNotHave = "";

            if ($(table).find("caption").filter(":visible").first().length) {
                presentationTablesShouldNotHave += "a &lt;caption&gt;, ";
            }
            if ($(all_th).first().length) {
                presentationTablesShouldNotHave += "&lt;th&gt; cells, ";
            }

            cellCount = 0;

            var presTableWithScope = false;
            var presTableWithHeaders = false;
            $(all_cells).each(function () {
                cellCount++;
                if ($(this).attr("scope")) {
                    presTableWithScope = true;
                }
                if ($(this).attr("headers")) {
                    presTableWithHeaders = true;
                }
            });

            if (presTableWithScope) {
                presentationTablesShouldNotHave += "cells with [scope] attributes, ";
            }
            if (presTableWithHeaders) {
                presentationTablesShouldNotHave += "cells with [headers] attributes, ";
            }
            if ($(table).attr("summary")) {
                presentationTablesShouldNotHave += "a [summary] attribute, ";
            }
            if (presentationTablesShouldNotHave) {
                alert = [alert_0041, [presentationTablesShouldNotHave.slice(0, -2)]];
            }

            AndiData.attachDataToElement(table);

            vANDI.hideModeButtons();
            AndiModule.activeActionButtons.scopeMode = true;
        } else if ($.trim(role) && role !== "table" && role !== "grid" && role !== "treegrid") {
            //==TABLE WITH NONTYPICAL ROLE==//
            andiData = new AndiData(table[0]);
            alert = [alert_004I, [role]];
            AndiData.attachDataToElement(table);
        }
        $(table).find("[andi508-temporaryhide]").each(function () {
            $(this)
                .css("display", $(this).attr("andi508-temporaryhide"))
                .removeAttr("andi508-temporaryhide");
        });
    }
    vANDI.analyze();
}//end init
