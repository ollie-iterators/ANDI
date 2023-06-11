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

//These variables are for the page
var activeTableIndex = -1;          //The array index of the active table

//This function will analyze the test page for table related markup relating to accessibility
tANDI.analyze = function(objectClass){
    var attributesToAdd = [];
    //Loop through each visible table
    var activeElementFound = false;
    $(TestPageData.allElements).filter("[role=presentation],[role=none]").each(function(){
        if($(this).isSemantically(["presentation","none"])){
            objectClass.list.push(new PresentationTable([this], objectClass.list.length + 1, "<span style='font-style:italic'>Presentation Table</span>", "", ""));
            attributesToAdd = andiBar.getAttributes(objectClass, objectClass.list.length - 1, attributesToAdd);
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "presentation tables";

            analyzeTable(objectClass.list[objectClass.list.length - 1].elementList[0]);
        }

        //Determine if this is a refresh of tANDI (there is an active element)
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

//This function will remove tANDI markup from every table and rebuild the alert list
tANDI.reset = function(){
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
}

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
        andiFocuser.focusByIndex(1);
        tANDI.viewList_highlightSelectedTable(activeTableIndex, false);
        andiResetter.resizeHeights();
        return false;
    });
};

//This function highlights the active table in the table list
//index: refers to the index of the table in the tableArray
tANDI.viewList_highlightSelectedTable = function(index, scrollIntoView){
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
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

tANDI.presentationTables = new PresentationTables();
tANDI.tableInfo = new TableInfo();

tANDI.presentationTables = andiBar.createObjectValues(tANDI.presentationTables, 1);

//analyze tables
tANDI.analyze(tANDI.presentationTables);
andiBar.results(tANDI.presentationTables, tANDI.tableInfo, attributesToAdd, showStartUpSummaryText);

}//end init
