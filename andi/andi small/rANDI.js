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
}

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
rANDI.results = function () {
    andiBar.updateResultsSummary("Live Regions: " + rANDI.liveRegions.count);
    if (!andiBar.focusIsOnInspectableElement()) {
        andiBar.showElementControls();

        andiBar.showStartUpSummary("<span class='ANDI508-module-name-s'>Live regions</span> found.<br />Discover the Output of the <span class='ANDI508-module-name-s'>live regions</span> by hovering over the highlighted areas or using the next/previous buttons. For updated Output, refresh ANDI whenever the Live Region changes.", true);
    }

    var liveRegionsSelectionLinks = "";
    for (var x = 0; x < rANDI.liveRegions.list.length; x++) {
        liveRegionsSelectionLinks += "<li><a href='javascript:void(0)' data-andi508-relatedindex='" + $(this).attr('data-andi508-index') + "'>" +
            '"' + rANDI.liveRegions.list[x].element + '" ' +
            '"' + rANDI.liveRegions.list[x].index + '" ' +
            '"' + rANDI.liveRegions.list[x].containerElement + '" ' +
            '"' + rANDI.liveRegions.list[x].innerText + '" ' +
            '"' + rANDI.liveRegions.list[x].containsForm + '" ' +
            '"' + rANDI.liveRegions.list[x].alerts + '" ' +
            "</a></li>";
    }

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {
            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData, ["aria-busy", "aria-relevant"]);

            andiBar.displayTable(elementData, element, addOnProps);

            //Copy from the AC table
            var innerText = $("#ANDI508-accessibleComponentsTable td.ANDI508-display-innerText").first().html();
            if (innerText) {
                elementData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
            }
            andiBar.displayOutput(elementData, element, addOnProps);
        }
    };

    rANDI.analyze();
    rANDI.results();

}//end init
