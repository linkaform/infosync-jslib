
/* LKF Utils */
function getAllElementsWithAttribute(rootNode, attribute, value){
	var matchingElements = [];
	var allElements = document.getElementsByTagName('*');
	for (var i = 0, n = allElements.length; i < n; i++){
		if (allElements[i].getAttribute(attribute) !== null &&
			allElements[i].getAttribute(attribute) === value){
			matchingElements.push(allElements[i]);
		}
	}
	return matchingElements;
}

function urlParamstoJson() {
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]], pair[1] ];
			query_string[pair[0]] = arr;
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	}
	return query_string;
};

function setValuesCatalog(data = [], key = null){
	let selectId = document.getElementById(key);
	if(selectId){
		data.forEach(element => {
		    let newOption = document.createElement('option');
		    newOption.value = element.key;
		    newOption.textContent = element.key;
		    selectId.appendChild(newOption);
		});
	}
}

function getCatalogRequest(id = null, catalogKey= null, formId = null ){
	let urlLinkaform = 'https://app.linkaform.com/api/infosync/catalog/view/';
	if(id != null && id != '' && formId != null && formId != ''){
		fetch(urlLinkaform, {
			method: 'POST',
			body: JSON.stringify({
				catalog_id: Number(id),
				form_id: Number(formId),
				is_edition: false,
				options: {'endkey':[],'group_level':1,'startkey':[]},
				parent_catalog_id:null
			}),
			headers:{
				'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(res => {
			if (res.rows) {
				setValuesCatalog(res.rows, catalogKey)
			}   
		})
	}
}

function setCatalog(){
	const formId = document.getElementById('infosyncFormID').value;
	const elementsCatalog = document.querySelectorAll('.list-catalogs-input');
	const elementsArray = Array.from(elementsCatalog);
	if(elementsArray.length > 0 ){
		elementsArray.forEach(element => {
			let catalogValues = element.value;
			let values = catalogValues.split('|');
			let [catalogId, catalogKey] = values;
			getCatalogRequest(catalogId, catalogKey, formId)
		});
	}
}

/* Infosync */
window.infosync = (function() {
	function Infosync() {
		this.method = "POST";
		this.post_url = "https://app.linkaform.com/api/infosync/form_answer/";
		this.patch_url = "https://app.linkaform.com/api/infosync/form_answer/patch_record/"
		this.resetDataToSend();
	}

	Infosync.prototype.resetDataToSend = function(){
		this.dataToSend = {
			answers: {},
			form_id: null,
			geolocation: [],
			end_timestamp: undefined,
			start_timestamp: new Date().getTime() / 1000
		};
	};

	Infosync.prototype.sendToInfosync = function(url) {
		var xhr, that;
		that = this;
		xhr = new XMLHttpRequest({mozAnon: true, mozSystem: true});

		xhr.open(this.method, url);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.onreadystatechange = function() {
			if(xhr.status >= 200 && xhr.status < 300) {
				that.onSuccessBase();
			} else {
				that.onError(xhr.response);
			}
		};
		try{
			xhr.send(JSON.stringify(this.dataToSend));
		}catch(err){
			that.onError(xhr.response);
		}
	};

	Infosync.prototype.reset = function(){
		var messageDivArea;
		toggleFieldErrors(false);
		messageDivArea = getMessageArea();
		messageDivArea.remove();
		this.method = "POST";
	};

	Infosync.prototype.send = function() {
		var elementsInForm, listOfAnswersIds, infosyncFormId, i, url;

		this.dataToSend.end_timestamp = new Date().getTime() / 1000;

		elementsInForm = document.getElementById("infosyncForm").elements;
		listOfAnswersIds = getListOfAnswersIds(elementsInForm);

		for(i = 0; i < elementsInForm.length; i++) {
			addAnswerToAnswersDictionary(this.dataToSend.answers, elementsInForm[i], listOfAnswersIds);
		}

		infosyncFormId = document.getElementById("infosyncFormID");
		infosyncRecordId = document.getElementById("infosyncRecordID");

		if(infosyncRecordId !== null && infosyncFormId !== null) {
			this.dataToSend.form_id = Number(infosyncFormId.value);
			url = this.patch_url + infosyncRecordId.value + '/';
			this.method = "PATCH"
			this.sendToInfosync(url);
		}else if(infosyncFormId !== null){
			this.dataToSend.form_id = Number(infosyncFormId.value);
			url = this.post_url
			this.sendToInfosync(url);
		}else {
			throw new Error("No Infosync Form ID specified.");
		}
	};

	Infosync.prototype.post = function() {
		var elementsInForm, listOfAnswersIds, infosyncFormId, i, url;

		this.dataToSend.end_timestamp = new Date().getTime() / 1000;

		elementsInForm = document.getElementById("infosyncForm").elements;
		listOfAnswersIds = getListOfAnswersIds(elementsInForm);

		for(i = 0; i < elementsInForm.length; i++) {
			addAnswerToAnswersDictionary(this.dataToSend.answers, elementsInForm[i], listOfAnswersIds);
		}

		infosyncFormId = document.getElementById("infosyncFormID");

		if(infosyncFormId !== null) {
			this.dataToSend.form_id = Number(infosyncFormId.value);
			url = this.post_url
			this.sendToInfosync(url);
		} else {
			throw new Error("No Infosync Form ID specified.");
		}
	};

	Infosync.prototype.patch = function() {
		var elementsInForm, listOfAnswersIds, infosyncFormId, infosyncRecordId, i;

		this.dataToSend.end_timestamp = new Date().getTime() / 1000;

		elementsInForm = document.getElementById("infosyncForm").elements;
		listOfAnswersIds = getListOfAnswersIds(elementsInForm);

		for(i = 0; i < elementsInForm.length; i++) {
			addAnswerToAnswersDictionary(this.dataToSend.answers, elementsInForm[i], listOfAnswersIds);
		}

		infosyncFormId = document.getElementById("infosyncFormID");
		infosyncRecordId = document.getElementById("infosyncRecordID");

		if(infosyncRecordId !== null) {
			this.dataToSend.form_id = Number(infosyncFormId.value);
			url = this.patch_url + infosyncRecordId.value + '/';
			this.method = "PATCH"
			this.sendToInfosync(url);
		} else {
			throw new Error("No Infosync Form ID specified.");
		}
	};

	Infosync.prototype.onSuccess = function() {
		toggleFieldErrors(false);
		var message = createResultMessage("infosyncSuccessMessage");
		appendToHTML(message, "infosync-success-message");
	};

	Infosync.prototype.onError = function(response) {
		var errorData;
		var message = createResultMessage("infosyncErrorMessage");
		appendToHTML(message, "infosync-error-message");
		if(response){
			try{
				errorData = JSON.parse(response);
				toggleFieldErrors(false);
				toggleFieldErrors(true, errorData);
			} catch(err) {
				console.error('Error: ' + response);
			}
		}
	};

	Infosync.prototype.onSuccessBase = function() {
		this.onSuccess();
		document.getElementById("infosyncForm").reset();
		this.resetDataToSend();
		redirectToUrl();
	};

	function toggleFieldErrors(show, errorData){
		var formNode, errorTags, i, errorTag, fieldId;
		formNode = document.getElementById("infosyncForm");
		if(show){
			for(fieldId in errorData){
				var elements = getAllElementsWithAttribute(formNode, 'data-infosync-id', fieldId);
				var last = elements.pop();
				var p = document.createElement("p");
				p.className = 'infosync-field-error';
				p.innerText = errorData[fieldId].msg.join(',');
				last.parentNode.appendChild(p);
			}
		}else{
			errorTags = formNode.getElementsByClassName("infosync-field-error");
			while(errorTags.length > 0){
				errorTags[0].parentNode.removeChild(errorTags[0]);
			}
		}
	}

	function getListOfAnswersIds(elementsInForm) {
		var i, listOfAnswersIds, currId;
		listOfAnswersIds = [];
		for(i=0; i<elementsInForm.length; i++) {
			currId = elementsInForm[i].getAttribute("data-infosync-id");
			if(currId && typeof currId !== "undefined") {
				if(listOfAnswersIds.indexOf(currId) < 0) {
					listOfAnswersIds.push(currId);
				}
			}
		}
		return listOfAnswersIds;
	}

	function addAnswerToAnswersDictionary(answers, element, listOfAnswersIds) {
		var tmpInfosyncId, tmpPosition;

		tmpInfosyncId = element.getAttribute("data-infosync-id");

		if(tmpInfosyncId && typeof tmpInfosyncId !== "undefined") {
			if((tmpPosition = listOfAnswersIds.indexOf(tmpInfosyncId)) >= 0) {
				switch(element.type) {
					case "number":
						answers[tmpInfosyncId] = Number(element.value);
						break;
					case "radio":
						addSingleChoiceAnswerTo(answers, tmpInfosyncId, element);
						break;
					case "checkbox":
						addMultipleChoiceAnswersTo(answers, tmpInfosyncId, element);
						break;
					case "select":
						addSingleChoiceAnswerTo(answers, tmpInfosyncId, element);
					default:
						answers[tmpInfosyncId] = element.value;
				}
				listOfAnswersIds.splice(tmpPosition, 1);
			}
		}
	}

	function addMultipleChoiceAnswersTo(answers, tmpInfosyncId, element) {
		var answer, tmpInfosyncId;
		answer = getElementsByAttribute(element, tmpInfosyncId, "checkbox");
		addAnswerToAnswers(answers, element, answer);
	}

	function addSingleChoiceAnswerTo(answers, tmpInfosyncId, element) {
		var answer;
		answer = getElementsByAttribute(element, tmpInfosyncId, "radio");
		addAnswerToAnswers(answers, element, answer);
	}

	function addAnswerToAnswers(answers, element, answer) {
		var tmpInfosyncId;
		tmpInfosyncId = element.getAttribute("data-infosync-id");
		if(answer && typeof answer !== "undefined" &&
			tmpInfosyncId && typeof tmpInfosyncId !== "undefined") {
				answers[tmpInfosyncId] = answer;
		}
	}

	function getElementsByAttribute(element, tmpInfosyncId, type) {
		var i, elementsOfId;
		elementsOfId = document.getElementsByName(tmpInfosyncId);

		if(type === "checkbox"){
			var listOfAnswers = [];
			for(i=0; i<elementsOfId.length; i++) {
				if(elementsOfId[i].checked) {
					listOfAnswers.push(elementsOfId[i].value);
				}
			}
			if(listOfAnswers.length > 0) {
				return listOfAnswers;
			}
		}else if(type === "radio" || type === "select"){
			for(i=0; i<elementsOfId.length; i++) {
				if(elementsOfId[i].checked) {
					return elementsOfId[i].value;
				}
			}
		}else{
			return;
		}
	}

	function createResultMessage(messageElementId) {
		var messageElement;
		messageElement = document.getElementById(messageElementId);
		if(messageElement && (typeof messageElement.getAttribute("data-message-active") === "undefined" ||
			messageElement.getAttribute("data-message-active") === "true")) {
			return getMessageToShow(messageElement);
		} else {
			return undefined;
		}
	}

	function getMessageToShow(messageElement) {
		var message;
		message = messageElement.getAttribute("data-message");
		return message ? message : "";
	}

	function appendToHTML(message, className) {
		var messageDivArea, infosyncForm;
		infosyncForm = document.getElementById("infosyncForm");
		if(message) {
			messageDivArea = getMessageArea();
			messageDivArea.className = className;
			messageDivArea.innerHTML = message;
			infosyncForm.appendChild(messageDivArea);
		}
	}

	function getMessageArea() {
		var messageDivArea;
		messageDivArea = document.getElementById("infosyncMessageArea");
		if(messageDivArea) {
			return messageDivArea;
		} else {
			messageDivArea = document.createElement("div");
			messageDivArea.setAttribute("id", "infosyncMessageArea");
			return messageDivArea;
		}
	}

	function redirectToUrl() {
		var tmpElement, urlToRedirect, urlToRedirectActive;
		tmpElement = document.getElementById("infosyncRedirectUrl");
		urlToRedirectActive = tmpElement.getAttribute("data-redirect-active");
		if(urlToRedirectActive && urlToRedirectActive === "true"){
			urlToRedirect = tmpElement.getAttribute("data-redirect-url");
			if(urlToRedirect) {
				window.location = urlToRedirect;
			}
		}
	}

	var infosync = {
		init: function() {
			return new Infosync();
		}
	};

	return infosync;
}()).init();

/* Pre fill form with URI parameters */
window.onload = function(){
	/* Store URI parameters on object */
	var qs = urlParamstoJson();

	var formNode = document.getElementById("infosyncForm");
	for(var key in qs){
		var elements = getAllElementsWithAttribute(formNode, 'data-infosync-id', key);
		var value = decodeURI(qs[key]);
		if(elements.length > 0){
			switch(elements[0].type){
				case 'text':
					elements[0].value = value;
					break;
				case 'textarea':
					elements[0].value = value;
					break;
				case 'select-one':
					console.log(value)
					elements[0].value = value;
					break;
				case 'radio':
					for(var idx in elements){
						if(elements[idx].value === value){
							elements[idx].checked = true;
						}
					}
					break;
				case 'checkbox':
					var values = value.split(';');
					for(var idx in elements){
						if(values.indexOf(elements[idx].value) !== -1){
							elements[idx].checked = true;
						}
					}
					break;
			}
		}
	}

	/*Catalog if exist*/
	setCatalog();
};
