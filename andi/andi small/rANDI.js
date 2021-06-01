//==========================================//
//rANDI: live regions ANDI                  //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    //create rANDI instance
    var rANDI = new AndiModule("4.1.4", "r");
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

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    rANDI.analyze = function () {
        rANDI.liveRegions = new LiveRegions();
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).is("[role=alert],[role=status],[role=log],[role=marquee],[role=timer],[aria-live=polite],[aria-live=assertive]")) {
                //Add to the live regions array
                andiData = new AndiData(this);
                var containerElement = $(this).isContainerElement();
                if ($(this).isContainerElement()) {
                    var innerText = andiUtility.getVisibleInnerText(this);
                    if (innerText) {
                        //For live regions, screen readers only use the innerText
                        //override the accName to just the innerText
                        andiData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
                    } else { //no visible innerText
                        andiAlerter.throwAlert(alert_0133);
                        andiData.accName = "";
                    }
                    //accDesc should not appear in output
                    delete andiData.accDesc;
                } else {  //not a container element
                    andiAlerter.throwAlert(alert_0184);
                }
                var containsForm = $(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length;
                if ($(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length) {
                    andiAlerter.throwAlert(alert_0182);
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
