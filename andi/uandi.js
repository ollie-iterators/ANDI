//=========================================//
//uANDI: strange presentation tables ANDI  //
//Created By Social Security Administration//
//=========================================//

function init_module(){

var uANDIVersionNumber = "11.2.1";

//create uANDI instance
var uANDI = new AndiModule(uANDIVersionNumber,"u");

//This function updates the Active Element Inspector when mouseover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.hoverability = function(event){
    //When hovering, inspect the cells of the data table, not the table itself. Unless it's a presentation table
    if(!event.shiftKey && !$(this).is("table:not([role=presentation],[role=none]),[role=table],[role=grid],[role=treegrid]") )
        AndiModule.inspect(this);
};

//These variables are for the page
var activeTableIndex = -1;          //The array index of the active table

var attributesToAdd = [];
//This function will analyze the test page for table related markup relating to accessibility
uANDI.analyze = function(objectClass){
    //Loop through each visible table
    var activeElementFound = false;
    $(TestPageData.allElements).filter("table").each(function(){
        if (!$(this).isSemantically(["table","grid","treegrid","presentation","none"],"table")) {
            objectClass.list.push(new StrangeTable([this], objectClass.list.length + 1, "<span style='font-style:italic'>Not Recognized as a Data Table</span>", "", ""));
            attributesToAdd = andiBar.getAttributes(objectClass, objectClass.list.length - 1, attributesToAdd);
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "strange tables";

            analyzeTable(objectClass.list[objectClass.list.length - 1].elementList[0]);
        }

        //Determine if this is a refresh of uANDI (there is an active element)
        if(!activeElementFound &&
            ($(this).hasClass("ANDI508-element-active") || $(this).find("th.ANDI508-element-active,td.ANDI508-element-active").first().length ))
        {
            activeTableIndex = objectClass.elementNums[0];//set this index to this table
            activeElementFound = true;
        }
    });
};

var showStartUpSummaryText = "Only <span class='ANDI508-module-name-t'>presentation tables</span> were found on this page, no data tables.";
//This function will inspect a table or table cell
AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"));

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function will remove uANDI markup from every table and rebuild the alert list
uANDI.reset = function(){
    var testPage = document.getElementById("ANDI508-testPage");

    //Every ANDI508-element
    $(testPage).find(".ANDI508-element").each(function(){
        $(this)
            .removeAttr("data-andi508-index")
            .removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
            .removeData("ANDI508")
            .off("focus",AndiModule.focusability)
            .off("mouseenter",AndiModule.hoverability);
    });

    andiLaser.cleanupLaserTargets(testPage);

    $("#ANDI508-alerts-list").html("");

    testPageData = new TestPageData(); //get fresh test page data
};

//This function will a table. Only one table at a time
function analyzeTable(table){

    var role = $(table).getValidRole();

    if($.trim(role) && role !== "table" && role !== "grid" && role !== "treegrid"){
        //==TABLE WITH NONTYPICAL ROLE==//
        andiData = new AndiData(table);
        andiAlerter.throwAlert(alert_004I,[role]);
        AndiData.attachDataToElement(table);
    }
}

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
    for(var x=0; x<uANDI.strangeTables.list.length; x++){
        appendHTML += "<tr";
        //Highlight the select table
        if($(uANDI.strangeTables.list[x].elementList[0]).hasClass("ANDI508-element"))
            appendHTML += " class='ANDI508-table-row-inspecting' aria-selected='true'";

        tableName = ["<span style='font-style:italic'>Not Recognized as a Data Table</span>", ""];

        appendHTML += "><th scope='role'>"+parseInt(x+1)+"</th><td>"+
            "<a href='javascript:void(0)' data-andi508-relatedtable='"+x+"'>"+
            tableName[0]+"</a></td><td style='font-family:monospace'>"+tableName[1]+"</td></tr>";
    }

    //Insert into ANDI Bar
    appendHTML += "</tbody></table></div></div>";
    $("#ANDI508-additionalPageResults").append(appendHTML);
};

//This function attaches the click,hover,focus events to the items in the view list
uANDI.viewList_attachEvents = function(){
    //Add focus click to each link (output) in the table
    $("#ANDI508-viewList-table td a").each(function(){
        andiLaser.createLaserTrigger($(this),$(uANDI.strangeTables.list[$(this).attr("data-andi508-relatedtable")].elementList[0]));
    })
    .click(function(){//Jump to this table
        //Make this link appear selected
        uANDI.reset();
        activeTableIndex = $(this).attr("data-andi508-relatedtable");
        analyzeTable(uANDI.strangeTables.list[activeTableIndex].elementList[0]);
        andiFocuser.focusByIndex(1);
        uANDI.viewList_highlightSelectedTable(activeTableIndex, false);
        andiResetter.resizeHeights();
        return false;
    });
};

//This function highlights the active table in the table list
//index: refers to the index of the table in the tableArray
uANDI.viewList_highlightSelectedTable = function(index, scrollIntoView){
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
};

//This object class is used to store data about each presentation table. Object instances will be placed into an array.
function StrangeTable(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the presentation tables on the page
function StrangeTables() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Strange Tables";
    this.cssProperties  = [];
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

uANDI.strangeTables = new StrangeTables();
uANDI.tableInfo = new TableInfo();

uANDI.strangeTables = andiBar.createObjectValues(uANDI.strangeTables, 1);

//analyze tables
uANDI.analyze(uANDI.strangeTables);
andiBar.results(uANDI.strangeTables, uANDI.tableInfo, attributesToAdd, showStartUpSummaryText);

}//end init
