//==========================================//
//mANDI: links ANDI (small code)            //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create mANDI instance
    var mANDI = new AndiModule("8.1.0", "m");

    //This object class is used to store data about each link. Object instances will be placed into an array.
    function Link(href, nameDescription, index, alerts, target, linkPurpose, ambiguousIndex, element) {
        this.href = href;
        this.nameDescription = nameDescription;
        this.index = index;
        this.alerts = alerts;
        this.target = target;
        this.linkPurpose = linkPurpose;
        this.ambiguousIndex = undefined;
        this.element = element;
    }

    //This object class is used to keep track of the links on the page
    function Links() {
        this.list = [];
        this.count = 0;
        this.ambiguousIndex = 0;
        this.ambiguousCount = 0;
        this.internalCount = 0;
        this.externalCount = 0;
    }

    mANDI.viewList_tableReady = false;

    //This function will analyze the test page for link related markup relating to accessibility
    mANDI.analyze = function () {
        mANDI.links = new Links();

        //Variables used to build the links list array.
        var href, nameDescription, alerts, target, linkPurpose, alertIcon, alertObject, relatedElement, ambiguousIndex;

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=link]", "a[href],a[tabindex],area")) {
                if (!andiCheck.isThisElementDisabled(this)) {

                    mANDI.links.count++;

                    andiData = new AndiData(this);

                    if ($(this).is("a,area") || andiData.role === "link") {
                        //set nameDescription
                        nameDescription = getNameDescription(andiData.accName, andiData.accDesc);
                        if ($(this).is("a,area")) {
                            href = mANDI.normalizeHref(this);
                        } else {
                            href = "";
                        }
                        alerts = "";
                        linkPurpose = ""; //i=internal, e=external
                        target = $.trim($(this).attr("target"));
                        alertIcon = "";
                        alertObject = "";
                        ambiguousIndex = undefined;

                        if (isLinkKeyboardAccessible(href, this)) {
                            if (nameDescription) {

                                ambiguousIndex = scanForAmbiguity(this, nameDescription, href);

                                determineLinkPurpose(href, this);

                                testForVagueLinkText(nameDescription);

                            } else { //No accessible name or description
                                alerts = "danger: No accessible name";
                                nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                            }

                            if (href) {
                                //create Link object and add to array
                                mANDI.links.list.push(
                                    new Link(href,
                                        nameDescription,
                                        andiData.andiElementIndex,
                                        alerts,
                                        target,
                                        linkPurpose,
                                        ambiguousIndex,
                                        this));
                            } else if (andiData.role === "link") {
                                //create Link object and add to array
                                mANDI.links.list.push(
                                    new Link(href,
                                        nameDescription,
                                        andiData.andiElementIndex,
                                        alerts,
                                        target,
                                        linkPurpose,
                                        ambiguousIndex,
                                        this));

                                isElementInTabOrder(this, "link");
                            } else if (!andiData.role) {
                                //link as no role and no href, suggest using role=link or href
                                alert = [alert_0168];
                            }
                            andiCheck.commonFocusableElementChecks(andiData, $(this));
                        }
                    }
                    AndiData.attachDataToElement(this);
                }
            } else if ($(this).is("a")) { //Analyze elements that might be links
                andiData = new AndiData(this);
                isLinkKeyboardAccessible(undefined, this);
                AndiData.attachDataToElement(this);
                //Don't allow element to appear in next/prev flow or hover. Also remove highlight.
                $(this).addClass("ANDI508-exclude-from-inspection").removeClass("ANDI508-highlight");
            }
        });

        //Detect disabled links
        if ($(this).attr("aria-hidden") !== "true") { // Code below was moved from areThereDisabledElements
            alert = [alert_0250, [testPageData.disabledElementsCount, "links"], 0];
        }

        //This function returns true if the link is keyboard accessible
        function isLinkKeyboardAccessible(href, element) {
            if (typeof href === "undefined" && !$(element).attr("tabindex")) {
                //There is no href and no tabindex
                var name = $(element).attr("name");
                var id = element.id;

                if (element.onclick !== null || $._data(element, "events").click !== undefined) {
                    //Link is clickable but not keyboard accessible
                    alert = [alert_0164];
                    //No click event could be detected
                } else if (!id && !name) {//Link doesn't have id or name
                    alert = [alert_0128];
                } else { //Link has id or name
                    //Determine if the link is an anchor for another link
                    var isDefinitelyAnAnchor = false;
                    var referencingHref = "";

                    //Look through all hrefs to see if any is referencing this element's id or name
                    $("#ANDI508-testPage a[href]").each(function () {
                        referencingHref = $(this).attr("href");
                        if (referencingHref.charAt(0) === "#") {
                            if (referencingHref.slice(1) === id || referencingHref.slice(1) === name) {
                                isDefinitelyAnAnchor = true;
                                return false; //break out of loop
                            }
                        }
                    });
                    if (!isDefinitelyAnAnchor) {
                        if (element.onclick === null && $._data(element, "events").click === undefined) {
                            alert = [alert_0129];
                        } else { //Link is clickable but not keyboard accessible
                            alert = [alert_0164];
                        }
                    } else if (name) { //name is deprecated
                        alert = [alert_007B, [name]];
                    } else {
                        alert = [alert_012A]; //definitely an anchor, but not focusable
                    }
                }
                return false; //not keyboard accessible
            }
            return true;
        }

        //This function will seach through Links Array for same name different href
        function scanForAmbiguity(element, nameDescription, href) {
            var regEx = /^https?:\/\//; //Strip out the http:// or https:// from the compare

            for (var x = 0; x < mANDI.links.list.length; x++) {
                if (nameDescription.toLowerCase() == mANDI.links.list[x].nameDescription.toLowerCase()) { //nameDescription match

                    if (href.toLowerCase().replace(regEx, "") != mANDI.links.list[x].href.toLowerCase().replace(regEx, "")) { //href doesn't match, throw alert

                        //Determine which alert level should be thrown
                        if (href.charAt(0) == "#" || mANDI.links.list[x].href.charAt(0) == "#") {
                            //One link is internal
                            alertIcon = "caution: Ambiguous: same name, different href";
                            alertObject = alert_0162;
                        } else {
                            alertIcon = "warning: Ambiguous: same name, different href";
                            alertObject = alert_0161;
                        }

                        //Throw the alert
                        if (!mANDI.links.list[x].alerts.includes(alertIcon)) {
                            //Throw alert on first instance only one time
                            andiAlerter.throwAlertOnOtherElement(mANDI.links.list[x].index, alertObject);
                            mANDI.links.list[x].alerts = alertIcon;
                        }

                        //Set the ambiguousIndex
                        var i; //will store the ambiguousIndex for this match
                        //Does the first instance already have an ambiguousIndex
                        relatedElement = $(mANDI.links.list[x].element);
                        if (mANDI.links.list[x].ambiguousIndex) {
                            //Yes. Copy the ambiguousIndex from the first instance
                            i = mANDI.links.list[x].ambiguousIndex;
                            mANDI.links.ambiguousCount++;
                        } else { //No. increment ambiguousIndex and add it to the first instance.
                            mANDI.links.ambiguousCount = mANDI.links.ambiguousCount + 2;
                            mANDI.links.ambiguousIndex++;
                            i = mANDI.links.ambiguousIndex;
                            mANDI.links.list[x].ambiguousIndex = i;
                            $(relatedElement).addClass("mANDI508-ambiguous");
                        }

                        $(element).addClass("mANDI508-ambiguous");
                        alerts += alertIcon;
                        alert = [alertObject];
                        return i;//prevents alert from being thrown more than once on an element
                    }
                }
            }
            return false;
        }

        //This function searches for anchor target if href is internal and greater than 1 character e.g. href="#x"
        function determineLinkPurpose(href, element) {
            if (typeof href !== "undefined") {
                if (href.charAt(0) === "#" && href.length > 1) {
                    var idRef = href.slice(1); //do not convert to lowercase
                    if (!isAnchorTargetFound(idRef)) {
                        if (element.onclick === null && $._data(element, 'events').click === undefined) {//no click events
                            //Throw Alert, Anchor Target not found
                            alerts += "danger: In-page anchor target not found";
                            alert = [alert_0069, [idRef]];
                        }
                    } else { //link is internal and anchor target found
                        mANDI.links.internalCount++;
                        linkPurpose = "i";
                        $(element).addClass("mANDI508-internalLink");
                    }
                } else if (href.charAt(0) !== "#" && !mANDI.isScriptedLink(href)) {//this is an external link
                    mANDI.links.externalCount++;
                    linkPurpose = "e";
                    $(element).addClass("mANDI508-externalLink");
                }
            }

            //This function searches allIds list to check if anchor target exists. return true if found.
            function isAnchorTargetFound(idRef) {
                //for(var z=0; z<testPageData.allIds.length; z++){
                //	if(testPageData.allIds[z].id.toString().toLowerCase() == idRef)
                //		return true;
                //}
                var anchorTarget = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
                if ($(anchorTarget).is(":visible")) {
                    $(anchorTarget).addClass("mANDI508-anchorTarget");
                    return true;
                }
                return false;
            }
        }

        //This function checks the link text for vagueness
        function testForVagueLinkText(nameDescription) {
            var regEx = /^(click here|here|link|edit|select|more|more info|more information|go)$/g;
            if (regEx.test(nameDescription.toLowerCase())) {
                alerts += "caution: Vague: does not identify link purpose.";
                alert = [alert_0163];
            }
        }

        //This function determines if an element[role] is in tab order
        function isElementInTabOrder(element, role) {
            if (!!$(element).prop("tabIndex") && !$(element).is(":tabbable")) {//Element is not tabbable and has no tabindex
                //Throw Alert: Element with role=link|button not in tab order
                alerts += "warning: Element not in tab order";
                alert = [alert_0125, [role]];
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

    //This function gets the href
    //if href length is greater than 1 and last char is a slash
    //This elimates false positives during comparisons since with or without slash is essentially the same
    mANDI.normalizeHref = function (element) {
        var href = $(element).attr("href");
        if (typeof href != "undefined") {
            href = $.trim($(element).attr("href"));
            if (href === "") {
                href = "\"\"";
            } else if (href.length > 1 && href.charAt(href.length - 1) == "/")
                href = href.slice(0, -1);
        }
        return href;
    };

    //This function returns true if the href is a link that fires a script
    mANDI.isScriptedLink = function (href) {
        if (typeof href == "string") {
            //broken up into three substrings so its not flagged in jslint
            return (href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
        }
        return false;
    };

    mANDI.analyze();
}//end init
