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
    dANDI.analyze();
}//end init
