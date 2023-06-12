//==========================================//
//lANDI: certain links ANDI                 //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var landiVersionNumber = "8.2.1";

//create lANDI instance
var lANDI = new AndiModule(landiVersionNumber,"l");

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element)
        $(element).removeClass("lANDI508-internalLink lANDI508-externalLink lANDI508-ambiguous lANDI508-anchorTarget");
};

//Alert icons for the links list table
//Ignore the jslint warning about the "new" declaration. It is needed.
var alertIcons = new function(){//new is intentional
    this.danger_noAccessibleName = makeIcon("danger","No accessible name");
    this.warning_anchorTargetNotFound = makeIcon("warning","In-page anchor target not found");
    this.warning_ambiguous = makeIcon("warning","Ambiguous: same name, different href");
    this.caution_ambiguous = makeIcon("caution","Ambiguous: same name, different href");
    this.caution_vagueText = makeIcon("caution","Vague: does not identify link purpose.");
    this.warning_tabOrder = makeIcon("warning","Element not in tab order");

    function makeIcon(alertLevel, titleText){
        //The sortPriority number allows alert icon sorting
        var sortPriority = "3"; //default to caution
        if(alertLevel=="warning")
            sortPriority = "2";
        else if(alertLevel=="danger")
            sortPriority = "1";
        return "<img src='"+icons_url+alertLevel+".png' alt='"+alertLevel+"' title='Accessibility Alert: "+titleText+"' /><i>"+sortPriority+" </i>";
    }
};

var attributesToAdd = [];
//This function will analyze the test page for link related markup relating to accessibility
lANDI.analyze = function(objectClass){
    //Variables used to build the links/buttons list array.
    var href, nameDescription, alerts, target, linkPurpose, alertIcon, alertObject, relatedElement, ambiguousIndex;

    //Loop through every visible element and run tests
    $(TestPageData.allElements).each(function(){
        //ANALYZE LINKS
        if($(this).isSemantically(["link"],"a[href],a[tabindex],area")){
            if(!andiCheck.isThisElementDisabled(this)){

                lANDI.links.elementNums[0] += 1;
                lANDI.links.elementStrings[0] = "links";

                andiData = new AndiData(this);

                if($(this).is("a,area") || andiData.role === "link"){
                    //set nameDescription
                    nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                    href = ($(this).is("a,area")) ? lANDI.normalizeHref(this) : "";
                    alerts = "";
                    linkPurpose = ""; //i=internal, e=external
                    target = $.trim($(this).attr("target"));
                    alertIcon = "";
                    alertObject = "";
                    ambiguousIndex = undefined;

                    if(isLinkKeyboardAccessible(href, this)){
                        if(nameDescription){
                            ambiguousIndex = scanForAmbiguity(this, nameDescription, href);

                            var rowClass = determineLinkPurpose(href, this);

                            testForVagueLinkText(nameDescription);

                            if(!alerts) //Add this for sorting purposes
                                alerts = "<i>4</i>";
                        }
                        else{//No accessible name or description
                            alerts = alertIcons.danger_noAccessibleName;
                            nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                        }

                        if(href){
                            //create Link object and add to array
                            lANDI.links.list.push(new CertainLink([this], objectClass.list.length + 1, nameDescription, "", rowClass));
                            attributesToAdd = andiBar.getAttributes(lANDI.links, lANDI.links.list.length - 1, attributesToAdd);
                        }
                        else if(andiData.role === "link"){
                            //create Link object and add to array
                            lANDI.links.list.push(new CertainLink([this], objectClass.list.length + 1, nameDescription, "", rowClass));
                            attributesToAdd = andiBar.getAttributes(lANDI.links, lANDI.links.list.length - 1, attributesToAdd);

                            isElementInTabOrder(this, "link");
                        }
                        else if(!andiData.role){
                            //link as no role and no href, suggest using role=link or href
                            andiAlerter.throwAlert(alert_0168);
                        }
                        andiCheck.commonFocusableElementChecks(andiData,$(this));
                    }
                }

                AndiData.attachDataToElement(this);
            }
        }
    });

    //Detect disabled links
    andiCheck.areThereDisabledElements("links");


    //This function returns true if the link is keyboard accessible
    function isLinkKeyboardAccessible(href, element){
        if(typeof href === "undefined" && !$(element).attr("tabindex")){
            //There is no href and no tabindex
            var name = $(element).attr("name");
            var id = element.id;

            if(element.onclick !== null || $._data(element, "events").click !== undefined){
                //Link is clickable but not keyboard accessible
                andiAlerter.throwAlert(alert_0164);
            }
            //No click event could be detected
            else if(!id && !name){//Link doesn't have id or name
                andiAlerter.throwAlert(alert_0128);
            }
            else{//Link has id or name
                //Determine if the link is an anchor for another link
                var isDefinitelyAnAnchor = false;
                var referencingHref = "";

                //Look through all hrefs to see if any is referencing this element's id or name
                $("#ANDI508-testPage a[href]").each(function(){
                    referencingHref = $(this).attr("href");
                    if(referencingHref.charAt(0) === "#"){
                        if(referencingHref.slice(1) === id || referencingHref.slice(1) === name){
                            isDefinitelyAnAnchor = true;
                            return false; //break out of loop
                        }
                    }
                });
                if(!isDefinitelyAnAnchor){
                    if(element.onclick === null && $._data(element, "events").click === undefined)
                        andiAlerter.throwAlert(alert_0129);
                    else //Link is clickable but not keyboard accessible
                        andiAlerter.throwAlert(alert_0164);
                }
                else if(name){ //name is deprecated
                    andiAlerter.throwAlert(alert_007B, [name]);
                }
                else{
                    andiAlerter.throwAlert(alert_012A); //definitely an anchor, but not focusable
                }
            }
            return false; //not keyboard accessible
        }
        return true;
    }

    //This function will seach through Links Array for same name different href
    function scanForAmbiguity(element, nameDescription, href){
        var regEx = /^https?:\/\//; //Strip out the http:// or https:// from the compare

        for(var x=0; x<lANDI.links.list.length; x++){
            if(nameDescription.toLowerCase() == lANDI.links.list[x].nameDescription.toLowerCase()){ //nameDescription match

                if(href.toLowerCase().replace(regEx,"") != lANDI.links.list[x].href.toLowerCase().replace(regEx,"")){ //href doesn't match, throw alert

                    //Determine which alert level should be thrown
                    if(href.charAt(0) == "#" || lANDI.links.list[x].href.charAt(0) == "#"){
                        //One link is internal
                        alertIcon = alertIcons.caution_ambiguous;
                        alertObject = alert_0162;
                    }
                    else{
                        alertIcon = alertIcons.warning_ambiguous;
                        alertObject = alert_0161;
                    }

                    //Throw the alert
                    if(!lANDI.links.list[x].alerts.includes(alertIcon)){
                        //Throw alert on first instance only one time
                        andiAlerter.throwAlertOnOtherElement(lANDI.links.list[x].index, alertObject);
                        lANDI.links.list[x].alerts = alertIcon;
                    }

                    //Set the ambiguousIndex
                    var i; //will store the ambiguousIndex for this match
                    //Does the first instance already have an ambiguousIndex?
                    relatedElement = $(lANDI.links.list[x].element);
                    if(lANDI.links.list[x].ambiguousIndex){
                        //Yes. Copy the ambiguousIndex from the first instance
                        i = lANDI.links.list[x].ambiguousIndex;
                        lANDI.links.elementNums[3] += 1;
                        lANDI.links.elementStrings[3] = "ambiguous links";
                    }
                    else{
                        //No. increment ambiguousIndex and add it to the first instance.
                        lANDI.links.elementNums[3] = lANDI.links.elementNums[3] + 2;
                        lANDI.links.elementStrings[3] = "ambiguous links";
                        lANDI.links.ambiguousIndex++;
                        i = lANDI.links.ambiguousIndex;
                        lANDI.links.list[x].ambiguousIndex = i;
                        $(relatedElement).addClass("lANDI508-ambiguous");
                    }

                    $(element).addClass("lANDI508-ambiguous");
                    alerts += alertIcon;
                    andiAlerter.throwAlert(alertObject);
                    return i;//prevents alert from being thrown more than once on an element
                }
            }
        }
        return false;
    }

    //This function searches for anchor target if href is internal and greater than 1 character e.g. href="#x"
    function determineLinkPurpose(href, element){
        var rowClass = "";
        if(typeof href !== "undefined"){
            if(href.charAt(0) === "#" && href.length > 1){
                var idRef = href.slice(1); //do not convert to lowercase
                if(!isAnchorTargetFound(idRef)){
                    if(element.onclick === null && $._data(element, 'events').click === undefined){//no click events
                        //Throw Alert, Anchor Target not found
                        alerts += alertIcons.warning_anchorTargetNotFound;
                        andiAlerter.throwAlert(alert_0069, [idRef]);
                    }
                }
                else{//link is internal and anchor target found
                    lANDI.links.elementNums[1] += 1;
                    lANDI.links.elementStrings[1] = "internal links";
                    linkPurpose = "i";
                    rowClass = "lANDI508-listLinks-internal";
                    $(element).addClass("lANDI508-internalLink");
                }
            }
            else if(href.charAt(0) !== "#" && !lANDI.isScriptedLink(href)){//this is an external link
                lANDI.links.elementNums[2] += 1;
                lANDI.links.elementStrings[2] = "external links";
                linkPurpose = "e";
                rowClass = "lANDI508-listLinks-external";
                $(element).addClass("lANDI508-externalLink");
            }
        }
        return rowClass;

        //This function searches allIds list to check if anchor target exists. return true if found.
        function isAnchorTargetFound(idRef){
            //for(var z=0; z<testPageData.allIds.length; z++){
            //	if(testPageData.allIds[z].id.toString().toLowerCase() == idRef)
            //		return true;
            //}
            var anchorTarget = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
            if($(anchorTarget).is(":visible")){
                $(anchorTarget).addClass("lANDI508-anchorTarget");
                return true;
            }
            return false;
        }
    }

    //This function checks the link text for vagueness
    function testForVagueLinkText(nameDescription){
        var regEx = /^(click here|here|link|edit|select|more|more info|more information|go)$/g;
        if(regEx.test(nameDescription.toLowerCase())){
            alerts += alertIcons.caution_vagueText;
            andiAlerter.throwAlert(alert_0163);
        }
    }

    //This function determines if an element[role] is in tab order
    function isElementInTabOrder(element, role){
        if(!!$(element).prop("tabIndex") && !$(element).is(":tabbable")){//Element is not tabbable and has no tabindex
            //Throw Alert: Element with role=link|button not in tab order
            alerts += alertIcons.warning_tabOrder;
            andiAlerter.throwAlert(alert_0125, [role]);
        }
    }

    //this function will normalize the accessible name and description so that the raw string can be analyzed.
    function getNameDescription(name, desc){
        var n = "";
        var d = "";
        if(name)
            n = andiUtility.normalizeOutput(name);
        if(desc){
            d = andiUtility.normalizeOutput(desc);
            if(n === d) //matchingTest
                d = "";
            else
                d = " " + d; //add space
        }
        return n + d;
    }
};

var showStartUpSummaryText = "Discover accessibility markup for <span class='ANDI508-module-name-l'>links</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every link.";
//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if ($(element).hasClass("ANDI508-element")) {

        //Highlight the row in the list that associates with this element
        andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"), "viewList");

        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData,
            [
                ["href", lANDI.normalizeHref(element)],
                "rel",
                "download",
                "media",
                "target",
                "type"
            ]
        );

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function builds the table for the view list
lANDI.viewList_buildTable = function(mode){
    var tableHTML = "";
    var rowClasses;
    var appendHTML = "<div id='lANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='ANDI508-viewList-tabs'>";
    var nextPrevHTML = "<button id='lANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='"+andiHotkeyList.key_prev.key+"'><img src='"+icons_url+"prev.png' alt='' /></button>"+
        "<button id='lANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='"+andiHotkeyList.key_next.key+"'><img src='"+icons_url+"next.png' alt='' /></button>"+
        "</div>"+
        "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='"+mode+" List' tabindex='-1'><thead><tr>";

    //BUILD LINKS LIST TABLE
    var displayHref, targetText;
    for(var x=0; x<lANDI.links.list.length; x++){
        //get target text if internal link
        displayHref = "";
        targetText = "";
        if(lANDI.links.list[x].href){//if has an href
            if(!lANDI.isScriptedLink(lANDI.links.list[x])){
                    if(lANDI.links.list[x].href.charAt(0) !== "#") //href doesn't start with # (points externally)
                        targetText = "target='_landi'";
                    displayHref = "<a href='"+lANDI.links.list[x].href+"' "+targetText+">"+lANDI.links.list[x].href+"</a>";
            }
            else{ //href contains javascript
                displayHref = lANDI.links.list[x].href;
            }
        }

        //determine if there is an alert
        rowClasses = "";
        var nextTabButton = "";
        if(lANDI.links.list[x].alerts.includes("Alert"))
            rowClasses += "ANDI508-table-row-alert ";

        if(lANDI.links.list[x].linkPurpose == "i"){
            var id = lANDI.links.list[x].href;
            if(id.charAt(0) === "#")
                id = id.substring(1, id.length);
            nextTabButton = " <button class='lANDI508-nextTab' data-andi508-relatedid='"+
                id+"' title='focus on the element after id="+
                id+"'>next tab</button>";
        }

        tableHTML += "<tr class='" + $.trim(rowClasses) + "'>"+
            "<th scope='row'>"+lANDI.links.list[x].index+"</th>"+
            "<td class='ANDI508-alert-column'>"+lANDI.links.list[x].alerts+"</td>"+
            "<td><a href='javascript:void(0)' data-andi508-relatedindex='"+lANDI.links.list[x].index+"'>"+lANDI.links.list[x].nameDescription+"</a></td>"+
            "<td class='ANDI508-code'>"+displayHref+nextTabButton+"</td>"+
            "</tr>";
    }

    appendHTML += nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>"+
        "<th scope='col' style='width:45%'><a href='javascript:void(0)'>href <i aria-hidden='true'></i></a></th>";

    $("#ANDI508-additionalPageResults").append(appendHTML+"</tr></thead><tbody>"+tableHTML+"</tbody></table></div></div>");
};

//This function gets the href
//if href length is greater than 1 and last char is a slash
//This elimates false positives during comparisons since with or without slash is essentially the same
lANDI.normalizeHref = function(element){
    var href = $(element).attr("href");
    if(typeof href != "undefined"){
        href = $.trim($(element).attr("href"));
        if(href === "")
            href = AndiCheck.emptyString;
        else if(href.length > 1 && href.charAt(href.length - 1) == "/")
            href = href.slice(0, -1);
    }
    return href;
};

//This function returns true if the href is a link that fires a script
lANDI.isScriptedLink = function(href){
    if(typeof href == "string"){
        //broken up into three substrings so its not flagged in jslint
        return(href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
    }//else
    return false;
};

//This object class is used to store data about each link. Object instances will be placed into an array.
function CertainLink(elementList, index, nameDescription, alerts, rowClass){
    this.elementList     = elementList;
    this.index           = index;
    this.nameDescription = nameDescription
    this.alerts          = alerts;
    this.columnValues    = [elementList, index, nameDescription, alerts];
    this.rowClass        = rowClass;
}

//This object class is used to keep track of the links on the page
function CertainLinks(){
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.columnNames    = ["elementList", "index", "nameDescription", "alerts"];
    this.ambiguousIndex = 0;
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode      = "Links";
    this.cssProperties  = [];
    this.buttonTextList = ["Highlight Ambiguous Links"];
    this.tabsTextList   = ["All", "Internal", "External"];
}

lANDI.links = new CertainLinks();
lANDI.tableInfo = new TableInfo();

lANDI.links = andiBar.createObjectValues(lANDI.links, 4);

lANDI.analyze(lANDI.links);
andiBar.results(lANDI.links, lANDI.tableInfo, attributesToAdd, showStartUpSummaryText);

}//end init
