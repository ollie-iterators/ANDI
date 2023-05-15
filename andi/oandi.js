//==========================================//
//oANDI: headers ANDI                       //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var oANDIVersionNumber = "4.3.0";

//create oANDI instance
var oANDI = new AndiModule(oANDIVersionNumber,"o");

var langAttributesCount = 0;
var roleAttributesCount = 0;

//This function will analyze the test page for graphics/image related markup relating to accessibility
oANDI.analyze = function(objectClass){

    //Loop through every visible element
    $(TestPageData.allElements).each(function(){
        if($(this).isSemantically(["heading"],"h1,h2,h3,h4,h5,h6")){

            objectClass.elementNums[0] += 1;
            objectClass.elementStrings[0] = "certain headings";

            andiData = new AndiData(this);

            //Add to the headings array

            if(andiData.isAriaHidden != true)
                objectClass.list.push(new CertainHeader([this], objectClass.list.length + 1, ''));

            if(andiData.role === "heading"){

                var ariaLevel = $(this).attr("aria-level");
                if(ariaLevel){
                    if($(this).is("h1,h2,h3,h4,h5,h6")){
                        if(andiData.tagNameText.charAt(1) !== ariaLevel){
                            //heading tag name level doesn't match aria-level
                            andiAlerter.throwAlert(alert_0191,[andiData.tagNameText,ariaLevel]);
                        }
                    }
                    if(parseInt(ariaLevel) < 0 || parseInt(ariaLevel) != ariaLevel)
                        //Not a positive integar
                        andiAlerter.throwAlert(alert_0193);
                }
                else{
                    //role=heading without aria-level
                    andiAlerter.throwAlert(alert_0192);
                }
            }

            andiCheck.commonNonFocusableElementChecks(andiData, $(this));
            AndiData.attachDataToElement(this);
        }

        //For all elements on the page
        if($.trim($(this).attr("role")))
            roleAttributesCount++;
        if($.trim($(this).prop("lang")))
            langAttributesCount++;
    });
};

//Initialize outline
oANDI.outline = "<h3 tabindex='-1' id='oANDI508-outline-heading'>Headings List (ordered by occurrence):</h3><div class='ANDI508-scrollable'>";

//This function will display the heading list (headings outline)
//It should only be called on heading elements
oANDI.getOutlineItem = function(element){
    var displayCharLength = 60; //for truncating innerText
    var tagName = $(element).prop("tagName").toLowerCase();
    var role = $(element).getValidRole();
    var ariaLevel = $(element).attr("aria-level");

    //Indent the heading according to the level
    //Results in h1 = 1% left margin, h2 = 2% left margin, etc.
    var indentLevel;
    if(ariaLevel){
        //Check if positive integar
        if(parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel)
            indentLevel = parseInt(ariaLevel);
        else //aria-level is not a positive integar, default to 2 (defined in ARIA spec, and screen readers are doing this)
            indentLevel = 2;
    }
    else{
        if(role === "heading")
            indentLevel = 2; //no aria-level and role=heading, so default to 2 (defined in ARIA spec)
        else
            indentLevel = parseInt(tagName.slice(1)); //get second character from h tag
    }

    var outlineItem = "<a style='margin-left:"+indentLevel+"%' href='#' data-andi508-relatedindex='"+$(element).attr('data-andi508-index')+"'>&lt;"+tagName;

    //display relevant attributes
    if(role)
        outlineItem += " role='" + role + "' ";
    if(ariaLevel)
        outlineItem += " aria-level='" + ariaLevel + "' ";

    outlineItem += "&gt;";
    outlineItem += "<span class='ANDI508-display-innerText'>";
    outlineItem += $.trim(andiUtility.formatForHtml($(element).text().substring(0,displayCharLength)));
    if($(element).html().length > displayCharLength){
        outlineItem += "...";
    }
    outlineItem += "</span>";
    outlineItem += "&lt;/"+tagName+"&gt;</a>";
    outlineItem += "<br />";
    return outlineItem;
};

var showStartUpSummaryText = "Heading structure found.<br />Determine if <span class='ANDI508-module-name-s'>headings</span> are appropriately applied.";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
oANDI.results = function(objectClass){

    var moduleActionButtons = "";

    var moreDetails = "<button id='ANDI508-pageTitle-button'>page title</button>"+
        "<button id='ANDI508-pageLanguage-button'>page language</button>";

    moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

    $("#ANDI508-module-actions").html(moduleActionButtons);

    andiBar.initializeModuleActionGroups();

    //Define the page title button
    $("#ANDI508-pageTitle-button").click(function(){
        andiOverlay.overlayButton_on("overlay",$(this));
        if(document.title)
            alert("The page title is: "+document.title);
        else
            alert("There is no page title.");
        andiOverlay.overlayButton_off("overlay",$(this));
    });

    //Define the page language button
    $("#ANDI508-pageLanguage-button").click(function(){
        andiOverlay.overlayButton_on("overlay",$(this));
        //get the lang attribute from the HTML element
        var htmlLangAttribute = $.trim($("html").first().prop("lang"));
        //pop up the lang value of the HTML element
        if(htmlLangAttribute)
            alert("The <html> element has a lang attribute value of: "+htmlLangAttribute+".");
        else
            alert("The <html> element does not have a lang attribute.");
        andiOverlay.overlayButton_off("overlay",$(this));
    });

    //Deselect all mode buttons
    $("#ANDI508-module-actions button.oANDI508-mode").attr("aria-selected","false");

    //HEADINGS
    $("#ANDI508-headings-button")
        .attr("aria-selected","true")
        .addClass("ANDI508-module-action-active");

    andiBar.updateResultsSummary("Headings: "+objectClass.list.length);

    //Build Outline
    for(var x=0; x<objectClass.list.length; x++){
        oANDI.outline += oANDI.getOutlineItem(objectClass.list[x]);
    }
    oANDI.outline += "</div>";

    $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view headings list</button><div id='oANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

    //Define outline button
    $("#ANDI508-viewOutline-button").click(function(){
        if($(this).attr("aria-expanded") === "true"){
            //hide Outline, show alert list
            $("#oANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
            if(testPageData.numberOfAccessibilityAlertsFound > 0){
                $("#ANDI508-alerts-list").show();
            }
            $(this)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon+"view headings list")
                .attr("aria-expanded","false")
                .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
        }
        else{
            //show Outline, hide alert list
            $("#ANDI508-alerts-list").hide();

            andiSettings.minimode(false);
            $(this)
                .html(listIcon+"hide headings list")
                .attr("aria-expanded","true")
                .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                .find("img").attr("src",icons_url+"list-on.png");
            $("#oANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
        }
        andiResetter.resizeHeights();
        return false;
    });

    if(!andiBar.focusIsOnInspectableElement()){
        andiBar.showElementControls();
        andiBar.showStartUpSummary(showStartUpSummaryText,true);
    }

    $("#oANDI508-outline-container")
    .html(oANDI.outline)
    .find("a[data-andi508-relatedindex]").each(function(){
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

    $("#oANDI508-outline-container")
    .html(oANDI.outline)
    .find("a[data-andi508-relatedindex]").each(function(){
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

    andiAlerter.updateAlertList();

    $("#ANDI508").focus();

};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if($(element).hasClass("ANDI508-element")){
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");

        var addOnProps = AndiData.getAddOnProps(element, elementData, ["aria-level"]);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function will overlay the reading order sequence.
AndiOverlay.prototype.overlayReadingOrder = function(){
    //Elements that should be excluded from the scan, hidden elements will automatically be filtered out
    var exclusions = "option,script,style,noscript";
    //Elements that should be included in the scan even if they don't have innerText
    var inclusions = "select,input,textarea";

    var readingSequence = 0;
    var overlayObject;

    traverseReadingOrder(document.getElementById("ANDI508-testPage"));

    //This recursive function traverses the dom tree and inserts the reading order overlay
    //It distinguishes between element nodes and text nodes
    //It will check for aria-hidden=true (with inheritance)
    function traverseReadingOrder(element, ariaHidden){

        //Check for aria-hidden=true
        ariaHidden = (ariaHidden || $(element).attr("aria-hidden") === "true") ? true : false;

        for(var z=0; z<element.childNodes.length; z++){

            //if child is an element object that is visible
            if(element.childNodes[z].nodeType === 1){
                if(!$(element.childNodes[z]).is(exclusions) && $(element.childNodes[z]).is(":shown")){
                    if($(element.childNodes[z]).is(inclusions)){//no need to look at this element's childNodes
                        insertReadingOrder(ariaHidden, element.childNodes[z]);
                        z++;//because a new node was inserted, the indexes changed
                    }
                    else{//recursion here:
                        traverseReadingOrder(element.childNodes[z], ariaHidden);
                    }
                }
            }
            //else if child is a text node
            else if(element.childNodes[z].nodeType === 3){
                if($.trim(element.childNodes[z].nodeValue) !== ""){
                    //Found some text
                    insertReadingOrder(ariaHidden, element.childNodes[z]);
                    z++;//because a new node was inserted, the indexes changed
                }
            }
        }

        //this function inserts the reading order overlay
        //if it's hidden using aria-hidden it will insert an alert overlay
        function insertReadingOrder(ariaHidden, node){
            if(ariaHidden){
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-readingOrder", "X", "hidden from screen reader using aria-hidden=true");
            }
            else{
                readingSequence++;
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-readingOrder", readingSequence);
            }
            andiOverlay.insertAssociatedOverlay(node, overlayObject);
        }
    }
};

//This object class is used to store data about each certain header. Object instances will be placed into an array.
function CertainHeader(elementList, index, rowClass) {
    this.elementList  = elementList;
    this.index        = index;
    this.columnValues = [elementList, index];
    this.rowClass     = rowClass;
}

//This object class is used to keep track of the certain headers on the page
function CertainHeaders() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["element", "index"];
    this.outlineReady   = false;
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode = "Certain Headers";
    this.cssProperties = [];
    this.buttonTextList = ["Reading Order", "Role Attributes", "Lang Attributes"];
    this.tabsTextList = [];
}

oANDI.certainHeaders = new CertainHeaders();

oANDI.tableInfo = new TableInfo();

oANDI.analyze(oANDI.certainHeaders);
//oANDI.results(oANDI.certainHeaders);
andiBar.results(oANDI.certainHeaders, oANDI.tableInfo, [], showStartUpSummaryText);

}//end init
