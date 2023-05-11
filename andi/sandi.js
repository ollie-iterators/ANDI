//==========================================//
//sANDI: live regions ANDI                  //
//Created By Social Security Administration //
//==========================================//
function init_module(){

var sANDIVersionNumber = "4.3.0";

//create sANDI instance
var sANDI = new AndiModule(sANDIVersionNumber,"s");

var langAttributesCount = 0;
var roleAttributesCount = 0;

AndiModule.initActiveActionButtons({
	readingOrder:false,
	roleAttributes:false,
	langAttributes:false
});

//This function will analyze the test page for graphics/image related markup relating to accessibility
sANDI.analyze = function(objectClass){

	//Loop through every visible element
	$(TestPageData.allElements).each(function(){
		if($(this).isSemantically(["alert","status","log","marquee","timer"],"[aria-live=polite],[aria-live=assertive]")){
			//Add to the live regions array
			objectClass.list.push(new LiveRegion(this, objectClass.index, ''));

            andiData = new AndiData(this);

            if($(this).isContainerElement()){
                var innerText = andiUtility.getVisibleInnerText(this);
                if(innerText){
                    //For live regions, screen readers only use the innerText
                    //override the accName to just the innerText
                    andiData.accName = "<span class='ANDI508-display-innerText'>"+innerText+"</span>";
                }
                else{//no visible innerText
                    andiAlerter.throwAlert(alert_0133);
                    andiData.accName = "";
                }
                //accDesc should not appear in output
                delete andiData.accDesc;
            }
            else//not a container element
                andiAlerter.throwAlert(alert_0184);
            if($(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length)
                andiAlerter.throwAlert(alert_0182);
            AndiData.attachDataToElement(this);
		}

		//For all elements on the page
		if($.trim($(this).attr("role")))
			roleAttributesCount++;
		if($.trim($(this).prop("lang")))
			langAttributesCount++;
	});
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
sANDI.results = function(objectClass){

	var moduleActionButtons = "";

	moduleActionButtons += "<button id='ANDI508-readingOrder-button' aria-pressed='false'>reading order"+overlayIcon+"</button>";

	var moreDetails = "<button id='ANDI508-pageTitle-button'>page title</button>"+
		"<button id='ANDI508-pageLanguage-button'>page language</button>"+
		"<button id='ANDI508-roleAttributes-button' aria-pressed='false' aria-label='"+roleAttributesCount+" Role Attributes'>"+roleAttributesCount+" role attributes"+overlayIcon+"</button>"+
		"<button id='ANDI508-langAttributes-button' aria-pressed='false' aria-label='"+langAttributesCount+" Lang Attributes'>"+langAttributesCount+" lang attributes"+overlayIcon+"</button>";

	moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

	$("#ANDI508-module-actions").html(moduleActionButtons);

	andiBar.initializeModuleActionGroups();

	//Define readingOrder button functionality
	$("#ANDI508-readingOrder-button").click(function(){
		if($(this).attr("aria-pressed") == "false"){
			andiOverlay.overlayButton_on("overlay",$(this));
			andiOverlay.overlayReadingOrder();
			AndiModule.activeActionButtons.readingOrder = true;
		}
		else{
			andiOverlay.overlayButton_off("overlay",$(this));
			andiOverlay.removeOverlay("ANDI508-overlay-readingOrder");
			AndiModule.activeActionButtons.readingOrder = false;
		}
		andiResetter.resizeHeights();
		return false;
	});

	//Define the lang attributes button
	$("#ANDI508-langAttributes-button").click(function(){
		if($(this).attr("aria-pressed") == "false"){
			andiOverlay.overlayButton_on("overlay",$(this));

			var langOverlayText = "";
			var overlayObject;
			var langOfPartsCount = 0;
			$("#ANDI508-testPage [lang]").filter(":visible").each(function(){
				if($(this).prop("lang").trim() != ""){
					langOverlayText = $(this).prop("tagName").toLowerCase()+" lang="+$(this).prop("lang");
					overlayObject = andiOverlay.createOverlay("ANDI508-overlay-langAttributes", langOverlayText);
					andiOverlay.insertAssociatedOverlay(this, overlayObject);
					langOfPartsCount++;
				}
			});

			AndiModule.activeActionButtons.langAttributes = true;
		}
		else{
			andiOverlay.overlayButton_off("overlay",$(this));
			andiOverlay.removeOverlay("ANDI508-overlay-langAttributes");
			AndiModule.activeActionButtons.langAttributes = false;
		}
		andiResetter.resizeHeights();

		return false;
	});

	//Define the lang attributes button
	$("#ANDI508-roleAttributes-button").click(function(){
		if($(this).attr("aria-pressed") == "false"){
			andiOverlay.overlayButton_on("overlay",$(this));

			var langOverlayText = "";
			var overlayObject, role;
			$("#ANDI508-testPage [role]:not('.ANDI508-overlay')").filter(":visible").each(function(){
				role = $.trim($(this).attr("role")).toLowerCase();
				if(role){ //if role is not empty
					langOverlayText = $(this).prop("tagName").toLowerCase()+" role="+role;
					overlayObject = andiOverlay.createOverlay("ANDI508-overlay-roleAttributes", langOverlayText);
					andiOverlay.insertAssociatedOverlay(this, overlayObject);
				}
			});

			AndiModule.activeActionButtons.roleAttributes = true;
		}
		else{
			andiOverlay.overlayButton_off("overlay",$(this));
			andiOverlay.removeOverlay("ANDI508-overlay-roleAttributes");
			AndiModule.activeActionButtons.roleAttributes = false;
		}
		andiResetter.resizeHeights();
		return false;
	});

	//Define the page title button
	$("#ANDI508-pageTitle-button").click(function(){
		andiOverlay.overlayButton_on("overlay",$(this));
		if(document.title)
			alert("The page title is: "+document.title);
		else
			alert("There is no page title.");
		andiOverlay.overlayButton_off("overlay",$(this));
	});

	//Define the page language button
	$("#ANDI508-pageLanguage-button").click(function(){
		andiOverlay.overlayButton_on("overlay",$(this));
		//get the lang attribute from the HTML element
		var htmlLangAttribute = $.trim($("html").first().prop("lang"));
		//pop up the lang value of the HTML element
		if(htmlLangAttribute)
			alert("The <html> element has a lang attribute value of: "+htmlLangAttribute+".");
		else
			alert("The <html> element does not have a lang attribute.");
		andiOverlay.overlayButton_off("overlay",$(this));
	});

	//Deselect all mode buttons
	$("#ANDI508-module-actions button.sANDI508-mode").attr("aria-selected","false");

    //LIVE REGIONS
    $("#ANDI508-liveRegions-button")
        .attr("aria-selected","true")
        .addClass("ANDI508-module-action-active");
    //No outline for liveRegions mode
    andiBar.updateResultsSummary("Live Regions: "+objectClass.list.length);
    if(!andiBar.focusIsOnInspectableElement()){
        andiBar.showElementControls();
        andiBar.showStartUpSummary("<span class='ANDI508-module-name-s'>Live regions</span> found.<br />Discover the Output of the <span class='ANDI508-module-name-s'>live regions</span> by hovering over the highlighted areas or using the next/previous buttons. For updated Output, refresh ANDI whenever the Live Region changes.",true);
    }

	andiAlerter.updateAlertList();

	AndiModule.engageActiveActionButtons([
		"readingOrder",
		"roleAttributes",
		"langAttributes"
	]);

	$("#ANDI508").focus();

};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
	if($(element).hasClass("ANDI508-element")){
		andiBar.prepareActiveElementInspection(element);

		var elementData = $(element).data("andi508");

		var addOnProps = AndiData.getAddOnProps(element, elementData,
			[
				"aria-level",
				getDefault_ariaLive(element, elementData),
				getDefault_ariaAtomic(element, elementData),
				"aria-busy",
				"aria-relevant"
			]);

		andiBar.displayTable(elementData, element, addOnProps);

        //Copy from the AC table
        var innerText = $("#ANDI508-accessibleComponentsTable td.ANDI508-display-innerText").first().html();
        if(innerText){
            elementData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
        }

		andiBar.displayOutput(elementData, element, addOnProps);
	}

	//This function assumes the default values of aria-live based on the element's role as defined by spec
	function getDefault_ariaLive(element, elementData){
		var val = $.trim($(element).attr("aria-live"));
		if(!val){
			if(elementData.role === "alert")
				val = "assertive";
			else if(elementData.role === "log" || elementData.role === "status")
				val = "polite";
			else if(elementData.role === "marquee" || elementData.role === "timer")
				val = "off";
			else return; //no default
		}
		return ["aria-live", val];
	}

	//This function assumes the default values of aria-atomic based on the element's role as defined by spec
	function getDefault_ariaAtomic(element, elementData){
		var val = $.trim($(element).attr("aria-atomic"));
		if(!val){
			if(elementData.role === "alert" || elementData.role === "status")
				val = "true";
			else if(elementData.role === "log" || elementData.role === "marquee" || elementData.role === "timer")
				val = "false";
			else return; //no default
		}
		return ["aria-atomic", val];
	}
};

//This function will overlay the reading order sequence.
AndiOverlay.prototype.overlayReadingOrder = function(){
	//Elements that should be excluded from the scan, hidden elements will automatically be filtered out
	var exclusions = "option,script,style,noscript";
	//Elements that should be included in the scan even if they don't have innerText
	var inclusions = "select,input,textarea";

	var readingSequence = 0;
	var overlayObject;

	traverseReadingOrder(document.getElementById("ANDI508-testPage"));

	//This recursive function traverses the dom tree and inserts the reading order overlay
	//It distinguishes between element nodes and text nodes
	//It will check for aria-hidden=true (with inheritance)
	function traverseReadingOrder(element, ariaHidden){

		//Check for aria-hidden=true
		ariaHidden = (ariaHidden || $(element).attr("aria-hidden") === "true") ? true : false;

		for(var z=0; z<element.childNodes.length; z++){

			//if child is an element object that is visible
			if(element.childNodes[z].nodeType === 1){
				if(!$(element.childNodes[z]).is(exclusions) && $(element.childNodes[z]).is(":shown")){
					if($(element.childNodes[z]).is(inclusions)){//no need to look at this element's childNodes
						insertReadingOrder(ariaHidden, element.childNodes[z]);
						z++;//because a new node was inserted, the indexes changed
					}
					else{//recursion here:
						traverseReadingOrder(element.childNodes[z], ariaHidden);
					}
				}
			}
			//else if child is a text node
			else if(element.childNodes[z].nodeType === 3){
				if($.trim(element.childNodes[z].nodeValue) !== ""){
					//Found some text
					insertReadingOrder(ariaHidden, element.childNodes[z]);
					z++;//because a new node was inserted, the indexes changed
				}
			}
		}

		//this function inserts the reading order overlay
		//if it's hidden using aria-hidden it will insert an alert overlay
		function insertReadingOrder(ariaHidden, node){
			if(ariaHidden){
				overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-readingOrder", "X", "hidden from screen reader using aria-hidden=true");
			}
			else{
				readingSequence++;
				overlayObject = andiOverlay.createOverlay("ANDI508-overlay-readingOrder", readingSequence);
			}
			andiOverlay.insertAssociatedOverlay(node, overlayObject);
		}
	}
};

//This object class is used to store data about each live region. Object instances will be placed into an array.
function LiveRegion(element, index, rowClass) {
    this.element      = element;
    this.index        = index;
    this.columnValues = [element, index];
    this.rowClass     = rowClass;
}

//This object class is used to keep track of the live regions on the page
function LiveRegions() {
    this.list        = [];
    this.count       = 0;
    this.index       = 1;
    this.columnNames = ["element", "index"];
}

sANDI.liveRegions = new LiveRegions();

sANDI.analyze(sANDI.liveRegions);
sANDI.results(sANDI.liveRegions);

}//end init
