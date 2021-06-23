//==========================================//
//jANDI: hidden content ANDI (small code)   //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //TODO: report whether an element should be visible or invisible to a screen reader

    //create jANDI instance
    var jANDI = new AndiModule("4.0.2", "j");

    //This object class is used to keep track of the hidden elements on the page
    function HiddenElements() {
        this.list = [];
        this.count = 0;
        this.hideDisplay = 0;
        this.hideVisibility = 0;
        this.hidePosition = 0;
        this.hideOpacity = 0;
        this.hideOverflow = 0;
        this.hideFontSize = 0;
        this.hideTextIndent = 0;
        this.hideHTML5 = 0;
        this.hasCSSInjectedContent = 0;
    }

    //This function will analyze the test page for elements hidden using CSS
    jANDI.analyze = function () {
        jANDI.hiddenElements = new HiddenElements();
        var elementCss;
        $(TestPageData.allElements).not("area,base,basefont,datalist,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function () {
            elementCss = "";
            var needsTesting = true;
            var isContainerElement = $(this).isContainerElement();
            var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";

            //Does this element contain content that needs testing
            if (isContainerElement &&
                ($.trim($(this).html()) === "" || ($.trim($(this).text()) === "" &&
                        $(this).find(elementsNeedingTesting).length === 0))) {
                needsTesting = false; //this element doesn't need testing
            } else if (!isContainerElement && $(this).is(elementsNeedingTesting)) { //Is this element one that needs testing
                needsTesting = false; //this element doesn't need testing
            }

            if (needsTesting) {
                if ($(this).css("display") == "none") { //element display is none
                    jANDI.hiddenElements.count += 1;
                    jANDI.hiddenElements.hideDisplay += 1;
                    elementCss += "display:none; ";
                }
                if ($(this).css("visibility") == "hidden") { //element visibility is hidden
                    jANDI.hiddenElements.count += 1;
                    jANDI.hiddenElements.hideVisibility += 1;
                    elementCss += "visibility:hidden; ";
                }
                if ($(this).css("position") == "absolute" && ($(this).offset().left < 0 || $(this).offset().top < 0)) {
                    //element is positioned offscreen
                    jANDI.hiddenElements.count += 1;
                    jANDI.hiddenElements.hidePosition += 1;
                    elementCss += "position:absolute; ";
                }
                if ($(this).css("opacity") == "0") { //element opacity is zero
                    jANDI.hiddenElements.count += 1;
                    jANDI.hiddenElements.hideOpacity += 1;
                    elementCss += "opacity:0; ";
                }
                if ($(this).isContainerElement() && $.trim($(this).text())) { //element has innerText
                    if ($(this).css("overflow") == "hidden" &&
                        (parseInt($(this).css("height")) <= 1 || parseInt($(this).css("width")) <= 1)) {
                        //element has overflow hidden and a small height or width
                        jANDI.hiddenElements.count += 1;
                        jANDI.hiddenElements.hideOverflow += 1;
                        elementCss += "overflow:hidden; ";
                    }
                    if (parseInt($(this).css("font-size")) === 0) { //element font-size is 0
                        jANDI.hiddenElements.count += 1;
                        jANDI.hiddenElements.hideFontSize += 1;
                        elementCss += "font-size:0; ";
                    }
                }
                if ($(this).css("text-indent") != "0" || $(this).css("text-indent") != "0px") {
                    if (parseInt($(this).css("text-indent")) < -998) { //element has a text-indent that makes it off screen
                        jANDI.hiddenElements.count += 1;
                        jANDI.hiddenElements.hideTextIndent += 1;
                        elementCss += "text-indent:" + $(this).css("text-indent") + "; ";
                    }
                }
                if ($(this).attr("hidden")) { //element has html5 hidden attribute
                    jANDI.hiddenElements.count += 1;
                    jANDI.hiddenElements.hideHTML5 += 1;
                    elementCss += "\/*html5 hidden*\/ ";
                }
            }

            if (elementCss !== "") {
                elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
                $(this).attr("data-jandi508-hidingtechniques", elementCss);
            }

            andiData = new AndiData(this, true);
            AndiData.attachDataToElement(this);
        });

        if (!oldIE) {
            jANDI.detectCssInjectedContent();

            if ($("#ANDI508-testPage .jANDI508-hasHiddenCssContent").first().length) {
                alert = [alert_0220, alert_0220.message, 0];
            }
        }
    };

    //This function will detect content hidden using css :before :after content.
    //Current screen readers will not read text injected using this method in some browsers.
    jANDI.detectCssInjectedContent = function () {
        var before_content, before_style, after_content, after_style, hasHiddenCSSContent, cssDisplay;

        //Loop through every element on the page
        for (var x = 0; x < TestPageData.allElements.length; x++) {
            hasHiddenCSSContent = false; //reset to false
            cssDisplay = "";

            before_style = window.getComputedStyle(TestPageData.allElements[x], ":before");
            if (before_style) {
                before_content = before_style.getPropertyValue("content");
                if (hasContent(before_content)) { //element has injected content using ::before
                    if (isVisible(before_style)) { //pseudoElement is visible
                        hasHiddenCSSContent = true;
                        cssDisplay += before_content + " ";
                    }
                }
            }

            after_style = window.getComputedStyle(TestPageData.allElements[x], ":after");
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
                jANDI.hiddenElements.hasCSSInjectedContent++;
                $(TestPageData.allElements[x]).addClass("jANDI508-hasHiddenCssContent");
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
        //TODO: Can this be replaced by getting the pseudo element and reusing :shown
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
