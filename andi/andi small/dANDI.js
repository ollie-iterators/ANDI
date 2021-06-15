//=============================================//
//dANDI: focusable elements ANDI (small code)  //
//Created By Social Security Administration	   //
//=============================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
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
                if ($(this).is("canvas")) { //Code is from lookForCanvasFallback function
                    if (!$(this).children().filter(":focusable").length) {
                        alert = [alert_0124];
                    } else { //has focusable fallback content
                        alert = [alert_0127];
                    }
                }
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
        if ($(this).attr("aria-hidden") !== "true") { // Code below was moved from areThereDisabledElements
            alert = [alert_0250, [testPageData.disabledElementsCount, "elements"], 0];
        }
    };

    function AndiAccesskeys() {
        //Raw accesskey values will be stored here and checked against
        var duplicateComparator = "";

        this.push = function (element, accesskey) {
            if (accesskey) {
                //Is accesskey value more than one character?
                if (accesskey.length > 1) { //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
                    alert = [alert_0052, [accesskey]];
                } else { //Check for duplicate accesskey
                    if (duplicateComparator.includes(accesskey)) {
                        if ($(element).is("button,input:submit,input:button,input:reset,input:image")) {
                            alert = [alert_0054, [accesskey]]; //duplicate accesskey found on button
                        } else if ($(element).is("a[href]")) { 
                            alert = [alert_0056, [accesskey]]; //duplicate accesskey found on link
                        } else { 
                            alert = [alert_0055, [accesskey]]; //duplicate accesskey found
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
