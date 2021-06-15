//==========================================//
//pANDI: fake headings ANDI                 //
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var pANDIVersionNumber = "4.1.4";

    //create pANDI instance
    var pANDI = new AndiModule(pANDIVersionNumber, "p");

    var fakeHeadingsArray = [];

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    pANDI.analyze = function () {
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            // Test whether any element that could be a heading should possibly be a heading
            if ($(this).is("p,div,span,strong,em")) {
                if (pANDI.isFakeHeading(this)) {
                    fakeHeadingsArray.push($(this));

                    andiData = new AndiData(this);

                    andiAlerter.throwAlert(alert_0190);
                    AndiData.attachDataToElement(this);
                }
            }
        });
    };

    //This function determine's if the element looks like a heading but is not semantically a heading
    pANDI.isFakeHeading = function (element) {
        var isFakeHeading = false;

        var text = $.trim($(element).text());
        if (text.length > 0 && text.length < 30) {
            //text is not empty, but less than char limit

            var fakeHeading_fontSize = parseInt($(element).css("font-size"));
            var fakeHeading_fontWeight = $(element).css("font-weight");

            if (fakeHeading_fontSize > 22 || (isBold(fakeHeading_fontWeight) && fakeHeading_fontSize > 15)) {
                //fakeHeading_fontSize is greater than size limit

                var nextElement = $(element).next().filter(":visible");

                if ($.trim($(nextElement).text()) !== "") { //next element has text

                    var nextElement_fontWeight = $(nextElement).css("font-weight");
                    var nextElement_fontSize = parseInt($(nextElement).css("font-size"));

                    if (nextElement_fontSize < fakeHeading_fontSize) {
                        //next element's font-size is smaller than fakeHeading font-size
                        isFakeHeading = true;
                    }
                    else if (isBold(fakeHeading_fontWeight) && !isBold(nextElement_fontWeight)) {
                        //next element's font-weight is lighter than fakeHeading font-weight
                        isFakeHeading = true;
                    }
                }
            }
        }
        return isFakeHeading;

        function isBold(weight) {
            return (weight === "bold" || weight === "bolder" || weight >= 700);
        }
    };

    //Initialize outline
    pANDI.outline = "<h3 tabindex='-1' id='pANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    pANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");
        var ariaLevel = $(element).attr("aria-level");

        //Indent the heading according to the level
        //Results in h1 = 1% left margin, h2 = 2% left margin, etc.
        var indentLevel;
        if (ariaLevel) {
            //Check if positive integar
            if (parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel)
                indentLevel = parseInt(ariaLevel);
            else //aria-level is not a positive integar, default to 2 (defined in ARIA spec, and screen readers are doing this)
                indentLevel = 2;
        }
        else {
            if (role === "heading")
                indentLevel = 2; //no aria-level and role=heading, so default to 2 (defined in ARIA spec)
            else
                indentLevel = parseInt(tagName.slice(1)); //get second character from h tag
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
    pANDI.results = function () {
        andiBar.updateResultsSummary("Headings: " + fakeHeadingsArray.length);

        //Build Outline
        for (var x = 0; x < fakeHeadingsArray.length; x++) {
            pANDI.outline += pANDI.getOutlineItem(fakeHeadingsArray[x]);
        }
        pANDI.outline += "</div>";

        $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view headings list</button><div id='pANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

        //Define outline button
        $("#ANDI508-viewOutline-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                //hide Outline, show alert list
                $("#pANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                if (testPageData.numberOfAccessibilityAlertsFound > 0) {
                    $("#ANDI508-alerts-list").show();
                }
                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "view headings list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            }
            else {
                //show Outline, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide headings list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#pANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });

        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("Heading structure found.<br />Determine if <span class='ANDI508-module-name-s'>headings</span> are appropriately applied.", true);
        }

        $("#pANDI508-outline-container")
            .html(pANDI.outline)
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

        $("#pANDI508-outline-container")
            .html(pANDI.outline)
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
                if (elementData.role === "alert")
                    val = "assertive";
                else if (elementData.role === "log" || elementData.role === "status")
                    val = "polite";
                else if (elementData.role === "marquee" || elementData.role === "timer")
                    val = "off";
                else return; //no default
            }
            return ["aria-live", val];
        }

        //This function assumes the default values of aria-atomic based on the element's role as defined by spec
        function getDefault_ariaAtomic(element, elementData) {
            var val = $.trim($(element).attr("aria-atomic"));
            if (!val) {
                if (elementData.role === "alert" || elementData.role === "status")
                    val = "true";
                else if (elementData.role === "log" || elementData.role === "marquee" || elementData.role === "timer")
                    val = "false";
                else return; //no default
            }
            return ["aria-atomic", val];
        }
    };
    pANDI.analyze();
    pANDI.results();

}//end init
