//==========================================//
//qANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var qANDIVersionNumber = "4.3.1";

//create qANDI instance
var qANDI = new AndiModule(qANDIVersionNumber,"r");

andiBar.cleanup(testPage, element);

//This function will analyze the test page for graphics/image related markup relating to accessibility
qANDI.analyze = function(objectClass){
    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["listitem","list"],"ol,ul,li,dl,dd,dt")){
            andiData = new AndiData(this);

            if($(this).isSemantically(["list"],"ol,ul,dl")){
                if ($(this).is("ul")) {
                    objectClass.elementNums[2] += 1;
                    objectClass.elementNums[2] = "ul elements";
                } else if ($(this).is("ol")) {
                    objectClass.elementNums[1] += 1;
                    objectClass.elementNums[1] = "ol elements";
                } else if ($(this).is("dl")) {
                    objectClass.elementNums[4] += 1;
                    objectClass.elementNums[4] = "dl elements";
                } else {
                    objectClass.elementNums[7] += 1;
                    objectClass.elementNums[7] = "list role elements";
                }
                objectClass.elementNums[9] += 1;
                objectClass.elementNums[9] = "lists found";
            }

            //Is the listitem contained by an appropriate list container?
            if($(this).is("[role=listitem]")){
                objectClass.elementNums[8] += 1;
                objectClass.elementStrings[8] = "listitem role elements";
                if(!$(this).closest("[role=list]").length)
                    andiAlerter.throwAlert(alert_0079, ["[role=listitem]","[role=list]"]);
            }
            else if($(this).is("li")){
                objectClass.elementNums[3] += 1;
                objectClass.elementNums[3] = "li elements";
                var listContainer = $(this).closest("ol,ul");
                if(!$(listContainer).length){
                    andiAlerter.throwAlert(alert_0079, ["&lt;li&gt;","&lt;ol&gt; or &lt;ul&gt;"]);
                }
                else{ //check if listContainer is still semantically a list
                    var listContainer_role = $(listContainer).getValidRole();
                    if(listContainer_role && listContainer_role !== "list")
                        andiAlerter.throwAlert(alert_0194, [listContainer_role]);
                }
            }
            else if($(this).is("dd,dt") && !$(this).closest("dl").length){//Is the dl,dt contained by a dl?
                if ($(this).is("dd")) {
                    objectClass.elementNums[5] += 1;
                    objectClass.elementNums[6] = "dd elements";
                } else if ($(this).is("dt")) {
                    objectClass.elementNums[6] += 1;
                    objectClass.elementStrings[6] = "dt elements";
                }

                andiAlerter.throwAlert(alert_007A);
            }

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            objectClass.list.push(new List([this], objectClass.list.length + 1, "", "", ""));
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] += "list elements";
            AndiData.attachDataToElement(this);
        }
    });
};

var showStartUpSummaryText = "List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (ol, ul, li, dl, dd, dt, role=list, role=listitem) are appropriately applied.";
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



//This object class is used to store data about each list. Object instances will be placed into an array.
function List(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the certain headers on the page
function Lists() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Lists";
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

qANDI.lists = new Lists();
qANDI.tableInfo = new TableInfo();

qANDI.lists = andiBar.createObjectValues(qANDI.lists, 12);

qANDI.analyze(qANDI.lists);
andiBar.results(qANDI.lists, qANDI.tableInfo, showStartUpSummaryText);

}//end init
