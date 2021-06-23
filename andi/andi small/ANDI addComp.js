// This is the addComp function that is used in other areas of the code
// NOTE: This is missing addLaserTarget, because it is not necessary to be used
AndiData.addComp = function (data, componentType, component, hasNodebeenTraversed) {
	var displayText = "";

	if (typeof component === "string") {
		if ($.trim(component) !== "") {
			displayText = "<span class='ANDI508-display-" + componentType + "'>" +
				andiCheck.checkCharacterLimit(component, componentType) + "</span>";
		}
	} else {//component is an array [text, refElement, id]
		if ($.trim(component[0]) !== "" || component[2]) { //add the text
			displayText = "<span class='ANDI508-display-" + componentType + "'>";
			if (component[2]) {  //add the referenced id
				displayText += "<span class='ANDI508-display-id'>#" + component[2] + "</span>";
			}

			displayText += "</span>";
		}
	}

	if (displayText) {
		if (componentType === "ariaLabelledby" || componentType === "ariaDescribedby") {
			if (data[componentType]) {
				data[componentType].push(displayText);//push to array
			} else {
				data[componentType] = [displayText];//create array
			}
		} else {//do not create an array
			if (data[componentType]) {
				data[componentType] += displayText;//append
			} else {
				data[componentType] = displayText;//create
			}
		}
	}

	//if node is traversed return empty string, otherwise return displayText
	return (!hasNodebeenTraversed) ? displayText : "";
};