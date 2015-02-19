/*
This software is allowed to use under GPL or you need to obtain Commercial or Enterise License
to use it in non-GPL project. Please contact sales@dhtmlx.com for details
*/
﻿
if (!window.dhtmlx) {
	dhtmlx = function(obj){
		for (var a in obj) dhtmlx[a]=obj[a];
		return dhtmlx; //simple singleton
	};
}
dhtmlx.extend_api=function(name,map,ext){
	var t = window[name];
	if (!t) return; //component not defined
	window[name]=function(obj){
		if (obj && typeof obj == "object" && !obj.tagName){
			var that = t.apply(this,(map._init?map._init(obj):arguments));
			//global settings
			for (var a in dhtmlx)
				if (map[a]) this[map[a]](dhtmlx[a]);
			//local settings
			for (var a in obj){
				if (map[a]) this[map[a]](obj[a]);
				else if (a.indexOf("on")==0){
					this.attachEvent(a,obj[a]);
				}
			}
		} else
			var that = t.apply(this,arguments);
		if (map._patch) map._patch(this);
		return that||this;
	};
	window[name].prototype=t.prototype;
	if (ext)
		dhtmlXHeir(window[name].prototype,ext);
};

dhtmlxAjax={
	get:function(url,callback){
		var t=new dtmlXMLLoaderObject(true);
		t.async=(arguments.length<3);
		t.waitCall=callback;
		t.loadXML(url)
		return t;
	},
	post:function(url,post,callback){
		var t=new dtmlXMLLoaderObject(true);
		t.async=(arguments.length<4);
		t.waitCall=callback;
		t.loadXML(url,true,post)
		return t;
	},
	getSync:function(url){
		return this.get(url,null,true)
	},
	postSync:function(url,post){
		return this.post(url,post,null,true);
	}
}

/**
 *     @desc: xmlLoader object
 *     @type: private
 *     @param: funcObject - xml parser function
 *     @param: object - jsControl object
 *     @param: async - sync/async mode (async by default)
 *     @param: rSeed - enable/disable random seed ( prevent IE caching)
 *     @topic: 0
 */
function dtmlXMLLoaderObject(funcObject, dhtmlObject, async, rSeed){
	this.xmlDoc="";

	if (typeof (async) != "undefined")
		this.async=async;
	else
		this.async=true;

	this.onloadAction=funcObject||null;
	this.mainObject=dhtmlObject||null;
	this.waitCall=null;
	this.rSeed=rSeed||false;
	return this;
};

dtmlXMLLoaderObject.count = 0;

/**
 *     @desc: xml loading handler
 *     @type: private
 *     @param: dtmlObject - xmlLoader object
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.waitLoadFunction=function(dhtmlObject){
	var once = true;
	this.check=function (){
		if ((dhtmlObject)&&(dhtmlObject.onloadAction != null)){
			if ((!dhtmlObject.xmlDoc.readyState)||(dhtmlObject.xmlDoc.readyState == 4)){
				if (!once)
					return;

				once=false; //IE 5 fix
				dtmlXMLLoaderObject.count++;
				if (typeof dhtmlObject.onloadAction == "function")
					dhtmlObject.onloadAction(dhtmlObject.mainObject, null, null, null, dhtmlObject);

				if (dhtmlObject.waitCall){
					dhtmlObject.waitCall.call(this,dhtmlObject);
					dhtmlObject.waitCall=null;
				}
			}
		}
	};
	return this.check;
};

/**
 *     @desc: return XML top node
 *     @param: tagName - top XML node tag name (not used in IE, required for Safari and Mozilla)
 *     @type: private
 *     @returns: top XML node
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.getXMLTopNode=function(tagName, oldObj){
	if (this.xmlDoc.responseXML){
		var temp = this.xmlDoc.responseXML.getElementsByTagName(tagName);
		if(temp.length==0 && tagName.indexOf(":")!=-1)
			var temp = this.xmlDoc.responseXML.getElementsByTagName((tagName.split(":"))[1]);
		var z = temp[0];
	} else
		var z = this.xmlDoc.documentElement;

	if (z){
		this._retry=false;
		return z;
	}

	if (!this._retry){
		this._retry=true;
		var oldObj = this.xmlDoc;
		this.loadXMLString(this.xmlDoc.responseText.replace(/^[\s]+/,""), true);
		return this.getXMLTopNode(tagName, oldObj);
	}

	dhtmlxError.throwError("LoadXML", "Incorrect XML", [
		(oldObj||this.xmlDoc),
		this.mainObject
	]);

	return document.createElement("DIV");
};

/**
 *     @desc: load XML from string
 *     @type: private
 *     @param: xmlString - xml string
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.loadXMLString=function(xmlString, silent){

	if (!_isIE){
		var parser = new DOMParser();
		this.xmlDoc=parser.parseFromString(xmlString, "text/xml");
	} else {
		this.xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		this.xmlDoc.async=this.async;
		this.xmlDoc.onreadystatechange = function(){};
		this.xmlDoc["loadXM"+"L"](xmlString);
	}

	if (silent)
		return;

	if (this.onloadAction)
		this.onloadAction(this.mainObject, null, null, null, this);

	if (this.waitCall){
		this.waitCall();
		this.waitCall=null;
	}
}
/**
 *     @desc: load XML
 *     @type: private
 *     @param: filePath - xml file path
 *     @param: postMode - send POST request
 *     @param: postVars - list of vars for post request
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.loadXML=function(filePath, postMode, postVars, rpc){
	if (this.rSeed)
		filePath+=((filePath.indexOf("?") != -1) ? "&" : "?")+"a_dhx_rSeed="+(new Date()).valueOf();
	this.filePath=filePath;

	if ((!_isIE)&&(window.XMLHttpRequest))
		this.xmlDoc=new XMLHttpRequest();
	else {
		this.xmlDoc=new ActiveXObject("Microsoft.XMLHTTP");
	}

	if (this.async)
		this.xmlDoc.onreadystatechange=new this.waitLoadFunction(this);
	this.xmlDoc.open(postMode ? "POST" : "GET", filePath, this.async);

	if (rpc){
		this.xmlDoc.setRequestHeader("User-Agent", "dhtmlxRPC v0.1 ("+navigator.userAgent+")");
		this.xmlDoc.setRequestHeader("Content-type", "text/xml");
	}

	else if (postMode)
		this.xmlDoc.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	this.xmlDoc.setRequestHeader("X-Requested-With","XMLHttpRequest");
	this.xmlDoc.send(null||postVars);

	if (!this.async)
		(new this.waitLoadFunction(this))();
};
/**
 *     @desc: destructor, cleans used memory
 *     @type: private
 *     @topic: 0
 */
dtmlXMLLoaderObject.prototype.destructor=function(){
	this._filterXPath = null;
	this._getAllNamedChilds = null;
	this._retry = null;
	this.async = null;
	this.rSeed = null;
	this.filePath = null;
	this.onloadAction = null;
	this.mainObject = null;
	this.xmlDoc = null;
	this.doXPath = null;
	this.doXPathOpera = null;
	this.doXSLTransToObject = null;
	this.doXSLTransToString = null;
	this.loadXML = null;
	this.loadXMLString = null;
	// this.waitLoadFunction = null;
	this.doSerialization = null;
	this.xmlNodeToJSON = null;
	this.getXMLTopNode = null;
	this.setXSLParamValue = null;
	return null;
}

dtmlXMLLoaderObject.prototype.xmlNodeToJSON = function(node){
	var t={};
	for (var i=0; i<node.attributes.length; i++)
		t[node.attributes[i].name]=node.attributes[i].value;
	t["_tagvalue"]=node.firstChild?node.firstChild.nodeValue:"";
	for (var i=0; i<node.childNodes.length; i++){
		var name=node.childNodes[i].tagName;
		if (name){
			if (!t[name]) t[name]=[];
			t[name].push(this.xmlNodeToJSON(node.childNodes[i]));
		}
	}
	return t;
}

/**
 *     @desc: Call wrapper
 *     @type: private
 *     @param: funcObject - action handler
 *     @param: dhtmlObject - user data
 *     @returns: function handler
 *     @topic: 0
 */
function callerFunction(funcObject, dhtmlObject){
	this.handler=function(e){
		if (!e)
			e=window.event;
		funcObject(e, dhtmlObject);
		return true;
	};
	return this.handler;
};

/**
 *     @desc: Calculate absolute position of html object
 *     @type: private
 *     @param: htmlObject - html object
 *     @topic: 0
 */
function getAbsoluteLeft(htmlObject){
	return getOffset(htmlObject).left;
}
/**
 *     @desc: Calculate absolute position of html object
 *     @type: private
 *     @param: htmlObject - html object
 *     @topic: 0
 */
function getAbsoluteTop(htmlObject){
	return getOffset(htmlObject).top;
}

function getOffsetSum(elem) {
	var top=0, left=0;
	while(elem) {
		top = top + parseInt(elem.offsetTop);
		left = left + parseInt(elem.offsetLeft);
		elem = elem.offsetParent;
	}
	return {top: top, left: left};
}
function getOffsetRect(elem) {
	var box = elem.getBoundingClientRect();
	var body = document.body;
	var docElem = document.documentElement;
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var top  = box.top +  scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;
	return { top: Math.round(top), left: Math.round(left) };
}
function getOffset(elem) {
	if (elem.getBoundingClientRect) {
		return getOffsetRect(elem);
	} else {
		return getOffsetSum(elem);
	}
}

/**
 *     @desc: Convert string to it boolean representation
 *     @type: private
 *     @param: inputString - string for covertion
 *     @topic: 0
 */
function convertStringToBoolean(inputString){
	if (typeof (inputString) == "string")
		inputString=inputString.toLowerCase();

	switch (inputString){
		case "1":
		case "true":
		case "yes":
		case "y":
		case 1:
		case true:
			return true;
			break;

		default: return false;
	}
}

/**
 *     @desc: find out what symbol to use as url param delimiters in further params
 *     @type: private
 *     @param: str - current url string
 *     @topic: 0
 */
function getUrlSymbol(str){
	if (str.indexOf("?") != -1)
		return "&"
	else
		return "?"
}

function dhtmlDragAndDropObject(){
	if (window.dhtmlDragAndDrop)
		return window.dhtmlDragAndDrop;

	this.lastLanding=0;
	this.dragNode=0;
	this.dragStartNode=0;
	this.dragStartObject=0;
	this.tempDOMU=null;
	this.tempDOMM=null;
	this.waitDrag=0;
	window.dhtmlDragAndDrop=this;

	return this;
};

dhtmlDragAndDropObject.prototype.removeDraggableItem=function(htmlNode){
	htmlNode.onmousedown=null;
	htmlNode.dragStarter=null;
	htmlNode.dragLanding=null;
}
dhtmlDragAndDropObject.prototype.addDraggableItem=function(htmlNode, dhtmlObject){
	htmlNode.onmousedown=this.preCreateDragCopy;
	htmlNode.dragStarter=dhtmlObject;
	this.addDragLanding(htmlNode, dhtmlObject);
}
dhtmlDragAndDropObject.prototype.addDragLanding=function(htmlNode, dhtmlObject){
	htmlNode.dragLanding=dhtmlObject;
}
dhtmlDragAndDropObject.prototype.preCreateDragCopy=function(e){
	if ((e||window.event) && (e||event).button == 2)
		return;

	if (window.dhtmlDragAndDrop.waitDrag){
		window.dhtmlDragAndDrop.waitDrag=0;
		document.body.onmouseup=window.dhtmlDragAndDrop.tempDOMU;
		document.body.onmousemove=window.dhtmlDragAndDrop.tempDOMM;
		return false;
	}

	if (window.dhtmlDragAndDrop.dragNode)
		window.dhtmlDragAndDrop.stopDrag(e);

	window.dhtmlDragAndDrop.waitDrag=1;
	window.dhtmlDragAndDrop.tempDOMU=document.body.onmouseup;
	window.dhtmlDragAndDrop.tempDOMM=document.body.onmousemove;
	window.dhtmlDragAndDrop.dragStartNode=this;
	window.dhtmlDragAndDrop.dragStartObject=this.dragStarter;
	document.body.onmouseup=window.dhtmlDragAndDrop.preCreateDragCopy;
	document.body.onmousemove=window.dhtmlDragAndDrop.callDrag;
	window.dhtmlDragAndDrop.downtime = new Date().valueOf();


	if ((e)&&(e.preventDefault)){
		e.preventDefault();
		return false;
	}
	return false;
};
dhtmlDragAndDropObject.prototype.callDrag=function(e){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

	if (!e)
		e=window.event;
	dragger=window.dhtmlDragAndDrop;
	if ((new Date()).valueOf()-dragger.downtime<100) return;

	//if ((e.button == 0)&&(_isIE))
	//	return dragger.stopDrag();

	if (!dragger.dragNode){
		if (dragger.waitDrag){
			dragger.dragNode=dragger.dragStartObject._createDragNode(dragger.dragStartNode, e);

			if (!dragger.dragNode)
				return dragger.stopDrag();

			dragger.dragNode.onselectstart=function(){return false;}
			dragger.gldragNode=dragger.dragNode;
			document.body.appendChild(dragger.dragNode);
			document.body.onmouseup=dragger.stopDrag;
			dragger.waitDrag=0;
			dragger.dragNode.pWindow=window;
			dragger.initFrameRoute();
		}
		else return dragger.stopDrag(e, true);
	}

	if (dragger.dragNode.parentNode != window.document.body && dragger.gldragNode){
		var grd = dragger.gldragNode;

		if (dragger.gldragNode.old)
			grd=dragger.gldragNode.old;

		//if (!document.all) dragger.calculateFramePosition();
		grd.parentNode.removeChild(grd);
		var oldBody = dragger.dragNode.pWindow;

		if (grd.pWindow &&	grd.pWindow.dhtmlDragAndDrop.lastLanding)
			grd.pWindow.dhtmlDragAndDrop.lastLanding.dragLanding._dragOut(grd.pWindow.dhtmlDragAndDrop.lastLanding);

		//		var oldp=dragger.dragNode.parentObject;
		if (_isIE){
			var div = document.createElement("Div");
			div.innerHTML=dragger.dragNode.outerHTML;
			dragger.dragNode=div.childNodes[0];
		} else
			dragger.dragNode=dragger.dragNode.cloneNode(true);

		dragger.dragNode.pWindow=window;
		//		dragger.dragNode.parentObject=oldp;

		dragger.gldragNode.old=dragger.dragNode;
		document.body.appendChild(dragger.dragNode);
		oldBody.dhtmlDragAndDrop.dragNode=dragger.dragNode;
	}

	dragger.dragNode.style.left=e.clientX+15+(dragger.fx
		? dragger.fx*(-1)
		: 0)
		+(document.body.scrollLeft||document.documentElement.scrollLeft)+"px";
	dragger.dragNode.style.top=e.clientY+3+(dragger.fy
		? dragger.fy*(-1)
		: 0)
		+(document.body.scrollTop||document.documentElement.scrollTop)+"px";

	if (!e.srcElement)
		var z = e.target;
	else
		z=e.srcElement;
	dragger.checkLanding(z, e);

	}).apply(self, args);});
}

dhtmlDragAndDropObject.prototype.calculateFramePosition=function(n){
	//this.fx = 0, this.fy = 0;
	if (window.name){
		var el = parent.frames[window.name].frameElement.offsetParent;
		var fx = 0;
		var fy = 0;

		while (el){
			fx+=el.offsetLeft;
			fy+=el.offsetTop;
			el=el.offsetParent;
		}

		if ((parent.dhtmlDragAndDrop)){
			var ls = parent.dhtmlDragAndDrop.calculateFramePosition(1);
			fx+=ls.split('_')[0]*1;
			fy+=ls.split('_')[1]*1;
		}

		if (n)
			return fx+"_"+fy;
		else
			this.fx=fx;
		this.fy=fy;
	}
	return "0_0";
}
dhtmlDragAndDropObject.prototype.checkLanding=function(htmlObject, e){
	if ((htmlObject)&&(htmlObject.dragLanding)){
		if (this.lastLanding)
			this.lastLanding.dragLanding._dragOut(this.lastLanding);
		this.lastLanding=htmlObject;
		this.lastLanding=this.lastLanding.dragLanding._dragIn(this.lastLanding, this.dragStartNode, e.clientX,
			e.clientY, e);
		this.lastLanding_scr=(_isIE ? e.srcElement : e.target);
	} else {
		if ((htmlObject)&&(htmlObject.tagName != "BODY"))
			this.checkLanding(htmlObject.parentNode, e);
		else {
			if (this.lastLanding)
				this.lastLanding.dragLanding._dragOut(this.lastLanding, e.clientX, e.clientY, e);
			this.lastLanding=0;

			if (this._onNotFound)
				this._onNotFound();
		}
	}
}
dhtmlDragAndDropObject.prototype.stopDrag=function(e, mode){
	dragger=window.dhtmlDragAndDrop;

	if (!mode){
		dragger.stopFrameRoute();
		var temp = dragger.lastLanding;
		dragger.lastLanding=null;

		if (temp)
			temp.dragLanding._drag(dragger.dragStartNode, dragger.dragStartObject, temp, (_isIE
				? event.srcElement
				: e.target));
	}
	dragger.lastLanding=null;

	if ((dragger.dragNode)&&(dragger.dragNode.parentNode == document.body))
		dragger.dragNode.parentNode.removeChild(dragger.dragNode);
	dragger.dragNode=0;
	dragger.gldragNode=0;
	dragger.fx=0;
	dragger.fy=0;
	dragger.dragStartNode=0;
	dragger.dragStartObject=0;
	document.body.onmouseup=dragger.tempDOMU;
	document.body.onmousemove=dragger.tempDOMM;
	dragger.tempDOMU=null;
	dragger.tempDOMM=null;
	dragger.waitDrag=0;
}

dhtmlDragAndDropObject.prototype.stopFrameRoute=function(win){
	if (win)
		window.dhtmlDragAndDrop.stopDrag(1, 1);

	for (var i = 0; i < window.frames.length; i++){
		try{
			if ((window.frames[i] != win)&&(window.frames[i].dhtmlDragAndDrop))
				window.frames[i].dhtmlDragAndDrop.stopFrameRoute(window);
		} catch(e){}
	}

	try{
		if ((parent.dhtmlDragAndDrop)&&(parent != window)&&(parent != win))
			parent.dhtmlDragAndDrop.stopFrameRoute(window);
	} catch(e){}
}
dhtmlDragAndDropObject.prototype.initFrameRoute=function(win, mode){
	if (win){
		window.dhtmlDragAndDrop.preCreateDragCopy();
		window.dhtmlDragAndDrop.dragStartNode=win.dhtmlDragAndDrop.dragStartNode;
		window.dhtmlDragAndDrop.dragStartObject=win.dhtmlDragAndDrop.dragStartObject;
		window.dhtmlDragAndDrop.dragNode=win.dhtmlDragAndDrop.dragNode;
		window.dhtmlDragAndDrop.gldragNode=win.dhtmlDragAndDrop.dragNode;
		window.document.body.onmouseup=window.dhtmlDragAndDrop.stopDrag;
		window.waitDrag=0;

		if (((!_isIE)&&(mode))&&((!_isFF)||(_FFrv < 1.8)))
			window.dhtmlDragAndDrop.calculateFramePosition();
	}
	try{
		if ((parent.dhtmlDragAndDrop)&&(parent != window)&&(parent != win))
			parent.dhtmlDragAndDrop.initFrameRoute(window);
	}catch(e){}

	for (var i = 0; i < window.frames.length; i++){
		try{
			if ((window.frames[i] != win)&&(window.frames[i].dhtmlDragAndDrop))
				window.frames[i].dhtmlDragAndDrop.initFrameRoute(window, ((!win||mode) ? 1 : 0));
		} catch(e){}
	}
}

_isFF = false;
_isIE = false;
_isOpera = false;
_isKHTML = false;
_isMacOS = false;
_isChrome = false;
_FFrv = false;
_KHTMLrv = false;
_OperaRv = false;

if (navigator.userAgent.indexOf('Macintosh') != -1)
	_isMacOS=true;


if (navigator.userAgent.toLowerCase().indexOf('chrome')>-1)
	_isChrome=true;

if ((navigator.userAgent.indexOf('Safari') != -1)||(navigator.userAgent.indexOf('Konqueror') != -1)){
	_KHTMLrv = parseFloat(navigator.userAgent.substr(navigator.userAgent.indexOf('Safari')+7, 5));

	if (_KHTMLrv > 525){ //mimic FF behavior for Safari 3.1+
		_isFF=true;
		_FFrv = 1.9;
	} else
		_isKHTML=true;
} else if (navigator.userAgent.indexOf('Opera') != -1){
	_isOpera=true;
	_OperaRv=parseFloat(navigator.userAgent.substr(navigator.userAgent.indexOf('Opera')+6, 3));
}


else if (navigator.appName.indexOf("Microsoft") != -1 || navigator.appName.indexOf("MSApp") != -1 ){
	_isIE=true;
	if ((navigator.appVersion.indexOf("MSIE 8.0")!= -1 || navigator.appVersion.indexOf("MSIE 9.0")!= -1 || navigator.appVersion.indexOf("MSIE 10.0")!= -1 ) && document.compatMode != "BackCompat"){
		_isIE=8;
	}
} else {
	_isFF=true;
	_FFrv = parseFloat(navigator.userAgent.split("rv:")[1])
}


//multibrowser Xpath processor
dtmlXMLLoaderObject.prototype.doXPath=function(xpathExp, docObj, namespace, result_type){
	if (_isKHTML || (!_isIE && !window.XPathResult))
		return this.doXPathOpera(xpathExp, docObj);

	if (_isIE){ //IE
		if (!docObj)
			if (!this.xmlDoc.nodeName)
				docObj=this.xmlDoc.responseXML
			else
				docObj=this.xmlDoc;

		if (!docObj)
			dhtmlxError.throwError("LoadXML", "Incorrect XML", [
				(docObj||this.xmlDoc),
				this.mainObject
			]);

		if (namespace != null)
			docObj.setProperty("SelectionNamespaces", "xmlns:xsl='"+namespace+"'"); //

		if (result_type == 'single'){
			return docObj.selectSingleNode(xpathExp);
		}
		else {
			return docObj.selectNodes(xpathExp)||new Array(0);
		}
	} else { //Mozilla
		var nodeObj = docObj;

		if (!docObj){
			if (!this.xmlDoc.nodeName){
				docObj=this.xmlDoc.responseXML
			}
			else {
				docObj=this.xmlDoc;
			}
		}

		if (!docObj)
			dhtmlxError.throwError("LoadXML", "Incorrect XML", [
				(docObj||this.xmlDoc),
				this.mainObject
			]);

		if (docObj.nodeName.indexOf("document") != -1){
			nodeObj=docObj;
		}
		else {
			nodeObj=docObj;
			docObj=docObj.ownerDocument;
		}
		var retType = XPathResult.ANY_TYPE;

		if (result_type == 'single')
			retType=XPathResult.FIRST_ORDERED_NODE_TYPE
		var rowsCol = new Array();
		var col = docObj.evaluate(xpathExp, nodeObj, function(pref){
			return namespace
		}, retType, null);

		if (retType == XPathResult.FIRST_ORDERED_NODE_TYPE){
			return col.singleNodeValue;
		}
		var thisColMemb = col.iterateNext();

		while (thisColMemb){
			rowsCol[rowsCol.length]=thisColMemb;
			thisColMemb=col.iterateNext();
		}
		return rowsCol;
	}
}

function _dhtmlxError(type, name, params){
	if (!this.catches)
		this.catches=new Array();

	return this;
}

_dhtmlxError.prototype.catchError=function(type, func_name){
	this.catches[type]=func_name;
}
_dhtmlxError.prototype.throwError=function(type, name, params){
	if (this.catches[type])
		return this.catches[type](type, name, params);

	if (this.catches["ALL"])
		return this.catches["ALL"](type, name, params);

    dhtmlx.alert("Error type: "+arguments[0]+"\nDescription: "+arguments[1]);
	return null;
}

window.dhtmlxError=new _dhtmlxError();


//opera fake, while 9.0 not released
//multibrowser Xpath processor
dtmlXMLLoaderObject.prototype.doXPathOpera=function(xpathExp, docObj){
	//this is fake for Opera
	var z = xpathExp.replace(/[\/]+/gi, "/").split('/');
	var obj = null;
	var i = 1;

	if (!z.length)
		return [];

	if (z[0] == ".")
		obj=[docObj]; else if (z[0] == ""){
		obj=(this.xmlDoc.responseXML||this.xmlDoc).getElementsByTagName(z[i].replace(/\[[^\]]*\]/g, ""));
		i++;
	} else
		return [];

	for (i; i < z.length; i++)obj=this._getAllNamedChilds(obj, z[i]);

	if (z[i-1].indexOf("[") != -1)
		obj=this._filterXPath(obj, z[i-1]);
	return obj;
}

dtmlXMLLoaderObject.prototype._filterXPath=function(a, b){
	var c = new Array();
	var b = b.replace(/[^\[]*\[\@/g, "").replace(/[\[\]\@]*/g, "");

	for (var i = 0; i < a.length; i++)
		if (a[i].getAttribute(b))
			c[c.length]=a[i];

	return c;
}
dtmlXMLLoaderObject.prototype._getAllNamedChilds=function(a, b){
	var c = new Array();

	if (_isKHTML)
		b=b.toUpperCase();

	for (var i = 0; i < a.length; i++)for (var j = 0; j < a[i].childNodes.length; j++){
		if (_isKHTML){
			if (a[i].childNodes[j].tagName&&a[i].childNodes[j].tagName.toUpperCase() == b)
				c[c.length]=a[i].childNodes[j];
		}

		else if (a[i].childNodes[j].tagName == b)
			c[c.length]=a[i].childNodes[j];
	}

	return c;
}

function dhtmlXHeir(a, b){
	for (var c in b)
		if (typeof (b[c]) == "function")
			a[c]=b[c];
	return a;
}

function dhtmlxEvent(el, event, handler){
	if (el.addEventListener)
		el.addEventListener(event, handler, false);

	else if (el.attachEvent)
		el.attachEvent("on"+event, handler);
}

//============= XSL Extension ===================================

dtmlXMLLoaderObject.prototype.xslDoc=null;
dtmlXMLLoaderObject.prototype.setXSLParamValue=function(paramName, paramValue, xslDoc){
	if (!xslDoc)
		xslDoc=this.xslDoc

	if (xslDoc.responseXML)
		xslDoc=xslDoc.responseXML;
	var item =
		this.doXPath("/xsl:stylesheet/xsl:variable[@name='"+paramName+"']", xslDoc,
			"http:/\/www.w3.org/1999/XSL/Transform", "single");

	if (item != null)
		item.firstChild.nodeValue=paramValue
}
dtmlXMLLoaderObject.prototype.doXSLTransToObject=function(xslDoc, xmlDoc){
	if (!xslDoc)
		xslDoc=this.xslDoc;

	if (xslDoc.responseXML)
		xslDoc=xslDoc.responseXML

	if (!xmlDoc)
		xmlDoc=this.xmlDoc;

	if (xmlDoc.responseXML)
		xmlDoc=xmlDoc.responseXML

	//MOzilla
	if (!_isIE){
		if (!this.XSLProcessor){
			this.XSLProcessor=new XSLTProcessor();
			this.XSLProcessor.importStylesheet(xslDoc);
		}
		var result = this.XSLProcessor.transformToDocument(xmlDoc);
	} else {
		var result = new ActiveXObject("Msxml2.DOMDocument.3.0");
		try{
			xmlDoc.transformNodeToObject(xslDoc, result);
		}catch(e){
			result = xmlDoc.transformNode(xslDoc);
		}
	}
	return result;
}

dtmlXMLLoaderObject.prototype.doXSLTransToString=function(xslDoc, xmlDoc){
	var res = this.doXSLTransToObject(xslDoc, xmlDoc);
	if(typeof(res)=="string")
		return res;
	return this.doSerialization(res);
}

dtmlXMLLoaderObject.prototype.doSerialization=function(xmlDoc){
	if (!xmlDoc)
		xmlDoc=this.xmlDoc;
	if (xmlDoc.responseXML)
		xmlDoc=xmlDoc.responseXML
	if (!_isIE){
		var xmlSerializer = new XMLSerializer();
		return xmlSerializer.serializeToString(xmlDoc);
	} else
		return xmlDoc.xml;
}

/**
 *   @desc:
 *   @type: private
 */
dhtmlxEventable=function(obj){
	obj.attachEvent=function(name, catcher, callObj){
		name='ev_'+name.toLowerCase();
		if (!this[name])
			this[name]=new this.eventCatcher(callObj||this);

		return(name+':'+this[name].addEvent(catcher)); //return ID (event name & event ID)
	}
	obj.callEvent=function(name, arg0){
		name='ev_'+name.toLowerCase();
		if (this[name])
			return this[name].apply(this, arg0);
		return true;
	}
	obj.checkEvent=function(name){
		return (!!this['ev_'+name.toLowerCase()])
	}
	obj.eventCatcher=function(obj){
		var dhx_catch = [];
		var z = function(){
			var res = true;
			for (var i = 0; i < dhx_catch.length; i++){
				if (dhx_catch[i] != null){
					var zr = dhx_catch[i].apply(obj, arguments);
					res=res&&zr;
				}
			}
			return res;
		}
		z.addEvent=function(ev){
			if (typeof (ev) != "function")
				ev=eval(ev);
			if (ev)
				return dhx_catch.push(ev)-1;
			return false;
		}
		z.removeEvent=function(id){
			dhx_catch[id]=null;
		}
		return z;
	}
	obj.detachEvent=function(id){
		if (id != false){
			var list = id.split(':');           //get EventName and ID
			this[list[0]].removeEvent(list[1]); //remove event
		}
	}
	obj.detachAllEvents = function(){
		for (var name in this){
			if (name.indexOf("ev_")==0)
				delete this[name];
		}
	}
	obj = null;
};

if(!window.dhtmlx)
	window.dhtmlx = {};

(function(){
	var _dhx_msg_cfg = null;
	function callback(config, result){
			var usercall = config.callback;
			modality(false);
			config.box.parentNode.removeChild(config.box);
			_dhx_msg_cfg = config.box = null;
			if (usercall)
				usercall(result);
	}
	function modal_key(e){
		if (_dhx_msg_cfg){
			e = e||event;
			var code = e.which||event.keyCode;
			if (dhtmlx.message.keyboard){
				if (code == 13 || code == 32)
					callback(_dhx_msg_cfg, true);
				if (code == 27)
					callback(_dhx_msg_cfg, false);
			}
			if (e.preventDefault)
				e.preventDefault();
			return !(e.cancelBubble = true);
		}
	}
	if (document.attachEvent)
		document.attachEvent("onkeydown", modal_key);
	else
		document.addEventListener("keydown", modal_key, true);
		
	function modality(mode){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

		if(!modality.cover){
			modality.cover = document.createElement("DIV");
			//necessary for IE only
			modality.cover.onkeydown = modal_key;
			modality.cover.className = "dhx_modal_cover";
			document.body.appendChild(modality.cover);
		}
		var height =  document.body.scrollHeight;
		modality.cover.style.display = mode?"inline-block":"none";
	
	}).apply(self, args);});
}

	function button(text, result){
		var button_css = "dhtmlx_"+text.toLowerCase().replace(/ /g, "_")+"_button"; // dhtmlx_ok_button, dhtmlx_click_me_button
		return "<div class='dhtmlx_popup_button "+button_css+"' result='"+result+"' ><div>"+text+"</div></div>";
	}

	function info(text){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

		if (!t.area){
			t.area = document.createElement("DIV");
			t.area.className = "dhtmlx_message_area";
			t.area.style[t.position]="5px";
			document.body.appendChild(t.area);
		}

		t.hide(text.id);
		var message = document.createElement("DIV");
		message.innerHTML = "<div>"+text.text+"</div>";
		message.className = "dhtmlx-info dhtmlx-" + text.type;
		message.onclick = function(){
			t.hide(text.id);
			text = null;
		};

		if (t.position == "bottom" && t.area.firstChild)
			t.area.insertBefore(message,t.area.firstChild);
		else
			t.area.appendChild(message);
		
		if (text.expire > 0)
			t.timers[text.id]=window.setTimeout(function(){
				t.hide(text.id);
			}, text.expire);

		t.pull[text.id] = message;
		message = null;

		return text.id;
	
	}).apply(self, args);});
}
	function _boxStructure(config, ok, cancel){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

		var box = document.createElement("DIV");
		box.className = " dhtmlx_modal_box dhtmlx-"+config.type;
		box.setAttribute("dhxbox", 1);
			
		var inner = '';

		if (config.width)
			box.style.width = config.width;
		if (config.height)
			box.style.height = config.height;
		if (config.title)
			inner+='<div class="dhtmlx_popup_title">'+config.title+'</div>';
		inner+='<div class="dhtmlx_popup_text"><span>'+(config.content?'':config.text)+'</span></div><div  class="dhtmlx_popup_controls">';
		if (ok)
			inner += button(config.ok || "OK", true);
		if (cancel)
			inner += button(config.cancel || "Cancel", false);
		if (config.buttons){
			for (var i=0; i<config.buttons.length; i++)
				inner += button(config.buttons[i],i);
		}
		inner += '</div>';
		box.innerHTML = inner;

		if (config.content){
			var node = config.content;
			if (typeof node == "string") 
				node = document.getElementById(node);
			if (node.style.display == 'none')
				node.style.display = "";
			box.childNodes[config.title?1:0].appendChild(node);
		}

		box.onclick = function(e){
			e = e ||event;
			var source = e.target || e.srcElement;
			if (!source.className) source = source.parentNode;
			if (source.className.split(" ")[0] == "dhtmlx_popup_button"){
				result = source.getAttribute("result");
				result = (result == "true")||(result == "false"?false:result);
				callback(config, result);
			}
		};
		config.box = box;
		if (ok||cancel)
			_dhx_msg_cfg = config;

		return box;
	
	}).apply(self, args);});
}
	function _createBox(config, ok, cancel){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

		var box = config.tagName ? config : _boxStructure(config, ok, cancel);
		
		if (!config.hidden)
			modality(true);
		document.body.appendChild(box);
		var x = Math.abs(Math.floor(((window.innerWidth||document.documentElement.offsetWidth) - box.offsetWidth)/2));
		var y = Math.abs(Math.floor(((window.innerHeight||document.documentElement.offsetHeight) - box.offsetHeight)/2));
		if (config.position == "top")
			box.style.top = "-3px";
		else
			box.style.top = y+'px';
		box.style.left = x+'px';
		//necessary for IE only
		box.onkeydown = modal_key;

		box.focus();
		if (config.hidden)
			dhtmlx.modalbox.hide(box);

		return box;
	
	}).apply(self, args);});
}

	function alertPopup(config){
		return _createBox(config, true, false);
	}
	function confirmPopup(config){
		return _createBox(config, true, true);
	}
	function boxPopup(config){
		return _createBox(config);
	}
	function box_params(text, type, callback){
		if (typeof text != "object"){
			if (typeof type == "function"){
				callback = type;
				type = "";
			}
			text = {text:text, type:type, callback:callback };
		}
		return text;
	}
	function params(text, type, expire, id){
		if (typeof text != "object")
			text = {text:text, type:type, expire:expire, id:id};
		text.id = text.id||t.uid();
		text.expire = text.expire||t.expire;
		return text;
	}
	dhtmlx.alert = function(){
		text = box_params.apply(this, arguments);
		text.type = text.type || "confirm";
		return alertPopup(text);
	};
	dhtmlx.confirm = function(){
		text = box_params.apply(this, arguments);
		text.type = text.type || "alert";
		return confirmPopup(text);
	};
	dhtmlx.modalbox = function(){
		text = box_params.apply(this, arguments);
		text.type = text.type || "alert";
		return boxPopup(text);
	};
	dhtmlx.modalbox.hide = function(node){
		while (node && node.getAttribute && !node.getAttribute("dhxbox"))
			node = node.parentNode;
		if (node){
			node.parentNode.removeChild(node);
			modality(false);
		}
	};
	var t = dhtmlx.message = function(text, type, expire, id){
		text = params.apply(this, arguments);
		text.type = text.type||"info";

		var subtype = text.type.split("-")[0];
		switch (subtype){
			case "alert":
				return alertPopup(text);
			case "confirm":
				return confirmPopup(text);
			case "modalbox":
				return boxPopup(text);
			default:
				return info(text);
			break;
		}
	};

	t.seed = (new Date()).valueOf();
	t.uid = function(){return t.seed++;};
	t.expire = 4000;
	t.keyboard = true;
	t.position = "top";
	t.pull = {};
	t.timers = {};

	t.hideAll = function(){
		for (var key in t.pull)
			t.hide(key);
	};
	t.hide = function(id){
		var obj = t.pull[id];
		if (obj && obj.parentNode){
			window.setTimeout(function(){
				obj.parentNode.removeChild(obj);
				obj = null;
			},2000);
			obj.className+=" hidden";
			
			if(t.timers[id])
				window.clearTimeout(t.timers[id]);
			delete t.pull[id];
		}
	};
})();
window.dhtmlXScheduler = window.scheduler = { version: "3.7.0" };
dhtmlxEventable(scheduler);

scheduler._wrapUnsafeFunction = function(unsafe, thisArg){
    var old = unsafe;
    return function(){
        var args = arguments;
        var self = thisArg || scheduler;
        return MSApp.execUnsafeLocalFunction(
            function(){return old.apply(self, args);}
        );
    };
};

scheduler._elapsedTime = function (delay, marker) {
    if(!marker)
        marker = "_prev_action";
    //needed to limit mousemove handlers
    if(scheduler[marker]){
        return false;
    }else{
        scheduler[marker] = true;
        setTimeout(function(){
            scheduler[marker] = false;
        }, delay || 15);
        return true;
    }
};

scheduler.init=function(id,date,mode){
	date=date||(scheduler._currentDate());
	mode=mode||"week";

	scheduler.date.init();

	this._obj=(typeof id == "string")?document.getElementById(id):id;
	this._els=[];
	this._scroll=true;
	this._quirks=(_isIE && document.compatMode == "BackCompat");
	this._quirks7=(_isIE && navigator.appVersion.indexOf("MSIE 8")==-1);
	
	this.get_elements();
	this.init_templates();
	this.set_actions();
	dhtmlxEvent(window,"resize",function(){
		window.clearTimeout(scheduler._resize_timer);
		scheduler._resize_timer=window.setTimeout(function(){
			if (scheduler.callEvent("onSchedulerResize",[]))  {
				scheduler.update_view();
				scheduler.callEvent("onAfterSchedulerResize", []);
			}
		}, 100);
	});

	this._init_touch_events();
	this.set_sizes();
	scheduler.callEvent('onSchedulerReady', []);
	this.setCurrentView(date,mode);
};

scheduler.xy={
	nav_height:22,
	min_event_height:40,
	scale_width:50,
	bar_height:20,
	scroll_width:18,
	scale_height:20,
	month_scale_height:20,
	menu_width:25,
	margin_top:0,
	margin_left:0,
	editor_width:140,
	lightbox_additional_height:50
};
scheduler.keys={
	edit_save:13,
	edit_cancel:27
};
scheduler.set_sizes=function(){
	var w = this._x = this._obj.clientWidth-this.xy.margin_left;
	var h = this._y = this._obj.clientHeight-this.xy.margin_top;
	
	//not-table mode always has scroll - need to be fixed in future
	var scale_x=this._table_view?0:(this.xy.scale_width+this.xy.scroll_width);
	var scale_s=this._table_view?-1:this.xy.scale_width;
	
	this.set_xy(this._els["dhx_cal_navline"][0],w,this.xy.nav_height,0,0);
	this.set_xy(this._els["dhx_cal_header"][0],w-scale_x,this.xy.scale_height,scale_s,this.xy.nav_height+(this._quirks?-1:1));
	//to support alter-skin, we need a way to alter height directly from css
	var actual_height = this._els["dhx_cal_navline"][0].offsetHeight;
	if (actual_height > 0) this.xy.nav_height = actual_height;
	
	var data_y=this.xy.scale_height+this.xy.nav_height+(this._quirks?-2:0);
	this.set_xy(this._els["dhx_cal_data"][0],w,h-(data_y+2),0,data_y+2);
};
scheduler.set_xy=function(node,w,h,x,y){
	node.style.width=Math.max(0,w)+"px";
	node.style.height=Math.max(0,h)+"px";
	if (arguments.length>3){
		node.style.left=x+"px";
		node.style.top=y+"px";	
	}
};
scheduler.get_elements=function(){
		var self = this;var args = arguments;
		return MSApp.execUnsafeLocalFunction(function(){return (function () {

	//get all child elements as named hash
	var els=this._obj.getElementsByTagName("DIV");
	for (var i=0; i < els.length; i++){
		var name=els[i].className;
		if (name) name = name.split(" ")[0];
		if (!this._els[name]) this._els[name]=[];
		this._els[name].push(els[i]);
		
		//check if name need to be changed
		var t=scheduler.locale.labels[els[i].getAttribute("name")||name];
		if (t) els[i].innerHTML=t;
	}

	}).apply(self, args);});
};
scheduler.set_actions=function(){
	for (var a in this._els)
		if (this._click[a])
			for (var i=0; i < this._els[a].length; i++)
				this._els[a][i].onclick=scheduler._click[a];
	this._obj.onselectstart=function(e){ return false; };
	this._obj.onmousemove=function(e){
		if (!scheduler._temp_touch_block)
			scheduler._on_mouse_move(e||event);
	};
	this._obj.onmousedown=function(e){
		if (!scheduler._ignore_next_click)
			scheduler._on_mouse_down(e||event);
	};
	this._obj.onmouseup=function(e){
		if (!scheduler._ignore_next_click)
			scheduler._on_mouse_up(e||event);
	};
	this._obj.ondblclick=function(e){
		scheduler._on_dbl_click(e||event);
	};
	this._obj.oncontextmenu = function(e) {
		var ev = e||event;
		var src = ev.target||ev.srcElement;
		var returnValue = scheduler.callEvent("onContextMenu", [scheduler._locate_event(src), ev]);
		return returnValue;
	};
};
scheduler.select=function(id){
	if (this._select_id==id) return;
	this.editStop(false);
	this.unselect();
	this._select_id = id;
	this.updateEvent(id);
};
scheduler.unselect=function(id){
	if (id && id!=this._select_id) return;
	var t=this._select_id;
	this._select_id = null;
	if (t) this.updateEvent(t);
};
scheduler.getState=function(){
	return {
		mode: this._mode,
		date: this._date,
		min_date: this._min_date,
		max_date: this._max_date,
		editor_id: this._edit_id,
		lightbox_id: this._lightbox_id,
		new_event: this._new_event,
		select_id: this._select_id,
		expanded: this.expanded,
		drag_id: this._drag_id,
		drag_mode: this._drag_mode
	};
};
scheduler._click={
	dhx_cal_data:function(e){
		//in case of touch disable click processing
		if (scheduler._ignore_next_click){
			if (e.preventDefault)
				e.preventDefault();
			e.cancelBubble = true;
			return scheduler._ignore_next_click = false;
		}

		var trg = e?e.target:event.srcElement;
		var id = scheduler._locate_event(trg);
		
		e = e || event;

		if (!id) {
			scheduler.callEvent("onEmptyClick",[scheduler.getActionData(e).date, e]);
		} else {
			if ( !scheduler.callEvent("onClick",[id,e]) || scheduler.config.readonly ) return;
		}

		if (id && scheduler.config.select) {

			scheduler.select(id);
			var mask = trg.className;
			if (mask.indexOf("_icon")!=-1)
				scheduler._click.buttons[mask.split(" ")[1].replace("icon_","")](id);
		} else
			scheduler._close_not_saved();
	},
	dhx_cal_prev_button:function(){
		scheduler._click.dhx_cal_next_button(0,-1);
	},
	dhx_cal_next_button:function(dummy,step){
		scheduler.setCurrentView(scheduler.date.add( //next line changes scheduler._date , but seems it has not side-effects
			scheduler.date[scheduler._mode+"_start"](scheduler._date),(step||1),scheduler._mode));
	},
	dhx_cal_today_button:function(){
		if (scheduler.callEvent("onBeforeTodayDisplayed", [])) {
			scheduler.setCurrentView(scheduler._currentDate());
		}
	},
	dhx_cal_tab:function(){
		var name = this.getAttribute("name");
		var mode = name.substring(0, name.search("_tab"));
		scheduler.setCurrentView(scheduler._date,mode);
	},
	buttons:{
		"delete":function(id){
			var c = scheduler.locale.labels.confirm_deleting;
			scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_deleting, function(){ scheduler.deleteEvent(id) });
		},
		edit:function(id){ scheduler.edit(id); },
		save:function(id){ scheduler.editStop(true); },
		details:function(id){ scheduler.showLightbox(id); },
		cancel:function(id){ scheduler.editStop(false); }
	}
};
scheduler._dhtmlx_confirm = function(message, title, callback) {
	if (!message)
		return callback();
	var opts = { text: message };
	if (title)
		opts.title = title;
	if (callback) {
		opts.callback = function(result) {
			if (result)
				callback();
		};
	}
	dhtmlx.confirm(opts);
};
scheduler.addEventNow=function(start,end,e){
	var base = {};
	if (start && start.constructor.toString().match(/object/i) !== null){
		base = start;
		start = null;
	}
	
	var d = (this.config.event_duration||this.config.time_step)*60000;
	if (!start) start = base.start_date||Math.round((scheduler._currentDate()).valueOf()/d)*d;
	var start_date = new Date(start);
	if (!end){
		var start_hour = this.config.first_hour;
		if (start_hour > start_date.getHours()){
			start_date.setHours(start_hour);
			start = start_date.valueOf();
		}
		end = start.valueOf()+d;
	}
	var end_date = new Date(end);

	// scheduler.addEventNow(new Date(), new Date()) + collision though get_visible events defect (such event was not retrieved)
	if(start_date.valueOf() == end_date.valueOf())
		end_date.setTime(end_date.valueOf()+d);

	base.start_date = base.start_date||start_date;
	base.end_date =  base.end_date||end_date;
	base.text = base.text||this.locale.labels.new_event;
	base.id = this._drag_id = this.uid();
	this._drag_mode="new-size";

	this._loading=true;
	this.addEvent(base);
	this.callEvent("onEventCreated",[this._drag_id,e]);
	this._loading=false;
	
	this._drag_event={}; //dummy , to trigger correct event updating logic
	this._on_mouse_up(e);	
};
scheduler._on_dbl_click=function(e,src){
	src = src||(e.target||e.srcElement);
	if (this.config.readonly) return;
	var name = src.className.split(" ")[0];
	switch(name){
		case "dhx_scale_holder":
		case "dhx_scale_holder_now":
		case "dhx_month_body":
		case "dhx_wa_day_data":
		case "dhx_marked_timespan":
			if (!scheduler.config.dblclick_create) break;
			this.addEventNow(this.getActionData(e).date,null,e);
			break;
		case "dhx_cal_event":
		case "dhx_wa_ev_body":
		case "dhx_agenda_line":
		case "dhx_grid_event":
		case "dhx_cal_event_line":
		case "dhx_cal_event_clear":
			var id = this._locate_event(src);
			if (!this.callEvent("onDblClick",[id,e])) return;
			if (this.config.details_on_dblclick || this._table_view || !this.getEvent(id)._timed || !this.config.select)
				this.showLightbox(id);
			else
				this.edit(id);
			break;
		case "dhx_time_block":
		case "dhx_cal_container":
			return;
			break;
		default:
			var t = this["dblclick_"+name];
			if (t) {
				t.call(this,e);
			}
			else {
				if (src.parentNode && src != this)
					return scheduler._on_dbl_click(e,src.parentNode);
			}
			break;
	}
};

scheduler._mouse_coords=function(ev){
	var pos;
	var b=document.body;
	var d = document.documentElement;
	if(ev.pageX || ev.pageY)
	    pos={x:ev.pageX, y:ev.pageY};
	else pos={
	    x:ev.clientX + (b.scrollLeft||d.scrollLeft||0) - b.clientLeft,
	    y:ev.clientY + (b.scrollTop||d.scrollTop||0) - b.clientTop
	};

	//apply layout
	pos.x-=getAbsoluteLeft(this._obj)+(this._table_view?0:this.xy.scale_width);
	pos.y-=getAbsoluteTop(this._obj)+this.xy.nav_height+(this._dy_shift||0)+this.xy.scale_height-this._els["dhx_cal_data"][0].scrollTop;
	pos.ev = ev;

	var handler = this["mouse_"+this._mode];
	if (handler)
		return handler.call(this,pos);

	//transform to date
	if (!this._table_view) {
		pos.x=Math.min(this._cols.length-1, Math.max(0,Math.ceil(pos.x/this._cols[0])-1));
		pos.y=Math.max(0,Math.ceil(pos.y*60/(this.config.time_step*this.config.hour_size_px))-1)+this.config.first_hour*(60/this.config.time_step);
	} else {
		if (!this._cols || !this._colsS) // agenda/map views
			return pos;
		var dy=0;
		for (dy=1; dy < this._colsS.heights.length; dy++)
			if (this._colsS.heights[dy]>pos.y) break;

		pos.y=Math.ceil( (Math.max(0, pos.x/this._cols[0])+Math.max(0,dy-1)*7)*24*60/this.config.time_step );

		if (scheduler._drag_mode || this._mode == "month")
			pos.y=(Math.max(0,Math.ceil(pos.x/this._cols[0])-1)+Math.max(0,dy-1)*7)*24*60/this.config.time_step;

		pos.x=0;
	}

	return pos;
};
scheduler._close_not_saved=function(){
	if (new Date().valueOf()-(scheduler._new_event||0) > 500 && scheduler._edit_id){
		var c=scheduler.locale.labels.confirm_closing;

		scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_closing, function() { scheduler.editStop(scheduler.config.positive_closing); });
	}
};
scheduler._correct_shift=function(start, back){
	return start-=((new Date(scheduler._min_date)).getTimezoneOffset()-(new Date(start)).getTimezoneOffset())*60000*(back?-1:1);	
};
scheduler._on_mouse_move=function(e){
	if (this._drag_mode && scheduler._elapsedTime()) {

		var pos=this._mouse_coords(e);
		if (!this._drag_pos || pos.force_redraw || this._drag_pos.x!=pos.x || this._drag_pos.y!=pos.y ){
			var start, end;
			if (this._edit_id!=this._drag_id)
				this._close_not_saved();
				
			this._drag_pos=pos;
			
			if (this._drag_mode=="create"){
				this._close_not_saved();
				this._loading=true; //will be ignored by dataprocessor
				
				start = this._get_date_from_pos(pos).valueOf();

				var res = this.callEvent("onBeforeEventCreated", [e]);
				if (!res)
					return;

				if (!this._drag_start) {
					this._drag_start=start;
					return;
				}

				end = start;
				if (end == this._drag_start) {
				}

				var start_date = new Date(this._drag_start);
				var end_date = new Date(end);
				if ( (this._mode == "day" || this._mode == "week")
						&& (start_date.getHours() == end_date.getHours() && start_date.getMinutes() == end_date.getMinutes()) ) {
			   	    end_date = new Date(this._drag_start+1000);
				}

				
				this._drag_id=this.uid();
				this.addEvent(start_date, end_date, this.locale.labels.new_event, this._drag_id, pos.fields);
				
				this.callEvent("onEventCreated",[this._drag_id,e]);
				this._loading=false;
				this._drag_mode="new-size";
				
			} 

			var ev=this.getEvent(this._drag_id);

			if (this._drag_mode=="move"){
				start = this._min_date.valueOf()+(pos.y*this.config.time_step+pos.x*24*60 -(scheduler._move_pos_shift||0) )*60000;
				if (!pos.custom && this._table_view) start+=this.date.time_part(ev.start_date)*1000;
				start = this._correct_shift(start);
				end = ev.end_date.valueOf()-(ev.start_date.valueOf()-start);
			} else { // resize
				start = ev.start_date.valueOf();
				end = ev.end_date.valueOf();
				if (this._table_view) {
					var resize_date = this._min_date.valueOf()+pos.y*this.config.time_step*60000 + (pos.custom?0:24*60*60000);
					if (this._mode == "month")
						resize_date = this._correct_shift(resize_date, false);

					if (pos.resize_from_start)
						start = resize_date;
					else
						end = resize_date;
				} else {
					end = this.date.date_part(new Date(ev.end_date)).valueOf()+pos.y*this.config.time_step*60000;
					this._els["dhx_cal_data"][0].style.cursor="s-resize";
					if (this._mode == "week" || this._mode == "day")
						end = this._correct_shift(end);
				}
				if (this._drag_mode == "new-size") {
					if (end <= this._drag_start){
						var shift = pos.shift||((this._table_view && !pos.custom)?24*60*60000:0);
						start = end-(pos.shift?0:shift);
						end = this._drag_start+(shift||(this.config.time_step*60000));
					} else {
						start = this._drag_start;
					}
				} else {
					if (end<=start)
						end=start+this.config.time_step*60000;
				}
			}
			var new_end = new Date(end-1);			
			var new_start = new Date(start);
			//prevent out-of-borders situation for day|week view
			if ( this._table_view || (new_end.getDate()==new_start.getDate() && new_end.getHours()<this.config.last_hour) || scheduler._allow_dnd ){
				ev.start_date=new_start;
				ev.end_date=new Date(end);
				if (this.config.update_render){
					//fix for repaint after dnd and scroll issue, #231
					var sx = scheduler._els["dhx_cal_data"][0].scrollTop;
					this.update_view();
					scheduler._els["dhx_cal_data"][0].scrollTop = sx;
				} else
					this.updateEvent(this._drag_id);
			}
			if (this._table_view) {
				this.for_rendered(this._drag_id,function(r){
					r.className+=" dhx_in_move";
				});
			}
		}
	}  else {
		if (scheduler.checkEvent("onMouseMove")){
			var id = this._locate_event(e.target||e.srcElement);
			this.callEvent("onMouseMove",[id,e]);
		}
	}
};
scheduler._on_mouse_down=function(e,src) {
	// on Mac we do not get onmouseup event when clicking right mouse button leaving us in dnd state
	// let's ignore right mouse button then
	if (e.button == 2)
		return;

	if (this.config.readonly || this._drag_mode) return;
	src = src||(e.target||e.srcElement);
	var classname = src.className && src.className.split(" ")[0];

	switch (classname) {
		case "dhx_cal_event_line":
		case "dhx_cal_event_clear":
			if (this._table_view)
				this._drag_mode="move"; //item in table mode
			break;
		case "dhx_event_move":
		case "dhx_wa_ev_body":
			this._drag_mode="move";
			break;
		case "dhx_event_resize":
			this._drag_mode="resize";
			break;
		case "dhx_scale_holder":
		case "dhx_scale_holder_now":
		case "dhx_month_body":
		case "dhx_matrix_cell":
		case "dhx_marked_timespan":
			this._drag_mode="create";
			this.unselect(this._select_id);
			break;
		case "":
			if (src.parentNode)
				return scheduler._on_mouse_down(e,src.parentNode);
		default:
			if (scheduler.checkEvent("onMouseDown") && scheduler.callEvent("onMouseDown", [classname])) {
				if (src.parentNode && src != this) {
					return scheduler._on_mouse_down(e,src.parentNode);
				}
			}
			this._drag_mode=null;
			this._drag_id=null;
			break;
	}
	if (this._drag_mode){
		var id = this._locate_event(src);
		if (!this.config["drag_"+this._drag_mode] || !this.callEvent("onBeforeDrag",[id, this._drag_mode, e]))
			this._drag_mode=this._drag_id=0;
		else {
			this._drag_id= id;
			this._drag_event = scheduler._lame_clone(this.getEvent(this._drag_id) || {});
		}
	}
	this._drag_start=null;
};
scheduler._on_mouse_up=function(e){
	if (this._drag_mode && this._drag_id){
		this._els["dhx_cal_data"][0].style.cursor="default";
		//drop
		var ev=this.getEvent(this._drag_id);
		if (this._drag_event._dhx_changed || !this._drag_event.start_date || ev.start_date.valueOf()!=this._drag_event.start_date.valueOf() || ev.end_date.valueOf()!=this._drag_event.end_date.valueOf()){
			var is_new=(this._drag_mode=="new-size");
			if (!this.callEvent("onBeforeEventChanged",[ev,e,is_new,this._drag_event])){
				if (is_new) 
					this.deleteEvent(ev.id, true);
				else {
					this._drag_event._dhx_changed = false;
					scheduler._lame_copy(ev, this._drag_event);
					this.updateEvent(ev.id);
				}
			} else {
				var drag_id = this._drag_id;
				this._drag_id = this._drag_mode = null;
				if (is_new && this.config.edit_on_create){
					this.unselect();
					this._new_event=new Date();//timestamp of creation
					//if selection disabled - force lightbox usage
					if (this._table_view || this.config.details_on_create || !this.config.select) {
						return this.showLightbox(drag_id);
					}
					this._drag_pos = true; //set flag to trigger full redraw
					this._select_id = this._edit_id = drag_id;
				} else {
					if (!this._new_event)
						this.callEvent(is_new?"onEventAdded":"onEventChanged",[drag_id,this.getEvent(drag_id)]);
				}
			}
		}
		if (this._drag_pos) this.render_view_data(); //redraw even if there is no real changes - necessary for correct positioning item after drag
	}
	this._drag_id = null;
	this._drag_mode=null;
	this._drag_pos=null;
};
scheduler.update_view=function(){
	this._reset_scale();
	if (this._load_mode && this._load()) return this._render_wait = true;
	this.render_view_data();
};
scheduler.updateView = function(date, mode) {
	date = date || this._date;
	mode = mode || this._mode;
	var dhx_cal_data = 'dhx_cal_data';

	if (!this._mode)
		this._obj.className += " dhx_scheduler_" + mode; else {
		this._obj.className = this._obj.className.replace("dhx_scheduler_" + this._mode, "dhx_scheduler_" + mode);
	}

	var prev_scroll = (this._mode == mode && this.config.preserve_scroll) ? this._els[dhx_cal_data][0].scrollTop : false; // saving current scroll

	//hide old custom view
	if (this[this._mode + "_view"] && mode && this._mode != mode)
		this[this._mode + "_view"](false);

	this._close_not_saved();

	var dhx_multi_day = 'dhx_multi_day';
	if (this._els[dhx_multi_day]) {
		this._els[dhx_multi_day][0].parentNode.removeChild(this._els[dhx_multi_day][0]);
		this._els[dhx_multi_day] = null;
	}

	this._mode = mode;
	this._date = date;
	this._table_view = (this._mode == "month");

	var tabs = this._els["dhx_cal_tab"];
	if(tabs){//calendar can work without view tabs
		for (var i = 0; i < tabs.length; i++) {
			var name = tabs[i].className;
			name = name.replace(/ active/g, "");
			if (tabs[i].getAttribute("name") == this._mode + "_tab")
				name = name + " active";
			tabs[i].className = name;
		}
	}
	//show new view
	var view = this[this._mode + "_view"];
	view ? view(true) : this.update_view();

	if (typeof prev_scroll == "number") // if we are updating or working with the same view scrollTop should be saved
		this._els[dhx_cal_data][0].scrollTop = prev_scroll; // restoring original scroll
};
scheduler.setCurrentView = function(date, mode) {
	if (!this.callEvent("onBeforeViewChange", [this._mode, this._date, mode, date])) return;
	this.updateView(date, mode);
	this.callEvent("onViewChange", [this._mode, this._date]);
};
scheduler._render_x_header = scheduler._wrapUnsafeFunction(function(i,left,d,h){
	//header scale	
	var head=document.createElement("DIV");
	head.className = "dhx_scale_bar";
	var width = this._cols[i]-1;

	if (this._mode == "month" && i === 0 && this.config.left_border) {
		head.className += " dhx_scale_bar_border";
		left = left+1;
	}
	this.set_xy(head, width, this.xy.scale_height-2, left, 0);//-1 for border
	head.innerHTML=this.templates[this._mode+"_scale_date"](d,this._mode); //TODO - move in separate method
	h.appendChild(head);
});


scheduler._reset_scale=scheduler._wrapUnsafeFunction(function(){
	//current mode doesn't support scales
	//we mustn't call reset_scale for such modes, so it just to be sure
	if (!this.templates[this._mode + "_date"]) return;

	var h = this._els["dhx_cal_header"][0];
	var b = this._els["dhx_cal_data"][0];
	var c = this.config;

	h.innerHTML = "";
	b.scrollTop = 0; //fix flickering in FF
	b.innerHTML = "";

	var str = ((c.readonly || (!c.drag_resize)) ? " dhx_resize_denied" : "") + ((c.readonly || (!c.drag_move)) ? " dhx_move_denied" : "");
	if (str) b.className = "dhx_cal_data" + str;

	this._scales = {};
	this._cols = [];	//store for data section
	this._colsS = {height: 0};
	this._dy_shift = 0;

	this.set_sizes();
	var summ=parseInt(h.style.width,10); //border delta
	var left=0;

	var d,dd,sd,today;
	dd=this.date[this._mode+"_start"](new Date(this._date.valueOf()));
	d=sd=this._table_view?scheduler.date.week_start(dd):dd;
	today=this.date.date_part( scheduler._currentDate());

	//reset date in header
	var ed=scheduler.date.add(dd,1,this._mode);
	var count = 7;
	
	if (!this._table_view){
		var count_n = this.date["get_"+this._mode+"_end"];
		if (count_n) ed = count_n(dd);
		count = Math.round((ed.valueOf()-dd.valueOf())/(1000*60*60*24));
	}
	
	this._min_date=d;
	this._els["dhx_cal_date"][0].innerHTML=this.templates[this._mode+"_date"](dd,ed,this._mode);

	for (var i=0; i<count; i++){ 
		this._cols[i]=Math.floor(summ/(count-i));
	
		this._render_x_header(i,left,d,h);
		if (!this._table_view){
			var scales=document.createElement("DIV");
			var cls = "dhx_scale_holder";
			if (d.valueOf()==today.valueOf()) cls = "dhx_scale_holder_now";
			scales.className=cls+" "+this.templates.week_date_class(d,today);
			this.set_xy(scales,this._cols[i]-1,c.hour_size_px*(c.last_hour-c.first_hour),left+this.xy.scale_width+1,0);//-1 for border
			b.appendChild(scales);
			this.callEvent("onScaleAdd",[scales, d]);
		}
		
		d=this.date.add(d,1,"day");
		summ-=this._cols[i];
		left+=this._cols[i];
		this._colsS[i]=(this._cols[i-1]||0)+(this._colsS[i-1]||(this._table_view?0:this.xy.scale_width+2));
		this._colsS['col_length'] = count+1;
	}
	this._max_date=d;
	this._colsS[count]=this._cols[count-1]+this._colsS[count-1];

	if (this._table_view) // month view
		this._reset_month_scale(b,dd,sd);
	else{
		this._reset_hours_scale(b,dd,sd);
		if (c.multi_day) {
			var dhx_multi_day = 'dhx_multi_day';

			if(this._els[dhx_multi_day]) {
				this._els[dhx_multi_day][0].parentNode.removeChild(this._els[dhx_multi_day][0]);
				this._els[dhx_multi_day] = null;
			}
			
			var navline = this._els["dhx_cal_navline"][0];
			var top = navline.offsetHeight + this._els["dhx_cal_header"][0].offsetHeight+1;
			
			var c1 = document.createElement("DIV");
			c1.className = dhx_multi_day;
			c1.style.visibility="hidden";
			this.set_xy(c1, this._colsS[this._colsS.col_length-1]+this.xy.scroll_width, 0, 0, top); // 2 extra borders, dhx_header has -1 bottom margin
			b.parentNode.insertBefore(c1,b);
			
			var c2 = c1.cloneNode(true);
			c2.className = dhx_multi_day+"_icon";
			c2.style.visibility="hidden";
			this.set_xy(c2, this.xy.scale_width, 0, 0, top); // dhx_header has -1 bottom margin
			
			c1.appendChild(c2);
			this._els[dhx_multi_day]=[c1,c2];
			this._els[dhx_multi_day][0].onclick = this._click.dhx_cal_data;
		}
	}

});




scheduler._reset_hours_scale=scheduler._wrapUnsafeFunction(function(b,dd,sd){
	var c=document.createElement("DIV");
	c.className="dhx_scale_holder";
	
	var date = new Date(1980,1,1,this.config.first_hour,0,0);
	for (var i=this.config.first_hour*1; i < this.config.last_hour; i++) {
		var cc=document.createElement("DIV");
		cc.className="dhx_scale_hour";
		cc.style.height=this.config.hour_size_px-(this._quirks?0:1)+"px";
		var width = this.xy.scale_width;
		if (this.config.left_border) {
			width = width - 1;
			cc.className += " dhx_scale_hour_border";
		}
		cc.style.width = width + "px";
		cc.innerHTML=scheduler.templates.hour_scale(date);
		
		c.appendChild(cc);
		date=this.date.add(date,1,"hour");
	}
	b.appendChild(c);
	if (this.config.scroll_hour)
		b.scrollTop = this.config.hour_size_px*(this.config.scroll_hour-this.config.first_hour);
});

scheduler._currentDate = function(){
	if(scheduler.config.now_date){
		return new Date(scheduler.config.now_date);
	}
	return new Date();
};

scheduler._reset_month_scale=scheduler._wrapUnsafeFunction(function(b,dd,sd){
	var ed=scheduler.date.add(dd,1,"month");
	
	//trim time part for comparation reasons
	var cd = scheduler._currentDate();
	this.date.date_part(cd);
	this.date.date_part(sd);

	var rows=Math.ceil(Math.round((ed.valueOf()-sd.valueOf()) / (60*60*24*1000) ) / 7);
	var tdcss=[];
	var height=(Math.floor(b.clientHeight/rows)-22);
	
	this._colsS.height=height+22;
	var h = this._colsS.heights = [];
	for (var i=0; i<=7; i++) {
		var cell_width = ((this._cols[i]||0)-1);
		if (i === 0 && this.config.left_border) {
			cell_width = cell_width - 1;
		}
		tdcss[i]=" style='height:"+height+"px; width:"+cell_width+"px;' ";
	}


	
	var cellheight = 0;
	this._min_date=sd;
	var html="<table cellpadding='0' cellspacing='0'>";
	var rendered_dates = [];
	for (var i=0; i<rows; i++){
		html+="<tr>";

		for (var j=0; j<7; j++) {
			html+="<td";
			var cls = "";
			if (sd<dd)
				cls='dhx_before';
			else if (sd>=ed)
				cls='dhx_after';
			else if (sd.valueOf()==cd.valueOf())
				cls='dhx_now';
			html+=" class='"+cls+" "+this.templates.month_date_class(sd,cd)+"' >";
			var body_class = "dhx_month_body";
			var head_class = "dhx_month_head";
			if (j === 0 && this.config.left_border) {
				body_class += " dhx_month_body_border";
				head_class += " dhx_month_head_border";
			}
			html+="<div class='"+head_class+"'>"+this.templates.month_day(sd)+"</div>";
			html+="<div class='"+body_class+"' "+tdcss[j]+"></div></td>";
			rendered_dates.push(sd);
			sd=this.date.add(sd,1,"day");
		}
		html+="</tr>";
		h[i] = cellheight;
		cellheight+=this._colsS.height;
	}
	html+="</table>";
	this._max_date=sd;
	
	b.innerHTML=html;

	this._scales = {};
	var divs = b.getElementsByTagName('div');
	for (var i=0; i<rendered_dates.length; i++) { // [header, body, header, body, ...]
		var div = divs[(i*2)+1];
		var date = rendered_dates[i];
		this._scales[+date] = div;
	}
	for (var i=0; i<rendered_dates.length; i++) {
		var date = rendered_dates[i];
		this.callEvent("onScaleAdd", [this._scales[+date], date]);
	}

	return sd;
});




scheduler.getLabel = function(property, key) {
	var sections = this.config.lightbox.sections;
	for (var i=0; i<sections.length; i++) {
		if(sections[i].map_to == property) {
			var options = sections[i].options;
			for (var j=0; j<options.length; j++) {
				if(options[j].key == key) {
					return options[j].label;
				}
			}
		}
	}
	return "";
};
scheduler.updateCollection = function(list_name, collection) {
	var list = scheduler.serverList(list_name);
	if (!list) return false;
	list.splice(0, list.length);
	list.push.apply(list, collection || []);
	scheduler.callEvent("onOptionsLoad", []);
	scheduler.resetLightbox();
	return true;
};
scheduler._lame_clone = function(object, cache) {
	var i, t, result; // iterator, types array, result

	cache = cache || [];

	for (i=0; i<cache.length; i+=2)
		if(object === cache[i])
			return cache[i+1];

	if (object && typeof object == "object") {
		result = {};
		t = [Array,Date,Number,String,Boolean];
		for (i=0; i<t.length; i++) {
			if (object instanceof t[i])
				result = i ? new t[i](object) : new t[i](); // first one is array
		}
		cache.push(object, result);
		for (i in object) {
			if (Object.prototype.hasOwnProperty.apply(object, [i]))
				result[i] = scheduler._lame_clone(object[i], cache)
		}
	}
	return result || object;
};
scheduler._lame_copy = function(target, source) {
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}
	return target;
};
scheduler._get_date_from_pos = function(pos) {
	var start=this._min_date.valueOf()+(pos.y*this.config.time_step+(this._table_view?0:pos.x)*24*60)*60000;
	return new Date(this._correct_shift(start));
};
// n_ev - native event
scheduler.getActionData = function(n_ev) {
	var pos = this._mouse_coords(n_ev);
	return {
		date:this._get_date_from_pos(pos),
		section:pos.section
	};
};
scheduler._focus = function(node, select){
	if (node && node.focus){
		if (this.config.touch){
			window.setTimeout(function(){ 
				node.focus();
			},100);
		} else {
			if (select && node.select) node.select();
			node.focus();
		}
	}
}
scheduler.date={
	init:function(){
		var s = scheduler.locale.date.month_short;
		var t = scheduler.locale.date.month_short_hash = {};
		for (var i = 0; i < s.length; i++)
			t[s[i]]=i;

		var s = scheduler.locale.date.month_full;
		var t = scheduler.locale.date.month_full_hash = {};
		for (var i = 0; i < s.length; i++)
			t[s[i]]=i;
	},
	date_part:function(date){
		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);
		if (date.getHours() != 0)
			date.setTime(date.getTime() + 60 * 60 * 1000 * (24 - date.getHours()));
		return date;
	},
	time_part:function(date){
		return (date.valueOf()/1000 - date.getTimezoneOffset()*60)%86400;
	},
	week_start:function(date){
		var shift=date.getDay();
		if (scheduler.config.start_on_monday){
			if (shift===0) shift=6;
			else shift--;
		}
		return this.date_part(this.add(date,-1*shift,"day"));
	},
	month_start:function(date){
		date.setDate(1);
		return this.date_part(date);
	},
	year_start:function(date){
		date.setMonth(0);
		return this.month_start(date);
	},
	day_start:function(date){
		return this.date_part(date);
	},
	add:function(date,inc,mode){
		var ndate=new Date(date.valueOf());
		switch(mode){
			case "week":
				inc *= 7;
			case "day":
				ndate.setDate(ndate.getDate() + inc);
				if (!date.getHours() && ndate.getHours()) //shift to yesterday
					ndate.setTime(ndate.getTime() + 60 * 60 * 1000 * (24 - ndate.getHours()));
				break;
			case "month": ndate.setMonth(ndate.getMonth()+inc); break;
			case "year": ndate.setYear(ndate.getFullYear()+inc); break;
			case "hour": ndate.setHours(ndate.getHours()+inc); break;
			case "minute": ndate.setMinutes(ndate.getMinutes()+inc); break;
			default:
				return scheduler.date["add_"+mode](date,inc,mode);
		}
		return ndate;
	},
	to_fixed:function(num){
		if (num<10)	return "0"+num;
		return num;
	},
	copy:function(date){
		return new Date(date.valueOf());
	},
	date_to_str:function(format,utc){
		format=format.replace(/%[a-zA-Z]/g,function(a){
			switch(a){
				case "%d": return "\"+scheduler.date.to_fixed(date.getDate())+\"";
				case "%m": return "\"+scheduler.date.to_fixed((date.getMonth()+1))+\"";
				case "%j": return "\"+date.getDate()+\"";
				case "%n": return "\"+(date.getMonth()+1)+\"";
				case "%y": return "\"+scheduler.date.to_fixed(date.getFullYear()%100)+\""; 
				case "%Y": return "\"+date.getFullYear()+\"";
				case "%D": return "\"+scheduler.locale.date.day_short[date.getDay()]+\"";
				case "%l": return "\"+scheduler.locale.date.day_full[date.getDay()]+\"";
				case "%M": return "\"+scheduler.locale.date.month_short[date.getMonth()]+\"";
				case "%F": return "\"+scheduler.locale.date.month_full[date.getMonth()]+\"";
				case "%h": return "\"+scheduler.date.to_fixed((date.getHours()+11)%12+1)+\"";
				case "%g": return "\"+((date.getHours()+11)%12+1)+\"";
				case "%G": return "\"+date.getHours()+\"";
				case "%H": return "\"+scheduler.date.to_fixed(date.getHours())+\"";
				case "%i": return "\"+scheduler.date.to_fixed(date.getMinutes())+\"";
				case "%a": return "\"+(date.getHours()>11?\"pm\":\"am\")+\"";
				case "%A": return "\"+(date.getHours()>11?\"PM\":\"AM\")+\"";
				case "%s": return "\"+scheduler.date.to_fixed(date.getSeconds())+\"";
				case "%W": return "\"+scheduler.date.to_fixed(scheduler.date.getISOWeek(date))+\"";
				default: return a;
			}
		});
		if (utc) format=format.replace(/date\.get/g,"date.getUTC");
		return new Function("date","return \""+format+"\";");
	},
	str_to_date:function(format,utc){
		var splt="var temp=date.match(/[a-zA-Z]+|[0-9]+/g);";
		var mask=format.match(/%[a-zA-Z]/g);
		for (var i=0; i<mask.length; i++){
			switch(mask[i]){
				case "%j":
				case "%d": splt+="set[2]=temp["+i+"]||1;";
					break;
				case "%n":
				case "%m": splt+="set[1]=(temp["+i+"]||1)-1;";
					break;
				case "%y": splt+="set[0]=temp["+i+"]*1+(temp["+i+"]>50?1900:2000);";
					break;
				case "%g":
				case "%G":
				case "%h": 
				case "%H":
							splt+="set[3]=temp["+i+"]||0;";
					break;
				case "%i":
							splt+="set[4]=temp["+i+"]||0;";
					break;
				case "%Y": splt+="set[0]=temp["+i+"]||0;";
					break;
				case "%a":					
				case "%A": splt+="set[3]=set[3]%12+((temp["+i+"]||'').toLowerCase()=='am'?0:12);";
					break;					
				case "%s": splt+="set[5]=temp["+i+"]||0;";
					break;
				case "%M": splt+="set[1]=scheduler.locale.date.month_short_hash[temp["+i+"]]||0;";
					break;
				case "%F": splt+="set[1]=scheduler.locale.date.month_full_hash[temp["+i+"]]||0;";
					break;
				default:
					break;
			}
		}
		var code ="set[0],set[1],set[2],set[3],set[4],set[5]";
		if (utc) code =" Date.UTC("+code+")";
		return new Function("date","var set=[0,0,1,0,0,0]; "+splt+" return new Date("+code+");");
	},
	getISOWeek: function(ndate) {
		if(!ndate) return false;
		var nday = ndate.getDay();
		if (nday === 0) {
			nday = 7;
		}
		var first_thursday = new Date(ndate.valueOf());
		first_thursday.setDate(ndate.getDate() + (4 - nday));
		var year_number = first_thursday.getFullYear(); // year of the first Thursday
		var ordinal_date = Math.round( (first_thursday.getTime() - new Date(year_number, 0, 1).getTime()) / 86400000); //ordinal date of the first Thursday - 1 (so not really ordinal date)
		var week_number = 1 + Math.floor( ordinal_date / 7);
		return week_number;
	},
	getUTCISOWeek: function(ndate){
		return this.getISOWeek(ndate);
	},
	convert_to_utc: function(date) {
		return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	}
};
scheduler.locale = {
	date:{
		month_full:["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		month_short:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		day_full:["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		day_short:["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	},
	labels:{
		dhx_cal_today_button:"Today",
		day_tab:"Day",
		week_tab:"Week",
		month_tab:"Month",
		new_event:"New event",
		icon_save:"Save",
		icon_cancel:"Cancel",
		icon_details:"Details",
		icon_edit:"Edit",
		icon_delete:"Delete",
		confirm_closing:"",//Your changes will be lost, are your sure ?
		confirm_deleting:"Event will be deleted permanently, are you sure?",
		section_description:"Description",
		section_time:"Time period",
		full_day:"Full day",

		/*recurring events*/
		confirm_recurring:"Do you want to edit the whole set of repeated events?",
		section_recurring:"Repeat event",
		button_recurring:"Disabled",
		button_recurring_open:"Enabled",
		button_edit_series: "Edit series",
		button_edit_occurrence: "Edit occurrence",

		/*agenda view extension*/
		agenda_tab:"Agenda",
		date:"Date",
		description:"Description",

		/*year view extension*/
		year_tab:"Year",

		/* week agenda extension */
		week_agenda_tab: "Agenda",

		/*grid view extension*/
		grid_tab: "Grid",
		drag_to_create:"Drag to create",
		drag_to_move:"Drag to move"
	}
};


/*
%e	Day of the month without leading zeros (01..31)
%d	Day of the month, 2 digits with leading zeros (01..31)
%j	Day of the year, 3 digits with leading zeros (001..366)
%a	A textual representation of a day, two letters
%W	A full textual representation of the day of the week

%c	Numeric representation of a month, without leading zeros (0..12)
%m	Numeric representation of a month, with leading zeros (00..12)
%b	A short textual representation of a month, three letters (Jan..Dec)
%M	A full textual representation of a month, such as January or March (January..December)

%y	A two digit representation of a year (93..03)
%Y	A full numeric representation of a year, 4 digits (1993..03)
*/

scheduler.config={
	default_date: "%j %M %Y",
	month_date: "%F %Y",
	load_date: "%Y-%m-%d",
	week_date: "%l",
	day_date: "%D, %F %j",
	hour_date: "%H:%i",
	month_day: "%d",
	xml_date: "%m/%d/%Y %H:%i",
	api_date: "%d-%m-%Y %H:%i",

	hour_size_px: 42,
	time_step: 5,

	start_on_monday: 1,
	first_hour: 0,
	last_hour: 24,
	readonly: false,
	drag_resize: 1,
	drag_move: 1,
	drag_create: 1,
	dblclick_create: 1,
	edit_on_create: 1,
	details_on_create: 0,
	click_form_details: 0,

	cascade_event_display: false,
	cascade_event_count: 4,
	cascade_event_margin: 30,

	multi_day_height_limit: 0,

	drag_lightbox: true,
	preserve_scroll: true,
	select: true,

	server_utc: false,
	touch:"force",
	touch_tip:true,
	touch_drag:500,
	quick_info_detached:true,

	positive_closing: false,

	icons_edit: ["icon_save", "icon_cancel"],
	icons_select: ["icon_details", "icon_edit", "icon_delete"],
	buttons_left: ["dhx_save_btn", "dhx_cancel_btn"],
	buttons_right: ["dhx_delete_btn"],
	lightbox: {
		sections: [
			{name: "description", height: 200, map_to: "text", type: "textarea", focus: true},
			{name: "time", height: 72, type: "time", map_to: "auto"}
		]
	},
	highlight_displayed_event: true,
	displayed_event_color: "#ffc5ab",
	displayed_event_text_color: "#7e2727",

	left_border: false
};
scheduler.templates={};
scheduler.init_templates=function(){
	var labels = scheduler.locale.labels;
	labels.dhx_save_btn 	= labels.icon_save;
	labels.dhx_cancel_btn 	= labels.icon_cancel;
	labels.dhx_delete_btn 	= labels.icon_delete;


	var d=scheduler.date.date_to_str;
	var c=scheduler.config;
	var f = function(a,b){
		for (var c in b)
			if (!a[c]) a[c]=b[c];
	};
	f(scheduler.templates,{
		day_date:d(c.default_date),
		month_date:d(c.month_date),
		week_date:function(d1,d2){
			return scheduler.templates.day_date(d1)+" &ndash; "+scheduler.templates.day_date(scheduler.date.add(d2,-1,"day"));
		},
		day_scale_date:d(c.default_date),
		month_scale_date:d(c.week_date),
		week_scale_date:d(c.day_date),
		hour_scale:d(c.hour_date),
		time_picker:d(c.hour_date),
		event_date:d(c.hour_date),
		month_day:d(c.month_day),
		xml_date:scheduler.date.str_to_date(c.xml_date,c.server_utc),
		load_format:d(c.load_date,c.server_utc),
		xml_format:d(c.xml_date,c.server_utc),
		api_date:scheduler.date.str_to_date(c.api_date),
		event_header:function(start,end,ev){
			return scheduler.templates.event_date(start)+" - "+scheduler.templates.event_date(end);
		},
		event_text:function(start,end,ev){
			return ev.text;
		},
		event_class:function(start,end,ev){
			return "";
		},
		month_date_class:function(d){
			return "";
		},
		week_date_class:function(d){
			return "";
		},
		event_bar_date:function(start,end,ev){
			return scheduler.templates.event_date(start)+" ";
		},
		event_bar_text:function(start,end,ev){
			return ev.text;
		}
	});
	this.callEvent("onTemplatesReady",[]);
};



scheduler.uid = function() {
	if (!this._seed) this._seed = (new Date).valueOf();
	return this._seed++;
};
scheduler._events = {};
scheduler.clearAll = function() {
	this._events = {};
	this._loaded = {};
	this.clear_view();
	this.callEvent("onClearAll", []);
};
scheduler.addEvent = function(start_date, end_date, text, id, extra_data) {
	if (!arguments.length)
		return this.addEventNow();
	var ev = start_date;
	if (arguments.length != 1) {
		ev = extra_data || {};
		ev.start_date = start_date;
		ev.end_date = end_date;
		ev.text = text;
		ev.id = id;
	}
	ev.id = ev.id || scheduler.uid();
	ev.text = ev.text || "";

	if (typeof ev.start_date == "string")  ev.start_date = this.templates.api_date(ev.start_date);
	if (typeof ev.end_date == "string")  ev.end_date = this.templates.api_date(ev.end_date);

	var d = (this.config.event_duration || this.config.time_step) * 60000;
	if (ev.start_date.valueOf() == ev.end_date.valueOf())
		ev.end_date.setTime(ev.end_date.valueOf() + d);

	ev._timed = this.is_one_day_event(ev);

	var is_new = !this._events[ev.id];
	this._events[ev.id] = ev;
	this.event_updated(ev);
	if (!this._loading)
		this.callEvent(is_new ? "onEventAdded" : "onEventChanged", [ev.id, ev]);
	return ev.id;
};
scheduler.deleteEvent = function(id, silent) {
	var ev = this._events[id];
	if (!silent && (!this.callEvent("onBeforeEventDelete", [id, ev]) || !this.callEvent("onConfirmedBeforeEventDelete", [id, ev])))
		return;
	if (ev) {
		delete this._events[id];
		this.unselect(id);
		this.event_updated(ev);
	}

	this.callEvent("onEventDeleted", [id, ev]);
};
scheduler.getEvent = function(id) {
	return this._events[id];
};
scheduler.setEvent = function(id, hash) {
	this._events[id] = hash;
};
scheduler.for_rendered = function(id, method) {
	for (var i = this._rendered.length - 1; i >= 0; i--)
		if (this._rendered[i].getAttribute("event_id") == id)
			method(this._rendered[i], i);
};
scheduler.changeEventId = function(id, new_id) {
	if (id == new_id) return;
	var ev = this._events[id];
	if (ev) {
		ev.id = new_id;
		this._events[new_id] = ev;
		delete this._events[id];
	}
	this.for_rendered(id, function(r) {
		r.setAttribute("event_id", new_id);
	});
	if (this._select_id == id) this._select_id = new_id;
	if (this._edit_id == id) this._edit_id = new_id;
	//if (this._drag_id==id) this._drag_id=new_id;
	this.callEvent("onEventIdChange", [id, new_id]);
};

(function() {
	var attrs = ["text", "Text", "start_date", "StartDate", "end_date", "EndDate"];
	var create_getter = function(name) {
		return function(id) { return (scheduler.getEvent(id))[name]; };
	};
	var create_setter = function(name) {
		return function(id, value) {
			var ev = scheduler.getEvent(id);
			ev[name] = value;
			ev._changed = true;
			ev._timed = this.is_one_day_event(ev);
			scheduler.event_updated(ev, true);
		};
	};
	for (var i = 0; i < attrs.length; i += 2) {
		scheduler["getEvent" + attrs[i + 1]] = create_getter(attrs[i]);
		scheduler["setEvent" + attrs[i + 1]] = create_setter(attrs[i]);
	}
})();

scheduler.event_updated = function(ev, force) {
	if (this.is_visible_events(ev))
		this.render_view_data();
	else
		this.clear_event(ev.id);
};
scheduler.is_visible_events = function(ev) {
	return (ev.start_date < this._max_date && this._min_date < ev.end_date);
};
scheduler.is_one_day_event = function(ev) {
	var delta = ev.end_date.getDate() - ev.start_date.getDate();

	if (!delta)
		return ev.start_date.getMonth() == ev.end_date.getMonth() && ev.start_date.getFullYear() == ev.end_date.getFullYear();
	else {
		if (delta < 0)  delta = Math.ceil((ev.end_date.valueOf() - ev.start_date.valueOf()) / (24 * 60 * 60 * 1000));
		return (delta == 1 && !ev.end_date.getHours() && !ev.end_date.getMinutes() && (ev.start_date.getHours() || ev.start_date.getMinutes() ));
	}

};
scheduler.get_visible_events = function(only_timed) {
	//not the best strategy for sure
	var stack = [];

	for (var id in this._events)
		if (this.is_visible_events(this._events[id]))
			if (!only_timed || this._events[id]._timed)
				if (this.filter_event(id, this._events[id]))
					stack.push(this._events[id]);

	return stack;
};
scheduler.filter_event = function(id, ev) {
	var filter = this["filter_" + this._mode];
	return (filter) ? filter(id, ev) : true;
};
scheduler.render_view_data = function(evs, hold) {
	if (!evs) {
		if (this._not_render) {
			this._render_wait = true;
			return;
		}
		this._render_wait = false;

		this.clear_view();
		evs = this.get_visible_events(!(this._table_view || this.config.multi_day));
	}

	if (this.config.multi_day && !this._table_view) {

		var tvs = [];
		var tvd = [];
		for (var i = 0; i < evs.length; i++) {
			if (evs[i]._timed)
				tvs.push(evs[i]); 
			else
				tvd.push(evs[i]);
		}

		// multiday events
		this._rendered_location = this._els['dhx_multi_day'][0];
		this._table_view = true;
		this.render_data(tvd, hold);
		this._table_view = false;

		// normal events
		this._rendered_location = this._els['dhx_cal_data'][0];
		this._table_view = false;
		this.render_data(tvs, hold);

	} else {
		this._rendered_location = this._els['dhx_cal_data'][0];
		this.render_data(evs, hold);
	}
};
scheduler.render_data = function(evs, hold) {
	evs = this._pre_render_events(evs, hold);
	for (var i = 0; i < evs.length; i++)
		if (this._table_view)
			this.render_event_bar(evs[i]);
		else
			this.render_event(evs[i]);
};
scheduler._pre_render_events = function(evs, hold) {
	var hb = this.xy.bar_height;
	var h_old = this._colsS.heights;
	var h = this._colsS.heights = [0, 0, 0, 0, 0, 0, 0];
	var data = this._els["dhx_cal_data"][0];

	if (!this._table_view)
		evs = this._pre_render_events_line(evs, hold); //ignore long events for now
	else
		evs = this._pre_render_events_table(evs, hold);

	if (this._table_view) {
		if (hold)
			this._colsS.heights = h_old;
		else {
			var evl = data.firstChild;
			if (evl.rows) {
				for (var i = 0; i < evl.rows.length; i++) {
					h[i]++;
					if ((h[i]) * hb > this._colsS.height - 22) { // 22 - height of cell's header
						//we have overflow, update heights
						var cells = evl.rows[i].cells;
						for (var j = 0; j < cells.length; j++) {
							cells[j].childNodes[1].style.height = h[i] * hb + "px";
						}
						h[i] = (h[i - 1] || 0) + cells[0].offsetHeight;
					}
					h[i] = (h[i - 1] || 0) + evl.rows[i].cells[0].offsetHeight;
				}
				h.unshift(0);
				if (evl.parentNode.offsetHeight < evl.parentNode.scrollHeight && !evl._h_fix && scheduler.xy.scroll_width) {
					//we have v-scroll, decrease last day cell
					for (var i = 0; i < evl.rows.length; i++) {
						var cell = evl.rows[i].cells[6].childNodes[0];
						var w = cell.offsetWidth - scheduler.xy.scroll_width + "px";
						cell.style.width = w;
						cell.nextSibling.style.width = w;
					}
					evl._h_fix = true;
				}
			} else {
				if (!evs.length && this._els["dhx_multi_day"][0].style.visibility == "visible")
					h[0] = -1;
				if (evs.length || h[0] == -1) {
					//shift days to have space for multiday events
					var childs = evl.parentNode.childNodes;

					// +1 so multiday events would have 2px from top and 2px from bottom by default
					var full_multi_day_height = (h[0] + 1) * hb + 1;

					var used_multi_day_height = full_multi_day_height;
					var used_multi_day_height_css = full_multi_day_height + "px";
					if (this.config.multi_day_height_limit) {
						used_multi_day_height = Math.min(full_multi_day_height, this.config.multi_day_height_limit) ;
						used_multi_day_height_css = used_multi_day_height + "px";
					}

					data.style.top = (this._els["dhx_cal_navline"][0].offsetHeight + this._els["dhx_cal_header"][0].offsetHeight + used_multi_day_height ) + 'px';
					data.style.height = (this._obj.offsetHeight - parseInt(data.style.top, 10) - (this.xy.margin_top || 0)) + 'px';

					var multi_day_section = this._els["dhx_multi_day"][0];
					multi_day_section.style.height = used_multi_day_height_css;
					multi_day_section.style.visibility = (h[0] == -1 ? "hidden" : "visible");

					// icon
					var multi_day_icon = this._els["dhx_multi_day"][1];
					multi_day_icon.style.height = used_multi_day_height_css;
					multi_day_icon.style.visibility = (h[0] == -1 ? "hidden" : "visible");
					multi_day_icon.className = h[0] ? "dhx_multi_day_icon" : "dhx_multi_day_icon_small";
					this._dy_shift = (h[0] + 1) * hb;
					h[0] = 0;

					if (used_multi_day_height != full_multi_day_height) {
						data.style.top = (parseInt(data.style.top) + 2) + "px";

						multi_day_section.style.overflowY = "auto";
						multi_day_section.style.width = (parseInt(multi_day_section.style.width) - 2) + "px";

						multi_day_icon.style.position = "fixed";
						multi_day_icon.style.top = "";
						multi_day_icon.style.left = "";
					}
				}
			}
		}
	}

	return evs;
};
scheduler._get_event_sday = function(ev) {
	return Math.floor((ev.start_date.valueOf() - this._min_date.valueOf()) / (24 * 60 * 60 * 1000));
};
scheduler._get_event_mapped_end_date = function(ev) {
	var end_date = ev.end_date;
	if (this.config.separate_short_events) {
		var ev_duration = (ev.end_date - ev.start_date) / 60000; // minutes
		if (ev_duration < this._min_mapped_duration) {
			end_date = this.date.add(end_date, this._min_mapped_duration - ev_duration, "minute");
		}
	}
	return end_date;
};
scheduler._pre_render_events_line = function(evs, hold) {
	evs.sort(function(a, b) {
		if (a.start_date.valueOf() == b.start_date.valueOf())
			return a.id > b.id ? 1 : -1;
		return a.start_date > b.start_date ? 1 : -1;
	});
	var days = []; //events by weeks
	var evs_originals = [];

	this._min_mapped_duration = Math.ceil(this.xy.min_event_height * 60 / this.config.hour_size_px);  // values could change along the way

	for (var i = 0; i < evs.length; i++) {
		var ev = evs[i];

		//check date overflow
		var sd = ev.start_date;
		var ed = ev.end_date;
		//check scale overflow
		var sh = sd.getHours();
		var eh = ed.getHours();

		ev._sday = this._get_event_sday(ev); // sday based on event start_date
		if (!days[ev._sday]) days[ev._sday] = [];

		if (!hold) {
			ev._inner = false;

			var stack = days[ev._sday];

			while (stack.length) {
				var t_ev = stack[stack.length - 1];
				var t_end_date = this._get_event_mapped_end_date(t_ev);
				if (t_end_date.valueOf() <= ev.start_date.valueOf()) {
					stack.splice(stack.length - 1, 1);
				} else {
					break;
				}
			}

			var sorderSet = false;
			for (var j = 0; j < stack.length; j++) {
				var t_ev = stack[j];
				var t_end_date = this._get_event_mapped_end_date(t_ev);
				if (t_end_date.valueOf() <= ev.start_date.valueOf()) {
					sorderSet = true;
					ev._sorder = t_ev._sorder;
					stack.splice(j, 1);
					ev._inner = true;
					break;
				}
			}

			if (stack.length)
				stack[stack.length - 1]._inner = true;

			if (!sorderSet) {
				if (stack.length) {
					if (stack.length <= stack[stack.length - 1]._sorder) {
						if (!stack[stack.length - 1]._sorder)
							ev._sorder = 0;
						else
							for (j = 0; j < stack.length; j++) {
								var _is_sorder = false;
								for (var k = 0; k < stack.length; k++) {
									if (stack[k]._sorder == j) {
										_is_sorder = true;
										break;
									}
								}
								if (!_is_sorder) {
									ev._sorder = j;
									break;
								}
							}
						ev._inner = true;
					} else {
						var _max_sorder = stack[0]._sorder;
						for (j = 1; j < stack.length; j++) {
							if (stack[j]._sorder > _max_sorder)
								_max_sorder = stack[j]._sorder;
						}
						ev._sorder = _max_sorder + 1;
						ev._inner = false;
					}

				} else
					ev._sorder = 0;
			}

			stack.push(ev);

			if (stack.length > (stack.max_count || 0)) {
				stack.max_count = stack.length;
				ev._count = stack.length;
			} else {
				ev._count = (ev._count) ? ev._count : 1;
			}
		}

		if (sh < this.config.first_hour || eh >= this.config.last_hour) {
			// Need to create copy of event as we will be changing it's start/end date
			// e.g. first_hour = 11 and event.start_date hours = 9. Need to preserve that info
			evs_originals.push(ev);
			evs[i] = ev = this._copy_event(ev);

			if (sh < this.config.first_hour) {
				ev.start_date.setHours(this.config.first_hour);
				ev.start_date.setMinutes(0);
			}
			if (eh >= this.config.last_hour) {
				ev.end_date.setMinutes(0);
				ev.end_date.setHours(this.config.last_hour);
			}

			if (ev.start_date > ev.end_date || sh == this.config.last_hour) {
				evs.splice(i, 1);
				i--;
				continue;
			}
		}
	}
	if (!hold) {
		for (var i = 0; i < evs.length; i++) {
			evs[i]._count = days[evs[i]._sday].max_count;
		}
		for (var i = 0; i < evs_originals.length; i++)
			evs_originals[i]._count = days[evs_originals[i]._sday].max_count;
	}

	return evs;
};
scheduler._time_order = function(evs) {
	evs.sort(function(a, b) {
		if (a.start_date.valueOf() == b.start_date.valueOf()) {
			if (a._timed && !b._timed) return 1;
			if (!a._timed && b._timed) return -1;
			return a.id > b.id ? 1 : -1;
		}
		return a.start_date > b.start_date ? 1 : -1;
	});
};
scheduler._pre_render_events_table = function(evs, hold) { // max - max height of week slot
	this._time_order(evs);
	var out = [];
	var weeks = [
		[],
		[],
		[],
		[],
		[],
		[],
		[]
	]; //events by weeks
	var max = this._colsS.heights;
	var start_date;
	var cols = this._cols.length;
	var chunks_info = {};

	for (var i = 0; i < evs.length; i++) {
		var ev = evs[i];
		var id = ev.id;
		if (!chunks_info[id]) {
			chunks_info[id] = {
				first_chunk: true,
				last_chunk: true
			};
		}
		var chunk_info = chunks_info[id];
		var sd = (start_date || ev.start_date);
		var ed = ev.end_date;
		//trim events which are crossing through current view
		if (sd < this._min_date) {
			chunk_info.first_chunk = false;
			sd = this._min_date;
		}
		if (ed > this._max_date) {
			chunk_info.last_chunk = false;
			ed = this._max_date;
		}

		var locate_s = this.locate_holder_day(sd, false, ev);
		ev._sday = locate_s % cols;
		var locate_e = this.locate_holder_day(ed, true, ev) || cols;
		ev._eday = (locate_e % cols) || cols; //cols used to fill full week, when event end on monday
		ev._length = locate_e - locate_s;

		//3600000 - compensate 1 hour during winter|summer time shift
		ev._sweek = Math.floor((this._correct_shift(sd.valueOf(), 1) - this._min_date.valueOf()) / (60 * 60 * 1000 * 24 * cols));

		//current slot
		var stack = weeks[ev._sweek];
		//check order position
		var stack_line;

		for (stack_line = 0; stack_line < stack.length; stack_line++)
			if (stack[stack_line]._eday <= ev._sday)
				break;

		if (!ev._sorder || !hold) {
			ev._sorder = stack_line;
		}

		if (ev._sday + ev._length <= cols) {
			start_date = null;
			out.push(ev);
			stack[stack_line] = ev;
			//get max height of slot
			max[ev._sweek] = stack.length - 1;
			ev._first_chunk = chunk_info.first_chunk;
			ev._last_chunk = chunk_info.last_chunk;
		} else { // split long event in chunks
			var copy = this._copy_event(ev);
			copy.id = ev.id;
			copy._length = cols - ev._sday;
			copy._eday = cols;
			copy._sday = ev._sday;
			copy._sweek = ev._sweek;
			copy._sorder = ev._sorder;
			copy.end_date = this.date.add(sd, copy._length, "day");
			copy._first_chunk = chunk_info.first_chunk;
			if (chunk_info.first_chunk) {
				chunk_info.first_chunk = false;
			}

			out.push(copy);
			stack[stack_line] = copy;
			start_date = copy.end_date;
			//get max height of slot
			max[ev._sweek] = stack.length - 1;
			i--;
			continue;  //repeat same step
		}
	}
	return out;
};
scheduler._copy_dummy = function() {
	var a = new Date(this.start_date);
	var b = new Date(this.end_date);
	this.start_date = a;
	this.end_date = b;
};
scheduler._copy_event = function(ev) {
	this._copy_dummy.prototype = ev;
	return new this._copy_dummy();
	//return {start_date:ev.start_date, end_date:ev.end_date, text:ev.text, id:ev.id}
};
scheduler._rendered = [];
scheduler.clear_view = function() {
	for (var i = 0; i < this._rendered.length; i++) {
		var obj = this._rendered[i];
		if (obj.parentNode) obj.parentNode.removeChild(obj);
	}
	this._rendered = [];
};
scheduler.updateEvent = function(id) {
	var ev = this.getEvent(id);
	this.clear_event(id);

	if (ev && this.is_visible_events(ev) && this.filter_event(id, ev) && (this._table_view || this.config.multi_day || ev._timed)) {
		if (this.config.update_render)
			this.render_view_data(); 
		else
			this.render_view_data([ev], true);
	}
};
scheduler.clear_event = function(id) {
	this.for_rendered(id, function(node, i) {
		if (node.parentNode)
			node.parentNode.removeChild(node);
		scheduler._rendered.splice(i, 1);
	});
};



scheduler.render_event = function(ev) {

	var menu = scheduler.xy.menu_width;
	var menu_offset = (this.config.use_select_menu_space) ? 0 : menu;
	if (ev._sday < 0) return; //can occur in case of recurring event during time shift
	var parent = scheduler.locate_holder(ev._sday);
	if (!parent) return; //attempt to render non-visible event
	var sm = ev.start_date.getHours() * 60 + ev.start_date.getMinutes();
	var em = (ev.end_date.getHours() * 60 + ev.end_date.getMinutes()) || (scheduler.config.last_hour * 60);
	var ev_count = ev._count || 1;
	var ev_sorder = ev._sorder || 0;
	var top = (Math.round((sm * 60 * 1000 - this.config.first_hour * 60 * 60 * 1000) * this.config.hour_size_px / (60 * 60 * 1000))) % (this.config.hour_size_px * 24); //42px/hour
	var height = Math.max(scheduler.xy.min_event_height, (em - sm) * this.config.hour_size_px / 60); //42px/hour
	var width = Math.floor((parent.clientWidth - menu_offset) / ev_count);
	var left = ev_sorder * width + 1;
	if (!ev._inner) width = width * (ev_count - ev_sorder);
	if (this.config.cascade_event_display) {
		var limit = this.config.cascade_event_count;
		var margin = this.config.cascade_event_margin;
		left = ev_sorder % limit * margin;
		var right = (ev._inner) ? (ev_count - ev_sorder - 1) % limit * margin / 2 : 0;
		width = Math.floor(parent.clientWidth - menu_offset - left - right);
	}

	var d = this._render_v_bar(ev.id, menu_offset + left, top, width, height, ev._text_style, scheduler.templates.event_header(ev.start_date, ev.end_date, ev), scheduler.templates.event_text(ev.start_date, ev.end_date, ev));

	this._rendered.push(d);
	parent.appendChild(d);

	left = left + parseInt(parent.style.left, 10) + menu_offset;

	if (this._edit_id == ev.id) {

		d.style.zIndex = 1; //fix overlapping issue
		width = Math.max(width - 4, scheduler.xy.editor_width);
		d = document.createElement("DIV");
		d.setAttribute("event_id", ev.id);
		this.set_xy(d, width, height - 20, left, top + 14);
		d.className = "dhx_cal_editor";

		var d2 = document.createElement("DIV");
		this.set_xy(d2, width - 6, height - 26);
		d2.style.cssText += ";margin:2px 2px 2px 2px;overflow:hidden;";

		d.appendChild(d2);
		this._els["dhx_cal_data"][0].appendChild(d);
		this._rendered.push(d);

		d2.innerHTML = toStaticHTML("<textarea class='dhx_cal_editor'>" + ev.text + "</textarea>");
		if (this._quirks7) d2.firstChild.style.height = height - 12 + "px"; //IEFIX
		this._editor = d2.firstChild;
		this._editor.onkeydown = function(e) {
			if ((e || event).shiftKey) return true;
			var code = (e || event).keyCode;
			if (code == scheduler.keys.edit_save) scheduler.editStop(true);
			if (code == scheduler.keys.edit_cancel) scheduler.editStop(false);
		};
		this._editor.onselectstart = function (e) {
			return (e || event).cancelBubble = true;
		};
		scheduler._focus(d2.firstChild, true);
		//IE and opera can add x-scroll during focusing
		this._els["dhx_cal_data"][0].scrollLeft = 0;
	}
	if (this.xy.menu_width !== 0 && this._select_id == ev.id) {
		if (this.config.cascade_event_display && this._drag_mode)
			d.style.zIndex = 1; //fix overlapping issue for cascade view in case of dnd of selected event
		var icons = this.config["icons_" + ((this._edit_id == ev.id) ? "edit" : "select")];
		var icons_str = "";
		var bg_color = (ev.color ? ("background-color: " + ev.color + ";") : "");
		var color = (ev.textColor ? ("color: " + ev.textColor + ";") : "");
		for (var i = 0; i < icons.length; i++)
			icons_str += "<div class='dhx_menu_icon " + icons[i] + "' style='" + bg_color + "" + color + "' title='" + this.locale.labels[icons[i]] + "'></div>";
		var obj = this._render_v_bar(ev.id, left - menu + 1, top, menu, icons.length * 20 + 26 - 2, "", "<div style='" + bg_color + "" + color + "' class='dhx_menu_head'></div>", icons_str, true);
		obj.style.left = left - menu + 1;
		this._els["dhx_cal_data"][0].appendChild(obj);
		this._rendered.push(obj);
	}

};



scheduler._render_v_bar = function (id, x, y, w, h, style, contentA, contentB, bottom) {
	var d = document.createElement("DIV");
	var ev = this.getEvent(id);

	var cs = (bottom) ? "dhx_cal_event dhx_cal_select_menu" : "dhx_cal_event";

	var cse = scheduler.templates.event_class(ev.start_date, ev.end_date, ev);
	if (cse) cs = cs + " " + cse;

	var bg_color = (ev.color ? ("background:" + ev.color + ";") : "");
	var color = (ev.textColor ? ("color:" + ev.textColor + ";") : "");

	var html = '<div class="' + cs + '" style="position:absolute; top:' + y + 'px; left:' + x + 'px; width:' + (w - 4) + 'px; height:' + h + 'px;' + (style || "") + '"></div>';
	d.innerHTML =toStaticHTML( html);
    d.firstChild.setAttribute("event_id", id);

	var container = d.cloneNode(true).firstChild;

	if (scheduler.renderEvent && !bottom && scheduler.renderEvent(container, ev)) {
		return container;
	} else {
		container = d.firstChild;

		var inner_html = '<div class="dhx_event_move dhx_header" style=" width:' + (w - 6) + 'px;' + bg_color + '" >&nbsp;</div>';
		inner_html += '<div class="dhx_event_move dhx_title" style="' + bg_color + '' + color + '">' + contentA + '</div>';
		inner_html += '<div class="dhx_body" style=" width:' + (w - (this._quirks ? 4 : 14)) + 'px; height:' + (h - (this._quirks ? 20 : 30) + 1) + 'px;' + bg_color + '' + color + '">' + contentB + '</div>'; // +2 css specific, moved from render_event

		var footer_class = "dhx_event_resize dhx_footer";
		if (bottom)
			footer_class = "dhx_resize_denied " + footer_class;

		inner_html += '<div class="' + footer_class + '" style=" width:' + (w - 8) + 'px;' + (bottom ? ' margin-top:-1px;' : '') + '' + bg_color + '' + color + '" ></div>';

		container.innerHTML = toStaticHTML(inner_html);
	}

	return container;
};
scheduler.locate_holder = function(day) {
	if (this._mode == "day") return this._els["dhx_cal_data"][0].firstChild; //dirty
	return this._els["dhx_cal_data"][0].childNodes[day];
};
scheduler.locate_holder_day = function(date, past) {
	var day = Math.floor((this._correct_shift(date, 1) - this._min_date) / (60 * 60 * 24 * 1000));
	//when locating end data of event , we need to use next day if time part was defined
	if (past && this.date.time_part(date)) day++;
	return day;
};


scheduler.render_event_bar = function (ev) {
	var parent = this._rendered_location;

	var x = this._colsS[ev._sday];
	var x2 = this._colsS[ev._eday];
	if (x2 == x) x2 = this._colsS[ev._eday + 1];
	var hb = this.xy.bar_height;

	var y_event_offset = (ev.id == this._drag_id) ? 0 : ev._sorder * hb;
	var y = this._colsS.heights[ev._sweek] + (this._colsS.height ? (this.xy.month_scale_height + 2) : 2 ) + y_event_offset;

	var d = document.createElement("DIV");
	var cs = "dhx_cal_event_clear";
	if (!ev._timed) {
		cs = "dhx_cal_event_line";
		if (ev.hasOwnProperty("_first_chunk") && ev._first_chunk)
			cs += " dhx_cal_event_line_start";
		if (ev.hasOwnProperty("_last_chunk") && ev._last_chunk)
			cs += " dhx_cal_event_line_end";
	}

	var cse = scheduler.templates.event_class(ev.start_date, ev.end_date, ev);
	if (cse) cs = cs + " " + cse;

	var bg_color = (ev.color ? ("background:" + ev.color + ";") : "");
	var color = (ev.textColor ? ("color:" + ev.textColor + ";") : "");

	var html = '<div class="' + cs + '" style="position:absolute; top:' + y + 'px; left:' + x + 'px; width:' + (x2 - x - 15) + 'px;' + color + '' + bg_color + '' + (ev._text_style || "") + '">';

	ev = scheduler.getEvent(ev.id); // ev at this point could be a part of a larged event
	if (ev._timed)
		html += scheduler.templates.event_bar_date(ev.start_date, ev.end_date, ev);
	html += scheduler.templates.event_bar_text(ev.start_date, ev.end_date, ev) + '</div>';
	html += '</div>';

	d.innerHTML =toStaticHTML( html);
    d.firstChild.setAttribute("event_id", ev.id);

	this._rendered.push(d.firstChild);
	parent.appendChild(d.firstChild);
};

scheduler._locate_event = function(node) {
	var id = null;
	while (node && !id && node.getAttribute) {
		id = node.getAttribute("event_id");
		node = node.parentNode;
	}
	return id;
};

scheduler.edit = function(id) {
	if (this._edit_id == id) return;
	this.editStop(false, id);
	this._edit_id = id;
	this.updateEvent(id);
};
scheduler.editStop = function(mode, id) {
	if (id && this._edit_id == id) return;
	var ev = this.getEvent(this._edit_id);
	if (ev) {
		if (mode) ev.text = this._editor.value;
		this._edit_id = null;
		this._editor = null;
		this.updateEvent(ev.id);
		this._edit_stop_event(ev, mode);
	}
};
scheduler._edit_stop_event = function(ev, mode) {
	if (this._new_event) {
		if (!mode) {
			if (ev) // in case of custom lightbox user can already delete event
				this.deleteEvent(ev.id, true);
		} else {
			this.callEvent("onEventAdded", [ev.id, ev]);
		}
		this._new_event = null;
	} else {
		if (mode)
			this.callEvent("onEventChanged", [ev.id, ev]);
	}
};

scheduler.getEvents = function(from, to) {
	var result = [];
	for (var a in this._events) {
		var ev = this._events[a];
		if (ev && ( (!from && !to) || (ev.start_date < to && ev.end_date > from) ))
			result.push(ev);
	}
	return result;
};
scheduler.getRenderedEvent = function(id) {
	if (!id)
		return;
	var rendered_events = scheduler._rendered;
	for (var i=0; i<rendered_events.length; i++) {
		var rendered_event = rendered_events[i];
		if (rendered_event.getAttribute("event_id") == id) {
			return rendered_event;
		}
	}
	return null;
};
scheduler.showEvent = function(id, mode) {
	var ev = (typeof id == "number" || typeof id == "string") ? scheduler.getEvent(id) : id;
	mode = mode||scheduler._mode;

	if (!ev || (this.checkEvent("onBeforeEventDisplay") && !this.callEvent("onBeforeEventDisplay", [ev, mode])))
		return;

	var scroll_hour = scheduler.config.scroll_hour;
	scheduler.config.scroll_hour = ev.start_date.getHours();
	var preserve_scroll = scheduler.config.preserve_scroll;
	scheduler.config.preserve_scroll = false;

	var original_color = ev.color;
	var original_text_color = ev.textColor;
	if (scheduler.config.highlight_displayed_event) {
		ev.color = scheduler.config.displayed_event_color;
		ev.textColor = scheduler.config.displayed_event_text_color;
	}

	scheduler.setCurrentView(new Date(ev.start_date), mode);

	ev.color = original_color;
	ev.textColor = original_text_color;
	scheduler.config.scroll_hour = scroll_hour;
	scheduler.config.preserve_scroll = preserve_scroll;

	if (scheduler.matrix && scheduler.matrix[mode]) {
		scheduler._els.dhx_cal_data[0].scrollTop = getAbsoluteTop(scheduler.getRenderedEvent(ev.id)) - getAbsoluteTop(scheduler._els.dhx_cal_data[0]) - 20;
	}

	scheduler.callEvent("onAfterEventDisplay", [ev, mode]);
};

scheduler._loaded = {};

scheduler.on_load = function(loader) {
	var evs;
	if (this._process) {
		evs = this[this._process].parse(loader.xmlDoc.responseText);
	} else {
		evs = this._magic_parser(loader);
	}

	scheduler._process_loading(evs);

	this.callEvent("onXLE", []);
};
scheduler._process_loading = function(evs) {
	this._loading = true;
	this._not_render = true;
	for (var i = 0; i < evs.length; i++) {
		if (!this.callEvent("onEventLoading", [evs[i]])) continue;
		this.addEvent(evs[i]);
	}
	this._not_render = false;
	if (this._render_wait) this.render_view_data();

	this._loading = false;
	if (this._after_call) this._after_call();
	this._after_call = null;
};
scheduler._init_event = function(event) {
	event.text = (event.text || event._tagvalue) || "";
	event.start_date = (event.start_date) ? scheduler.templates.xml_date(event.start_date) : null;
	event.end_date = (event.end_date) ? scheduler.templates.xml_date(event.end_date) : null;
};
scheduler.json = {};
scheduler.json.parse = function(data) {
	if (typeof data == "string") {
		scheduler._temp = JSON.parse( data );
		data = (scheduler._temp) ? scheduler._temp.data || scheduler._temp : [];
	}

	if (data.dhx_security)
		dhtmlx.security_key = data.dhx_security;

	var collections = (scheduler._temp && scheduler._temp.collections) ? scheduler._temp.collections : {};
	var collections_loaded = false;
	for (var key in collections) {
		if (collections.hasOwnProperty(key)) {
			collections_loaded = true;
			var collection = collections[key];
			var arr = scheduler.serverList[key];
			if (!arr) continue;
			arr.splice(0, arr.length); //clear old options
			for (var j = 0; j < collection.length; j++) {
				var option = collection[j];
				var obj = { key: option.value, label: option.label }; // resulting option object
				for (var option_key in option) {
					if (option.hasOwnProperty(option_key)) {
						if (option_key == "value" || option_key == "label")
							continue;
						obj[option_key] = option[option_key]; // obj['value'] = option['value']
					}
				}
				arr.push(obj);
			}
		}
	}
	if (collections_loaded)
		scheduler.callEvent("onOptionsLoad", []);

	var evs = [];
	for (var i = 0; i < data.length; i++) {
		var event = data[i];
		scheduler._init_event(event);
		evs.push(event);
	}
	return evs;
};
scheduler.parse = function(data, type) {
	this._process = type;
	this.on_load({xmlDoc: {responseText: data}});
};



//current view by default, or all data if "true" as parameter provided
scheduler.refresh = function(refresh_all) {
    dhtmlx.alert("not implemented");
	/*
	 this._loaded={};
	 this._load();
	 */
};
scheduler.serverList = function(name, array) {
	if (array) {
		return this.serverList[name] = array.slice(0);
	}
	return this.serverList[name] = (this.serverList[name] || []);
};
scheduler._userdata = {};
scheduler._magic_parser = function(loader) {
	var xml;
	if (!loader.getXMLTopNode) { //from a string
		var xml_string = loader.xmlDoc.responseText;
		loader = new dtmlXMLLoaderObject(function() {});
		loader.loadXMLString(xml_string);
	}

	xml = loader.getXMLTopNode("data");
	if (xml.tagName != "data") return [];//not an xml
	var skey = xml.getAttribute("dhx_security");
	if (skey)
		dhtmlx.security_key = skey;

	var opts = loader.doXPath("//coll_options");
	for (var i = 0; i < opts.length; i++) {
		var bind = opts[i].getAttribute("for");
		var arr = this.serverList[bind];
		if (!arr) continue;
		arr.splice(0, arr.length);	//clear old options
		var itms = loader.doXPath(".//item", opts[i]);
		for (var j = 0; j < itms.length; j++) {
			var itm = itms[j];
			var attrs = itm.attributes;
			var obj = { key: itms[j].getAttribute("value"), label: itms[j].getAttribute("label")};
			for (var k = 0; k < attrs.length; k++) {
				var attr = attrs[k];
				if (attr.nodeName == "value" || attr.nodeName == "label")
					continue;
				obj[attr.nodeName] = attr.nodeValue;
			}
			arr.push(obj);
		}
	}
	if (opts.length)
		scheduler.callEvent("onOptionsLoad", []);

	var ud = loader.doXPath("//userdata");
	for (var i = 0; i < ud.length; i++) {
		var udx = this.xmlNodeToJSON(ud[i]);
		this._userdata[udx.name] = udx.text;
	}

	var evs = [];
	xml = loader.doXPath("//event");

	for (var i = 0; i < xml.length; i++) {
		var ev = evs[i] = this.xmlNodeToJSON(xml[i]);
		scheduler._init_event(ev);
	}
	return evs;
};
scheduler.xmlNodeToJSON = function(node) {
	var t = {};
	for (var i = 0; i < node.attributes.length; i++)
		t[node.attributes[i].name] = node.attributes[i].value;

	for (var i = 0; i < node.childNodes.length; i++) {
		var child = node.childNodes[i];
		if (child.nodeType == 1)
			t[child.tagName] = child.firstChild ? child.firstChild.nodeValue : "";
	}

	if (!t.text) t.text = node.firstChild ? node.firstChild.nodeValue : "";

	return t;
};


scheduler.attachEvent("onXLS", scheduler._wrapUnsafeFunction(function() {
	if (this.config.show_loading === true) {
		var t;
		t = this.config.show_loading = document.createElement("DIV");
		t.className = 'dhx_loading';
		t.style.left = Math.round((this._x - 128) / 2) + "px";
		t.style.top = Math.round((this._y - 15) / 2) + "px";
		this._obj.appendChild(t);
	}
}));

scheduler.attachEvent("onXLE", function() {
	var t;
	if (t = this.config.show_loading)
		if (typeof t == "object") {
			this._obj.removeChild(t);
			this.config.show_loading = true;
		}
});

/*
This software is allowed to use under GPL or you need to obtain Commercial or Enterise License
to use it in not GPL project. Please contact sales@dhtmlx.com for details
*/
scheduler.ical={
	parse:function(str){
		var data = str.match(RegExp(this.c_start+"[^\f]*"+this.c_end,""));
		if (!data.length) return;
		
		//unfolding 
		data[0]=data[0].replace(/[\r\n]+(?=[a-z \t])/g," ");
		//drop property
		data[0]=data[0].replace(/\;[^:\r\n]*/g,"");
		
		
		var incoming=[];
		var match;
		var event_r = RegExp("(?:"+this.e_start+")([^\f]*?)(?:"+this.e_end+")","g");
		while (match=event_r.exec(data)){
			var e={};
			var param;
			var param_r = /[^\r\n]+[\r\n]+/g;
			while (param=param_r.exec(match[1]))
				this.parse_param(param.toString(),e);
			if (e.uid && !e.id) e.id = e.uid; //fallback to UID, when ID is not defined
			incoming.push(e);	
		}
		return incoming;
	},
	parse_param:function(str,obj){
		var d = str.indexOf(":"); 
			if (d==-1) return;
		
		var name = str.substr(0,d).toLowerCase();
		var value = str.substr(d+1).replace(/\\\,/g,",").replace(/[\r\n]+$/,"");
		if (name=="summary")
			name="text";
		else if (name=="dtstart"){
			name = "start_date";
			value = this.parse_date(value,0,0);
		}
		else if (name=="dtend"){
			name = "end_date";
			value = this.parse_date(value,0,0);
		}
		obj[name]=value;
	},
	parse_date:function(value,dh,dm){
		var t = value.split("T");	
		if (t[1]){
			dh=t[1].substr(0,2);
			dm=t[1].substr(2,2);
		}
		var dy = t[0].substr(0,4);
		var dn = parseInt(t[0].substr(4,2),10)-1;
		var dd = t[0].substr(6,2);
		if (scheduler.config.server_utc && !t[1]) { // if no hours/minutes were specified == full day event
			return new Date(Date.UTC(dy,dn,dd,dh,dm)) ;
		}
		return new Date(dy,dn,dd,dh,dm);
	},
	c_start:"BEGIN:VCALENDAR",
	e_start:"BEGIN:VEVENT",
	e_end:"END:VEVENT",
	c_end:"END:VCALENDAR"	
};
scheduler.lightbox = {};
scheduler.formSection = function(name){
	var config = this.config.lightbox.sections;
	var i =0;
	for (i; i < config.length; i++)
		if (config[i].name == name)
			break;
	var section = config[i];
	if (!scheduler._lightbox)
		scheduler.getLightbox();
	var header = document.getElementById(section.id);
	var node = header.nextSibling;

	var result = {
		section: section,
		header: header,
		node: node,
		getValue:function(ev){
			return scheduler.form_blocks[section.type].get_value(node, (ev||{}), section);
		},
		setValue:function(value, ev){
			return scheduler.form_blocks[section.type].set_value(node, value, (ev||{}), section);
		}
	};

	var handler = scheduler.lightbox["get_"+section.type+"_control"];
	return handler?handler(result):result;
};
scheduler.lightbox.get_template_control = function(result) {
	result.control = result.node;
	return result;
};
scheduler.lightbox.get_select_control = function(result) {
	result.control = result.node.getElementsByTagName('select')[0];
	return result;
};
scheduler.lightbox.get_textarea_control = function(result) {
	result.control = result.node.getElementsByTagName('textarea')[0];
	return result;
};
scheduler.lightbox.get_time_control = function(result) {
	result.control = result.node.getElementsByTagName('select'); // array
	return result;
};
scheduler.form_blocks={
	template:{
			render: function(sns){
			var height=(sns.height||"30")+"px";
			return "<div class='dhx_cal_ltext dhx_cal_template' style='height:"+height+";'></div>";
		},
		set_value: function(node,value,ev,config){
			node.innerHTML = toStaticHTML(value)||"";
	    },
		get_value: scheduler._wrapUnsafeFunction(function(node,ev,config){
			return toStaticHTML(node.innerHTML)||"";
        }),
		focus: function(node){
		}
	},
	textarea:{
		render:function(sns){
			var height=(sns.height||"130")+"px";
			return "<div class='dhx_cal_ltext' style='height:"+height+";'><textarea></textarea></div>";
		},
		set_value:function(node,value,ev){
			node.firstChild.value=toStaticHTML(value)||"";
		},
		get_value:function(node,ev){
			return toStaticHTML(node.firstChild.value);
		},
		focus:function(node){
			var a=node.firstChild; scheduler._focus(a, true) 
		}
	},
	select:{
		render:function(sns){
			var height=(sns.height||"23")+"px";
			var html="<div class='dhx_cal_ltext' style='height:"+height+";'><select style='width:100%;'>";
			for (var i=0; i < sns.options.length; i++)
				html+="<option value='"+sns.options[i].key+"'>"+toStaticHTML(sns.options[i].label)+"</option>";
			html+="</select></div>";
			return html;
		},
		set_value:function(node,value,ev,sns){
			var select = node.firstChild;
			if (!select._dhx_onchange && sns.onchange) {
				select.onchange = sns.onchange;
				select._dhx_onchange = true;
			}
			if (typeof value == "undefined")
				value = (select.options[0]||{}).value;
			select.value=value||"";
		},
		get_value:function(node,ev){
			return toStaticHTML(node.firstChild.value);
		},
		focus:function(node){
			var a=node.firstChild; scheduler._focus(a, true); 
		}
	},
	time:{
		render:function(sns) {
			if (!sns.time_format) {
				// default order
				sns.time_format = ["%H:%i", "%d", "%m", "%Y"];
			}
			// map: default order => real one
			sns._time_format_order = {};
			var time_format = sns.time_format;

			var cfg = scheduler.config;
			var dt = this.date.date_part(scheduler._currentDate());
			var last = 24*60, first = 0;
			if(scheduler.config.limit_time_select){
				last = 60*cfg.last_hour+1;
				first = 60*cfg.first_hour;
				dt.setHours(cfg.first_hour);
			}
			var html = "";

			for (var p = 0; p < time_format.length; p++) {
				var time_option = time_format[p];

				// adding spaces between selects
				if (p > 0) {
					html += " ";
				}

				switch (time_option) {
					case "%Y":
						sns._time_format_order[3] = p;
						//year
						html+="<select>";
						var year = dt.getFullYear()-5; //maybe take from config?
						for (var i=0; i < 10; i++)
							html+="<option value='"+(year+i)+"'>"+(year+i)+"</option>";
						html+="</select> ";
						break;
					case "%m":
						sns._time_format_order[2] = p;
						//month
						html+="<select>";
						for (var i=0; i < 12; i++)
							html+="<option value='"+i+"'>"+this.locale.date.month_full[i]+"</option>";
						html += "</select>";
						break;
					case "%d":
						sns._time_format_order[1] = p;
						//days
						html+="<select>";
						for (var i=1; i < 32; i++)
							html+="<option value='"+i+"'>"+i+"</option>";
						html += "</select>";
						break;
					case "%H:%i":
						sns._time_format_order[0] = p;
						//hours
						html += "<select>";
						var i = first;
						var tdate = dt.getDate();
						sns._time_values = [];

						while(i<last){
							var time=toStaticHTML(this.templates.time_picker(dt));
							html+="<option value='"+i+"'>"+time+"</option>";
							sns._time_values.push(i);
							dt.setTime(dt.valueOf()+this.config.time_step*60*1000);
							var diff = (dt.getDate()!=tdate)?1:0; // moved or not to the next day
							i=diff*24*60+dt.getHours()*60+dt.getMinutes();
						}
						html += "</select>";
						break;
				}
			}

			return "<div style='height:30px;padding-top:0px;font-size:inherit;' class='dhx_section_time'>"+html+"<span style='font-weight:normal; font-size:10pt;'> &nbsp;&ndash;&nbsp; </span>"+html+"</div>";
		},
		set_value:scheduler._wrapUnsafeFunction(function(node,value,ev,config){
			var cfg = scheduler.config;
			var s=node.getElementsByTagName("select");
			var map = config._time_format_order;

			if(cfg.full_day) {
				if (!node._full_day){
					var html = "<label class='dhx_fullday'><input type='checkbox' name='full_day' value='true'> "+scheduler.locale.labels.full_day+"&nbsp;</label></input>";
					if (!scheduler.config.wide_form)
						html = node.previousSibling.innerHTML+html;
					node.previousSibling.innerHTML=html;
					node._full_day=true;
				}
				var input=node.previousSibling.getElementsByTagName("input")[0];
				input.checked = (scheduler.date.time_part(ev.start_date)===0 && scheduler.date.time_part(ev.end_date)===0);

				s[map[0]].disabled=input.checked;
				s[ map[0] + s.length/2 ].disabled=input.checked;

				input.onclick = function(){ 
					if(input.checked) {
						var obj = {};
						scheduler.form_blocks.time.get_value(node,obj,config);

						var start_date = scheduler.date.date_part(obj.start_date);
						var end_date = scheduler.date.date_part(obj.end_date);

						if (+end_date == +start_date || (+end_date >= +start_date && (ev.end_date.getHours() != 0 || ev.end_date.getMinutes() != 0)))
							end_date = scheduler.date.add(end_date, 1, "day");
					}

					s[map[0]].disabled=input.checked;
					s[ map[0] + s.length/2 ].disabled=input.checked;
					
					_fill_lightbox_select(s,0,start_date||ev.start_date);
					_fill_lightbox_select(s,4,end_date||ev.end_date);
				};
			}
			
			if(cfg.auto_end_date && cfg.event_duration) {
				function _update_lightbox_select() {
					var start_date = new Date(s[map[3]].value,s[map[2]].value,s[map[1]].value,0,s[map[0]].value);
					var end_date = new Date(start_date.getTime() + (scheduler.config.event_duration * 60 * 1000));
					_fill_lightbox_select(s, 4, end_date);
				}
				for(var i=0; i<4; i++) {
					s[i].onchange = _update_lightbox_select;
				}
			}
			
			function _fill_lightbox_select(s,i,d) {
				var time_values = config._time_values;
				var direct_value = d.getHours()*60+d.getMinutes();
				var fixed_value = direct_value;
				var value_found = false;
				for (var k=0; k<time_values.length; k++) {
					var t_v = time_values[k];
					if (t_v === direct_value) {
						value_found = true;
						break;
					}
					if (t_v < direct_value)
						fixed_value = t_v;
				}

				s[i+map[0]].value=(value_found)?direct_value:fixed_value;
				if(!(value_found || fixed_value)){
					s[i+map[0]].selectedIndex = -1;//show empty select in FF
				}
				s[i+map[1]].value=d.getDate();
				s[i+map[2]].value=d.getMonth();
				s[i+map[3]].value=d.getFullYear();
			}

			_fill_lightbox_select(s,0,ev.start_date);
			_fill_lightbox_select(s,4,ev.end_date);
        }),
		get_value:function(node, ev, config) {
			s=node.getElementsByTagName("select");
			var map = config._time_format_order;

			ev.start_date=new Date(s[map[3]].value,s[map[2]].value,s[map[1]].value,0,s[map[0]].value);
			ev.end_date=new Date(s[map[3]+4].value,s[map[2]+4].value,s[map[1]+4].value,0,s[map[0]+4].value);

			if (ev.end_date<=ev.start_date) 
				ev.end_date=scheduler.date.add(ev.start_date,scheduler.config.time_step,"minute");
			return {
				start_date: new Date(ev.start_date),
				end_date: new Date(ev.end_date)
			};
		},
		focus:function(node){
			scheduler._focus(node.getElementsByTagName("select")[0]); 
		}
	}
};
scheduler.showCover=function(box){
	if (box){
		box.style.display="block";

		var scroll_top = window.pageYOffset||document.body.scrollTop||document.documentElement.scrollTop;
		var scroll_left = window.pageXOffset||document.body.scrollLeft||document.documentElement.scrollLeft;

		var view_height = window.innerHeight||document.documentElement.clientHeight;

		if(scroll_top) // if vertical scroll on window
			box.style.top=Math.round(scroll_top+Math.max((view_height-box.offsetHeight)/2, 0))+"px";
		else // vertical scroll on body
			box.style.top=Math.round(Math.max(((view_height-box.offsetHeight)/2), 0) + 9)+"px"; // +9 for compatibility with auto tests

		// not quite accurate but used for compatibility reasons
		if(document.documentElement.scrollWidth > document.body.offsetWidth) // if horizontal scroll on the window
			box.style.left=Math.round(scroll_left+(document.body.offsetWidth-box.offsetWidth)/2)+"px";
		else // horizontal scroll on the body
			box.style.left=Math.round((document.body.offsetWidth-box.offsetWidth)/2)+"px";
	}
    this.show_cover();
};
scheduler.showLightbox=function(id){
	if (!id) return;
	if (!this.callEvent("onBeforeLightbox",[id])) {
		if (this._new_event)
			this._new_event = null;
		return;
	}
	var box = this.getLightbox();
	this.showCover(box);
	this._fill_lightbox(id,box);
	this.callEvent("onLightbox",[id]);
};



scheduler._fill_lightbox = scheduler._wrapUnsafeFunction(function(id, box) {
	var ev = this.getEvent(id);
	var s = box.getElementsByTagName("span");
	if (scheduler.templates.lightbox_header) {
		s[1].innerHTML = "";
		s[2].innerHTML = scheduler.templates.lightbox_header(ev.start_date, ev.end_date, ev);
	} else {
		s[1].innerHTML = this.templates.event_header(ev.start_date, ev.end_date, ev);
		s[2].innerHTML = (this.templates.event_bar_text(ev.start_date, ev.end_date, ev) || "").substr(0, 70); //IE6 fix
	}

	var sns = this.config.lightbox.sections;
	for (var i = 0; i < sns.length; i++) {
		var current_sns = sns[i];
		var node = document.getElementById(current_sns.id).nextSibling;
		var block = this.form_blocks[current_sns.type];
		var value = (ev[current_sns.map_to] !== undefined) ? ev[current_sns.map_to] : current_sns.default_value;
		block.set_value.call(this, node, value, ev, current_sns);
		if (sns[i].focus)
			block.focus.call(this, node);
	}

	scheduler._lightbox_id = id;
});
scheduler._lightbox_out=function(ev){
	var sns = this.config.lightbox.sections;
	for (var i=0; i < sns.length; i++) {
		var node = document.getElementById(sns[i].id);
		node=(node?node.nextSibling:node);
		var block=this.form_blocks[sns[i].type];
		var res=block.get_value.call(this,node,ev, sns[i]);
		if (sns[i].map_to!="auto")
			ev[sns[i].map_to]=res;
	}
	return ev;
};
scheduler._empty_lightbox=function(data){
	var id=scheduler._lightbox_id;
	var ev=this.getEvent(id);
	var box=this.getLightbox();

	this._lame_copy(ev, data);

	ev._timed=this.is_one_day_event(ev);
	this.setEvent(ev.id,ev);
	this._edit_stop_event(ev,true);
	this.render_view_data();
};
scheduler.hide_lightbox=function(id){
	this.hideCover(this.getLightbox());
	this._lightbox_id=null;
	this.callEvent("onAfterLightbox",[]);
};
scheduler.hideCover=function(box){
	if (box) box.style.display="none";
	this.hide_cover();
};
scheduler.hide_cover=function(){
	if (this._cover) 
		this._cover.parentNode.removeChild(this._cover);
	this._cover=null;
};

scheduler.show_cover=scheduler._wrapUnsafeFunction(function(){
	this._cover=document.createElement("DIV");
	this._cover.className="dhx_cal_cover";
	var _document_height = ((document.height !== undefined) ? document.height : document.body.offsetHeight);
	var _scroll_height = ((document.documentElement) ? document.documentElement.scrollHeight : 0);
	this._cover.style.height = Math.max(_document_height, _scroll_height) + 'px';
	document.body.appendChild(this._cover);
});
scheduler.save_lightbox=function(){
	var data = this._lightbox_out({}, this._lame_copy(this.getEvent(this._lightbox_id)));
	if (this.checkEvent("onEventSave") && !this.callEvent("onEventSave",[this._lightbox_id, data, this._new_event]))
		return;
	this._empty_lightbox(data);
	this.hide_lightbox();
};
scheduler.startLightbox = function(id, box){
	this._lightbox_id = id;
	this._custom_lightbox = true;
	this._lightbox = box;
	this.showCover(box);
};
scheduler.endLightbox = function(mode, box){
	this._edit_stop_event(scheduler.getEvent(this._lightbox_id),mode);
	if (mode)
		scheduler.render_view_data();
	this.hideCover(box);
	this._lightbox_id = null; // in case of custom lightbox user only calls endLightbox so we need to reset _lightbox_id
};
scheduler.resetLightbox = function(){
	if (scheduler._lightbox && !scheduler._custom_lightbox)
		scheduler._lightbox.parentNode.removeChild(scheduler._lightbox);
	scheduler._lightbox = null;
};
scheduler.cancel_lightbox=function(){
	this.callEvent("onEventCancel",[this._lightbox_id, this._new_event]);
	this.endLightbox(false);
	this.hide_lightbox();
};
scheduler._init_lightbox_events=function(){
	this.getLightbox().onclick=function(e){
		var src=e?e.target:event.srcElement;
		if (!src.className) src=src.previousSibling;
		if (src && src.className)
			switch(src.className){
				case "dhx_save_btn":
					scheduler.save_lightbox();
					break;
				case "dhx_delete_btn":
					var c=scheduler.locale.labels.confirm_deleting;

					scheduler._dhtmlx_confirm(c, scheduler.locale.labels.title_confirm_deleting, function(){
						scheduler.deleteEvent(scheduler._lightbox_id);
						scheduler._new_event = null; //clear flag, if it was unsaved event
						scheduler.hide_lightbox();
					});

					break;
				case "dhx_cancel_btn":
					scheduler.cancel_lightbox();
					break;

				default:
					if (src.getAttribute("dhx_button")) {
						scheduler.callEvent("onLightboxButton", [src.className, src, e]);
					} else {
						var index, block, sec;
						if (src.className.indexOf("dhx_custom_button") != -1) {
							if (src.className.indexOf("dhx_custom_button_") != -1) {
								index = src.parentNode.getAttribute("index");
								sec = src.parentNode.parentNode;
							} else {
								index = src.getAttribute("index");
								sec = src.parentNode;
								src = src.firstChild;
							}
						}
						if (index) {
							block = scheduler.form_blocks[scheduler.config.lightbox.sections[index].type];
							block.button_click(index, src, sec, sec.nextSibling);
						}
					}
					break;
			}
	};
	this.getLightbox().onkeydown=function(e){
		switch((e||event).keyCode){
			case scheduler.keys.edit_save:
				if ((e||event).shiftKey) return;
				scheduler.save_lightbox();
				break;
			case scheduler.keys.edit_cancel:
				scheduler.cancel_lightbox();
				break;
			default:
				break;
		}
	};
};
scheduler.setLightboxSize=function(){
	var d = this._lightbox;
	if (!d) return;

	var con = d.childNodes[1];
	con.style.height="0px";
	con.style.height=con.scrollHeight+"px";
	d.style.height=con.scrollHeight+scheduler.xy.lightbox_additional_height+"px";
	con.style.height=con.scrollHeight+"px"; //it is incredible , how ugly IE can be
};

scheduler._init_dnd_events = function(){
	dhtmlxEvent(document.body, "mousemove", scheduler._move_while_dnd);
	dhtmlxEvent(document.body, "mouseup", scheduler._finish_dnd);
	scheduler._init_dnd_events = function(){};
};
scheduler._move_while_dnd = function(e){
    if (scheduler._dnd_start_lb && scheduler._elapsedTime()) {

		if (!document.dhx_unselectable){
			document.body.className += " dhx_unselectable";
			document.dhx_unselectable = true;
		}
		var lb = scheduler.getLightbox();
		var now = (e&&e.target)?[e.pageX, e.pageY]:[event.clientX, event.clientY];
		lb.style.top = scheduler._lb_start[1]+now[1]-scheduler._dnd_start_lb[1]+"px";
		lb.style.left = scheduler._lb_start[0]+now[0]-scheduler._dnd_start_lb[0]+"px";
	}
};
scheduler._ready_to_dnd = function(e){
	var lb = scheduler.getLightbox();
	scheduler._lb_start = [parseInt(lb.style.left,10), parseInt(lb.style.top,10)];
	scheduler._dnd_start_lb = (e&&e.target)?[e.pageX, e.pageY]:[event.clientX, event.clientY];
};
scheduler._finish_dnd = function(){
	if (scheduler._lb_start){
		scheduler._lb_start = scheduler._dnd_start_lb = false;
		document.body.className = document.body.className.replace(" dhx_unselectable","");
		document.dhx_unselectable = false;
	}
};
scheduler.getLightbox=function(){

 //scheduler.config.wide_form=true;
	if (!this._lightbox){
        var self = this, args = arguments;
        MSApp.execUnsafeLocalFunction(function () {
            (function () {
		var d=document.createElement("DIV");
		d.className="dhx_cal_light";
		if (scheduler.config.wide_form)
			d.className+=" dhx_cal_light_wide";
		if (scheduler.form_blocks.recurring)
			d.className+=" dhx_cal_light_rec";

		if (/msie|MSIE 6/.test(navigator.userAgent))
			d.className+=" dhx_ie6";
		d.style.visibility="hidden";
		var html = this._lightbox_template;

		var buttons = this.config.buttons_left;
		for (var i = 0; i < buttons.length; i++)
			html+="<div class='dhx_btn_set dhx_left_btn_set "+buttons[i]+"_set'><div dhx_button='1' class='"+buttons[i]+"'></div><div>"+scheduler.locale.labels[buttons[i]]+"</div></div>";

		buttons = this.config.buttons_right;
		for (var i = 0; i < buttons.length; i++)
			html+="<div class='dhx_btn_set dhx_right_btn_set "+buttons[i]+"_set' style='float:right;'><div dhx_button='1' class='"+buttons[i]+"'></div><div>"+scheduler.locale.labels[buttons[i]]+"</div></div>";

		html+="</div>";
		d.innerHTML=html;
		if (scheduler.config.drag_lightbox){
			d.firstChild.onmousedown = scheduler._ready_to_dnd;
			d.firstChild.onselectstart = function(){ return false; };
			d.firstChild.style.cursor = "pointer";
			scheduler._init_dnd_events();

		}
		document.body.insertBefore(d,document.body.firstChild);
		this._lightbox=d;

		var sns=this.config.lightbox.sections;
		html="";
		for (var i=0; i < sns.length; i++) {
			var block=this.form_blocks[sns[i].type];
			if (!block) continue; //ignore incorrect blocks
			sns[i].id="area_"+this.uid();
			var button = "";
			if (sns[i].button){
			 	button = "<div class='dhx_custom_button' index='"+i+"'><div class='dhx_custom_button_"+sns[i].button+"'></div><div>"+this.locale.labels["button_"+sns[i].button]+"</div></div>";
			 }

			if (this.config.wide_form){
				html+="<div class='dhx_wrap_section'>";
			}
			html+="<div id='"+sns[i].id+"' class='dhx_cal_lsection'>"+button+this.locale.labels["section_"+sns[i].name]+"</div>"+block.render.call(this,sns[i]);
			html+="</div>"
		}

		var ds=d.getElementsByTagName("div");
		for (var i=0; i<ds.length; i++) {
			var t_ds = ds[i];
			if (t_ds.className == "dhx_cal_larea") {
				t_ds.innerHTML = toStaticHTML(html);
				break;
			}
		}

		//sizes
		this.setLightboxSize();

		this._init_lightbox_events(this);
		d.style.display="none";
		d.style.visibility="visible";
            }).apply(self, args)
        });
	}
	return this._lightbox;
};
scheduler._lightbox_template="<div class='dhx_cal_ltitle'><span class='dhx_mark'>&nbsp;</span><span class='dhx_time'></span><span class='dhx_title'></span></div><div class='dhx_cal_larea'></div>";

scheduler._init_touch_events = function(){
	if (this.config.touch != "force")
		this.config.touch = this.config.touch 
			&& (   (navigator.userAgent.indexOf("Mobile")!=-1)
				|| (navigator.userAgent.indexOf("iPad")!=-1)
				|| (navigator.userAgent.indexOf("Android")!=-1)
				|| (navigator.userAgent.indexOf("Touch")!=-1));

	if (this.config.touch){
		this.xy.scroll_width = 0;
		if (window.navigator.msPointerEnabled){
			this._touch_events(["MSPointerMove", "MSPointerDown", "MSPointerUp"], function(ev){
				if (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE ) return null;
				return ev;
			}, function(ev){
				return (!ev || ev.pointerType == ev.MSPOINTER_TYPE_MOUSE);
			});
		} else
			this._touch_events(["touchmove", "touchstart", "touchend"], function(ev){
				if (ev.touches && ev.touches.length > 1) return null;
				if (ev.touches[0])
					return { target:ev.target, pageX:ev.touches[0].pageX, pageY:ev.touches[0].pageY };
				else 
					return ev;
			}, function(){ return false; });
	}
};

scheduler._touch_events = function(names, accessor, ignore){
	//webkit on android need to be handled separately
	var a_webkit = (navigator.userAgent.indexOf("Android")!=-1) && (navigator.userAgent.indexOf("WebKit")!=-1);
	var source, tracker, timer, drag_mode, scroll_mode, action_mode;
	var dblclicktime = 0;

	function check_direction_swipe(s_ev, e_ev, step){
		if (!s_ev || !e_ev) return;

		var dy = Math.abs(s_ev.pageY - e_ev.pageY);
		var dx = Math.abs(s_ev.pageX - e_ev.pageX);
		if (dx>step && (!dy || (dx/dy > 3))){
			if (s_ev.pageX > e_ev.pageX)
				scheduler._click.dhx_cal_next_button();
			else
				scheduler._click.dhx_cal_prev_button();
		}
	};
	dhtmlxEvent(document.body, names[0], function(e){
		if (ignore(e)) return;

		if (drag_mode){
			scheduler._on_mouse_move(accessor(e));
			scheduler._update_global_tip();
			if (e.preventDefault)	
				e.preventDefault();
			e.cancelBubble = true;
			return false;
		}

		if (tracker && a_webkit){
			check_direction_swipe(tracker, accessor(e), 0);
		}

		tracker = accessor(e);
		//ignore common and scrolling moves
		if (!action_mode) return;

		//multitouch		
		if (!tracker){
			scroll_mode = true;
			return;
		}

		//target changed - probably in scroll mode

		if (source.target != tracker.target || (Math.abs(source.pageX - tracker.pageX) > 5) || (Math.abs(source.pageY - tracker.pageY) > 5)){
			scroll_mode = true;
			clearTimeout(timer);
		}

	});

	dhtmlxEvent(this._els["dhx_cal_data"][0], "scroll", drag_cancel);
	dhtmlxEvent(this._els["dhx_cal_data"][0], "touchcancel", drag_cancel);
	dhtmlxEvent(this._els["dhx_cal_data"][0], "contextmenu", function(e){
		if (action_mode){
			if (e && e.preventDefault)
				e.preventDefault();
			(e||event).cancelBubble = true;
			return false;
		}
	});
	dhtmlxEvent(this._els["dhx_cal_data"][0], names[1], function(e){
		if (ignore(e)) return;

		drag_mode = scroll_mode = tracker = false;
		action_mode = true;
		scheduler._temp_touch_block = true;

		var fake_event = tracker = accessor(e);
		if (!fake_event){
			scroll_mode = true;
			return;
		}

		//dbl click
		var now = new Date();

		if (!scroll_mode && !drag_mode && now - dblclicktime < 250){
			scheduler._click.dhx_cal_data(fake_event);
			window.setTimeout(function(){
				scheduler._on_dbl_click(fake_event);
			}, 50);
			
			if (e.preventDefault)
				e.preventDefault();
			e.cancelBubble = true;
			scheduler._block_next_stop = true;
			return false;
		}
		dblclicktime = now;

		//drag
		
		if (scroll_mode || drag_mode || !scheduler.config.touch_drag)
			return;

		//there is no target
		timer = setTimeout(function(){
			drag_mode = true;
			var target = source.target;
			if (target && target.className && target.className.indexOf("dhx_body") != -1)
				target = target.previousSibling;

			scheduler._on_mouse_down(source, target);
			if (scheduler._drag_mode && scheduler._drag_mode != "create"){
				var pos = -1;
				scheduler.for_rendered(scheduler._drag_id, function(node, i) {
					pos = node.getBoundingClientRect().top;
					node.style.display='none';
					scheduler._rendered.splice(i, 1);
				});
				if (pos>=0){
					var step = scheduler.config.time_step;
					scheduler._move_pos_shift = step* Math.round((fake_event.pageY - pos)*60/(scheduler.config.hour_size_px*step));
				}
			}

			if (scheduler.config.touch_tip)
				scheduler._show_global_tip();
			scheduler._on_mouse_move(source);
		},scheduler.config.touch_drag);

		source = fake_event;
	});
	function drag_cancel(e){
		if (ignore(e)) return;
		scheduler._hide_global_tip();
		if (drag_mode){
			scheduler._on_mouse_up( accessor(e||event) );
			scheduler._temp_touch_block = false;
		}
		scheduler._drag_id = null;
		scheduler._drag_mode=null;
		scheduler._drag_pos=null;
		
		clearTimeout(timer);
		drag_mode = scroll_mode = action_mode = false;
	}
	dhtmlxEvent(this._els["dhx_cal_data"][0], names[2], function(e){
		if (ignore(e)) return;

		if (!drag_mode)
			check_direction_swipe(source, tracker, 200);
		
		if (drag_mode)
			scheduler._ignore_next_click = true;

		drag_cancel(e);
		if (scheduler._block_next_stop){
			scheduler._block_next_stop = false;
			if (e.preventDefault)
				e.preventDefault();
			e.cancelBubble = true;
			return false;	
		}
	});	

	dhtmlxEvent(document.body, names[2], drag_cancel);
};

scheduler._show_global_tip = function(){
	scheduler._hide_global_tip();

	var toptip = scheduler._global_tip = document.createElement("DIV");
	toptip.className='dhx_global_tip';

	scheduler._update_global_tip(1);

	document.body.appendChild(toptip);
};
scheduler._update_global_tip = function(init){
	var toptip = scheduler._global_tip;
	if (toptip){
		var time = "";
		if (scheduler._drag_id && !init){
			var ev = scheduler.getEvent(scheduler._drag_id);
			if (ev)
				time = "<div>" + (ev._timed ? scheduler.templates.event_header(ev.start_date, ev.end_date, ev):scheduler.templates.day_date(ev.start_date, ev.end_date, ev)) + "</div>";
		}
		
		if (scheduler._drag_mode == "create" || scheduler._drag_mode == "new-size")
			toptip.innerHTML = (scheduler.locale.drag_to_create || "Drag to create")+time;
		else
			toptip.innerHTML = (scheduler.locale.drag_to_move || "Drag to move")+time;
	}
};
scheduler._hide_global_tip = function(){
	var toptip = scheduler._global_tip;
	if (toptip && toptip.parentNode){
		toptip.parentNode.removeChild(toptip);
		scheduler._global_tip = 0;
	}
};
