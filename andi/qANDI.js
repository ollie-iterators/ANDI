//==========================================//
//qANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var qANDIVersionNumber = "4.1.4";

    //create qANDI instance
    var qANDI = new AndiModule(qANDIVersionNumber, "p");

    var listsArray = [];
    var listsCount = 0;
    var olCount = 0;
    var ulCount = 0;
    var dlCount = 0;
    var listRoleCount = 0;

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    qANDI.analyze = function () {
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=listitem],[role=list]", "ol,ul,li,dl,dd,dt")) {
                //Add to the lists array
                listsArray.push($(this));

                if ($(this).isSemantically("[role=list]", "ol,ul,dl")) {
                    if ($(this).is("ul")) {
                        ulCount++;
                    } else if ($(this).is("ol")) {
                        olCount++;
                    } else if ($(this).is("dl")) {
                        dlCount++;
                    } else {
                        listRoleCount++;
                    }
                    listsCount++;
                }

                andiData = new AndiData(this);

                //Is the listitem contained by an appropriate list container?
                if ($(this).is("[role=listitem]")) {
                    if (!$(this).closest("[role=list]").length)
                        andiAlerter.throwAlert(alert_0079, ["[role=listitem]", "[role=list]"]);
                } else if ($(this).is("li")) {
                    var listContainer = $(this).closest("ol,ul");
                    if (!$(listContainer).length) {
                        andiAlerter.throwAlert(alert_0079, ["&lt;li&gt;", "&lt;ol&gt; or &lt;ul&gt;"]);
                    } else { //check if listContainer is still semantically a list
                        var listContainer_role = $(listContainer).attr("role");
                        if (listContainer_role && listContainer_role !== "list")
                            andiAlerter.throwAlert(alert_0185, [listContainer_role]);
                    }
                } else if ($(this).is("dd,dt") && !$(this).closest("dl").length) {//Is the dl,dt contained by a dl?
                    andiAlerter.throwAlert(alert_007A);
                }
                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
            }
        });
    };

    //Initialize outline
    qANDI.outline = "<h3 tabindex='-1' id='qANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    qANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");
        var ariaLevel = $(element).attr("aria-level");

        var outlineItem = "<a href='#' data-andi508-relatedindex='" + $(element).attr('data-andi508-index') + "'>&lt;" + tagName;

        //display relevant attributes
        if (role)
            outlineItem += " role='" + role + "' ";
        if (ariaLevel)
            outlineItem += " aria-level='" + ariaLevel + "' ";

        outlineItem += "&gt;";
        outlineItem += "<span class='ANDI508-display-innerText'>";
        outlineItem += $.trim(andiUtility.formatForHtml($(element).text().substring(0, displayCharLength)));
        if ($(element).html().length > displayCharLength) {
            outlineItem += "...";
        }
        outlineItem += "</span>";
        outlineItem += "&lt;/" + tagName + "&gt;</a>";
        outlineItem += "<br />";
        return outlineItem;
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    qANDI.results = function () {

        $("#ANDI508-lists-button")
            .attr("aria-selected", "true")
            .addClass("ANDI508-module-action-active");
        //No outline for lists mode

        andiBar.updateResultsSummary("List Elements: " + listsArray.length);
        var listCounts = "";
        var delimiter = "";
        var listTypesUsed = "";

        listCounts += olCount + " ordered list (ol)";
        listTypesUsed += "ol";
        delimiter = ", ";

        listCounts += delimiter + ulCount + " unordered list (ul)";
        listTypesUsed += delimiter + "ul";
        delimiter = ", ";

        listCounts += delimiter + dlCount + " description list (dl)";
        listTypesUsed += delimiter + "dl";

        listCounts += delimiter + listRoleCount + " role=list";
        listTypesUsed += delimiter + "[role=list]";

        $("#ANDI508-additionalPageResults").html(listCounts);

        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (" + listTypesUsed + ") are appropriately applied.", true);
        }

        $("#qANDI508-outline-container")
            .html(qANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
                andiLaser.createLaserTrigger($(this), $(relatedElement));
                $(this)
                    .hover(function () {
                        if (!event.shiftKey)
                            AndiModule.inspect(relatedElement[0]);
                    })
                    .focus(function () {
                        AndiModule.inspect(relatedElement[0]);
                    });
            });

        $("#qANDI508-outline-container")
            .html(qANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
                andiLaser.createLaserTrigger($(this), $(relatedElement));
                $(this)
                    .hover(function () {
                        if (!event.shiftKey)
                            AndiModule.inspect(relatedElement[0]);
                    })
                    .focus(function () {
                        AndiModule.inspect(relatedElement[0]);
                    });
            });

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {
            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");

            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [
                    "aria-level",
                    getDefault_ariaLive(element, elementData),
                    getDefault_ariaAtomic(element, elementData),
                    "aria-busy",
                    "aria-relevant"
                ]);

            andiBar.displayTable(elementData, element, addOnProps);

            andiBar.displayOutput(elementData, element, addOnProps);
        }

        //This function assumes the default values of aria-live based on the element's role as defined by spec
        function getDefault_ariaLive(element, elementData) {
            var val = $.trim($(element).attr("aria-live"));
            if (!val) {
                if (elementData.role === "alert") {
                    val = "assertive";
                } else if (elementData.role === "log" || elementData.role === "status") {
                    val = "polite";
                } else if (elementData.role === "marquee" || elementData.role === "timer") {
                    val = "off";
                } else {
                    return; //no default
                }
            }
            return ["aria-live", val];
        }

        //This function assumes the default values of aria-atomic based on the element's role as defined by spec
        function getDefault_ariaAtomic(element, elementData) {
            var val = $.trim($(element).attr("aria-atomic"));
            if (!val) {
                if (elementData.role === "alert" || elementData.role === "status") {
                    val = "true";
                } else if (elementData.role === "log" || elementData.role === "marquee" || elementData.role === "timer") {
                    val = "false";
                } else {
                    return; //no default
                }
            }
            return ["aria-atomic", val];
        }
    };
    qANDI.analyze();
    qANDI.results();
}//end init
