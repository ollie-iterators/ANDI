//==========================================//
//oANDI: headers ANDI (not fake headings)   //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    var oANDIVersionNumber = "4.1.4";

    //create oANDI instance
    var oANDI = new AndiModule(oANDIVersionNumber, "o");

    var headingsArray = [];

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    oANDI.analyze = function () {

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=heading]", "h1,h2,h3,h4,h5,h6")) {
                //Add to the headings array
                headingsArray.push($(this));

                andiData = new AndiData(this);

                if (andiData.role === "heading") {
                    var ariaLevel = $(this).attr("aria-level");
                    if (ariaLevel) {
                        if ($(this).is("h1,h2,h3,h4,h5,h6")) {
                            if (andiData.tagNameText.charAt(1) !== ariaLevel) {
                                //heading tag name level doesn't match aria-level
                                andiAlerter.throwAlert(alert_0191, [andiData.tagNameText, ariaLevel]);
                            }
                        }
                        if (parseInt(ariaLevel) < 0 || parseInt(ariaLevel) != ariaLevel)
                            //Not a positive integar
                            andiAlerter.throwAlert(alert_0180);
                    } else { //role=heading without aria-level
                        andiAlerter.throwAlert(alert_0192);
                    }
                }

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
            }
        });
    };

    //Initialize outline
    oANDI.outline = "<h3 tabindex='-1' id='oANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    oANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");
        var ariaLevel = $(element).attr("aria-level");

        //Indent the heading according to the level
        //Results in h1 = 1% left margin, h2 = 2% left margin, etc.
        var indentLevel;
        if (ariaLevel) {
            //Check if positive integar
            if (parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel) {
                indentLevel = parseInt(ariaLevel);
            } else { //aria-level is not a positive integar, default to 2 (defined in ARIA spec, and screen readers are doing this)
                indentLevel = 2;
            }
        } else {
            if (role === "heading") {
                indentLevel = 2; //no aria-level and role=heading, so default to 2 (defined in ARIA spec)
            } else {
                indentLevel = parseInt(tagName.slice(1)); //get second character from h tag
            }
        }

        var outlineItem = "<a style='margin-left:" + indentLevel + "%' href='#' data-andi508-relatedindex='" + $(element).attr('data-andi508-index') + "'>&lt;" + tagName;

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
    oANDI.results = function () {

        var moduleActionButtons = "";

        var moreDetails = "<button id='ANDI508-pageTitle-button'>page title</button>" +
            "<button id='ANDI508-pageLanguage-button'>page language</button>";

        moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        andiBar.initializeModuleActionGroups();

        //Define the page title button
        $("#ANDI508-pageTitle-button").click(function () {
            andiOverlay.overlayButton_on("overlay", $(this));
            if (document.title)
                alert("The page title is: " + document.title);
            else
                alert("There is no page title.");
            andiOverlay.overlayButton_off("overlay", $(this));
        });

        //Define the page language button
        $("#ANDI508-pageLanguage-button").click(function () {
            andiOverlay.overlayButton_on("overlay", $(this));
            //get the lang attribute from the HTML element
            var htmlLangAttribute = $.trim($("html").first().prop("lang"));
            //pop up the lang value of the HTML element
            if (htmlLangAttribute)
                alert("The <html> element has a lang attribute value of: " + htmlLangAttribute + ".");
            else
                alert("The <html> element does not have a lang attribute.");
            andiOverlay.overlayButton_off("overlay", $(this));
        });

        andiBar.updateResultsSummary("Headings: " + headingsArray.length);
        for (var x = 0; x < headingsArray.length; x++) { //Build Outline
            oANDI.outline += oANDI.getOutlineItem(headingsArray[x]);
        }
        oANDI.outline += "</div>";

        $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view headings list</button><div id='oANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

        //Define outline button
        $("#ANDI508-viewOutline-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                //hide Outline, show alert list
                $("#oANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                if (testPageData.numberOfAccessibilityAlertsFound > 0) {
                    $("#ANDI508-alerts-list").show();
                }
                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "view headings list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else {
                //show Outline, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide headings list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#oANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });

        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("Heading structure found.<br />Determine if <span class='ANDI508-module-name-s'>headings</span> are appropriately applied.", true);
        }

        $("#oANDI508-outline-container")
            .html(oANDI.outline)
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

        $("#oANDI508-outline-container")
            .html(oANDI.outline)
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

    oANDI.analyze();
    oANDI.results();

}//end init
