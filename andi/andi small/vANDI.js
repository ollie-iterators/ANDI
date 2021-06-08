//==========================================//
//oANDI: fake headers ANDI                  //
//Created By Social Security Administration //
//==========================================//
//NOTE: This only contains the code for finding errors and none for displaying the error code
function init_module() {
    //create oANDI instance
    var oANDI = new AndiModule("4.1.4", "o");
    oANDI.index = 1;

    //This object class is used to store data about each fake header. Object instances will be placed into an array.
    function FakeHeader(element, index, text, fontSize, fontWeight, nextElement, nextText, nextFontSize, nextFontWeight, isFakeHeader) {
        this.element = element;
        this.index = index;
        this.text = text;
        this.fontSize = fontSize;
        this.fontWeight = fontWeight;
        this.nextElement = nextElement;
        this.nextText = nextText;
        this.nextFontSize = nextFontSize;
        this.nextFontWeight = nextFontWeight;
        this.isFakeHeader = isFakeHeader;
    }

    //This object class is used to keep track of the fake headers on the page
    function FakeHeaders() {
        this.FakeHeaderList = [];
        this.count = 0;
    }

    //This analyzes the test page for graphics/image related markup relating to accessibility
    oANDI.analyze = function () {
        oANDI.fakeHeaders = new FakeHeaders();
        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).is("p,div,span,strong,em")) {
                var text = $.trim($(this).text());
                var fontSize = parseInt($(this).css("font-size"));
                var fontWeight = $(this).css("font-weight");
                var nextElement = $(this).next().filter(":visible");
                var nextText = $.trim($(nextElement).text());
                var nextFontSize = parseInt($(nextElement).css("font-size"));
                var nextFontWeight = $(nextElement).css("font-weight");
                var isFakeHeading = false;
                if (text.length > 0 && text.length < 30) {
                    var fakeHeadingIsBold = (fontWeight === "bold" || fontWeight === "bolder" || fontWeight > 700);
                    if (fontSize > 22 || (fakeHeadingIsBold && fontSize > 15)) { //fontSize is greater than size limit
                        if (nextText !== "") { //next element has text
                            var nextIsBold = (nextFontWeight === "bold" || nextFontWeight === "bolder" || nextFontWeight > 700);
                            if (nextFontSize < fontSize) {
                                //next element's font-size is smaller than fakeHeading font-size
                                isFakeHeading = true;
                            } else if (fakeHeadingIsBold && !nextIsBold) {
                                //next element's font-weight is lighter than fakeHeading font-weight
                                isFakeHeading = true;
                            }
                        }
                    }
                }
                if (isFakeHeading) { //Since oANDI has not found a heading yet, check if this element is a fake headings
                    andiData = new AndiData(this);

                    alert = [alert_0190];
                    AndiData.attachDataToElement(this);
                }
                oANDI.fakeHeaders.FakeHeaderList.push(new FakeHeader(this, oANDI.index, text, fontSize, fontWeight, nextElement, nextText, nextFontSize, nextFontWeight, oANDI.isFakeHeading(this)))
                oANDI.index += 1;
            }
        });
    };
    oANDI.analyze();
}//end init
