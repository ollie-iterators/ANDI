//==========================================//
//gANDI: graphics ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var gandiVersionNumber = "6.1.1";

//TODO: add <video>

//create gANDI instance
var gANDI = new AndiModule(gandiVersionNumber,"g");

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
    if(element)
        $(element).removeClass("gANDI508-fontIcon");
    else{
        $(testPage).find(".gANDI508-decorative").removeClass("gANDI508-decorative");
    }
    $(testPage).find(".gANDI508-background").removeClass("gANDI508-background");
};

AndiModule.initActiveActionButtons({
    fadeInlineImages:false,
    highlightDecorativeImages:false,
    removeBackgroundImages:false,
    highlightBackgroundImages:false,
    highlightFontIcons:false
});

//This function will analyze the test page for graphics/image related markup relating to accessibility
gANDI.analyze = function(objectClass){
    objectClass = andiBar.createObjectValues(objectClass, 7);

    var isImageContainedByInteractiveWidget; //boolean if image is contained by link or button

    //Loop through every visible element
    $(TestPageData.allElements).each(function(){

        var closestWidgetParent;
        //Determine if the image is contained by an interactive widget (link, button)
        isImageContainedByInteractiveWidget = false; //reset boolean
        if($(this).not("[tabindex]").isSemantically(["img"],"img")){
            //Is Image contained by a link or button?
            closestWidgetParent = $(this).closest("a,button,[role=button],[role=link]");
            if($(closestWidgetParent).length){
                if ($(closestWidgetParent).isSemantically(["link"],"a")) {
                    objectClass.elementNums[5] += 1;
                    objectClass.elementStrings[5] = "image links";
                } else if ($(closestWidgetParent).isSemantically(["button"],"button")) {
                    objectClass.elementNums[5] += 1;
                    objectClass.elementStrings[5] = "inline buttons";
                }

                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                isImageContainedByInteractiveWidget = true;
            }
        }

        if(isImageContainedByInteractiveWidget || $(this).is("[role=image]") || $(this).isSemantically(["img"],"img,input[type=image],svg,canvas,area,marquee,blink")){

            if(isImageContainedByInteractiveWidget){
                //Check if parent already has been evaluated (when more than one image is in a link)
                if(!$(closestWidgetParent).hasClass("ANDI508-element")){
                    //Image is contained by <a> or <button>
                    andiData = new AndiData(closestWidgetParent[0]);
                    andiCheck.commonFocusableElementChecks(andiData, $(closestWidgetParent));
                    AndiData.attachDataToElement(closestWidgetParent);
                }
            }
            else{//not contained by interactive widget
                andiData = new AndiData(this);
            }

            //Check for conditions based on semantics
            if($(this).is("marquee")){
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                andiAlerter.throwAlert(alert_0171);
                AndiData.attachDataToElement(this);
            }
            else if($(this).is("blink")){
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                andiAlerter.throwAlert(alert_0172);
                AndiData.attachDataToElement(this);
            }
            else if($(this).is("canvas")){
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                AndiData.attachDataToElement(this);
            }
            else if($(this).is("input:image")){
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                andiCheck.commonFocusableElementChecks(andiData, $(this));
                altTextAnalysis($.trim($(this).attr("alt")));
                AndiData.attachDataToElement(this);
            }
            //Check for server side image map
            else if($(this).is("img") && $(this).attr("ismap")){//Code is written this way to prevent bug in IE8
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                andiAlerter.throwAlert(alert_0173);
                AndiData.attachDataToElement(this);
            }
            else if(!isImageContainedByInteractiveWidget && $(this).isSemantically(["img"],"img,svg")){ //an image used by an image map is handled by the <area>
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                if(isElementDecorative(this, andiData)){
                    objectClass.elementNums[3] += 1;
                    objectClass.elementStrings[3] = "decorative images";
                    $(this).addClass("gANDI508-decorative");

                    if($(this).prop("tabIndex") >= 0)
                        //Decorative image is in the tab order
                        andiAlerter.throwAlert(alert_0126);
                }
                else{//This image has not been declared decorative
                    if(andiData.tabbable)
                        andiCheck.commonFocusableElementChecks(andiData,$(this));
                    else
                        andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                    altTextAnalysis($.trim($(this).attr("alt")));
                }

                AndiData.attachDataToElement(this);
            }
            else if($(this).is("area")){
                objectClass.elementNums[1] += 1;
                objectClass.elementStrings[1] = "inline images";
                var map = $(this).closest("map");
                if($(map).length){
                    //<area> is contained in <map>
                    var mapName = "#"+$(map).attr("name");
                    if($("#ANDI508-testPage img[usemap='"+mapName+"']").length){
                        //<map> references existing <img>
                        andiCheck.commonFocusableElementChecks(andiData, $(this));
                        altTextAnalysis($.trim($(this).attr("alt")));
                        AndiData.attachDataToElement(this);
                    }
                    else{//Image referenced by image map not found
                        //TODO: throw this message only once for all area tags that it relates to
                        andiAlerter.throwAlert(alert_006A,["&ltmap name="+mapName+"&gt;"],0);
                    }
                }
                else //Area tag not contained in map
                    andiAlerter.throwAlert(alert_0178,alert_0178.message,0);
            }
            else if($(this).is("[role=image]")){
                //objectClass.elementNums[1] += 1;
                //objectClass.elementStrings[1] = "inline images";
                andiAlerter.throwAlert(alert_0134);
                AndiData.attachDataToElement(this);
            }
        }
        else if($(this).css("background-image").includes("url(")){
            objectClass.elementNums[2] += 1;
            objectClass.elementStrings[2] = "background images";
            $(this).addClass("gANDI508-background");
        }

        //Check for common font icon classes
        if( !$(this).isSemantically(["img"],"img") &&
            (
            $(this).hasClass("fa fab fas fal fad") || //font awesome
            $(this).hasClass("glyphicon") || //glyphicon
            $(this).hasClass("material-icons") || //google material icons
            $(this).is("[data-icon]") ||//common usage of the data-* attribute for icons
            lookForPrivateUseUnicode(this)
            )
        )
        {
            if(!$(this).hasClass("ANDI508-element")){
                andiData = new AndiData(this);
                AndiData.attachDataToElement(this);
            }
            objectClass.elementNums[4] += 1;
            objectClass.elementStrings[4] = "font icons";
            $(this).addClass("gANDI508-fontIcon");
            //Throw alert
            if(andiData.accName && !andiData.isTabbable){
                //has accessible name. Needs role=img if meaningful image.
                andiAlerter.throwAlert(alert_0179);
            }
            else{
                //no accessible name. Is it meaningful?
                //andiAlerter.throwAlert(alert_017A);
            }
        }
    });

    if(objectClass.elementNums[2] > 0) //Page has background images
        andiAlerter.throwAlert(alert_0177,alert_0177.message,0);

    //This returns true if the image is decorative.
    function isElementDecorative(element, elementData){
        if($(element).attr("aria-hidden") === "true"){
            return true;
        }
        //TODO: this logic may need to change if screen readers support spec that says aria-label
        //		should override role=presentation, thus making it not decorative
        else{
            if(elementData.role === "presentation" || elementData.role === "none"){ //role is presentation or none
                return true;
            }
            else if($(element).is("img") && elementData.empty && elementData.empty.alt){ //<img> and empty alt
                return true;
            }
        }
        return false;
    }

    //This function looks at the CSS content psuedo elements looking for unicode in the private use range which usually means font icon
    function lookForPrivateUseUnicode(element){
        return ( hasPrivateUseUnicode("before") || hasPrivateUseUnicode("after") );

        function hasPrivateUseUnicode(psuedo){
            var content = (oldIE) ? "" : window.getComputedStyle(element, ":"+psuedo).content;
            if(content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\""){//content is not none or empty string
                var unicode;
                //starts at 1 and end at length-1 to ignore the starting and ending double quotes
                for(var i=1; i<content.length-1; i++){
                    unicode = content.charCodeAt(i);
                    if(unicode >= 57344 && unicode <= 63743){
                        //unicode is in the private use range
                        return true;
                    }
                }
            }
            return false;
        }
    }
};

var startUpSummaryText = "";
//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
gANDI.results = function(objectClass){

    var imagesCount = objectClass.elementNums[1] + objectClass.elementNums[2] + objectClass.elementNums[4];

    andiBar.updateResultsSummary("Images Found: "+imagesCount);

    //Create Image contained by html (number of image links and image buttons)
    var resultsDetails = "";

    resultsDetails += objectClass.elementNums[1] + " inline images, ";
    resultsDetails += objectClass.elementNums[5] + " image links, ";
    resultsDetails += objectClass.elementNums[6] + " image buttons, ";
    resultsDetails += objectClass.elementNums[4] + " font icons, ";
    resultsDetails += objectClass.elementNums[2]+ " background-images";

    $("#ANDI508-additionalPageResults").append("<p tabindex='0'>"+resultsDetails+"</p>");

    //Add Module Mode Buttons
    var moduleActionButtons = "";

    moduleActionButtons += "<button id='ANDI508-fadeInlineImages-button' aria-label='Hide "+objectClass.elementNums[1]+" Inline Images' aria-pressed='false'>hide "+objectClass.elementNums[1]+" inline</button>";
    moduleActionButtons += "<button id='ANDI508-highlightDecorativeImages-button' aria-label='Highlight "+objectClass.elementNums[3]+" Decorative Inline Images' aria-pressed='false'>"+objectClass.elementNums[3]+" decorative inline"+findIcon+"</button>";
    moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> ";
    moduleActionButtons += "<button id='ANDI508-removeBackgroundImages-button' aria-label='Hide "+objectClass.elementNums[2]+" Background Images' aria-pressed='false'>hide "+objectClass.elementNums[2]+" background</button>";
    moduleActionButtons += "<button id='ANDI508-highlightBackgroundImages-button' aria-label='Highlight "+objectClass.elementNums[2]+" Background Images' aria-pressed='false'>find "+objectClass.elementNums[2]+" background"+findIcon+"</button>";
    moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> ";
    moduleActionButtons += "<button id='ANDI508-highlightFontIcons-button' aria-label='Find "+objectClass.elementNums[4]+" Font Icons' aria-pressed='false'>"+objectClass.elementNums[4]+" font icons</button>";

    $("#ANDI508-module-actions").html(moduleActionButtons);

    //Define fadeInlineImages button
    $("#ANDI508-fadeInlineImages-button").click(function(){
        //This button will change the image's opacity to almost zero
        if($(this).attr("aria-pressed")=="false"){
            $(this).attr("aria-pressed","true").addClass("ANDI508-module-action-active");
            $("#ANDI508-testPage").addClass("gANDI508-fadeInline");
            AndiModule.activeActionButtons.fadeInlineImages = true;
        }
        else{
            $(this).attr("aria-pressed","false").removeClass("ANDI508-module-action-active");
            $("#ANDI508-testPage").removeClass("gANDI508-fadeInline");
            AndiModule.activeActionButtons.fadeInlineImages = false;
        }
        andiResetter.resizeHeights();
        return false;
    });

    //Define Remove removeBackgroundImages button
    $("#ANDI508-removeBackgroundImages-button").click(function(){
        if($(this).attr("aria-pressed")=="false"){
            $(this).attr("aria-pressed","true").addClass("ANDI508-module-action-active");
            $("#ANDI508-testPage").addClass("gANDI508-hideBackground");
            AndiModule.activeActionButtons.removeBackgroundImages = true;
        }
        else{
            $(this).attr("aria-pressed","false").removeClass("ANDI508-module-action-active");
            $("#ANDI508-testPage").removeClass("gANDI508-hideBackground");
            AndiModule.activeActionButtons.removeBackgroundImages = false;
        }
        andiResetter.resizeHeights();
        return false;
    });

    //Define highlightBackgroundImages button
    $("#ANDI508-highlightBackgroundImages-button").click(function(){
        if($(this).attr("aria-pressed")=="false"){
            andiOverlay.overlayButton_on("find",$(this));
            $("#ANDI508-testPage").addClass("gANDI508-highlightBackground");
            AndiModule.activeActionButtons.highlightBackgroundImages = true;
        }
        else{
            andiOverlay.overlayButton_off("find",$(this));
            $("#ANDI508-testPage").removeClass("gANDI508-highlightBackground");
            AndiModule.activeActionButtons.highlightBackgroundImages = false;
        }
        andiResetter.resizeHeights();
        return false;
    });

    //Define highlightDecorativeImages button
    $("#ANDI508-highlightDecorativeImages-button").click(function(){
        if($(this).attr("aria-pressed")=="false"){
            andiOverlay.overlayButton_on("find",$(this));
            $("#ANDI508-testPage").addClass("gANDI508-highlightDecorative");
            AndiModule.activeActionButtons.highlightDecorativeImages = true;
        }
        else{
            andiOverlay.overlayButton_off("find",$(this));
            $("#ANDI508-testPage").removeClass("gANDI508-highlightDecorative");
            AndiModule.activeActionButtons.highlightDecorativeImages = false;
        }
        andiResetter.resizeHeights();
        return false;
    });

    //Define highlightFontIcons button
    $("#ANDI508-highlightFontIcons-button").click(function(){
        if($(this).attr("aria-pressed")=="false"){
            andiOverlay.overlayButton_on("find",$(this));
            $("#ANDI508-testPage").addClass("gANDI508-highlightFontIcon");
            AndiModule.activeActionButtons.highlightFontIcons = true;
        }
        else{
            andiOverlay.overlayButton_off("find",$(this));
            $("#ANDI508-testPage").removeClass("gANDI508-highlightFontIcon");
            AndiModule.activeActionButtons.highlightFontIcons = false;
        }
        andiResetter.resizeHeights();
        return false;
    });

    andiBar.showElementControls();
    if(!andiBar.focusIsOnInspectableElement())
        startUpSummaryText += "Discover accessibility markup for inline <span class='ANDI508-module-name-g'>graphics/images</span> by hovering over the highlighted elements or pressing the next/previous element buttons. ";

    startUpSummaryText += "Ensure that every meaningful/non-decorative image has a text equivalent.";
    andiBar.showStartUpSummary(startUpSummaryText, true);

    AndiModule.engageActiveActionButtons([
        "fadeInlineImages",
        "removeBackgroundImages",
        "highlightBackgroundImages",
        "highlightDecorativeImages",
        "highlightFontIcons"
    ]);

    andiAlerter.updateAlertList();

    $("#ANDI508").focus();
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
    if($(element).hasClass("ANDI508-element")){
        andiBar.prepareActiveElementInspection(element);

        //format background-image
        var bgImgUrl = $(element).css("background-image");
        if(bgImgUrl.slice(0, 4) === "url(")
            bgImgUrl = bgImgUrl.slice(5, -2); //remove 'url("' and '")'
        else
            bgImgUrl = "";

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData,
            [
                "longdesc",
                "ismap",
                "usemap",
                ["background-image", bgImgUrl]
            ]);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    }
};

//This function will analyze the alt text
function altTextAnalysis(altText){
    var regEx_redundantPhrase = /(image of|photo of|picture of|graphic of|photograph of)/g;
    var regEx_fileTypeExt = /\.(png|jpg|jpeg|gif|pdf|doc|docx|svg)$/g;
    var regEx_nonDescAlt = /^(photo|photograph|picture|graphic|logo|icon|graph|image)$/g;

    if(altText !== ""){
        altText = altText.toLowerCase();
        //check for redundant phrase in alt text
        if(regEx_redundantPhrase.test(altText)){
            //redundant phrase in alt text
            andiAlerter.throwAlert(alert_0174);
        }
        //Check for filename in alt text
        else if(regEx_fileTypeExt.test(altText)){
            //file name in alt text
            andiAlerter.throwAlert(alert_0175);
        }
        //Check for non-descriptive alt text
        else if(regEx_nonDescAlt.test(altText)){
            //non-descriptive alt text
            andiAlerter.throwAlert(alert_0176);
        }
    }
}

// This is where the code that I added starts because there is little room to add code
// after this point in the original code.
//This object class is used to store data about each graphic. Object instances will be placed into an array.
function Image(element, index, rowClass) {
    this.element      = element;
    this.index        = index;
    this.columnValues = [element, index];
    this.rowClass     = rowClass;
}

//This object class is used to keep track of the graphics on the page
function Images() {
    this.list           = [];
    this.elementNums    = [];
    this.elementStrings = [];
    this.count          = 0;
    this.index          = 1;
    this.columnNames    = ["element", "index"];
}

// This object class is used to keep track of the table information
function TableInfo() {
    this.tableMode = "Images";
    this.cssProperties = [];
    this.buttonTextList = [];
}

gANDI.images = new Images();
gANDI.tableInfo = new TableInfo();

gANDI.analyze(gANDI.images);
//gANDI.results(gANDI.images);
andiBar.results(gANDI.images, gANDI.tableInfo, [], startUpSummaryText);

}//end init
