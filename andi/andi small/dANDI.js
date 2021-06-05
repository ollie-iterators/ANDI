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
                    dANDI.accesskeys.push(this, andiData.accesskey);
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

        this.push = function (element, accesskey) {
            if (accesskey) {
                //Is accesskey value more than one character?
                if (accesskey.length > 1) { //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
                    andiAlerter.throwAlert(alert_0052, [accesskey]);
                } else {
                    //Check for duplicate accesskey
                    if (duplicateComparator.includes(accesskey)) {
                        if ($(element).is("button,input:submit,input:button,input:reset,input:image")) {
                            //duplicate accesskey found on button
                            andiAlerter.throwAlert(alert_0054, [accesskey]);
                        } else if ($(element).is("a[href]")) { //duplicate accesskey found on link
                            andiAlerter.throwAlert(alert_0056, [accesskey]);
                        } else { //duplicate accesskey found
                            andiAlerter.throwAlert(alert_0055, [accesskey]);
                        }
                    } else {
                        duplicateComparator += accesskey;
                    }
                }
            }
        };
    }
    dANDI.analyze();
}//end init
