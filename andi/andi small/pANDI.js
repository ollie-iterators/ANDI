//==========================================//
//pANDI: lists ANDI (small code)            //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    var pANDI = new AndiModule("4.1.4", "p"); //create pANDI instance
    pANDI.index = 1;

    //This object class is used to store data about each landmark. Object instances will be placed into an array.
    function List(element, index, closestListItem, listContainer, listContainer_role, closestDesc, isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, alerts) {
        this.element = element;
        this.index = index;
        this.closestListItem = closestListItem;
        this.listContainer = listContainer;
        this.listContainer_role = listContainer_role;
        this.closestDesc = closestDesc;
        // Common Non Focusable Element Attributes
        this.isAriaHidden = isAriaHidden;
        this.ariaLabel = ariaLabel;
        this.ariaLabelledby = ariaLabelledby;
        this.ariaRole = ariaRole;
        this.ariaLabeledby = ariaLabeledby;
        this.alerts = alerts;
    }

    //This object class is used to keep track of the lists on the page
    function Lists() {
        this.list = [];
        this.count = 0;
        this.liCount = 0;
        this.ddCount = 0;
        this.dtCount = 0;
        this.listItemRoleCount = 0;
    }

    //This analyzes the test page for graphics/image related markup relating to accessibility
    pANDI.analyze = function () {
        pANDI.lists = new Lists();
        $(TestPageData.allElements).each(function () { //Loop through every visible element
            if ($(this).isSemantically("[role=listitem],[role=list]", "ol,ul,li,dl,dd,dt")) {
                var closestListItem = "";
                var listContainer = "";
                var listContainer_role = "";
                var closestDesc = "";
                var ariaLabel = $(this).attr("aria-label");
                var ariaLabelledby = $(this).attr("aria-labelledby");
                var ariaRole = $(this).attr("aria-role");
                var ariaLabeledby = $(this).attr("aria-labeledby");
                if ($(this).is("[role=listitem]")) {
                    pANDI.lists.listItemRoleCount += 1;
                    closestListItem = $(this).closest("[role=list]").length;
                    if (!closestListItem) { //Is the listitem contained by an appropriate list container?
                        alert = [alert_0079, ["[role=listitem]", "[role=list]"]];
                    }
                } else if ($(this).is("li")) {
                    pANDI.lists.liCount += 1;
                    var listContainer = $(this).closest("ol,ul");
                    if (!$(listContainer).length) {
                        alert = [alert_0079, ["&lt;li&gt;", "&lt;ol&gt; or &lt;ul&gt;"]];
                    } else { //check if listContainer is still semantically a list
                        var listContainer_role = $(listContainer).attr("role");
                        if (listContainer_role && listContainer_role !== "list")
                            alert = [alert_0185, [listContainer_role]];
                    }
                } else if ($(this).is("dd,dt")) {
                    pANDI.lists.ddCount += 1;
                    closestDesc = !$(this).closest("dl").length;
                    if (closestDesc) {
                        alert = [alert_007A];
                    }
                }
                andiData = new AndiData(this);
                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);

                //Add to the lists array
                pANDI.lists.list.push(new List(this, pANDI.index, closestListItem, listConatainer, listContainer_role, closestDesc, andiData.isAriaHidden, ariaLabel, ariaLabelledby, ariaRole, ariaLabeledby, ""));
                pANDI.lists.count += 1;
                pANDI.index += 1;
            }
        });
    };
    pANDI.analyze();
}//end init
