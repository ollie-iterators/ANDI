//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module() {
    var kANDIVersionNumber = "3.0.1";
    //create kANDI instance
    var kANDI = new AndiModule(kANDIVersionNumber, "k");
    kANDI.index = 1;

    //This object class is used to store data about each iFrame. Object instances will be placed into an array.
    function iFrame(element, index, src, ariaHiddenTest, isAriaHidden, accessibleName, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        this.src = src;
        this.ariaHiddenTest = ariaHiddenTest;
        this.isAriaHidden = isAriaHidden;
        this.accessibleName = accessibleName
        this.ariaLabel = ariaLabel
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the iFrames on the page
    function IFrames() {
        this.list = [];
        this.count = 0;
    }

    //This function will analyze the test page for focusable element related markup relating to accessibility
    kANDI.analyze = function () {
        $(TestPageData.allElements).each(function () {
            kANDI.iFrames = new IFrames();
            if ($(this).is("iframe")) {
                var src = $(this).attr("src");
                var ariaLabel = $(this).attr("aria-label");
                var ariaLabelledby = $(this).attr("aria-labelledby");
                var ariaRole = $(this).attr("aria-role");
                var ariaLabeledby = $(this).attr("aria-labeledby");
                var ariaHiddenTest = $(this).parents().attr("aria-hidden");
                andiData = new AndiData(this);
                andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                AndiData.attachDataToElement(this);
                kANDI.iFrames.list.push(new iFrame(this, kANDI.index, src, ariaHiddenTest, andiData.isAriaHidden, andiData.accName, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, ""));
                kANDI.index += 1;
                kANDI.iFrames.count += 1;
            }
        });
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    //Inserts some counter totals, displays the accesskey list
    kANDI.results = function () {
        andiBar.updateResultsSummary("Iframes with Content: " + testPageData.andiElementIndex);
        var iframesSelectionMenu = "";
        var iframesSelectionLinks = "";

        $("#ANDI508-testPage .ANDI508-element").each(function () {
            //Build iFrame List
            iframesSelectionLinks += "<li><a href='javascript:void(0)' data-andi508-relatedindex='" + $(this).attr('data-andi508-index') + "'>";
            if ($(this).attr("src"))
                iframesSelectionLinks += $(this).attr("src");
            else
                iframesSelectionLinks += "No src";
            iframesSelectionLinks += "</a></li>";
        });
        //iframes contain body content
        if (iframesSelectionLinks) {
            iframesSelectionMenu += "<p>Select iframe to open in a new tab, then launch ANDI.</p>" +
                "<ol>" + iframesSelectionLinks + "</ol>";
        }

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewIframeList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view iframe list</button><div id='kANDI508-iframeList-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'><div class='ANDI508-scrollable'>" + iframesSelectionMenu + "</div></div>");

        $("#kANDI508-iframeList-container").find("a").click(function () {
            var relatedIndex = $(this).attr("data-andi508-relatedindex");
            var relatedIframe = $("#ANDI508-testPage .ANDI508-element[data-andi508-index=" + relatedIndex + "]");
            kANDI.openIframeInNewWindow(relatedIframe);
        });

        //Define outline button
        $("#ANDI508-viewIframeList-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                //hide iframe list, show alert list
                $("#kANDI508-iframeList-container").slideUp(AndiSettings.andiAnimationSpeed);
                if (testPageData.numberOfAccessibilityAlertsFound > 0) {
                    $("#ANDI508-alerts-list").show();
                }
                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "view iframe list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else {
                //show iframe list, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide iframe list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#kANDI508-iframeList-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });

        //For iframe list links, add hoverability, focusability, clickability 
        $("#kANDI508-iframeList-container").find("a[data-andi508-relatedindex]").each(function () {
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

        andiBar.showStartUpSummary("To test the contents of <span class='ANDI508-module-name-i'>iframes</span>, each must be viewed independently.<br />Inspect an iframe, press the \"test in new tab\" button, then launch ANDI.", true);

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData,
            ["src"]
        );

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);

        $("#ANDI508-additionalElementDetails").html("<button>test in new tab</button>");
        $("#ANDI508-additionalElementDetails button").click(function () {
            kANDI.openIframeInNewWindow(element);
            return false;
        });
    };

    //This function will open an iframe in a new window 
    kANDI.openIframeInNewWindow = function (iframe, src) {
        var iframeWindow;
        var url = $(iframe).attr("src");

        if (url) {
            iframeWindow = window.open(url, "_blank"); //opens user preference, usually new tab
            iframeWindow.focus();
        } else {
            alert("This iframe has no [src] and cannot be opened independently. ANDI cannot be used to test the contents of this iframe.");
        }
    };

    kANDI.analyze();
    kANDI.results();

}//end init
