//==========================================//
//eANDI: graphics ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module() {
    //TODO: add <video>

    //create eANDI instance
    var eANDI = new AndiModule("6.0.2", "e");

    //This object class is used to keep track of the images on the page
    function Images() {
        this.list = [];
        this.count = 0;
        this.inline = 0;      //inline images
        this.background = 0;  //elements with background images
        this.decorative = 0;  //images explicetly declared as decorative
        this.fontIcon = 0;    //font icons
        this.imageLink = 0;   //images contained in links
        this.imageButton = 0; //images contained in buttons
    }

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    eANDI.analyze = function () {
        eANDI.images = new Images();
        var isImageContainedByInteractiveWidget; //boolean if image is contained by link or button

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {

            var closestWidgetParent;
            //Determine if the image is contained by an interactive widget (link, button)
            isImageContainedByInteractiveWidget = false; //reset boolean
            if ($(this).not("[tabindex]").is("img,[role=img]")) {
                //Is Image contained by a link or button?
                closestWidgetParent = $(this).closest("a,button,[role=button],[role=link]");
                if ($(closestWidgetParent).length) {
                    if ($(closestWidgetParent).isSemantically("[role=link]", "a")) {
                        eANDI.images.imageLink++;
                    } else if ($(closestWidgetParent).isSemantically("[role=button]", "button")) {
                        eANDI.images.imageButton++;
                    }
                    eANDI.images.inline++;
                    isImageContainedByInteractiveWidget = true;
                }
            }

            if (isImageContainedByInteractiveWidget || $(this).is("[role=img],[role=image],img,input[type=image],svg,canvas,area,marquee,blink")) {
                if (isImageContainedByInteractiveWidget) {
                    //Check if parent already has been evaluated (when more than one image is in a link)
                    if (!$(closestWidgetParent).hasClass("ANDI508-element")) {
                        //Image is contained by <a> or <button>
                        andiData = new AndiData(closestWidgetParent[0]);
                        andiCheck.commonFocusableElementChecks(andiData, $(closestWidgetParent));
                        AndiData.attachDataToElement(closestWidgetParent);
                    }
                } else { //not contained by interactive widget
                    andiData = new AndiData(this);
                }

                //Check for conditions based on semantics
                if ($(this).is("marquee")) {
                    eANDI.images.inline++;
                    andiAlerter.throwAlert(alert_0171);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("blink")) {
                    eANDI.images.inline++;
                    andiAlerter.throwAlert(alert_0172);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("canvas")) {
                    eANDI.images.inline++;
                    andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("input:image")) {
                    eANDI.images.inline++;
                    andiCheck.commonFocusableElementChecks(andiData, $(this));
                    altTextAnalysis($.trim($(this).attr("alt")));
                    AndiData.attachDataToElement(this);
                    //Check for server side image map
                } else if ($(this).is("img") && $(this).attr("ismap")) {//Code is written this way to prevent bug in IE8
                    eANDI.images.inline++;
                    andiAlerter.throwAlert(alert_0173);
                    AndiData.attachDataToElement(this);
                } else if (!isImageContainedByInteractiveWidget && $(this).is("img,svg,[role=img]")) { //an image used by an image map is handled by the <area>
                    eANDI.images.inline++;
                    if (isElementDecorative(this, andiData)) {
                        eANDI.images.decorative++;
                        $(this).addClass("eANDI508-decorative");

                        if ($(this).prop("tabIndex") >= 0) { //Decorative image is in the tab order
                            andiAlerter.throwAlert(alert_0126);
                        }
                    } else { //This image has not been declared decorative
                        if (andiData.tabbable) {
                            andiCheck.commonFocusableElementChecks(andiData, $(this));
                        } else {
                            andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                        }
                        altTextAnalysis($.trim($(this).attr("alt")));
                    }
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("area")) {
                    eANDI.images.inline++;
                    var map = $(this).closest("map");
                    if ($(map).length) { //<area> is contained in <map>
                        var mapName = "#" + $(map).attr("name");
                        if ($("#ANDI508-testPage img[usemap='" + mapName + "']").length) {
                            //<map> references existing <img>
                            andiCheck.commonFocusableElementChecks(andiData, $(this));
                            altTextAnalysis($.trim($(this).attr("alt")));
                            AndiData.attachDataToElement(this);
                        } else { //Image referenced by image map not found
                            //TODO: throw this message only once for all area tags that it relates to
                            andiAlerter.throwAlert(alert_006A, ["&ltmap name=" + mapName + "&gt;"], 0);
                        }
                    } else { //Area tag not contained in map
                        andiAlerter.throwAlert(alert_0178, alert_0178.message, 0);
                    }
                } else if ($(this).is("[role=image]")) {
                    //eANDI.images.inline++;
                    andiAlerter.throwAlert(alert_0183);
                    AndiData.attachDataToElement(this);
                }
            } else if ($(this).css("background-image").includes("url(")) {
                eANDI.images.background++;
                $(this).addClass("eANDI508-background");
            }

            //Check for common font icon classes
            if (!$(this).is("[role=img],img") &&
                ($(this).hasClass("fa fab fas fal fad") || //font awesome
                    $(this).hasClass("glyphicon") || //glyphicon
                    $(this).hasClass("material-icons") || //google material icons
                    $(this).is("[data-icon]") ||//common usage of the data-* attribute for icons
                    lookForPrivateUseUnicode(this)
                )
            ) {
                if (!$(this).hasClass("ANDI508-element")) {
                    andiData = new AndiData(this);
                    AndiData.attachDataToElement(this);
                }
                eANDI.images.fontIcon++;
                $(this).addClass("eANDI508-fontIcon");
                //Throw alert
                if (andiData.accName && !andiData.isTabbable) {
                    //has accessible name. Needs role=img if meaningful image.
                    andiAlerter.throwAlert(alert_0179);
                } else {
                    //no accessible name. Is it meaningful?
                    //andiAlerter.throwAlert(alert_017A);
                }
            }
        });

        if (eANDI.images.background > 0) { //Page has background images
            andiAlerter.throwAlert(alert_0177, alert_0177.message, 0);
        }

        //This returns true if the image is decorative.
        function isElementDecorative(element, elementData) {
            if ($(element).attr("aria-hidden") === "true") {
                return true;
                //TODO: this logic may need to change if screen readers support spec that says aria-label
                //		should override role=presentation, thus making it not decorative
            } else {
                if (elementData.role === "presentation" || elementData.role === "none") { //role is presentation or none
                    return true;
                } else if ($(element).is("img") && elementData.empty && elementData.empty.alt) { //<img> and empty alt
                    return true;
                }
            }
            return false;
        }

        //This function looks at the CSS content psuedo elements looking for unicode in the private use range which usually means font icon
        function lookForPrivateUseUnicode(element) {
            return (hasPrivateUseUnicode("before") || hasPrivateUseUnicode("after"));

            function hasPrivateUseUnicode(psuedo) {
                var content = (oldIE) ? "" : window.getComputedStyle(element, ":" + psuedo).content;
                if (content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"") {//content is not none or empty string
                    var unicode;
                    //starts at 1 and end at length-1 to ignore the starting and ending double quotes
                    for (var i = 1; i < content.length - 1; i++) {
                        unicode = content.charCodeAt(i);
                        if (unicode >= 57344 && unicode <= 63743) {
                            //unicode is in the private use range
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    };

    //This function will analyze the alt text
    function altTextAnalysis(altText) {
        var regEx_redundantPhrase = /(image of|photo of|picture of|graphic of|photograph of)/g;
        var regEx_fileTypeExt = /\.(png|jpg|jpeg|gif|pdf|doc|docx|svg)$/g;
        var regEx_nonDescAlt = /^(photo|photograph|picture|graphic|logo|icon|graph|image)$/g;

        if (altText !== "") {
            altText = altText.toLowerCase();
            if (regEx_redundantPhrase.test(altText)) { //check for redundant phrase in alt text
                andiAlerter.throwAlert(alert_0174); //redundant phrase in alt text
            } else if (regEx_fileTypeExt.test(altText)) { //Check for filename in alt text
                andiAlerter.throwAlert(alert_0175); //file name in alt text
            } else if (regEx_nonDescAlt.test(altText)) { //Check for non-descriptive alt text
                andiAlerter.throwAlert(alert_0176); //non-descriptive alt text
            }
        }
    }
    eANDI.analyze();
}//end init
