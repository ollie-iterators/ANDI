//==========================================//
//nANDI: buttons ANDI (small code)          //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create nANDI instance
    var nANDI = new AndiModule("8.1.0", "n");
    nANDI.index = 1;

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeClass("nANDI508-ambiguous");
        }
    };

    //This object class is used to store data about each button. Object instances will be placed into an array.
    function Button(element, index, role, elementInTabOrder, nameDescription, alerts, accesskey, nonUniqueIndex, isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby) {
        this.element = element;
        this.index = index;
        this.role = role;
        this.elementInTabOrder = elementInTabOrder;
        this.nameDescription = nameDescription;
        this.alerts = alerts;
        this.accesskey = accesskey;
        this.nonUniqueIndex = undefined;
        // Common Focusable Element Attributes
        this.isAriaHidden = isAriaHidden;
        this.ariaLabel = ariaLabel
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        // NOTE: Check out: areThereAnyDuplicateFors
        this.onBlue = onBlur;
        // NOTE: onCharge is combined with whether the element is an input, select, or textarea element
        this.onCharge = onCharge;
        this.onDBLClick = onDBLClick;
        //NOTE: Clickable area check works if an element does not have a label and is a radio button or a checkbox
    }

    //This object class is used to keep track of the buttons on the page
    function Buttons() {
        this.list = [];
        this.nonUniqueIndex = 0;
        this.count = 0;
        this.nonUniqueCount = 0;
    }

    //Alert icons for the buttons list table
    //Ignore the jslint warning about the "new" declaration. It is needed.
    var alertIcons = new function () {//new is intentional
        this.danger_noAccessibleName = makeIcon("danger", "No accessible name");
        this.warning_nonUnique = makeIcon("warning", "Non-Unique: same name as another button");
        this.warning_tabOrder = makeIcon("warning", "Element not in tab order");

        function makeIcon(alertLevel, titleText) {
            //The sortPriority number allows alert icon sorting
            var sortPriority = "3"; //default to caution
            if (alertLevel == "warning") {
                sortPriority = "2";
            } else if (alertLevel == "danger") {
                sortPriority = "1";
            }
            return "<img src='" + icons_url + alertLevel + ".png' alt='" + alertLevel + "' title='Accessibility Alert: " + titleText + "' /><i>" + sortPriority + " </i>";
        }
    };

    //This function will analyze the test page for link related markup relating to accessibility
    nANDI.analyze = function () {
        nANDI.buttons = new Buttons();

        //Variables used to build the buttons list array.
        var nameDescription, alerts, accesskey, alertIcon, alertObject, relatedElement, nonUniqueIndex, elementInTabOrder;

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=button]", "button,:button,:submit,:reset,:image")) {
                if (!andiCheck.isThisElementDisabled(this)) {
                    var role = $(this).attr("role");
                    var elementInTabOrder = !!$(element).prop("tabIndex") && !$(element).is(":tabbable");
                    var ariaLabel = $(this).attr("aria-label");
                    var ariaLabelledby = $(this).attr("aria-labelledby");
                    var ariaRole = $(this).attr("aria-role");
                    var ariaLabeledby = $(this).attr("aria-labeledby");

                    andiData = new AndiData(this);

                    nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                    alerts = "";
                    alertIcon = "";
                    alertObject = "";

                    if (andiData.accesskey) {
                        accesskey = andiData.accesskey;
                    } else {
                        accesskey = "";
                    }
                    if (nameDescription) { //Seach through Buttons Array for same name
                        nonUniqueIndex = scanForNonUniqueness(this, nameDescription);

                        if ($(this).is("[role=button]")) { //role=button
                            isElementInTabOrder(this, "button");
                        }

                        if (!alerts) { //Add this for sorting purposes
                            alerts = "<i>4</i>";
                        }     
                    } else { //No accessible name or description
                        alerts = alertIcons.danger_noAccessibleName;
                        nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                    }

                    andiCheck.commonFocusableElementChecks(andiData, $(this));
                    var isAriaHidden = andiData.isAriaHidden;
                    AndiData.attachDataToElement(this);

                    //create Button object and add to array
                    nANDI.buttons.list.push(new Button(this, nANDI.index, role, elementInTabOrder, nameDescription, alerts, accesskey, nonUniqueIndex));
                    nANDI.index += 1;
                    nANDI.buttons.count++;
                }
            }
        });

        //Detect disabled buttons
        andiCheck.areThereDisabledElements("buttons");

        //This function searches the button list for non-uniqueness.
        function scanForNonUniqueness(element, nameDescription) {
            for (var y = 0; y < nANDI.buttons.list.length; y++) {
                if (nameDescription.toLowerCase() == nANDI.buttons.list[y].nameDescription.toLowerCase()) { //nameDescription matches

                    alertIcon = alertIcons.warning_nonUnique;
                    alertObject = alert_0200;

                    //Throw the alert
                    if (!nANDI.buttons.list[y].alerts.includes(alertIcon)) {
                        //Throw alert on first instance only one time
                        andiAlerter.throwAlertOnOtherElement(nANDI.buttons.list[y].index, alertObject);
                        nANDI.buttons.list[y].alerts = alertIcon;
                    }

                    //Set the nonUniqueIndex
                    var m; //will store the nonUniqueIndex for this match
                    //Does the first instance already have a nonUniqueIndex?
                    relatedElement = $(nANDI.buttons.list[y].element);
                    if (nANDI.buttons.list[y].nonUniqueIndex) {
                        //Yes. Copy the nonUniqueIndex from the first instance
                        m = nANDI.buttons.list[y].nonUniqueIndex;
                        nANDI.buttons.nonUniqueCount++;
                    } else { //No. increment nonUniqueIndex and add it to the first instance.
                        nANDI.buttons.nonUniqueCount = nANDI.buttons.nonUniqueCount + 2;
                        nANDI.buttons.nonUniqueIndex++;
                        m = nANDI.buttons.nonUniqueIndex;
                        nANDI.buttons.list[y].nonUniqueIndex = m;
                        $(relatedElement).addClass("nANDI508-ambiguous");
                    }

                    $(element).addClass("nANDI508-ambiguous");
                    alerts += alertIcon;
                    andiAlerter.throwAlert(alertObject);
                    return m;//prevents alert from being thrown more than once on an element
                }
            }
            return false;
        }

        //This function determines if an element[role] is in tab order
        function isElementInTabOrder(element, role) {
            if (!!$(element).prop("tabIndex") && !$(element).is(":tabbable")) {//Element is not tabbable and has no tabindex
                //Throw Alert: Element with role=button not in tab order
                alerts += alertIcons.warning_tabOrder;
                andiAlerter.throwAlert(alert_0125, [role]);
            }
        }

        //this function will normalize the accessible name and description so that the raw string can be analyzed.
        function getNameDescription(name, desc) {
            var n = "";
            var d = "";
            if (name)
                n = andiUtility.normalizeOutput(name);
            if (desc) {
                d = andiUtility.normalizeOutput(desc);
                if (n === d) { //matchingTest
                    d = "";
                } else {
                    d = " " + d; //add space
                }
            }
            return n + d;
        }
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    nANDI.results = function () {
        andiBar.updateResultsSummary("Buttons Found: " + nANDI.buttons.count);

        //Show Startup Summary
        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>buttons</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every button.", true);
        }

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {

            //Highlight the row in the buttons list that associates with this element
            nANDI.viewList_rowHighlight($(element).attr("data-andi508-index"));

            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [["rel", "download", "media", "target", "type"]]);

            andiBar.displayOutput(elementData, element, addOnProps);
            andiBar.displayTable(elementData, element, addOnProps);
        }
    };

    nANDI.analyze();
    nANDI.results();

}//end init
