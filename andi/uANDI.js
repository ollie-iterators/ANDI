//==========================================//
//uANDI: live regions ANDI 					//
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var uANDIVersionNumber = "4.1.4";

    //create uANDI instance
    var uANDI = new AndiModule(uANDIVersionNumber, "r");

    var liveRegionsArray = [];

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    uANDI.analyze = function () {

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).is("[role=alert],[role=status],[role=log],[role=marquee],[role=timer],[aria-live=polite],[aria-live=assertive]")) {
                //Add to the live regions array
                liveRegionsArray.push($(this));

                andiData = new AndiData(this);

                if ($(this).isContainerElement()) {
                    var innerText = andiUtility.getVisibleInnerText(this);
                    if (innerText) {
                        //For live regions, screen readers only use the innerText
                        //override the accName to just the innerText
                        andiData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
                    } else {//no visible innerText
                        andiAlerter.throwAlert(alert_0133);
                        andiData.accName = "";
                    }
                    //accDesc should not appear in output
                    delete andiData.accDesc;
                }
                else//not a container element
                    andiAlerter.throwAlert(alert_0184);
                if ($(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length)
                    andiAlerter.throwAlert(alert_0182);
                AndiData.attachDataToElement(this);
            }
        });
    };

    //Initialize outline
    uANDI.outline = "<h3 tabindex='-1' id='uANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    uANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");

        var outlineItem = "<a href='#' data-andi508-relatedindex='" + $(element).attr('data-andi508-index') + "'>&lt;" + tagName;

        //display relevant attributes
        if (role)
            outlineItem += " role='" + role + "' ";

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
    uANDI.results = function () {
        andiBar.updateResultsSummary("Live Regions: " + liveRegionsArray.length);
        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("<span class='ANDI508-module-name-s'>Live regions</span> found.<br />Discover the Output of the <span class='ANDI508-module-name-s'>live regions</span> by hovering over the highlighted areas or using the next/previous buttons. For updated Output, refresh ANDI whenever the Live Region changes.", true);
        }

        $("#uANDI508-outline-container")
            .html(uANDI.outline)
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

        $("#uANDI508-outline-container")
            .html(uANDI.outline)
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
                [getDefault_ariaLive(element, elementData),
                getDefault_ariaAtomic(element, elementData),
                    "aria-busy",
                    "aria-relevant"
                ]);

            andiBar.displayTable(elementData, element, addOnProps);

            //For Live Region mode, update the output live
            //Copy from the AC table
            var innerText = $("#ANDI508-accessibleComponentsTable td.ANDI508-display-innerText").first().html();
            if (innerText) {
                elementData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
            }

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
    uANDI.analyze();
    uANDI.results();
}//end init
