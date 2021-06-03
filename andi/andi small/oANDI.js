//==========================================//
//oANDI: headers ANDI                       //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    //create oANDI instance
    var oANDI = new AndiModule("4.1.4", "o");
    oANDI.index = 1;

    //This object class is used to store data about each header. Object instances will be placed into an array.
    function Header(element, index, role, lang) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the headers on the page
    function Headers() {
        this.list = [];
        this.count = 0;
    }

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    oANDI.analyze = function () {
        oANDI.headers = new Headers();
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=heading]", "h1,h2,h3,h4,h5,h6")) {
                //Add to the headings array
                oANDI.headers.list.push(new Header(this, oANDI.index));
                oANDI.headers.count += 1;
                oANDI.index += 1;

                andiData = new AndiData(this);

                if (andiData.role === "heading") {
                    var ariaLevel = $(this).attr("aria-level");
                    if (ariaLevel) {
                        if ($(this).is("h1,h2,h3,h4,h5,h6")) {
                            if (andiData.tagNameText.charAt(1) !== ariaLevel) { //heading tag name level doesn't match aria-level
                                andiAlerter.throwAlert(alert_0191, [andiData.tagNameText, ariaLevel]);
                            }
                        }
                        if (parseInt(ariaLevel) < 0 || parseInt(ariaLevel) != ariaLevel) { //Not a positive integer
                            andiAlerter.throwAlert(alert_0180);
                        }
                    } else { //role=heading without aria-level
                        andiAlerter.throwAlert(alert_0192);
                    }
                }

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
            } else if (oANDI.headers.list.length === 0 && $(this).is("p,div,span,strong,em")) {
                //Since oANDI has not found a heading yet, check if this element is a fake headings

                if (oANDI.isFakeHeading(this)) {
                    andiData = new AndiData(this);

                    andiAlerter.throwAlert(alert_0190);
                    AndiData.attachDataToElement(this);
                }
            }
        });
    };

    //This function determine's if the element looks like a heading but is not semantically a heading
    oANDI.isFakeHeading = function (element) {
        var isFakeHeading = false;

        var text = $.trim($(element).text());
        if (text.length > 0 && text.length < 30) {
            //text is not empty, but less than char limit

            var fakeHeading_fontSize = parseInt($(element).css("font-size"));
            var fakeHeading_fontWeight = $(element).css("font-weight");

            if (fakeHeading_fontSize > 22 ||
                (isBold(fakeHeading_fontWeight) && fakeHeading_fontSize > 15)
            ) { //fakeHeading_fontSize is greater than size limit
                var nextElement = $(element).next().filter(":visible");

                if ($.trim($(nextElement).text()) !== "") { //next element has text
                    var nextElement_fontWeight = $(nextElement).css("font-weight");
                    var nextElement_fontSize = parseInt($(nextElement).css("font-size"));

                    if (nextElement_fontSize < fakeHeading_fontSize) {
                        //next element's font-size is smaller than fakeHeading font-size
                        isFakeHeading = true;
                    } else if (isBold(fakeHeading_fontWeight) && !isBold(nextElement_fontWeight)) {
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
        andiBar.updateResultsSummary("Headings: " + oANDI.headers.list.length);

        //Build Outline
        for (var x = 0; x < oANDI.headers.list.length; x++) {
            oANDI.outline += oANDI.getOutlineItem(oANDI.headers.list[x]);
        }
        oANDI.outline += "</div>";

        $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view headings list</button><div id='oANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

        //Define outline button
        $("#ANDI508-viewOutline-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") { //hide Outline, show alert list
                $("#oANDI508-outline-container").slideUp(50);
                $("#ANDI508-alerts-list").show();
                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "view headings list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else { //show Outline, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide headings list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#oANDI508-outline-container").slideDown(50).focus();
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
            var addOnProps = AndiData.getAddOnProps(element, elementData, ["aria-level", "aria-busy", "aria-relevant"]);

            andiBar.displayTable(elementData, element, addOnProps);

            andiBar.displayOutput(elementData, element, addOnProps);
        }
    };

    oANDI.analyze();
    oANDI.results();

}//end init
