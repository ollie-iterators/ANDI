//=============================================//
//iANDI: iframe ANDI						   //
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var iandiVersionNumber = "3.0.2";

//create iANDI instance
var iANDI = new AndiModule(iandiVersionNumber,"i");

//This function will analyze the test page for iframes
iANDI.analyze = function(objectClass){
    $(TestPageData.allElements).each(function(){
        if($(this).is("iframe")){
            andiData = new AndiData(this);
            andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
            objectClass.list.push(new iFrame([this], objectClass.list.length + 1, "", "", ""))
            andiBar.getAttributes(objectClass, objectClass.list.length - 1);
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "iframes";
            AndiData.attachDataToElement(this);
        }
    });
};

var showStartUpSummaryText = "To test the contents of <span class='ANDI508-module-name-i'>iframes</span>, each must be viewed independently.<br />Inspect an iframe, press the \"test in new tab\" button, then launch ANDI.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
//Inserts some counter totals, displays the accesskey list
iANDI.results = function(){
    $("#iANDI508-iframeList-container").find("a").click(function(){
        var relatedIndex = $(this).attr("data-andi508-relatedindex");
        var relatedIframe = $("#ANDI508-testPage .ANDI508-element[data-andi508-index="+relatedIndex+"]");
        iANDI.openIframeInNewWindow(relatedIframe);
    });

    //For iframe list links, add hoverability, focusability, clickability
    $("#iANDI508-iframeList-container").find("a[data-andi508-relatedindex]").each(function(){
        andiFocuser.addFocusClick($(this));
        var relatedIndex = $(this).attr("data-andi508-relatedindex");
        var relatedElement = $("#ANDI508-testPage [data-andi508-index="+relatedIndex+"]").first();
        andiLaser.createLaserTrigger($(this),$(relatedElement));
        $(this)
        .hover(function(){
            if(!event.shiftKey)
                AndiModule.inspect(relatedElement[0]);
        })
        .focus(function(){
            AndiModule.inspect(relatedElement[0]);
        });
    });
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    andiBar.prepareActiveElementInspection(element);

    var elementData = $(element).data("andi508");
    var addOnProps = AndiData.getAddOnProps(element, elementData, ["src"]);

    andiBar.displayOutput(elementData, element, addOnProps);
    andiBar.displayTable(elementData, element, addOnProps);

    $("#ANDI508-additionalElementDetails").html("<button>test in new tab</button>");
    $("#ANDI508-additionalElementDetails button").click(function(){
        iANDI.openIframeInNewWindow(element);
        return false;
    });
};

//This function will open an iframe in a new window
iANDI.openIframeInNewWindow = function(iframe){
    var iframeWindow;
    var url = $(iframe).attr("src");

    if(url){
        iframeWindow = window.open(url, "_blank"); //opens user preference, usually new tab
        iframeWindow.focus();
    }
    else{
        alert("This iframe has no [src] and cannot be opened independently. ANDI cannot be used to test the contents of this iframe.");
    }
};

//This object class is used to store data about each hidden element. Object instances will be placed into an array.
function iFrame(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the iFrames on the page
function iFrames() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "iFrames";
    this.cssProperties  = [];
    this.buttonTextList = [];
    this.tabsTextList   = [];
}

iANDI.iFrames = new iFrames();
iANDI.tableInfo = new TableInfo();

iANDI.iFrames = andiBar.createObjectValues(iANDI.iFrames, 1);

iANDI.analyze(iANDI.iFrames);
andiBar.results(iANDI.iFrames, iANDI.tableInfo, [], showStartUpSummaryText);

}//end init
