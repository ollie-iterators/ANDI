//==========================================//
//jANDI: hidden content ANDI 				//
//Created By Social Security Administration //
//==========================================//
function init_module() {
    //TODO: report whether an element should be visible or invisible to a screen reader

    //create jANDI instance
    var jANDI = new AndiModule("4.0.2", "j");

    //This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
    //Holding the shift key will prevent inspection from changing.
    AndiModule.hoverability = function (event) {
        if (!event.shiftKey && $(this).hasClass("ANDI508-forceReveal")) //check for holding shift key
            AndiModule.inspect(this);
    };

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeAttr("data-jandi508-hidingtechniques").removeClass("ANDI508-forceReveal ANDI508-forceReveal-display ANDI508-forceReveal-visibility ANDI508-forceReveal-position ANDI508-forceReveal-opacity ANDI508-forceReveal-overflow ANDI508-forceReveal-fontSize ANDI508-forceReveal-textIndent");
            if ($(element).hasClass("ANDI508-forceReveal-html5Hidden"))
                $(element).attr("hidden", "hidden").removeClass("ANDI508-forceReveal-html5Hidden"); //add the hidden attribute back
        } else {
            $(testPage).find(".jANDI508-hasHiddenCssContent").removeClass("jANDI508-hasHiddenCssContent");
        }
    };

    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);
        var hidingTechniques = $(element).attr("data-jandi508-hidingtechniques");
        $("#ANDI508-additionalElementDetails").html("");
        if (hidingTechniques)
            $("#ANDI508-additionalElementDetails").append(hidingTechniques);
    };

    var hiddenElements = 0;
    var hidden_display = 0;
    var hidden_visibility = 0;
    var hidden_position = 0;
    var hidden_opacity = 0;
    var hidden_overflow = 0;
    var hidden_fontSize = 0;
    var hidden_textIndent = 0;
    var hidden_html5Hidden = 0;

    var elementsWithCssInjectedContent = 0;

    var prevNextBtnsVisible = false;

    if (!prevNextBtnsVisible) {
        andiBar.hideElementControls();
    }

    //This function returns true if the element contains elements that might need accessibility testing, false if not.
    jANDI.containsTestableContent = function (element) {
        var needsTesting = true;
        var isContainerElement = $(element).isContainerElement();
        var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";

        //Does this element contain content that needs testing
        if (isContainerElement &&
            ($.trim($(element).html()) === "" ||
                ($.trim($(element).text()) === "" &&
                    $(element).find(elementsNeedingTesting).length === 0))) {
            needsTesting = false; //this element doesn't need testing
        } else if (!isContainerElement && $(element).is(elementsNeedingTesting)) { //Is this element one that needs testing?
            needsTesting = false; //this element doesn't need testing
        }

        return needsTesting;
    };

    //This function will analyze the test page for elements hidden using CSS
    jANDI.analyze = function () {
        var isHidingContent, elementCss;
        $(TestPageData.allElements).not("area,base,basefont,datalist,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function () {
            isHidingContent = false;
            elementCss = "";

            if (jANDI.containsTestableContent(this)) {
                if ($(this).css("display") == "none") {
                    //element display is none
                    hiddenElements++;
                    isHidingContent = true;
                    hidden_display++; //increment count if not contained by another of same hiding technique
                    $(this).addClass("ANDI508-forceReveal-display");
                    elementCss += "display:none; ";
                }
                if ($(this).css("visibility") == "hidden") {
                    //element visibility is hidden
                    hiddenElements++;
                    isHidingContent = true;
                    hidden_visibility++; //increment count if not contained by another of same hiding technique
                    $(this).addClass("ANDI508-forceReveal-visibility");
                    elementCss += "visibility:hidden; ";
                }
                if ($(this).css("position") == "absolute" && ($(this).offset().left < 0 || $(this).offset().top < 0)) {
                    //element is positioned offscreen
                    hiddenElements++;
                    isHidingContent = true;
                    hidden_position++; //increment count if not contained by another of same hiding technique
                    $(this).addClass("ANDI508-forceReveal-position");
                    elementCss += "position:absolute; ";
                }
                if ($(this).css("opacity") == "0") {
                    //element opacity is zero
                    hiddenElements++;
                    isHidingContent = true;
                    hidden_opacity++; //increment count if not contained by another of same hiding technique
                    $(this).addClass("ANDI508-forceReveal-opacity");
                    elementCss += "opacity:0; ";
                }
                //if element has innerText
                if ($(this).isContainerElement() && $.trim($(this).text())) {
                    if ($(this).css("overflow") == "hidden" &&
                        (parseInt($(this).css("height")) <= 1 || parseInt($(this).css("width")) <= 1)) {
                        //element has overflow hidden and a small height or width
                        hiddenElements++;
                        isHidingContent = true;
                        hidden_overflow++; //increment count if not contained by another of same hiding technique
                        $(this).addClass("ANDI508-forceReveal-overflow");
                        elementCss += "overflow:hidden; ";
                    }
                    if (parseInt($(this).css("font-size")) === 0) {
                        //element font-size is 0
                        hiddenElements++;
                        isHidingContent = true;
                        hidden_fontSize++; //increment count if not contained by another of same hiding technique
                        $(this).addClass("ANDI508-forceReveal-fontSize");
                        elementCss += "font-size:0; ";
                    }
                }
                if ($(this).css("text-indent") != "0" || $(this).css("text-indent") != "0px") {
                    if (parseInt($(this).css("text-indent")) < -998) {
                        //element has a text-indent that makes it off screen
                        hiddenElements++;
                        isHidingContent = true;
                        hidden_textIndent++; //increment count if not contained by another of same hiding technique
                        $(this).addClass("ANDI508-forceReveal-textIndent");
                        elementCss += "text-indent:" + $(this).css("text-indent") + "; ";
                    }
                }
                if ($(this).attr("hidden")) {
                    //element has html5 hidden attribute
                    hiddenElements++;
                    isHidingContent = true;
                    hidden_html5Hidden++; //increment count if not contained by another of same hiding technique
                    $(this).addClass("ANDI508-forceReveal-html5Hidden");
                    elementCss += "\/*html5 hidden*\/ ";
                }
            }

            if (isHidingContent) {
                //create data-jandi508-hidingtechniques
                if (elementCss !== "") {
                    elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
                    $(this).attr("data-jandi508-hidingtechniques", elementCss);
                }

                andiData = new AndiData(this, true);
                AndiData.attachDataToElement(this);
            }
        });

        if (!oldIE) {
            jANDI.detectCssInjectedContent();

            if ($("#ANDI508-testPage .jANDI508-hasHiddenCssContent").first().length)
                andiAlerter.throwAlert(alert_0220, alert_0220.message, 0);
        }
    };

    //This function will detect content hidden using css :before :after content.
    //Current screen readers will not read text injected using this method in some browsers.
    jANDI.detectCssInjectedContent = function () {
        var before_content, before_style, after_content, after_style, hasHiddenCSSContent, cssDisplay;

        //Loop through every element on the page
        for (var x = 0; x < TestPageData.allVisibleElements.length; x++) {
            hasHiddenCSSContent = false; //reset to false
            cssDisplay = "";

            before_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":before");
            if (before_style) {
                before_content = before_style.getPropertyValue("content");
                if (hasContent(before_content)) { //element has injected content using ::before
                    if (isVisible(before_style)) { //pseudoElement is visible
                        hasHiddenCSSContent = true;
                        cssDisplay += before_content + " ";
                    }
                }
            }

            after_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":after");
            if (after_style) {
                after_content = after_style.getPropertyValue("content");
                if (hasContent(after_content)) { //element has injected content using ::after
                    if (isVisible(after_style)) { //pseudoElement is visible
                        hasHiddenCSSContent = true;
                        cssDisplay += after_content;
                    }
                }
            }

            if (hasHiddenCSSContent) {
                elementsWithCssInjectedContent++;
                $(TestPageData.allVisibleElements[x]).addClass("jANDI508-hasHiddenCssContent");
            }
        }

        //This function will return true if content exists
        function hasContent(content) {
            if (content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"" && content !== "\" \"") {//content is not empty
                return true;
            }
            return false;
        }

        //This function returns true if the style of an element is not hidden
        //TODO: Can this be replaced by getting the pseudo element and reusing :shown ?
        function isVisible(style) {
            if (style.getPropertyValue("visibility") === "hidden" ||
                style.getPropertyValue("display") === "none" ||
                (style.getPropertyValue("height") === "0" && style.getPropertyValue("width") === "0")
            ) {
                return false;
            }
            return true;
        }
    };
    jANDI.analyze();
    jANDI.results();

}//end init
