//==========================================//
//rANDI: live regions ANDI (small code)     //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    var rANDI = new AndiModule("4.1.4", "r"); //create rANDI instance
    rANDI.index = 1;

    //This object class is used to store data about each live region. Object instances will be placed into an array.
    function LiveRegion(element, index, containerElement, innerText, containsForm, alerts) {
        this.element = element;
        this.index = index;
        this.containerElement = containerElement;
        this.innerText = innerText;
        this.containsForm = containsForm;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the Live Regions on the page
    function LiveRegions() {
        this.list = [];
        this.count = 0;
    }

    //This analyzes the test page for graphics/image related markup relating to accessibility
    rANDI.analyze = function () {
        rANDI.liveRegions = new LiveRegions();
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).is("[role=alert],[role=status],[role=log],[role=marquee],[role=timer],[aria-live=polite],[aria-live=assertive]")) {
                andiData = new AndiData(this);
                var containerElement = $(this).isContainerElement();
                if ($(this).isContainerElement()) {
                    var innerText = andiUtility.getVisibleInnerText(this);
                    if (innerText) { //For live regions, screen readers only use the innerText
                        andiData.accName = innerText;
                    } else { //no visible innerText
                        alert = [alert_0133];
                        andiData.accName = "";
                    }
                    delete andiData.accDesc; //accDesc should not appear in output
                } else {  //not a container element
                    alert = [alert_0184];
                }
                var containsForm = $(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length;
                if (containsForm) {
                    alert = [alert_0182];
                }
                rANDI.liveRegions.list.push(new LiveRegion(this, rANDI.index, containerElement, innerText, containsForm, ""));
                rANDI.index += 1;
                rANDI.liveRegions.count += 1;
                AndiData.attachDataToElement(this);
            }
        });
    };
    rANDI.analyze();
}//end init
