//==========================================//
//mANDI: possible links ANDI                //
//Created By Social Security Administration //
//==========================================//
function init_module(){

    var mANDIVersionNumber = "8.2.1";

    //create mANDI instance
    var mANDI = new AndiModule(mANDIVersionNumber,"m");

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function(testPage, element){
        if(element)
            $(element).removeClass("mANDI508-ambiguous mANDI508-anchorTarget");
    };

    //This object class is used to store data about each link. Object instances will be placed into an array.
    function Link(href, nameDescription, index, alerts, target, linkPurpose, ambiguousIndex, element){
        this.href = href;
        this.nameDescription = nameDescription;
        this.index = index;
        this.alerts = alerts;
        this.target = target;
        this.linkPurpose = linkPurpose;
        this.ambiguousIndex = undefined;
        this.element = element;
    }

    //This object class is used to keep track of the links on the page
    function Links(){
        this.list           = [];
        this.elementNums    = [];
        this.elementStrings = [];
        this.ambiguousIndex = 0;
    }

    AndiModule.initActiveActionButtons({
        viewLinksList:false
    });

    mANDI.viewList_tableReady = false;

    //This function will analyze the test page for link related markup relating to accessibility
    mANDI.analyze = function(objectClass){
        objectClass = andiBar.createObjectValues(objectClass, 1);

        mANDI.links = new Links();

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function(){
            //ANALYZE LINKS
            if($(this).isSemantically(["link"],"a[href],a[tabindex],area")){
                // Combine this with the later else if statement
            }
            //Analyze elements that might be links
            else if($(this).is("a")){
                andiData = new AndiData(this);
                isLinkKeyboardAccessible(undefined, this);
                objectClass.elementNums[0] += 1;
                objectClass.elementStrings[0] = "possible links";
                AndiData.attachDataToElement(this);
                //Don't allow element to appear in next/prev flow or hover. Also remove highlight.
                $(this).addClass("ANDI508-exclude-from-inspection").removeClass("ANDI508-highlight");
            }
        });

        //Detect disabled links or buttons
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
    };

    var showStartUpSummaryText = "Discover accessibility markup for <span class='ANDI508-module-name-l'>links</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every link.";
    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    mANDI.results = function(objectClass){

        andiBar.updateResultsSummary("Links Found: "+mANDI.links.elementNums[0]);

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewLinksList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view links list</button>");

        //Links List Button
        $("#ANDI508-viewLinksList-button").click(function(){
            if(!mANDI.viewList_tableReady){
                mANDI.viewList_buildTable("links");
                mANDI.viewList_attachEvents();
                mANDI.viewList_attachEvents_links();
                mANDI.viewList_tableReady = true;
            }
            mANDI.viewList_toggle("links", this);
            andiResetter.resizeHeights();
            return false;
        });

        //Show Startup Summary
        if(!andiBar.focusIsOnInspectableElement()){
            andiBar.showElementControls();
            andiBar.showStartUpSummary(showStartUpSummaryText,true);
        }

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons([
            "viewLinksList"
        ]);

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function(element){
        if($(element).hasClass("ANDI508-element")){

            //Highlight the row in the links list that associates with this element
            andiBar.viewList_rowHighlight($(element).attr("data-andi508-index"));

            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [
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
    mANDI.viewList_buildTable = function(mode){
        var tableHTML = "";
        var rowClasses;
        var appendHTML = "<div id='mANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='mANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='mANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='"+andiHotkeyList.key_prev.key+"'><img src='"+icons_url+"prev.png' alt='' /></button>"+
            "<button id='mANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='"+andiHotkeyList.key_next.key+"'><img src='"+icons_url+"next.png' alt='' /></button>"+
            "</div>"+
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='"+mode+" List' tabindex='-1'><thead><tr>";

        //BUILD LINKS LIST TABLE
        var displayHref, targetText;
        for(var x=0; x<mANDI.links.list.length; x++){
            //get target text if internal link
            displayHref = "";
            targetText = "";
            if(mANDI.links.list[x].href){//if has an href
                if(!mANDI.isScriptedLink(mANDI.links.list[x])){
                        if(mANDI.links.list[x].href.charAt(0) !== "#") //href doesn't start with # (points externally)
                            targetText = "target='_mandi'";
                        displayHref = "<a href='"+mANDI.links.list[x].href+"' "+targetText+">"+mANDI.links.list[x].href+"</a>";
                }
                else{ //href contains javascript
                    displayHref = mANDI.links.list[x].href;
                }
            }

            //determine if there is an alert
            rowClasses = "";
            var nextTabButton = "";
            if(mANDI.links.list[x].alerts.includes("Alert"))
                rowClasses += "ANDI508-table-row-alert ";

            if(mANDI.links.list[x].linkPurpose == "i"){
                rowClasses += "mANDI508-listLinks-internal ";
                var id = mANDI.links.list[x].href;
                if(id.charAt(0) === "#")
                    id = id.substring(1, id.length);
                nextTabButton = " <button class='mANDI508-nextTab' data-andi508-relatedid='"+
                    id+"' title='focus on the element after id="+
                    id+"'>next tab</button>";
            }
            else if(mANDI.links.list[x].linkPurpose == "e")
                rowClasses += "mANDI508-listLinks-external ";

            tableHTML += "<tr class='" + $.trim(rowClasses) + "'>"+
                "<th scope='row'>"+mANDI.links.list[x].index+"</th>"+
                "<td class='ANDI508-alert-column'>"+mANDI.links.list[x].alerts+"</td>"+
                "<td><a href='javascript:void(0)' data-andi508-relatedindex='"+mANDI.links.list[x].index+"'>"+mANDI.links.list[x].nameDescription+"</a></td>"+
                "<td class='ANDI508-code'>"+displayHref+nextTabButton+"</td>"+
                "</tr>";
        }

        appendHTML += nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>"+
            "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>"+
            "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>"+
            "<th scope='col' style='width:45%'><a href='javascript:void(0)'>href <i aria-hidden='true'></i></a></th>";

        $("#ANDI508-additionalPageResults").append(appendHTML+"</tr></thead><tbody>"+tableHTML+"</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    mANDI.viewList_toggle = function(mode, btn){
        if($(btn).attr("aria-expanded") === "false"){
            //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon+"hide "+mode+" list")
                .attr("aria-expanded","true")
                .find("img").attr("src",icons_url+"list-on.png");
            $("#mANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            AndiModule.activeActionButtons.viewLinksList = true;
        }
        else{
            //hide List, show alert list
            $("#mANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();
            $("#ANDI508-alerts-list").show();
            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon+"view "+mode+" list")
                .attr("aria-expanded","false");
            AndiModule.activeActionButtons.viewLinksList = false;
        }
    };

    //This function attaches the click,hover,focus events to the items in the view list
    mANDI.viewList_attachEvents = function(){
        //Add focus click to each link (output) in the table
        $("#ANDI508-viewList-table td a[data-andi508-relatedindex]").each(function(){
            andiFocuser.addFocusClick($(this));
            var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + $(this).attr("data-andi508-relatedindex") + "]").first();
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

        //This will define the click logic for the table sorting.
        //Table sorting does not use aria-sort because .removeAttr("aria-sort") crashes in old IE
        $("#ANDI508-viewList-table th a").click(function(){
            var table = $(this).closest("table");
            $(table).find("th").find("i").html("")
                .end().find("a"); //remove all arrow

            var rows = $(table).find("tr:gt(0)").toArray().sort(sortCompare($(this).parent().index()));
            this.asc = !this.asc;
            if(!this.asc){
                rows = rows.reverse();
                $(this).attr("title","descending")
                    .parent().find("i").html("&#9650;"); //up arrow
            }
            else{
                $(this).attr("title","ascending")
                    .parent().find("i").html("&#9660;"); //down arrow
            }
            for(var i=0; i<rows.length; i++){
                $(table).append(rows[i]);
            }

            //Table Sort Functionality
            function sortCompare(index){
                return function(a, b){
                    var valA = getCellValue(a, index);
                    var valB = getCellValue(b, index);
                    return !isNaN(valA) && !isNaN(valB) ? valA - valB : valA.localeCompare(valB);
                };
                function getCellValue(row, index){
                    return $(row).children("td,th").eq(index).text();
                }
            }
        });

        //Define listLinks next button
        $("#mANDI508-viewList-button-next").click(function(){
            //Get class name based on selected tab
            var selectedTabClass = $("#mANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var focusGoesOnThisIndex;

            if(index == testPageData.andiElementIndex || isNaN(index)){
                //No link being inspected yet, get first element according to selected tab
                focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to first
            }
            else{
                //Find the next element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for(var x=index; x<testPageData.andiElementIndex; x++){
                    //Get next element within set of selected tab type
                    if($("#ANDI508-testPage ."+selectedTabClass+"[data-andi508-index='"+(x + 1)+"']").length){
                        focusGoesOnThisIndex = x + 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            andiBar.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function(){
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLinks prev button
        $("#mANDI508-viewList-button-prev").click(function(){
            //Get class name based on selected tab
            var selectedTabClass = $("#mANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var firstElementInListIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-andi508-index");
            var focusGoesOnThisIndex;

            if(isNaN(index)){ //no active element yet
                //get first element according to selected tab
                andiFocuser.focusByIndex(firstElementInListIndex); //loop back to first
                focusGoesOnThisIndex = firstElementInListIndex;
            }
            else if(index == firstElementInListIndex){
                //Loop to last element in list
                focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).last().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to last
            }
            else{
                //Find the previous element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for(var x=index; x>0; x--){
                    //Get next element within set of selected tab type
                    if($("#ANDI508-testPage ."+selectedTabClass+"[data-andi508-index='"+(x - 1)+"']").length){
                        focusGoesOnThisIndex = x - 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            andiBar.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function(){
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function attaches click events to the items specific to the Links view list
    mANDI.viewList_attachEvents_links = function(){
        $("#mANDI508-listLinks-tab-all").click(function(){
            mANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").show();
            //Remove All (glowing) Highlights
            $("#ANDI508-testPage").removeClass("mANDI508-highlightInternal mANDI508-highlightExternal mANDI508-highlightAmbiguous");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#mANDI508-listLinks-tab-internal").click(function(){
            mANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function(){
                if($(this).hasClass("mANDI508-listLinks-internal"))
                    $(this).show();
                else
                    $(this).hide();
            });
            //Add (glowing) Highlight for Internal Links
            $("#ANDI508-testPage").removeClass("mANDI508-highlightExternal mANDI508-highlightAmbiguous").addClass("mANDI508-highlightInternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#mANDI508-listLinks-tab-external").click(function(){
            mANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function(){
                if($(this).hasClass("mANDI508-listLinks-external"))
                    $(this).show();
                else
                    $(this).hide();
            });
            //Add (glowing) Highlight for External Links
            $("#ANDI508-testPage").removeClass("mANDI508-highlightInternal mANDI508-highlightAmbiguous").addClass("mANDI508-highlightExternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });

        //Define next tab button
        $("#ANDI508-viewList-table button.mANDI508-nextTab").each(function(){
            $(this).click(function(){
                var allElementsInTestPage = $("#ANDI508-testPage *");
                var idRef = $(this).attr("data-andi508-relatedid");
                var anchorTargetElement = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
                var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
                for(var x=anchorTargetElementIndex; x<allElementsInTestPage.length; x++){
                    if($(allElementsInTestPage).eq(x).is(":tabbable")){
                        $(allElementsInTestPage).eq(x).focus();
                        break;
                    }
                }
            });
        });
    };

    //This function handles the selection of a tab.
    mANDI.viewList_selectTab = function(tab){
        $("#mANDI508-viewList-tabs button").removeClass().attr("aria-selected","false");
        $(tab).addClass("ANDI508-tab-active").attr("aria-selected","true");
    };

    //This function returns true if the href is a link that fires a script
    mANDI.isScriptedLink = function(href){
        if(typeof href == "string"){
            //broken up into three substrings so its not flagged in jslint
            return(href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
        }//else
        return false;
    };

    mANDI.analyze();
    mANDI.results();

    }//end init
