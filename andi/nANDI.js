//==========================================//
//nANDI: buttons ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var nANDIVersionNumber = "8.1.0";

    //create nANDI instance
    var nANDI = new AndiModule(nANDIVersionNumber, "m");

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element)
            $(element).removeClass("nANDI508-internalLink nANDI508-externalLink nANDI508-ambiguous nANDI508-anchorTarget");
    };

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

    //This object class is used to store data about each button. Object instances will be placed into an array.
    function Button(nameDescription, index, alerts, accesskey, nonUniqueIndex, element) {
        this.nameDescription = nameDescription;
        this.index = index;
        this.alerts = alerts;
        this.accesskey = accesskey;
        this.nonUniqueIndex = undefined;
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

    //This object class is used to keep track of the buttons on the page
    function Buttons() {
        this.list = [];
        this.nonUniqueIndex = 0;
        this.count = 0;
        this.nonUniqueCount = 0;
    }

    //Alert icons for the links list table
    //Ignore the jslint warning about the "new" declaration. It is needed.
    var alertIcons = new function () {//new is intentional
        this.danger_noAccessibleName = makeIcon("danger", "No accessible name");
        this.danger_anchorTargetNotFound = makeIcon("warning", "In-page anchor target not found");
        this.warning_ambiguous = makeIcon("warning", "Ambiguous: same name, different href");
        this.caution_ambiguous = makeIcon("caution", "Ambiguous: same name, different href");
        this.caution_vagueText = makeIcon("caution", "Vague: does not identify link purpose.");
        this.warning_nonUnique = makeIcon("warning", "Non-Unique: same name as another button");
        this.warning_tabOrder = makeIcon("warning", "Element not in tab order");

        function makeIcon(alertLevel, titleText) {
            //The sortPriority number allows alert icon sorting
            var sortPriority = "3"; //default to caution
            if (alertLevel == "warning")
                sortPriority = "2";
            else if (alertLevel == "danger")
                sortPriority = "1";
            return "<img src='" + icons_url + alertLevel + ".png' alt='" + alertLevel + "' title='Accessibility Alert: " + titleText + "' /><i>" + sortPriority + " </i>";
        }
    };

    AndiModule.initActiveActionButtons({
        linksMode: true,
        viewLinksList: false,
        highlightAmbiguousLinks: false,
        buttonsMode: false,
        viewButtonsList: false,
        highlightNonUniqueButtons: false
    });

    nANDI.viewList_tableReady = false;

    //This function will analyze the test page for link related markup relating to accessibility
    nANDI.analyze = function () {

        nANDI.links = new Links();
        nANDI.buttons = new Buttons();

        //Variables used to build the links/buttons list array.
        var href, nameDescription, alerts, target, linkPurpose, accesskey, alertIcon, alertObject, relatedElement, nonUniqueIndex, ambiguousIndex;

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            //ANALYZE LINKS
            if ($(this).isSemantically("[role=link]", "a[href],a[tabindex],area")) {
                if (!andiCheck.isThisElementDisabled(this)) {

                    nANDI.links.count++;

                    if (AndiModule.activeActionButtons.linksMode) {
                        andiData = new AndiData(this);

                        if ($(this).is("a,area") || andiData.role === "link") {
                            //set nameDescription
                            nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                            href = ($(this).is("a,area")) ? nANDI.normalizeHref(this) : "";
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

                                    if (!alerts) //Add this for sorting purposes
                                        alerts = "<i>4</i>";
                                }
                                else {//No accessible name or description
                                    alerts = alertIcons.danger_noAccessibleName;
                                    nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                                }

                                if (href) {
                                    //create Link object and add to array
                                    nANDI.links.list.push(
                                        new Link(href,
                                            nameDescription,
                                            andiData.andiElementIndex,
                                            alerts,
                                            target,
                                            linkPurpose,
                                            ambiguousIndex,
                                            this));
                                }
                                else if (andiData.role === "link") {
                                    //create Link object and add to array
                                    nANDI.links.list.push(
                                        new Link(href,
                                            nameDescription,
                                            andiData.andiElementIndex,
                                            alerts,
                                            target,
                                            linkPurpose,
                                            ambiguousIndex,
                                            this));

                                    isElementInTabOrder(this, "link");
                                }
                                else if (!andiData.role) {
                                    //link as no role and no href, suggest using role=link or href
                                    andiAlerter.throwAlert(alert_0168);
                                }

                                andiCheck.commonFocusableElementChecks(andiData, $(this));
                            }
                        }

                        AndiData.attachDataToElement(this);
                    }
                }
            }
            //Analyze elements that might be links
            else if (AndiModule.activeActionButtons.linksMode && $(this).is("a")) {
                andiData = new AndiData(this);
                isLinkKeyboardAccessible(undefined, this);
                AndiData.attachDataToElement(this);
                //Don't allow element to appear in next/prev flow or hover. Also remove highlight.
                $(this).addClass("ANDI508-exclude-from-inspection").removeClass("ANDI508-highlight");
            }
            //ANALYZE BUTTONS
            else if ($(this).isSemantically("[role=button]", "button,:button,:submit,:reset,:image")) {

                if (!andiCheck.isThisElementDisabled(this)) {
                    nANDI.buttons.count++;

                    if (AndiModule.activeActionButtons.buttonsMode) {
                        andiData = new AndiData(this);

                        nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                        alerts = "";
                        alertIcon = "";
                        alertObject = "";

                        if (andiData.accesskey)
                            accesskey = andiData.accesskey;
                        else
                            accesskey = "";

                        if (nameDescription) {
                            //Seach through Buttons Array for same name
                            nonUniqueIndex = scanForNonUniqueness(this, nameDescription);

                            //role=button
                            if ($(this).is("[role=button]")) {
                                isElementInTabOrder(this, "button");
                            }

                            if (!alerts)
                                //Add this for sorting purposes
                                alerts = "<i>4</i>";
                        }
                        else {
                            //No accessible name or description
                            alerts = alertIcons.danger_noAccessibleName;
                            nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                        }

                        andiCheck.commonFocusableElementChecks(andiData, $(this));
                        AndiData.attachDataToElement(this);

                        //create Button object and add to array
                        nANDI.buttons.list.push(new Button(nameDescription, andiData.andiElementIndex, alerts, accesskey, nonUniqueIndex, this));
                    }
                }
            }
        });

        //Detect disabled links or buttons
        if (AndiModule.activeActionButtons.linksMode) {
            andiCheck.areThereDisabledElements("links");
        }
        else if (AndiModule.activeActionButtons.buttonsMode) {
            andiCheck.areThereDisabledElements("buttons");
        }

        //This function returns true if the link is keyboard accessible
        function isLinkKeyboardAccessible(href, element) {
            if (typeof href === "undefined" && !$(element).attr("tabindex")) {
                //There is no href and no tabindex
                var name = $(element).attr("name");
                var id = element.id;

                if (element.onclick !== null || $._data(element, "events").click !== undefined) {
                    //Link is clickable but not keyboard accessible
                    andiAlerter.throwAlert(alert_0164);
                }
                //No click event could be detected
                else if (!id && !name) {//Link doesn't have id or name
                    andiAlerter.throwAlert(alert_0128);
                }
                else {//Link has id or name
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
                        if (element.onclick === null && $._data(element, "events").click === undefined)
                            andiAlerter.throwAlert(alert_0129);
                        else //Link is clickable but not keyboard accessible
                            andiAlerter.throwAlert(alert_0164);
                    }
                    else if (name) { //name is deprecated
                        andiAlerter.throwAlert(alert_007B, [name]);
                    }
                    else {
                        andiAlerter.throwAlert(alert_012A); //definitely an anchor, but not focusable
                    }
                }
                return false; //not keyboard accessible
            }
            return true;
        }

        //This function will seach through Links Array for same name different href
        function scanForAmbiguity(element, nameDescription, href) {
            var regEx = /^https?:\/\//; //Strip out the http:// or https:// from the compare

            for (var x = 0; x < nANDI.links.list.length; x++) {
                if (nameDescription.toLowerCase() == nANDI.links.list[x].nameDescription.toLowerCase()) { //nameDescription match

                    if (href.toLowerCase().replace(regEx, "") != nANDI.links.list[x].href.toLowerCase().replace(regEx, "")) { //href doesn't match, throw alert

                        //Determine which alert level should be thrown
                        if (href.charAt(0) == "#" || nANDI.links.list[x].href.charAt(0) == "#") {
                            //One link is internal
                            alertIcon = alertIcons.caution_ambiguous;
                            alertObject = alert_0162;
                        }
                        else {
                            alertIcon = alertIcons.warning_ambiguous;
                            alertObject = alert_0161;
                        }

                        //Throw the alert
                        if (!nANDI.links.list[x].alerts.includes(alertIcon)) {
                            //Throw alert on first instance only one time
                            andiAlerter.throwAlertOnOtherElement(nANDI.links.list[x].index, alertObject);
                            nANDI.links.list[x].alerts = alertIcon;
                        }

                        //Set the ambiguousIndex
                        var i; //will store the ambiguousIndex for this match
                        //Does the first instance already have an ambiguousIndex?
                        relatedElement = $(nANDI.links.list[x].element);
                        if (nANDI.links.list[x].ambiguousIndex) {
                            //Yes. Copy the ambiguousIndex from the first instance
                            i = nANDI.links.list[x].ambiguousIndex;
                            nANDI.links.ambiguousCount++;
                        }
                        else {
                            //No. increment ambiguousIndex and add it to the first instance.
                            nANDI.links.ambiguousCount = nANDI.links.ambiguousCount + 2;
                            nANDI.links.ambiguousIndex++;
                            i = nANDI.links.ambiguousIndex;
                            nANDI.links.list[x].ambiguousIndex = i;
                            $(relatedElement).addClass("nANDI508-ambiguous");
                        }

                        $(element).addClass("nANDI508-ambiguous");
                        alerts += alertIcon;
                        andiAlerter.throwAlert(alertObject);
                        return i;//prevents alert from being thrown more than once on an element
                    }
                }
            }
            return false;
        }

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
                    }
                    else {
                        //No. increment nonUniqueIndex and add it to the first instance.
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

        //This function searches for anchor target if href is internal and greater than 1 character e.g. href="#x"
        function determineLinkPurpose(href, element) {
            if (typeof href !== "undefined") {
                if (href.charAt(0) === "#" && href.length > 1) {
                    var idRef = href.slice(1); //do not convert to lowercase
                    if (!isAnchorTargetFound(idRef)) {
                        if (element.onclick === null && $._data(element, 'events').click === undefined) {//no click events
                            //Throw Alert, Anchor Target not found
                            alerts += alertIcons.danger_anchorTargetNotFound;
                            andiAlerter.throwAlert(alert_0069, [idRef]);
                        }
                    }
                    else {//link is internal and anchor target found
                        nANDI.links.internalCount++;
                        linkPurpose = "i";
                        $(element).addClass("nANDI508-internalLink");
                    }
                }
                else if (href.charAt(0) !== "#" && !nANDI.isScriptedLink(href)) {//this is an external link
                    nANDI.links.externalCount++;
                    linkPurpose = "e";
                    $(element).addClass("nANDI508-externalLink");
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
                    $(anchorTarget).addClass("nANDI508-anchorTarget");
                    return true;
                }
                return false;
            }
        }

        //This function checks the link text for vagueness
        function testForVagueLinkText(nameDescription) {
            var regEx = /^(click here|here|link|edit|select|more|more info|more information|go)$/g;
            if (regEx.test(nameDescription.toLowerCase())) {
                alerts += alertIcons.caution_vagueText;
                andiAlerter.throwAlert(alert_0163);
            }
        }

        //This function determines if an element[role] is in tab order
        function isElementInTabOrder(element, role) {
            if (!!$(element).prop("tabIndex") && !$(element).is(":tabbable")) {//Element is not tabbable and has no tabindex
                //Throw Alert: Element with role=link|button not in tab order
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
                if (n === d) //matchingTest
                    d = "";
                else
                    d = " " + d; //add space
            }
            return n + d;
        }
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    nANDI.results = function () {

        //Add Module Mode Buttons
        var moduleModeButtons = "<button id='ANDI508-linksMode-button' class='nANDI508-mode' aria-label='" + nANDI.links.count + " Links' aria-selected='false'>" + nANDI.links.count + " links</button>" +
            "<button id='ANDI508-buttonsMode-button' class='nANDI508-mode' aria-label='" + nANDI.buttons.count + " Buttons' aria-selected='false'>" + nANDI.buttons.count + " buttons</button>";
        $("#ANDI508-module-actions").html(moduleModeButtons);

        //Define nANDI mode buttons
        $("#ANDI508-linksMode-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.linksMode = true;
            AndiModule.activeActionButtons.buttonsMode = false;
            AndiModule.launchModule("m");
        });
        $("#ANDI508-buttonsMode-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.linksMode = false;
            AndiModule.activeActionButtons.buttonsMode = true;
            AndiModule.launchModule("m");
        });

        if (nANDI.links.count > 0 || nANDI.buttons.count > 0) {
            //Links or buttons were found

            if (AndiModule.activeActionButtons.linksMode) {
                andiBar.updateResultsSummary("Links Found: " + nANDI.links.count);

                $("#ANDI508-linksMode-button").attr("aria-selected", "true").addClass("ANDI508-module-action-active");

                if (nANDI.links.count > 0) {

                    if (nANDI.links.ambiguousIndex > 0) {
                        //highlightAmbiguousLinks button
                        $("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightAmbiguousLinks-button' aria-label='Highlight " + nANDI.links.ambiguousCount + " Ambiguous Links' aria-pressed='false'>" + nANDI.links.ambiguousCount + " ambiguous links" + findIcon + "</button>");

                        //Ambiguous Links Button
                        $("#ANDI508-highlightAmbiguousLinks-button").click(function () {
                            var testPage = $("#ANDI508-testPage");
                            if (!$(testPage).hasClass("nANDI508-highlightAmbiguous")) {
                                //On
                                $("#nANDI508-listLinks-tab-all").click();
                                $("#ANDI508-testPage")
                                    //.removeClass("nANDI508-highlightInternal nANDI508-highlightExternal")
                                    .addClass("nANDI508-highlightAmbiguous");
                                andiOverlay.overlayButton_on("find", $(this));
                                AndiModule.activeActionButtons.highlightAmbiguousLinks = true;
                            }
                            else {
                                //Off
                                $("#ANDI508-testPage").removeClass("nANDI508-highlightAmbiguous");
                                andiOverlay.overlayButton_off("find", $(this));
                                AndiModule.activeActionButtons.highlightAmbiguousLinks = false;
                            }
                            andiResetter.resizeHeights();
                            return false;
                        });
                    }

                    $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewLinksList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view links list</button>");

                    //Links List Button
                    $("#ANDI508-viewLinksList-button").click(function () {
                        if (!nANDI.viewList_tableReady) {
                            nANDI.viewList_buildTable("links");
                            nANDI.viewList_attachEvents();
                            nANDI.viewList_attachEvents_links();
                            nANDI.viewList_tableReady = true;
                        }
                        nANDI.viewList_toggle("links", this);
                        andiResetter.resizeHeights();
                        return false;
                    });

                    //Show Startup Summary
                    if (!andiBar.focusIsOnInspectableElement()) {
                        andiBar.showElementControls();
                        andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>links</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every link.", true);
                    }
                }
                else {//page has no links, but has buttons
                    andiBar.updateResultsSummary("Links Found: 0");

                    //No links or buttons were found
                    andiBar.hideElementControls();
                    andiBar.showStartUpSummary("No <span class='ANDI508-module-name-l'>links</span> were found.");
                }
            }
            else if (AndiModule.activeActionButtons.buttonsMode) {
                andiBar.updateResultsSummary("Buttons Found: " + nANDI.buttons.count);

                $("#ANDI508-buttonsMode-button").attr("aria-selected", "true").addClass("ANDI508-module-action-active");

                if (nANDI.buttons.count > 0) {

                    if (nANDI.buttons.nonUniqueCount > 0) {
                        //highlightNonUniqueButtons
                        $("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightNonUniqueButtons-button' aria-label='Highlight " + nANDI.buttons.nonUniqueCount + " Non-Unique Buttons' aria-pressed='false'>" + nANDI.buttons.nonUniqueCount + " non-unique buttons" + findIcon + "</button>");

                        //highlightNonUniqueButtons Button
                        $("#ANDI508-highlightNonUniqueButtons-button").click(function () {
                            var testPage = $("#ANDI508-testPage");
                            if (!$(testPage).hasClass("nANDI508-highlightAmbiguous")) {
                                //On
                                $("#nANDI508-listButtons-tab-all").click();
                                $("#ANDI508-testPage").addClass("nANDI508-highlightAmbiguous");
                                andiOverlay.overlayButton_on("find", $(this));
                                AndiModule.activeActionButtons.highlightNonUniqueButtons = true;
                            }
                            else {
                                //Off
                                $("#ANDI508-testPage").removeClass("nANDI508-highlightAmbiguous");
                                andiOverlay.overlayButton_off("find", $(this));
                                AndiModule.activeActionButtons.highlightNonUniqueButtons = false;
                            }
                            andiResetter.resizeHeights();
                            return false;
                        });
                    }

                    $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewButtonsList-button' class='ANDI508-viewOtherResults-button' aria-label='View Buttons List' aria-expanded='false'>" + listIcon + "view buttons list</button>");

                    //View Button List Button
                    $("#ANDI508-viewButtonsList-button").click(function () {
                        if (!nANDI.viewList_tableReady) {
                            nANDI.viewList_buildTable("buttons");
                            nANDI.viewList_attachEvents();
                            nANDI.viewList_attachEvents_buttons();
                            nANDI.viewList_tableReady = true;
                        }
                        nANDI.viewList_toggle("buttons", this);
                        andiResetter.resizeHeights();
                        return false;
                    });

                    //Show Startup Summary
                    if (!andiBar.focusIsOnInspectableElement()) {
                        andiBar.showElementControls();
                        andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>buttons</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every button.", true);
                    }
                }
                else {
                    //page has no buttons, but has links
                    andiBar.updateResultsSummary("Buttons Found: 0");

                    //No links or buttons were found
                    andiBar.hideElementControls();
                    andiBar.showStartUpSummary("No <span class='ANDI508-module-name-l'>buttons</span> were found.");
                }
            }
        }
        else {
            andiBar.updateResultsSummary("Links Found: 0, Buttons Found: 0");

            //No links or buttons were found
            andiBar.hideElementControls();
            andiBar.showStartUpSummary("No <span class='ANDI508-module-name-l'>links</span> or <span class='ANDI508-module-name-l'>buttons</span> were found.");
        }

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons([
            "viewLinksList",
            "highlightAmbiguousLinks",
            "viewButtonsList",
            "highlightNonUniqueButtons"
        ]);

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {

            //Highlight the row in the links list that associates with this element
            nANDI.viewList_rowHighlight($(element).attr("data-andi508-index"));

            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [
                    ["href", nANDI.normalizeHref(element)],
                    "rel",
                    "download",
                    "media",
                    "target",
                    "type"
                ]
            );

            andiBar.displayOutput(elementData, element, addOnProps);
            andiBar.displayTable(elementData, element, addOnProps);
        }
    };

    //This function builds the table for the view list
    nANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='nANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='nANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='nANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='nANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        if (mode === "links") {
            //BUILD LINKS LIST TABLE
            var displayHref, targetText;
            for (var x = 0; x < nANDI.links.list.length; x++) {
                //get target text if internal link
                displayHref = "";
                targetText = "";
                if (nANDI.links.list[x].href) {//if has an href
                    if (!nANDI.isScriptedLink(nANDI.links.list[x])) {
                        if (nANDI.links.list[x].href.charAt(0) !== "#") //href doesn't start with # (points externally)
                            targetText = "target='_nANDI'";
                        displayHref = "<a href='" + nANDI.links.list[x].href + "' " + targetText + ">" + nANDI.links.list[x].href + "</a>";
                    }
                    else { //href contains javascript
                        displayHref = nANDI.links.list[x].href;
                    }
                }

                //determine if there is an alert
                rowClasses = "";
                var nextTabButton = "";
                if (nANDI.links.list[x].alerts.includes("Alert"))
                    rowClasses += "ANDI508-table-row-alert ";

                if (nANDI.links.list[x].linkPurpose == "i") {
                    rowClasses += "nANDI508-listLinks-internal ";
                    var id = nANDI.links.list[x].href;
                    if (id.charAt(0) === "#")
                        id = id.substring(1, id.length);
                    nextTabButton = " <button class='nANDI508-nextTab' data-andi508-relatedid='" +
                        id + "' title='focus on the element after id=" +
                        id + "'>next tab</button>";
                }
                else if (nANDI.links.list[x].linkPurpose == "e")
                    rowClasses += "nANDI508-listLinks-external ";

                tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                    "<th scope='row'>" + nANDI.links.list[x].index + "</th>" +
                    "<td class='ANDI508-alert-column'>" + nANDI.links.list[x].alerts + "</td>" +
                    "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + nANDI.links.list[x].index + "'>" + nANDI.links.list[x].nameDescription + "</a></td>" +
                    "<td class='ANDI508-code'>" + displayHref + nextTabButton + "</td>" +
                    "</tr>";
            }

            tabsHTML = "<button id='nANDI508-listLinks-tab-all' aria-label='View All Links' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all links (" + nANDI.links.list.length + ")</button>";
            if (nANDI.links.internalCount > 0)
                tabsHTML += "<button id='nANDI508-listLinks-tab-internal' aria-label='View Skip Links' aria-selected='false' data-andi508-relatedclass='nANDI508-internalLink'>skip links (" + nANDI.links.internalCount + ")</button>";
            if (nANDI.links.externalCount > 0)
                tabsHTML += "<button id='nANDI508-listLinks-tab-external' aria-label='View External Links' aria-selected='false' data-andi508-relatedclass='nANDI508-externalLink'>external links (" + nANDI.links.externalCount + ")</button>";

            appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:45%'><a href='javascript:void(0)'>href <i aria-hidden='true'></i></a></th>";
        }
        else {
            //BUILD BUTTON LIST TABLE
            for (var b = 0; b < nANDI.buttons.list.length; b++) {
                //determine if there is an alert
                rowClasses = "";
                if (nANDI.buttons.list[b].alerts.includes("Alert"))
                    rowClasses += "ANDI508-table-row-alert ";

                tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                    "<th scope='row'>" + nANDI.buttons.list[b].index + "</th>" +
                    "<td class='ANDI508-alert-column'>" + nANDI.buttons.list[b].alerts + "</td>" +
                    "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + nANDI.buttons.list[b].index + "'>" + nANDI.buttons.list[b].nameDescription + "</a></td>" +
                    "<td>" + nANDI.buttons.list[b].accesskey + "</td>" +
                    "</tr>";
            }

            tabsHTML = "<button id='nANDI508-listButtons-tab-all' aria-label='View All Buttons' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all buttons</button>";

            appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='button number'>#<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:75%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Accesskey <i aria-hidden='true'></i></a></th>";
        }

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    nANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") {
            //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#nANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "links")
                AndiModule.activeActionButtons.viewLinksList = true;
            else
                AndiModule.activeActionButtons.viewButtonsList = true;
        }
        else {
            //hide List, show alert list
            $("#nANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();
            if (testPageData.numberOfAccessibilityAlertsFound > 0) {
                $("#ANDI508-alerts-list").show();
            }
            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view " + mode + " list")
                .attr("aria-expanded", "false");
            if (mode === "links")
                AndiModule.activeActionButtons.viewLinksList = false;
            else
                AndiModule.activeActionButtons.viewButtonsList = false;
        }
    };

    //This function will highlight the text of the row.
    nANDI.viewList_rowHighlight = function (index) {
        $("#ANDI508-viewList-table tbody tr").each(function () {
            $(this).removeClass("ANDI508-table-row-inspecting");
            if ($(this).find("th").first().html() == index) {
                $(this).addClass("ANDI508-table-row-inspecting");
            }
        });
    };

    //This function attaches the click,hover,focus events to the items in the view list
    nANDI.viewList_attachEvents = function () {
        //Add focus click to each link (output) in the table
        $("#ANDI508-viewList-table td a[data-andi508-relatedindex]").each(function () {
            andiFocuser.addFocusClick($(this));
            var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + $(this).attr("data-andi508-relatedindex") + "]").first();
            andiLaser.createLaserTrigger($(this), $(relatedElement));
            $(this)
                .hover(function () {
                    if (!event.shiftKey)
                        AndiModule.inspect(relatedElement[0]);
                })
                .focus(function () {
                    AndiModule.inspect(relatedElement[0]);
                });
        });

        //This will define the click logic for the table sorting.
        //Table sorting does not use aria-sort because .removeAttr("aria-sort") crashes in old IE
        $("#ANDI508-viewList-table th a").click(function () {
            var table = $(this).closest("table");
            $(table).find("th").find("i").html("")
                .end().find("a"); //remove all arrow

            var rows = $(table).find("tr:gt(0)").toArray().sort(sortCompare($(this).parent().index()));
            this.asc = !this.asc;
            if (!this.asc) {
                rows = rows.reverse();
                $(this).attr("title", "descending")
                    .parent().find("i").html("&#9650;"); //up arrow
            }
            else {
                $(this).attr("title", "ascending")
                    .parent().find("i").html("&#9660;"); //down arrow
            }
            for (var i = 0; i < rows.length; i++) {
                $(table).append(rows[i]);
            }

            //Table Sort Functionality
            function sortCompare(index) {
                return function (a, b) {
                    var valA = getCellValue(a, index);
                    var valB = getCellValue(b, index);
                    return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
                };
                function getCellValue(row, index) {
                    return $(row).children("td,th").eq(index).text();
                }
            }
        });

        //Define listLinks next button
        $("#nANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#nANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var focusGoesOnThisIndex;

            if (index == testPageData.andiElementIndex || isNaN(index)) {
                //No link being inspected yet, get first element according to selected tab
                focusGoesOnThisIndex = $("#ANDI508-testPage ." + selectedTabClass).first().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to first
            }
            else {
                //Find the next element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for (var x = index; x < testPageData.andiElementIndex; x++) {
                    //Get next element within set of selected tab type
                    if ($("#ANDI508-testPage ." + selectedTabClass + "[data-andi508-index='" + (x + 1) + "']").length) {
                        focusGoesOnThisIndex = x + 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            nANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLinks prev button
        $("#nANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#nANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var firstElementInListIndex = $("#ANDI508-testPage ." + selectedTabClass).first().attr("data-andi508-index");
            var focusGoesOnThisIndex;

            if (isNaN(index)) { //no active element yet
                //get first element according to selected tab
                andiFocuser.focusByIndex(firstElementInListIndex); //loop back to first
                focusGoesOnThisIndex = firstElementInListIndex;
            }
            else if (index == firstElementInListIndex) {
                //Loop to last element in list
                focusGoesOnThisIndex = $("#ANDI508-testPage ." + selectedTabClass).last().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to last
            }
            else {
                //Find the previous element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for (var x = index; x > 0; x--) {
                    //Get next element within set of selected tab type
                    if ($("#ANDI508-testPage ." + selectedTabClass + "[data-andi508-index='" + (x - 1) + "']").length) {
                        focusGoesOnThisIndex = x - 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            nANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function attaches click events to the items specific to the Links view list
    nANDI.viewList_attachEvents_links = function () {
        $("#nANDI508-listLinks-tab-all").click(function () {
            nANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").show();
            //Remove All (glowing) Highlights
            $("#ANDI508-testPage").removeClass("nANDI508-highlightInternal nANDI508-highlightExternal nANDI508-highlightAmbiguous");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#nANDI508-listLinks-tab-internal").click(function () {
            nANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function () {
                if ($(this).hasClass("nANDI508-listLinks-internal"))
                    $(this).show();
                else
                    $(this).hide();
            });
            //Add (glowing) Highlight for Internal Links
            $("#ANDI508-testPage").removeClass("nANDI508-highlightExternal nANDI508-highlightAmbiguous").addClass("nANDI508-highlightInternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#nANDI508-listLinks-tab-external").click(function () {
            nANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function () {
                if ($(this).hasClass("nANDI508-listLinks-external"))
                    $(this).show();
                else
                    $(this).hide();
            });
            //Add (glowing) Highlight for External Links
            $("#ANDI508-testPage").removeClass("nANDI508-highlightInternal nANDI508-highlightAmbiguous").addClass("nANDI508-highlightExternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });

        //Define next tab button
        $("#ANDI508-viewList-table button.nANDI508-nextTab").each(function () {
            $(this).click(function () {
                var allElementsInTestPage = $("#ANDI508-testPage *");
                var idRef = $(this).attr("data-andi508-relatedid");
                var anchorTargetElement = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
                var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
                for (var x = anchorTargetElementIndex; x < allElementsInTestPage.length; x++) {
                    if ($(allElementsInTestPage).eq(x).is(":tabbable")) {
                        $(allElementsInTestPage).eq(x).focus();
                        break;
                    }
                }
            });
        });
    };

    //This function attaches click events to the items specific to the Buttons view list
    nANDI.viewList_attachEvents_buttons = function () {
        $("#nANDI508-listButtons-tab-all").click(function () {
            nANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").show();
            //Remove All (glowing) Highlights
            $("#ANDI508-testPage").removeClass("nANDI508-highlightAmbiguous");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightNonUniqueButtons-button"));
            andiResetter.resizeHeights();
            return false;
        });
    };

    //This function handles the selection of a tab.
    nANDI.viewList_selectTab = function (tab) {
        $("#nANDI508-viewList-tabs button").removeClass().attr("aria-selected", "false");
        $(tab).addClass("ANDI508-tab-active").attr("aria-selected", "true");
    };

    //This function gets the href
    //if href length is greater than 1 and last char is a slash
    //This elimates false positives during comparisons since with or without slash is essentially the same
    nANDI.normalizeHref = function (element) {
        var href = $(element).attr("href");
        if (typeof href != "undefined") {
            href = $.trim($(element).attr("href"));
            if (href === "")
                href = AndiCheck.emptyString;
            else if (href.length > 1 && href.charAt(href.length - 1) == "/")
                href = href.slice(0, -1);
        }
        return href;
    };

    //This function returns true if the href is a link that fires a script
    nANDI.isScriptedLink = function (href) {
        if (typeof href == "string") {
            //broken up into three substrings so its not flagged in jslint
            return (href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
        }//else
        return false;
    };

    nANDI.analyze();
    nANDI.results();

}//end init
