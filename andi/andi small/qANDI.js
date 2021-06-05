//==========================================//
//qANDI: landmarks ANDI                     //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    var qANDI = new AndiModule("4.1.4", "q"); //create qANDI instance
    qANDI.index = 1;

    //This object class is used to store data about each landmark. Object instances will be placed into an array.
    function Landmark(element, index, isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        // Common Non Focusable Element Attributes
        this.isAriaHidden = isAriaHidden;
        this.ariaLabel = ariaLabel;
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

    //This analyzes the test page for graphics/image related markup relating to accessibility
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
    qANDI.analyze();
}//end init
