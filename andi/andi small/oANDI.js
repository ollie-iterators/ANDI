//==========================================//
//oANDI: headers ANDI (no fake headers)     //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create oANDI instance
    var oANDI = new AndiModule("4.1.4", "o");
    oANDI.index = 1;

    //This object class is used to store data about each header. Object instances will be placed into an array.
    function Header(element, index, role, ariaLevel, ariaLevelComp, isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        this.role = role;
        this.ariaLevel = ariaLevel;
        this.ariaLevelComp = ariaLevelComp;
        // Common Non Focusable Element Attributes
        this.isAriaHidden = isAriaHidden;
        this.ariaLabel = ariaLabel;
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the headers on the page
    function Headers() {
        this.HeaderList = [];
        this.count = 0;
    }

    //This analyzes the test page for graphics/image related markup relating to accessibility
    oANDI.analyze = function () {
        oANDI.headers = new Headers();
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=heading]", "h1,h2,h3,h4,h5,h6")) {
                andiData = new AndiData(this);
                var ariaLevel = "";
                var ariaLevelComp = andiData.tagNameText.charAt(1);
                var role = $(this).attr("role");
                var ariaLabel = $(this).attr("aria-label");
                var ariaLabelledby = $(this).attr("aria-labelledby");
                var ariaRole = $(this).attr("aria-role");
                var ariaLabeledby = $(this).attr("aria-labeledby");
                if (andiData.role === "heading") {
                    ariaLevel = $(this).attr("aria-level");
                    if (ariaLevel) {
                        if ($(this).is("h1,h2,h3,h4,h5,h6")) {
                            if (andiData.tagNameText.charAt(1) !== ariaLevel) { //heading tag name level doesn't match aria-level
                                andiAlerter.throwAlert(alert_0191, [andiData.tagNameText, ariaLevel]);
                            }
                        }
                        if (parseInt(ariaLevel) < 0 || parseInt(ariaLevel) != ariaLevel) { //Not a positive integer
                            andiAlerter.throwAlert(alert_0180);
                        }
                    } else { //role=heading without aria-level
                        andiAlerter.throwAlert(alert_0192);
                    }
                }

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
                oANDI.headers.HeaderList.push(new Header(this, oANDI.index, role, ariaLevel, ariaLevelComp, andiData.isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, ""));
                oANDI.headers.count += 1;
                oANDI.index += 1;
            }
        });
    };
    oANDI.analyze();
}//end init
