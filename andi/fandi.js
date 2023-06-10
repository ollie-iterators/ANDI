//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var fandiVersionNumber = "7.0.0";

//create fANDI instance
var fANDI = new AndiModule(fandiVersionNumber,"f");

//This function will analyze the test page for focusable element related markup relating to accessibility
fANDI.analyze = function(objectClass){
    //Loop through every visible element and run tests
    $(TestPageData.allElements).each(function(){
        if($(this).is(":focusable,canvas")){//If element is focusable, search for accessibility components.
            andiData = new AndiData(this);

            andiCheck.commonFocusableElementChecks(andiData, $(this));
            andiCheck.lookForCanvasFallback(this);
            if(andiData.accesskey)
                fANDI.accesskeys.push(this, andiData.accesskey, andiData.andiElementIndex);
            testPageData.firstLaunchedModulePrep(this, andiData);
            objectClass.list.push(new Focusable([this], objectClass.list.length + 1, "", "", ""));
            andiBar.getAttributes(objectClass, objectClass.list.length - 1)
            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "focusable elements"
            AndiData.attachDataToElement(this);
        }
        else{
            testPageData.firstLaunchedModulePrep(this);
            andiCheck.isThisElementDisabled(this);
        }


    });

    andiCheck.areLabelForValid();
    andiCheck.areThereDisabledElements("elements");
};

function AndiAccesskeys(){
    //Raw accesskey values will be stored here and checked against
    var duplicateComparator = "";

    //Stores HTML to display the accesskeys
    var list = "";

    this.getListHtml = function(){
        return list;
    };

    this.push = function(element, accesskey, index){
        if(accesskey){
            //Is accesskey value more than one character?
            if(accesskey.length > 1){ //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
                andiAlerter.throwAlert(alert_0052,[accesskey]);
                addToList(accesskey, alert_0052);
            }
            else{
                //Check for duplicate accesskey
                if(duplicateComparator.includes(accesskey)){
                    if($(element).is("button,input:submit,input:button,input:reset,input:image")){
                        //duplicate accesskey found on button
                        andiAlerter.throwAlert(alert_0054,[accesskey]);
                        addToList(accesskey, alert_0054);
                    }
                    else if($(element).is("a[href]")){
                        //duplicate accesskey found on link
                        andiAlerter.throwAlert(alert_0056,[accesskey]);
                        addToList(accesskey, alert_0056);
                    }
                    else{
                        //duplicate accesskey found
                        andiAlerter.throwAlert(alert_0055,[accesskey]);
                        addToList(accesskey, alert_0055);
                    }
                }
                else{
                    addToList(accesskey);
                    duplicateComparator += accesskey;
                }
            }
        }

        function addToList(accesskey, alertObject){
            var addClass = "";
            var titleText = "";
            if(alertObject){
                addClass = "class='ANDI508-display-"+alertObject.level+"'";
                titleText = alertObject.level+": "+alertObject.message+accesskey;
            }
            else
                titleText = "AccessKey "+accesskey+" found, focus on element";

            if(index === 0)
                list += "<span tabindex='0' "+addClass+" title='"+ titleText +"'>"+accesskey+"</span> ";
            else
                list += "<a href='#' data-andi508-relatedindex='"+index+"' title='"+ titleText +"'><span "+addClass+">"+accesskey+"</span></a> ";
        }
    };
}

var showStartUpSummaryText = "Discover accessibility markup for focusable elements by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every focusable element.";
//This function will overlay the tab order sequence.
//It will take into account, tabindexes that are greater than zero and less than zero
AndiOverlay.prototype.overlayTabOrder = function(){
    var tabindex;
    var tabSequence = 0;
    var overlayObject;
    //PASS 1: Get tabindexes greater than 0:
    var greaterThanZeroArray = []; //Will store elements with tabindex greater than 0
    $("#ANDI508-testPage [tabindex].ANDI508-element").each(function(){
        tabindex = $(this).attr("tabindex");
        if(tabindex > 0)//tab index is greater than 0
            greaterThanZeroArray.push(this); //Add to the array
    });
    //loop through the greater than zero array until all elements have been addressed
    var i = 1;
    var z = greaterThanZeroArray.length;
    while(z > 0){
        for(var x=0; x<greaterThanZeroArray.length; x++){
            if($(greaterThanZeroArray[x]).attr("tabindex") == i){
                tabSequence++;
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabIndex="+i, i);
                andiOverlay.insertAssociatedOverlay($(greaterThanZeroArray[x]), overlayObject, true);
                z--;
            }
        }
        i++;
    }

    //PASS 2: Get tabindex=0 and natively tabbable:
    var titleText;
    var lastRadioGroupName;
    $("#ANDI508-testPage .ANDI508-element").each(function(){
        tabindex = $(this).attr("tabindex");
        if(tabindex < 0){
            //tab index is negative
            overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0);
            andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
        }
        else if(tabindex == 0 || ($(this).is(":tabbable") && !(tabindex > 0) )){
            //tabindex is 0 or natively tabbable and tabindex is not greater than zero

            if($(this).is("input[type=radio][name]")){
                if(lastRadioGroupName !== undefined && lastRadioGroupName === $(this).attr("name"))
                    return; //this is a subsequent radio button, don't add overlay
                else
                    lastRadioGroupName = $(this).attr("name");
            }
            tabSequence++;
            titleText = (tabindex == 0) ? "tabIndex=0" : "natively tabbable";
            overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0);
            andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
        }
    });
};

//This function will overlay the label elements.
AndiOverlay.prototype.overlayLabelTags = function(){
    var labelText, labelFor, overlayClasses, overlayObject, titleText;
    $("#ANDI508-testPage label").filter(":visible").each(function(){
        labelText = "&lt;label";
        overlayClasses = "ANDI508-overlay-labelTags";
        titleText = "";
        labelFor = $(this).attr("for");

        if(labelFor){
            labelText += " for=" + labelFor;
            if(!document.getElementById(labelFor)){ //id that matches for cannot be found
                overlayClasses += " ANDI508-overlay-alert";
                titleText += "no matching [id]";
            }
        }
        else
            titleText += "no [for] attribute";
        labelText += "&gt;";

        overlayObject = andiOverlay.createOverlay(overlayClasses, labelText, titleText, 0);
        andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
        $(this).after(andiOverlay.createOverlay(overlayClasses, "&lt;/label&gt;", "", 0));
    });

};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
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

// This is where the added code for the module goes
fANDI.addAccessKeysList = function (objectClass) {
    //Accesskeys List:
    if(objectClass.getListHtml()){
        $("#ANDI508-additionalPageResults").append("<p id='ANDI508-accesskeysFound'>AccessKeys: "+"{ "+objectClass.getListHtml()+"}</p>");
        $("#ANDI508-accesskeysFound").find("a").each(function(){
            andiFocuser.addFocusClick($(this));
            $(this).on("mouseover" 	,andiLaser.drawAlertLaser);
            $(this).on("click"		,andiLaser.eraseLaser);
            $(this).on("mouseleave"	,andiLaser.eraseLaser);
        });
        $("#ANDI508-accesskeysFound").show();
    }
}

//This object class is used to store data about each focusable element. Object instances will be placed into an array.
function Focusable(elementList, index, nameDescription, alerts, rowClass) {
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription;
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the focusable elements on the page
function Focusables() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Focusable Elements";
    this.cssProperties  = [];
    this.buttonTextList = ["Tab Sequence"];
    this.tabsTextList   = [];
}

fANDI.focusables = new Focusables();
fANDI.tableInfo = new TableInfo();
fANDI.accesskeys = new AndiAccesskeys();

fANDI.focusables = andiBar.createObjectValues(fANDI.focusables, 3);

fANDI.addAccessKeysList(fANDI.accesskeys);
fANDI.analyze(fANDI.focusables);
andiBar.results(fANDI.focusables, fANDI.tableInfo, [], showStartUpSummaryText);

}//end init
