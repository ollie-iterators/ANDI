//==========================================//
//pANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    var pANDI = new AndiModule("4.1.4", "p"); //create pANDI instance
    pANDI.index = 1;

    //This object class is used to store data about each landmark. Object instances will be placed into an array.
    function List(element, index, closestListItem, listContainer, listContainer_role, closestDesc) {
        this.element = element;
        this.index = index;
        this.closestListItem = closestListItem;
        this.listContainer = listContainer;
        this.listContainer_role = listContainer_role;
        this.closestDesc = closestDesc;
    }

    //This object class is used to keep track of the lists on the page
    function Lists() {
        this.list = [];
        this.count = 0;
        this.olCount = 0;
        this.ulCount = 0;
        this.liCount = 0;
        this.dlCount = 0;
        this.ddCount = 0;
        this.dtCount = 0;
        this.listRoleCount = 0;
        this.listItemRoleCount = 0;
    }

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    pANDI.analyze = function () {
        pANDI.lists = new Lists();
        $(TestPageData.allElements).each(function () { //Loop through every visible element
            if ($(this).isSemantically("[role=listitem],[role=list]", "ol,ul,li,dl,dd,dt")) {
                var closestListItem = "";
                var listContainer = "";
                var listContainer_role = "";
                var closestDesc = "";
                if ($(this).isSemantically("[role=list]", "ol,ul,dl")) {
                    if ($(this).is("ul")) {
                        pANDI.lists.ulCount++;
                    } else if ($(this).is("ol")) {
                        pANDI.lists.olCount++;
                    } else if ($(this).is("dl")) {
                        pANDI.lists.dlCount++;
                    } else {
                        pANDI.lists.listRoleCount++;
                    }
                }
                andiData = new AndiData(this);

                //Is the listitem contained by an appropriate list container?
                if ($(this).is("[role=listitem]")) {
                    pANDI.lists.listItemRoleCount += 1;
                    closestListItem = $(this).closest("[role=list]").length;
                    if (!$(this).closest("[role=list]").length)
                        andiAlerter.throwAlert(alert_0079, ["[role=listitem]", "[role=list]"]);
                } else if ($(this).is("li")) {
                    pANDI.lists.liCount += 1;
                    var listContainer = $(this).closest("ol,ul");
                    if (!$(listContainer).length) {
                        andiAlerter.throwAlert(alert_0079, ["&lt;li&gt;", "&lt;ol&gt; or &lt;ul&gt;"]);
                    } else { //check if listContainer is still semantically a list
                        var listContainer_role = $(listContainer).attr("role");
                        if (listContainer_role && listContainer_role !== "list")
                            andiAlerter.throwAlert(alert_0185, [listContainer_role]);
                    }
                } else if ($(this).is("dd,dt") && !$(this).closest("dl").length) {//Is the dl,dt contained by a dl?
                    closestDesc = $(this).is("dd,dt") && !$(this).closest("dl").length;
                    andiAlerter.throwAlert(alert_007A);
                }

                if ($(this).is("dd")) {
                    pANDI.lists.ddCount += 1;
                } else if ($(this).is("dt")) {
                    pANDI.lists.dtCount += 1;
                }

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
                //Add to the lists array
                pANDI.lists.list.push(new List(this, pANDI.index, closestListItem, listConatainer, listContainer_role, closestDesc));
                pANDI.lists.count += 1;
                pANDI.index += 1;
            }
        });
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    pANDI.results = function () {
        andiBar.updateResultsSummary("List Elements: " + pANDI.lists.count);
        var listCounts = "";
        var delimiter = "";
        var listTypesUsed = "";

        listCounts += pANDI.lists.olCount + " ordered list (ol)";
        listTypesUsed += "ol";
        delimiter = ", ";

        listCounts += delimiter + pANDI.lists.ulCount + " unordered list (ul)";
        listTypesUsed += delimiter + "ul";
        delimiter = ", ";

        listCounts += delimiter + pANDI.lists.dlCount + " description list (dl)";
        listTypesUsed += delimiter + "dl";

        listCounts += delimiter + pANDI.lists.listRoleCount + " role=list";
        listTypesUsed += delimiter + "[role=list]";

        $("#ANDI508-additionalPageResults").html(listCounts);

        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (" + listTypesUsed + ") are appropriately applied.", true);
        }

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();

    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {
            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");

            var addOnProps = AndiData.getAddOnProps(element, elementData, ["aria-busy", "aria-relevant"]);

            andiBar.displayTable(elementData, element, addOnProps);

            andiBar.displayOutput(elementData, element, addOnProps);
        }
    };

    pANDI.analyze();
    pANDI.results();

}//end init
