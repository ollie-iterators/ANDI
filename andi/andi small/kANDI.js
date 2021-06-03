//=============================================//
//kANDI: iFrame (small code)                   //
//Created By Social Security Administration	   //
//=============================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create kANDI instance
    var kANDI = new AndiModule("3.0.1", "k");
    kANDI.index = 1;

    //This object class is used to store data about each iFrame. Object instances will be placed into an array.
    function iFrame(element, index, src, ariaHiddenTest, isAriaHidden, accessibleName, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        this.src = src;
        this.ariaHiddenTest = ariaHiddenTest;
        this.isAriaHidden = isAriaHidden;
        this.accessibleName = accessibleName
        this.ariaLabel = ariaLabel
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the iFrames on the page
    function IFrames() {
        this.list = [];
        this.count = 0;
    }

    //This function will analyze the test page for focusable element related markup relating to accessibility
    kANDI.analyze = function () {
        kANDI.iFrames = new IFrames();
        $(TestPageData.allElements).each(function () {
            if ($(this).is("iframe")) {
                var src = $(this).attr("src");
                var ariaLabel = $(this).attr("aria-label");
                var ariaLabelledby = $(this).attr("aria-labelledby");
                var ariaRole = $(this).attr("aria-role");
                var ariaLabeledby = $(this).attr("aria-labeledby");
                var ariaHiddenTest = $(this).parents().attr("aria-hidden");
                andiData = new AndiData(this);
                andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                AndiData.attachDataToElement(this);
                kANDI.iFrames.list.push(new iFrame(this, kANDI.index, src, ariaHiddenTest, andiData.isAriaHidden, andiData.accName, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, ""));
                kANDI.index += 1;
                kANDI.iFrames.count += 1;
            }
        });
    };

    kANDI.analyze();

}//end init
