//==========================================//
//nANDI: buttons ANDI (small code)          //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create nANDI instance
    var nANDI = new AndiModule("8.1.0", "n");
    nANDI.index = 1;

    //This object class is used to store data about each button. Object instances will be placed into an array.
    function Button(element, index, role, elementInTabOrder, nameDescription, alerts, accesskey, nonUniqueIndex, isAriaHidden, ariaLabel, ariaLabelledby, label, ariaRole, ariaLabeledby, alerts) {
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
        // NOTE: label[for] means a label tag with a for attribute that shows which element it is added to
        // The test is about if the element has a label attribute and
        this.label = label;
        this.onBlur = onBlur;
        // NOTE: onCharge is combined with whether the element is an input, select, or textarea element
        this.onCharge = onCharge;
        this.onDBLClick = onDBLClick;
        //NOTE: Clickable area check works if an element does not have a label and is a radio button or a checkbox
        this.alerts = alerts;
    }

    //This object class is used to keep track of the buttons on the page
    function Buttons() {
        this.list = [];
        this.nonUniqueIndex = 0;
        this.count = 0;
        this.nonUniqueCount = 0;
    }

    //This analyzes the test page for link related markup relating to accessibility
    nANDI.analyze = function () {
        nANDI.buttons = new Buttons();
        //Variables used to build the buttons list array.
        var nameDescription, alerts, accesskey, alertIcon, alertObject, relatedElement, nonUniqueIndex, elementInTabOrder;

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=button]", "button,:button,:submit,:reset,:image")) {
                if (!andiCheck.isThisElementDisabled(this)) {
                    var role = $(this).attr("role");
                    var elementInTabOrder = !!$(this).prop("tabIndex") && !$(this).is(":tabbable");
                    var ariaLabel = $(this).attr("aria-label");
                    var ariaLabelledby = $(this).attr("aria-labelledby");
                    var ariaRole = $(this).attr("aria-role");
                    var ariaLabeledby = $(this).attr("aria-labeledby");
                    var label = $(this).attr("label");
                    var nameDescription = "";

                    andiData = new AndiData(this);

                    var n = "";
                    var d = "";
                    if (andiData.accName) {
                        n = andiUtility.normalizeOutput(andiData.accName);
                    }
                    if (andiData.accDesc) {
                        d = andiUtility.normalizeOutput(andiData.accDesc);
                        if (n === d) { //matchingTest
                            d = "";
                        } else {
                            d = " " + d; //add space
                        }
                    }
                    nameDescription = n + d;

                    alerts = "";
                    alertIcon = "";
                    alertObject = "";

                    if (andiData.accesskey) {
                        accesskey = andiData.accesskey;
                    } else {
                        accesskey = "";
                    }
                    var nonUniqueIndex = "";
                    if (nameDescription) { //Seach through Buttons Array for same name
                        for (var y = 0; y < nANDI.buttons.list.length; y++) {
                            if (nameDescription.toLowerCase() == nANDI.buttons.list[y].nameDescription.toLowerCase()) { //nameDescription matches
            
                                alertIcon = "warning: Non-Unique: same name as another button (alert_0200)";
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
                                if (nANDI.buttons.list[y].nonUniqueIndex) { //Yes. Copy the nonUniqueIndex from the first instance
                                    m = nANDI.buttons.list[y].nonUniqueIndex;
                                    nANDI.buttons.nonUniqueCount++;
                                } else { //No. increment nonUniqueIndex and add it to the first instance.
                                    nANDI.buttons.nonUniqueCount = nANDI.buttons.nonUniqueCount + 2;
                                    nANDI.buttons.nonUniqueIndex++;
                                    m = nANDI.buttons.nonUniqueIndex;
                                    nANDI.buttons.list[y].nonUniqueIndex = m;
                                    $(relatedElement).addClass("nANDI508-ambiguous");
                                }
            
                                $(this).addClass("nANDI508-ambiguous");
                                alerts += alertIcon;
                                andiAlerter.throwAlert(alertObject);
                                nonUniqueIndex = m;//prevents alert from being thrown more than once on an element
                            }
                        }
                        nonUniqueIndex = false;

                        if ($(this).is("[role=button]")) { //role=button
                            if (elementInTabOrder) {//Element is not tabbable and has no tabindex
                                //Throw Alert: Element with role=button not in tab order
                                alerts += "warning: Element not in tab order (alert_0125, role attribute)";
                                andiAlerter.throwAlert(alert_0125, ["button"]);
                            }
                        } 
                    } else { //No accessible name or description
                        alerts = "danger: No accessible name";
                        nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                    }

                    andiCheck.commonFocusableElementChecks(andiData, $(this));
                    var isAriaHidden = andiData.isAriaHidden;
                    AndiData.attachDataToElement(this);

                    //create Button object and add to array
                    nANDI.buttons.list.push(new Button(this, nANDI.index, role, elementInTabOrder, nameDescription, alerts, accesskey, nonUniqueIndex, isAriaHidden, ariaLabel, ariaLabelledby, label, ariaRole, ariaLabeledby, ""));
                    nANDI.index += 1;
                    nANDI.buttons.count++;
                }
            }
        });

        //Detect disabled buttons
        andiCheck.areThereDisabledElements("buttons");
    };
    nANDI.analyze();
}//end init
