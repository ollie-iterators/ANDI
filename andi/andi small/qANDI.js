//==========================================//
//qANDI: landmarks ANDI                     //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    //create qANDI instance
    var qANDI = new AndiModule("4.1.4", "q");
    qANDI.index = 1;

    //This object class is used to store data about each landmark. Object instances will be placed into an array.
    function Landmark(element, index, isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        this.isAriaHidden = isAriaHidden;
        this.ariaLabel = ariaLabel
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the landmarks on the page
    function Landmarks() {
        this.list = [];
        this.count = 0;
    }

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    qANDI.analyze = function () {
        qANDI.landmarks = new Landmarks();

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=banner],[role=complementary],[role=contentinfo],[role=form],[role=main],[role=navigation],[role=search],[role=region]", "main,header,footer,nav,form,aside")) {
                //Add to the landmarks array
                var ariaLabel = $(this).attr("aria-label");
                var ariaLabelledby = $(this).attr("aria-labelledby");
                var ariaRole = $(this).attr("aria-role");
                var ariaLabeledby = $(this).attr("aria-labeledby");

                andiData = new AndiData(this);

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
                qANDI.landmarks.lists.push(new Landmark(this, qANDI.index, andiData.isAriaHidden, andiData.accName, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, ""));
                qANDI.landmarks.count += 1;
                qANDI.index += 1;
            }
        });
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    qANDI.results = function () {
        andiBar.updateResultsSummary("Landmarks: " + qANDI.landmarks.count);
        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("Landmark structure found.<br />Ensure that each landmark is applied appropriately to the corresponding section of the page.", true);
        }

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {
            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData, ["aria-busy", "aria-relevant"]);

            andiBar.displayTable(elementData, element, addOnProps);

            andiBar.displayOutput(elementData, element, addOnProps);
        }
    };
    qANDI.analyze();
    qANDI.results();
}//end init
