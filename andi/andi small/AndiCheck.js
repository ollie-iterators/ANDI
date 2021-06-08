//This object sets up the check logic to determine if an alert should be thrown.
function AndiCheck(){
	//==Mult-Point Checks==//

	//This function is used to check for alerts related to focusable elements
	this.commonFocusableElementChecks = function(andiData, element){
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData, true);
		this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAnyMisspelledAria(element);
		this.areThereAnyDuplicateFors(element, andiData);
		this.areThereAnyTroublesomeJavascriptEvents(element);
		this.clickableAreaCheck(element, andiData);
	};

	//This function is used to check for alerts related to non-focusable elements
	this.commonNonFocusableElementChecks = function(andiData, element, isElementMustHaveName){
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData);
		if(isElementMustHaveName)
			this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAnyMisspelledAria(element);
	};

	//==Test Page Checks==//

	//This function will count the number of visible fieldset/figure/table tags and compare to the number of legend/figcaption/caption tags
	//If there are more parents than children, it will generate an alert with the message and the counts.
	//Note: The function does not test whether the children are actually contained within the parents, it's strictly concerned with the counts.
	//More children than parents might mean a parent is missing or the child tag isn't being used properly.
	//It will also set the booleans page_using_fieldset, page_using_figure to true if found, which will be used elsewhere for performance enhancements
	this.areThereMoreExclusiveChildrenThanParents = function(){
		var children, parents;

		//legend/fieldset
		parents = $(TestPageData.allElements).filter("fieldset").length*1; //*1 ensures that the var will be a number
		children = $(TestPageData.allElements).filter("legend").length*1; //*1 ensures that the var will be a number
		if(children > parents) {
			alert = [alert_0074,[children, parents],0];
		}
		if(parents>0) {
			testPageData.page_using_fieldset = true;
		}
		
		//figcaption/figure
		parents = $(TestPageData.allElements).filter("figure").length*1; //*1 ensures that the var will be a number
		children = $(TestPageData.allElements).filter("figcaption").length*1; //*1 ensures that the var will be a number
		if(children > parents) {
			alert = [alert_0075,[children, parents],0];
		}
		if(parents>0) {
			testPageData.page_using_figure = true;
		}

		//caption/table
		if(TestPageData.page_using_table){
			parents = $(TestPageData.allElements).filter("table").length*1; //*1 ensures that the var will be a number
			children = $(TestPageData.allElements).filter("caption").length*1; //*1 ensures that the var will be a number
			if(children) {
				TestPageData.page_using_caption = true;
			}
			if(children > parents) {
				alert = [alert_0076,[children, parents],0];
			}
		}
	};

	//This function checks to see if there is only one page <title> tag within the head
	//If none, empty, or more than one, it will generate an alert.
	//It also looks at document.title
	this.isThereExactlyOnePageTitle = function(){
		var pageTitleCount = $("head title").length;
		if(document.title === ""){ //check document.title because could have been set by javascript
			if(pageTitleCount === 0)
				alert = [alert_0072,alert_0072.message,0];
			else if(pageTitleCount === 1 && $.trim($("head title").text()) === "")
				alert = [alert_0071,alert_0071.message,0];
		}
		else if(pageTitleCount > 1)
			alert = [alert_0073,alert_0073.message,0];
	};

	//==Element Checks==//

	//This function resets the accessibleComponentsTable
	//returns true if components were found that should appear in the accessibleComponentsTable
	this.wereComponentsFound = function(isTabbable, accessibleComponentsTableBody){
		//calculate total
		var total = $(accessibleComponentsTableBody).find("tr").length;
		//Display total
		$("#ANDI508-accessibleComponentsTotal").html(total);

		if(total === 0){//No components. Display message in table
			var alertLevel = "danger"; //tabbable elements with no components, default to red
			if(!isTabbable)
				alertLevel = "caution"; //non-tabbable elements with no components, default to yellow
			$(accessibleComponentsTableBody).html(
				"<tr><th id='ANDI508-accessibleComponentsTable-noData' class='ANDI508-display-"+
				alertLevel+"'>No accessibility markup found for this Element.</th></tr>");
		}
	};

	//This function will throw No Accessible Name alert depending on the tagName passed
	this.wasAccessibleNameFound = function(elementData){
		if(!elementData.isAriaHidden){ //element is not aria-hidden=true and not contained by aria-hidden=true
			var tagNameText = elementData.tagNameText;
			if(!elementData.accName){

				if(elementData.components.ariaDescribedby)
					//element has no name but has ariaDescribedby
					alert = [alert_0021];
				else { //throw No Accessible Name Alert
					if(tagNameText === "iframe"){
						if(elementData.tabindex)
							alert = [alert_0007];
						else//no tabindex
							alert = [alert_0009];
					}
					else if(elementData.isTabbable){
						//Does this element have a role?
						if(elementData.role){
							var roleCapitalized = elementData.role.charAt(0).toUpperCase()+elementData.role.slice(1);
							alert = [alert_0008, roleCapitalized+" Element"+alert_0008.message];
						}
						//Is this an input element, excluding input[image]?
						else if(tagNameText.includes("input") && tagNameText != "input[type=image]"){
							switch(tagNameText){
							case "input[type=text]":
								alert = [alert_0001, "Textbox"+alert_0001.message];
								break;
							case "input[type=radio]":
								alert = [alert_0001, "Radio Button"+alert_0001.message];
								break;
							case "input[type=checkbox]":
								alert = [alert_0001, "Checkbox"+alert_0001.message];
								break;
							default:
								alert = [alert_0001, "Input Element"+alert_0001.message];
							}
						}
						//All other elements:
						else switch(tagNameText){
							case "a":
								alert = [alert_0002, "Link"+alert_0002.message];
								break;
							case "img":
							case "input[type=image]":
								alert = [alert_0003, "Image"+alert_0003.message];
								break;
							case "button":
								alert = [alert_0002, "Button"+alert_0002.message];
								break;
							case "select":
								alert = [alert_0001, "Select"+alert_0001.message];
								break;
							case "textarea":
								alert = [alert_0001, "Textarea"+alert_0001.message];
								break;
							case "table":
								alert = [alert_0004, alert_0004.message];
								break;
							case "figure":
								alert = [alert_0005, alert_0005.message];
								break;
							case "th":
							case "td":
								alert = [alert_0002, "Table Cell"+alert_0002.message];
								break;
							case "canvas":
								alert = [alert_0008, "Canvas"+alert_0008.message];
								break;
							default:
								alert = [alert_0002, "Element"+alert_0002.message];
						}
					}
					else{//not tabbable
						//Does this element have a role?
						if(elementData.role === "img"){
							alert = [alert_0008, "[role=img] Element"+alert_0008.message];
						}
						else{
							switch(tagNameText){
							case "img":
							case "input[type=image]":
								if(!elementData.role) alert = [alert_0003, "Image"+alert_0003.message];
								break;
							case "canvas":
								alert = [alert_0008, "Canvas"+alert_0008.message];
								break;
							}
						}
					}
				}

				if(elementData.components.legend)
					//element has no name but has legend
					alert = [alert_0022];
			}
		}
	};

	//This function will search the test page for elements with duplicate ids.
	//If found, it will generate an alert
	//TODO: add this check when these components are detected: aria-activedescendant,aria-colcount,aria-colindex,aria-colspan,aria-controls,aria-details,aria-errormessage,aria-flowto,aria-owns,aria-posinset,aria-rowcount,aria-rowindex,aria-rowspan,aria-setsize
	this.areThereAnyDuplicateIds = function(component, id){
		if(id && testPageData.allIds.length > 1){
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (var x=0; x<testPageData.allIds.length; x++){
				if(id === testPageData.allIds[x].id){
					idMatchesFound++;
					if(idMatchesFound === 2) break; //duplicate found so stop searching, for performance
				}
			}
			if(idMatchesFound > 1){//Duplicate Found
				var message = "";
				if(component === "label[for]") //label[for]
					message = "Element has duplicate id [id="+id+"] and is referenced by a &lt;label[for]&gt;";
				else //anything else
					message = "["+component+"] is referencing a duplicate id [id="+id+"]";
				alert = [alert_0011, [message]];
			}
		}
	};

	//This function will search the html body for labels with duplicate 'for' attributes
	//If found, it will throw alert_0012 with a link pointing to the ANDI highlighted element with the matching id.
	this.areThereAnyDuplicateFors = function(element, data){
		if(testPageData.page_using_label && data.components.label){
			var id = $.trim($(element).prop("id"));
			if(id && testPageData.allFors.length > 1){
				var forMatchesFound = 0;
				for(var x=0; x<testPageData.allFors.length; x++){
					if(id === $.trim($(testPageData.allFors[x]).attr("for"))){
						forMatchesFound++;
						if(forMatchesFound == 2) break; //duplicate found so stop searching, for performance
					}
				}
				if(forMatchesFound > 1) //Duplicate Found
					alert = [alert_0012,[id,id]];
			}
		}
	};

	//This function goes through the LabelFor array and checks if is pointing to valid form element
	this.areLabelForValid = function(){
		if(testPageData.page_using_label){
			var referencedElement;
			for(var f=0; f<testPageData.allFors.length; f++){
				referencedElement = document.getElementById(testPageData.allFors[f].htmlFor);
				if(referencedElement && $(referencedElement).hasClass("ANDI508-element")){
					if(!$(referencedElement).isSemantically("[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio]","input,select,textarea,button,[contenteditable=true],[contenteditable='']"))
						//is not a form element
						andiAlerter.throwAlertOnOtherElement($(referencedElement).attr("data-andi508-index"), alert_0091);
				}
			}
		}
	};

	//This function will throw alert_0112 if commonly troublesome Javascript events are found on the element.
	this.areThereAnyTroublesomeJavascriptEvents = function(element){
		var events = "";
		if($(element).is("[onblur]"))
			events += "[onBlur] ";
		if($(element).is("input,select,textarea") && $(element).is("[onchange]"))
			events += "[onChange] ";
		if($(element).is("[ondblclick]"))
			events += "[ondblclick] ";
		if(events !== "")
			alert = [alert_0112,[$.trim(events)]];
	};

	//This function will check the clickable area of the element.
	this.clickableAreaCheck = function(element, andiData){
		if(!andiData.components.label && $(element).is("input[type=checkbox],input[type=radio]")){
			//the element is a radio button or checkbox and does not have an associated label
			var height = $(element).height();
			var width = $(element).width();
			var clickableAreaLimit = 21; //px
			if(height < clickableAreaLimit && width < clickableAreaLimit){
				//The height and with of the element is smaller than the clickableAreaLimit
				if(andiData.tagNameText == "input[type=radio]")
					alert = [alert_0210,["radio button"]];
				else if(andiData.tagNameText == "input[type=checkbox]")
					alert = [alert_0210,["checkbox"]];
			}
		}
	};

	//This function will search for misspelled aria attributes and throw an alert if found.
	this.areThereAnyMisspelledAria = function(element){
		if($(element).is("[aria-role]"))
			alert = [alert_0032];

		if($(element).is("[aria-labeledby]"))
			alert = [alert_0031];
	};

	//This function will throw alert_0260 or alert_0261
	//if the element has aria-hidden=true or is a child of an element with aria-hidden=true
	//NOTE: role=presentation/none are not factored in here
	//      because browsers automatically ignore them if the element is focusable
	this.hasThisElementBeenHiddenFromScreenReader = function(element, elementData, isDangerous){
		if(elementData.isAriaHidden){
			if(isDangerous) //this type of element should not be hidden from screen reader
				alert = [alert_0260]; //danger level alert
			else //this type of element could be hidden by a screen reader, but tester should investigate
				alert = [alert_0261]; //warning level alert
		}
	};

	//This function will increment the testPageData.disabledElementsCount
	//Returns true if the element is disabled
	this.isThisElementDisabled = function(element){
		if(element.disabled){
			//if the element has aria-hidden=true, assume intentiality behind making this element disabled. Therefore don't complain about this element's disabled state.
			if($(element).attr("aria-hidden") !== "true"){
				testPageData.disabledElementsCount++;
				return true;
			}
		}
		return false;
	};

	//This function will throw alert_0250 if there are disabled elements
	this.areThereDisabledElements = function(type){
		if(testPageData.disabledElementsCount > 0)
			alert = [alert_0250,[testPageData.disabledElementsCount, type],0];
	};

	//This function will throw an alert if the canvas has no focusable children
	this.lookForCanvasFallback = function(element){
		if($(element).is("canvas")){
			if(!$(element).children().filter(":focusable").length)
				alert = [alert_0124];
			else //has focusable fallback content
				alert = [alert_0127];
		}
	};

	//This function will scan for deprecated HTML relating to accessibility associated with the element
	this.detectDeprecatedHTML = function(element){
		if(document.doctype !== null && document.doctype.name == "html" && !document.doctype.publicId && !document.doctype.systemId){
			var message;
			if($(element).is("table") && $(element).attr("summary")){
				var role = $(element).attr("role");
				if(role !== "presentation" && role !== "none")
					message = ["attribute [summary] in &lt;table&gt;, use &lt;caption&gt; or [aria-label] instead"];
			}
			else if($(element).is("a") && $(element).attr("name"))
				message = ["attribute [name] in &lt;a&gt;, use [id] instead"];
			else if($(element).is("td") && $(element).attr("scope"))
				message = ["attribute [scope] on &lt;td&gt;, in HTML5 [scope] only valid on &lt;th&gt;"];

			if(message){
				if($(element).hasClass("ANDI508-element"))
					alert = [alert_0078,message];
				else
					alert = [alert_0078,message,0];
			}
		}
	};

	//==Component Quality Checks==//

	//this function will throw an alert if there are missingReferences
	this.areThereMissingReferences = function(attribute, missingReferences){
		//Check if any ids were not found
		if(missingReferences.length === 1){//one reference is missing
			alert = [alert_0063, [attribute, missingReferences]];
		}
		else if(missingReferences.length > 1){//more than one reference missing
			alert = [alert_0065, [attribute, missingReferences]];
		}
	};

	//This function will throw alert_0101
	this.areThereComponentsThatShouldntBeCombined = function(data){
		if(data.components.ariaLabel && data.components.ariaLabelledby)
			alert = [alert_0101,["[aria-label] with [aria-labelledby]"]];
	};

	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//If the limit was exceeded, it will insert a scissors unicode
	this.checkCharacterLimit = function(componentText, componentName){
		if( componentText &&
			(componentName === "ariaLabel" || componentName === "title" || componentName === "alt") &&
			componentText.length > AndiCheck.characterLimiter
		){
			if(componentName === "ariaLabel")
				componentName = "aria-label";
			alert = [alert_0151,[componentName]];
			return insertCharacterLimitMark(componentText);
		}
		return componentText;

		//This function inserts a pipe character into the componentText at the characterLimiter position
		//The color of the pipe is the color of a warning
		function insertCharacterLimitMark(componentText){//inject scissors unicode
			return andiUtility.formatForHtml(componentText.substring(0, AndiCheck.characterLimiter)) +
				"<span class='ANDI508-display-warning'>&hellip;&#9986;&hellip;</span>" +
				andiUtility.formatForHtml(componentText.substring(AndiCheck.characterLimiter,componentText.length));
		}
	};
}