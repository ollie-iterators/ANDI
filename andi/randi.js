//==========================================//
//rANDI: landmarks ANDI                     //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var rANDIVersionNumber = "4.3.1";

//create rANDI instance
var rANDI = new AndiModule(rANDIVersionNumber,"r");

//This function will analyze the test page for graphics/image related markup relating to accessibility
rANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["banner","complementary","contentinfo","form","main","navigation","search","region"],"main,header,footer,nav,form,aside")){
            andiData = new AndiData(this);

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            objectClass.list.push(new Landmark([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "landmarks";
            AndiData.attachDataToElement(this);
        }
    });
};

var showStartUpSummaryText = "Landmark structure found.<br />Ensure that each <span class='ANDI508-module-name-s'>landmark</span> is applied appropriately to the corresponding section of the page.";
//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"), "viewList");

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This object class is used to store data about each landmark. Object instances will be placed into an array.
function Landmark(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the landmarks on the page
function Landmarks() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Landmarks";
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

rANDI.landmarks = new Landmarks();
rANDI.tableInfo = new TableInfo();

rANDI.landmarks = andiBar.createObjectValues(rANDI.landmarks, 3);

rANDI.analyze(rANDI.landmarks);
andiBar.results(rANDI.landmarks, rANDI.tableInfo, showStartUpSummaryText);

}//end init
