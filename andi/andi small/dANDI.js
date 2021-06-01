//=============================================//
//dANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module() {
    //create dANDI instance
    var dANDI = new AndiModule("7.0.0", "d");

    //This function will analyze the test page for focusable element related markup relating to accessibility
    dANDI.analyze = function () {
        dANDI.accesskeys = new AndiAccesskeys();

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            if ($(this).is(":focusable,canvas")) {//If element is focusable, search for accessibility components.
                andiData = new AndiData(this);

                andiCheck.commonFocusableElementChecks(andiData, $(this));
                andiCheck.lookForCanvasFallback(this);
                if (andiData.accesskey) {
                    dANDI.accesskeys.push(this, andiData.accesskey, andiData.andiElementIndex);
                }
                testPageData.firstLaunchedModulePrep(this, andiData);
                AndiData.attachDataToElement(this);
            } else {
                testPageData.firstLaunchedModulePrep(this);
                andiCheck.isThisElementDisabled(this);
            }
        });
        andiCheck.areLabelForValid();
        andiCheck.areThereDisabledElements("elements");
    };

    function AndiAccesskeys() {
        //Raw accesskey values will be stored here and checked against
        var duplicateComparator = "";

        //Stores HTML to display the accesskeys
        var list = "";

        this.getListHtml = function () {
            return list;
        };

        this.push = function (element, accesskey, index) {
            if (accesskey) {
                //Is accesskey value more than one character?
                if (accesskey.length > 1) { //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
                    andiAlerter.throwAlert(alert_0052, [accesskey]);
                    addToList(accesskey, alert_0052);
                } else {
                    //Check for duplicate accesskey
                    if (duplicateComparator.includes(accesskey)) {
                        if ($(element).is("button,input:submit,input:button,input:reset,input:image")) {
                            //duplicate accesskey found on button
                            andiAlerter.throwAlert(alert_0054, [accesskey]);
                            addToList(accesskey, alert_0054);
                        } else if ($(element).is("a[href]")) {
                            //duplicate accesskey found on link
                            andiAlerter.throwAlert(alert_0056, [accesskey]);
                            addToList(accesskey, alert_0056);
                        } else {
                            //duplicate accesskey found
                            andiAlerter.throwAlert(alert_0055, [accesskey]);
                            addToList(accesskey, alert_0055);
                        }
                    } else {
                        addToList(accesskey);
                        duplicateComparator += accesskey;
                    }
                }
            }

            function addToList(accesskey, alertObject) {
                var addClass = "";
                var titleText = "";
                if (alertObject) {
                    addClass = "class='ANDI508-display-" + alertObject.level + "'";
                    titleText = alertObject.level + ": " + alertObject.message + accesskey;
                } else {
                    titleText = "AccessKey " + accesskey + " found, focus on element";
                }

                if (index === 0) {
                    list += "<span tabindex='0' " + addClass + " title='" + titleText + "'>" + accesskey + "</span> ";
                } else {
                    list += "<a href='#' data-andi508-relatedindex='" + index + "' title='" + titleText + "'><span " + addClass + ">" + accesskey + "</span></a> ";
                }
            }
        };
    }

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    //Inserts some counter totals, displays the accesskey list
    dANDI.results = function () {
        andiBar.updateResultsSummary("Focusable Elements Found: " + testPageData.andiElementIndex);
        //Accesskeys List:
        if (dANDI.accesskeys.getListHtml()) {
            $("#ANDI508-additionalPageResults").append("<p id='ANDI508-accesskeysFound'>AccessKeys: " + "{ " + dANDI.accesskeys.getListHtml() + "}</p>");
            $("#ANDI508-accesskeysFound").find("a").each(function () {
                andiFocuser.addFocusClick($(this));
                $(this).on("mouseover", andiLaser.drawAlertLaser);
                $(this).on("click", andiLaser.eraseLaser);
                $(this).on("mouseleave", andiLaser.eraseLaser);
            });
            $("#ANDI508-accesskeysFound").show();
        }

        andiBar.focusIsOnInspectableElement();
        andiBar.showElementControls();
        andiBar.showStartUpSummary("Discover accessibility markup for focusable elements by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every focusable element.", true);

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    };

    dANDI.analyze();
    dANDI.results();
}//end init
