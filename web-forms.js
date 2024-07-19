/* WebFormsJS - Providing Infrastructure For Web Controls In CodeBehind Framework Owned By Elanat (elanat.net) */

/* Start Options */

var PostBackOptions = new Object();
PostBackOptions.UseProgressBar = true;
PostBackOptions.UseConnectionErrorMessage = true;
PostBackOptions.ConnectionErrorMessage = "Connection Error";
PostBackOptions.AutoSetSubmitOnClick = true;
PostBackOptions.SendDataOnlyByPostMethod = false;
PostBackOptions.ResponseLocation = document.body;

/* End Options */

/* Start Event */

function SetPostBackFunctionToSubmit()
{
    if (!PostBackOptions.AutoSetSubmitOnClick)
        return;

    const SubmitInputs = document.querySelectorAll('input[type="submit"]');

    SubmitInputs.forEach(function (InputElement)
    {
        if (InputElement.hasAttribute("onclick"))
        {
            var OnClickAttr = InputElement.getAttribute("onclick");

            if (!OnClickAttr)
            {
                InputElement.setAttribute("onclick", "PostBack(this)");
                return;
            }

            if (!OnClickAttr.Contains("PostBack(this)"))
                if (OnClickAttr.charAt(OnClickAttr.length - 1) == ';')
                    InputElement.setAttribute("onclick", OnClickAttr + "PostBack(this)");
                else
                    InputElement.setAttribute("onclick", OnClickAttr + ";PostBack(this)");
        }
        else
            InputElement.setAttribute("onclick", "PostBack(this)");
    });
}
window.onload = function ()
{
    SetPostBackFunctionToSubmit()
};

/* End Event */

/* Start Post-Back */

function PostBack(obj, ViewState)
{
    // Set Form Value
    var Form = obj;
    do
    {
        if (!Form.parentNode)
            return;

        Form = Form.parentNode;
    }
    while (Form.nodeName.toLowerCase() != "form");

    if (Form.nodeName.toLowerCase() != "form")
        return;

    var FormMethod = (Form.hasAttribute("method") && !PostBackOptions.SendDataOnlyByPostMethod) ? Form.getAttribute("method") : "POST" ;
    var FormAction = Form.getAttribute("action");

    // Chek Form Multi Part
    var FormIsMultiPart = false;
    if (Form.hasAttribute("enctype") && FormMethod.toLowerCase() == "post")
        if (Form.getAttribute("enctype") == "multipart/form-data")
            FormIsMultiPart = true;


    // Set Progress Tag
    if (PostBackOptions.UseProgressBar)
        cb_SetProgressTag(obj, Form);


    // Set Input Value
    var TagSubmitValue = null;
    switch (obj.nodeName.toLowerCase())
    {
        case "input": TagSubmitValue = (obj.getAttribute("value")) ? obj.getAttribute("value") : ""; break;
        case "select": TagSubmitValue =  (obj.options[obj.selectedIndex].value) ? obj.options[obj.selectedIndex].value : "";
    }

    var OldObjectType;
    if (obj.getAttribute("type"))
        if (obj.getAttribute("type") != "button")
        {
            OldObjectType = obj.type;
            obj.setAttribute("type", "button");
        }


    var XMLHttp = new XMLHttpRequest();
    XMLHttp.onreadystatechange = function ()
    {
        if (XMLHttp.readyState == 4 && XMLHttp.status == 200)
        {
            var HttpResult = XMLHttp.responseText;
            var IsWebForms = false;

            // Check Exist WebForms Values
            if (HttpResult.length >= 11)
                if (HttpResult.substring(0, 11) == "[web-forms]")
                    IsWebForms = true;

            if (IsWebForms)
                cb_SetWebFormsValues(HttpResult, true);
            else
            {
                var TmpDiv = document.createElement("div");
                TmpDiv.appendChild(HttpResult.toDOM());
                cb_AppendJavaScriptTag(HttpResult);

                if (ViewState)
                    PostBackOptions.ResponseLocation.prepend(TmpDiv);
                else
                    PostBackOptions.ResponseLocation.innerHTML = TmpDiv.outerHTML;

                Form.focus();
            }

            // Reset Input Type
            setTimeout(function () { (OldObjectType == "submit") ? obj.type = "submit" : obj.type; }, 1);
        }
    }

    XMLHttp.onerror = function ()
    {
        if (XMLHttp.status != 0 && (XMLHttp.readyState == 0 || XMLHttp.status > 200))
        {
            if (PostBackOptions.UseConnectionErrorMessage)
            {
                var BErrorTag = document.createElement("b");
                BErrorTag.innerText = "Connection Error";
                document.body.prepend(BErrorTag);
            }

            // Clean Progress Value
            if (PostBackOptions.UseProgressBar)
                cb_CleanProgressValue();
        }

        // Reset Input Type
        setTimeout(function () { (OldObjectType == "submit") ? obj.type = "submit" : obj.type; }, 1);
    }

    XMLHttp.open(FormMethod, FormAction, true);

    if (PostBackOptions.UseProgressBar && cb_HasFileInput(Form))
        XMLHttp.upload.addEventListener("progress", cb_ProgressHandler, false);

    if (!FormIsMultiPart)
        XMLHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    XMLHttp.setRequestHeader("Post-Back", "true");

    XMLHttp.send(cb_FormDataSerialize(Form, obj.getAttribute("name"), TagSubmitValue, FormIsMultiPart));
}

/* End Post-Back */

/* Start Get-Back */

function GetBack(FormAction, ViewState)
{
    var FormMethod = (PostBackOptions.SendDataOnlyByPostMethod) ? "POST" : "GET";

    if (FormAction)
    {
        if (typeof FormAction === "object")
        {
            // Set Form Value
            var Form = FormAction;
            do
            {
                if (!Form.parentNode)
                    return;

                Form = Form.parentNode;
            }
            while (Form.nodeName.toLowerCase() != "form");

            if (Form.nodeName.toLowerCase() != "form")
                if (body.getElementsByTagName("form").length > 0)
                    Form = body.getElementsByTagName("form")[0];

            FormMethod = (Form.hasAttribute("method") && !PostBackOptions.SendDataOnlyByPostMethod) ? Form.getAttribute("method") : "POST" ;
            FormAction = Form.getAttribute("action");
        }
    }
    else
        FormAction = "";

    var XMLHttp = new XMLHttpRequest();
    XMLHttp.onreadystatechange = function ()
    {
        if (XMLHttp.readyState == 4 && XMLHttp.status == 200)
        {
            var HttpResult = XMLHttp.responseText;
            var IsWebForms = false;

            // Check Exist WebForms Values
            if (HttpResult.length >= 11)
                if (HttpResult.substring(0, 11) == "[web-forms]")
                    IsWebForms = true;

            if (IsWebForms)
                cb_SetWebFormsValues(HttpResult, true);
            else
            {
                var TmpDiv = document.createElement("div");
                TmpDiv.appendChild(HttpResult.toDOM());
                cb_AppendJavaScriptTag(HttpResult);

                if (ViewState)
                    PostBackOptions.ResponseLocation.prepend(TmpDiv);
                else
                    PostBackOptions.ResponseLocation.innerHTML = TmpDiv.outerHTML;

                Form.focus();
            }
        }
    }

    XMLHttp.onerror = function ()
    {
        if (XMLHttp.status != 0 && (XMLHttp.readyState == 0 || XMLHttp.status > 200))
        {
            if (PostBackOptions.UseConnectionErrorMessage)
            {
                var BErrorTag = document.createElement("b");
                BErrorTag.innerText = "Connection Error";
                document.body.prepend(BErrorTag);
            }
        }
    }

    XMLHttp.open(FormMethod, FormAction, true);

    XMLHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    XMLHttp.setRequestHeader("Post-Back", "true");

    XMLHttp.send();
}

/* End Get-Back */

function cb_FormDataSerialize(form, TagSubmitName, TagSubmitValue, FormIsMultiPart)
{       
    var FormString = "";
    var TmpFormData = new FormData();

    if (!form || form.nodeName.toLowerCase() != "form")
        return;

    var i, j;
    for (i = form.elements.length - 1; i >= 0; i = i - 1)
    {
        if (form.elements[i].name === "")
            continue;

        switch (form.elements[i].nodeName.toLowerCase())
        {
            case 'input':
                switch (form.elements[i].type.toLowerCase())
                {
                    case 'text':
                    case 'number':
                    case 'hidden':
                    case 'password':
                    case 'reset':
                    case 'color':
                    case 'date':
                    case 'range':
                    case 'search':
                    case 'time':
                    case 'datetime-local':
                    case 'email':
                    case 'month':
                    case 'tel':
                    case 'url':
                    case 'week':
                        {
                            if (FormIsMultiPart)
                                TmpFormData.append(form.elements[i].name, form.elements[i].value);
                            else
                                FormString += form.elements[i].name + "=" + form.elements[i].value + "&";
                        }
                        break;
                    case 'checkbox':
                    case 'radio':
                        if (form.elements[i].checked)
                        {
                            if (FormIsMultiPart)
                                TmpFormData.append(form.elements[i].name, form.elements[i].value);
                            else
                                FormString += form.elements[i].name + "=" + form.elements[i].value + "&";
                        }
                        break;
                    case 'file':
                        {
                            var files = form.elements[i].files;

                            if (files.length == 0)
                                break;

                            var file = files[0];

                            if (FormIsMultiPart)
                                TmpFormData.append(form.elements[i].name, file, file.name);
                            else
                                FormString += form.elements[i].name + "=" + file, file.name + "&";
                        }
                        break;
                }
                break;
            case 'file':
                break;
            case 'textarea':
                {
                    if (FormIsMultiPart)
                        TmpFormData.append(form.elements[i].name, form.elements[i].value);
                    else
                        FormString += form.elements[i].name + "=" + form.elements[i].value + "&";
                }
                break;
            case 'select':
                switch (form.elements[i].type.toLowerCase())
                {
                    case 'select-one':
                        {
                            if (FormIsMultiPart)
                                TmpFormData.append(form.elements[i].name, form.elements[i].value);
                            else
                                FormString += form.elements[i].name + "=" + form.elements[i].value + "&";
                        }
                        break;
                    case 'select-multiple':
                        for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1)
                        {
                            if (form.elements[i].options[j].selected)
                            {
                                if (FormIsMultiPart)
                                    TmpFormData.append(form.elements[i].name, form.elements[i].options[j].value);
                                else
                                    FormString += form.elements[i].name + "=" + form.elements[i].options[j].value + "&";
                            }
                        }
                        break;
                }
                break;
            case 'button':
                switch (form.elements[i].type.toLowerCase())
                {
                    case 'reset':
                    case 'submit':
                    case 'button':
                        {
                            if (FormIsMultiPart)
                                TmpFormData.append(form.elements[i].name, form.elements[i].value);
                            else
                                FormString += form.elements[i].name + "=" + form.elements[i].value + "&";
                        }
                        break;
                }
                break;
        }
    }

    if (FormIsMultiPart)
        TmpFormData.append(TagSubmitName, TagSubmitValue);
    else
        FormString += TagSubmitName + "=" + TagSubmitValue;

    return (FormIsMultiPart) ? TmpFormData : FormString;
}

/* Start Append Java Script */

function cb_ExtractScriptTags(Html)
{
    var ScriptList = new Array();
    const regex = /<script[^>]+>(.*?)<\/script>/gs;
    let match;

    while ((match = regex.exec(Html)) !== null)
    {
        const ScriptTag = document.createElement("script");
        const ScriptContent = match[1];

        // Extract Attributes
        const AttrRegex = /([a-zA-Z0-9_]+)="([^"]*)"/g;
        let AttrMatch;

        while ((AttrMatch = AttrRegex.exec(match[0])) !== null)
        {
            const Name = AttrMatch[1];
            const Value = AttrMatch[2];
            ScriptTag.setAttribute(Name, Value);
        }

        const TextNode = document.createTextNode(ScriptContent);

        ScriptTag.appendChild(TextNode);
        ScriptList.push(ScriptTag);
    }

    return ScriptList;
}

function cb_AppendJavaScriptTag(HtmlSource)
{
    var ScriptList = cb_ExtractScriptTags(HtmlSource);

    for (var i = 0; i < ScriptList.length; i++)
        document.body.appendChild(ScriptList[i]);
}

/* End Append Java Script */

/* Start Progress Bar */
function cb_ProgressHandler(event)
{
    var Percent = (event.loaded / event.total) * 100;

    if (event.total >= 1048576)
        document.getElementById("div_ProgressPercentLoaded").innerHTML = (event.loaded / 1048576).toFixed(1) + "(" + Math.round(Percent) + "%)" + " / " + (event.total / 1048576).toFixed(1) + " MB";
    else
        document.getElementById("div_ProgressPercentLoaded").innerHTML = (event.loaded / 1024).toFixed(1) + "(" + Math.round(Percent) + "%)" + " / " + (event.total / 1024).toFixed(1) + " KB";

    document.getElementById("div_ProgressUploadValue").style.width = Math.round(Percent) + "%";
}

function cb_SetProgressTag(obj, form)
{
    if (!cb_HasFileInput(form))
        return;

    if (!document.getElementById("div_ProgressUpload"))
    {
        var DivProgressUpload = document.createElement("div");
        DivProgressUpload.id = "div_ProgressUpload";
        DivProgressUpload.setAttribute("style", "width:100%;min-width:300px;max-width:600px;background-color:#eee;margin:2px 0px");

        var DivProgressPercentLoaded = document.createElement("div");
        DivProgressPercentLoaded.id = "div_ProgressPercentLoaded";
        DivProgressPercentLoaded.setAttribute("style", "position:absolute;padding:0px 4px;line-height:22px");

        var DivProgressUploadValue = document.createElement("div");
        DivProgressUploadValue.id = "div_ProgressUploadValue";
        DivProgressUploadValue.setAttribute("style", "height:20px;background-color:#4D93DD;width:0%");

        DivProgressUpload.appendChild(DivProgressPercentLoaded);
        DivProgressUpload.appendChild(DivProgressUploadValue);

        if (obj.parentElement)
            obj.parentElement.appendChild(DivProgressUpload);
        else
            document.body.appendChild(DivProgressUpload);
    }
}

function cb_CleanProgressValue()
{
    if (document.getElementById("div_ProgressUploadValue"))
        document.getElementById("div_ProgressUpload").outerHTML = "";
}

function cb_HasFileInput(Form)
{
    if (Form.getElementsByTagName("file").length > 0)
        return true;

    var InputCount = Form.getElementsByTagName("input").length;

    for (var i = 0; i < InputCount; i++)
        if (Form.getElementsByTagName("input").item(i).hasAttribute("type"))
            if (Form.getElementsByTagName("input").item(i).getAttribute("type") == "file")
                return true;

    return false;
}

/* End Progress Bar */

/* Start Fetch Web-Forms */

function cb_SetWebFormsValues(WebFormsValues, UsePostBack)
{
    WebFormsValues = WebFormsValues.substring(11);

    var WebFormsList = (UsePostBack) ? WebFormsValues.split('\n') : WebFormsValues.split("$[sln];");

    for (var i = 0; i < WebFormsList.length; i++)
    {
        if (!WebFormsList[i].FullTrim())
            continue;

        var ActionName = WebFormsList[i].substring(0, 2);
        var ActionValue = WebFormsList[i].substring(2);

        var ActionOperation = ActionName.substring(0, 1);
        var ActionFeature = ActionName.substring(1, 2);

        cb_SetValueToInput(ActionOperation, ActionFeature, ActionValue);
    }
}

function cb_SetValueToInput(ActionOperation, ActionFeature, ActionValue)
{
    var ElementPlace = ActionValue.GetTextBefore("=");
    var CurrentElement = cb_GetElementByElementPlace(ElementPlace);
    var Value = ActionValue.GetTextAfter("=").FullTrim();
    var LabelForIndexer = 0;

    if (!CurrentElement)
        return;

    // Without Server Attribute
    switch (ActionOperation)
    {
        case 'a':
            switch (ActionFeature)
            {
                case 'i': CurrentElement.id = (CurrentElement.id) ? CurrentElement.id + Value : Value; break;
                case 'n':
                    if (CurrentElement.tagName.IsInput())
                        CurrentElement.name = (CurrentElement.name) ? CurrentElement.name + Value : Value;
                    else
                        if (CurrentElement.hasAttribute("name"))
                        {
                            var NameAttr = CurrentElement.getAttribute("name");
                            CurrentElement.setAttribute("name", NameAttr + Value);
                        }
                        else
                            CurrentElement.setAttribute("name", Value);
                    break;
                case 'v':
                    if (CurrentElement.tagName.IsInput())
                        CurrentElement.value = (CurrentElement.value) ? CurrentElement.value + Value : Value;
                    else
                        if (CurrentElement.hasAttribute("value"))
                        {
                            var ValueAttr = CurrentElement.getAttribute("value");
                            CurrentElement.setAttribute("value", ValueAttr + Value);
                        }
                        else
                            CurrentElement.setAttribute("value", Value);
                    break;
                case 'c':
                    if (CurrentElement.hasAttribute("class"))
                    {
                        var ClassAttr = CurrentElement.getAttribute("class");
                        CurrentElement.setAttribute("class", ClassAttr + ' ' + Value);
                    }
                    else
                        CurrentElement.setAttribute("class", Value);
                    break;
                case 's':
                    if (CurrentElement.hasAttribute("style"))
                    {
                        var StyleAttr = CurrentElement.getAttribute("style");
                        if (StyleAttr.charAt(StyleAttr.length - 1) == ';')
                            CurrentElement.setAttribute("style", StyleAttr + Value);
                        else
                            CurrentElement.setAttribute("style", StyleAttr + ';' + Value);
                    }
                    else
                        CurrentElement.setAttribute("style", Value);
                    break;
                case 'o':
                    var OptionTag = document.createElement("option");
                    var OptionValue = Value.GetTextBefore("|");
                    var OptionText = Value.GetTextAfter("|");
                    if (OptionText.Contains("|"))
                    {
                        OptionTag.selected = (OptionText.GetTextAfter("|") == "1");
                        OptionText = OptionText.GetTextBefore("|");
                    }

                    OptionTag.value = OptionValue;
                    OptionTag.text = OptionText;

                    CurrentElement.appendChild(OptionTag);
                    break;
                case 'k':
                    var CheckBoxTag = document.createElement("input");
                    CheckBoxTag.setAttribute("type", "checkbox");

                    var CheckBoxValue = Value.GetTextBefore("|");
                    var CheckBoxText = Value.GetTextAfter("|");
                    if (CheckBoxText.Contains("|"))
                    {
                        CheckBoxTag.checked = (CheckBoxText.GetTextAfter("|") == "1");
                        CheckBoxText = CheckBoxText.GetTextBefore("|");
                    }

                    CheckBoxTag.setAttribute("value", CheckBoxValue);
                    var CeckBoxIndex = CurrentElement.querySelectorAll('input[type="checkbox"]').length;

                    var CheckBoxNameAndText = "cblst_NoneSet";
                    if (CurrentElement.id)
                        CheckBoxNameAndText = CurrentElement.id;
                    else
                        if (CeckBoxIndex > 0)
                            CheckBoxNameAndText = CurrentElement.querySelectorAll('input[type="checkbox"]')[0].name.GetTextBefore("$");

                    CheckBoxTag.id = CheckBoxNameAndText + "_" + CeckBoxIndex;
                    CheckBoxTag.name = CheckBoxNameAndText + "$" + CeckBoxIndex;

                    CurrentElement.appendChild(document.createElement("br"));

                    CurrentElement.appendChild(CheckBoxTag);

                    var LabelTag = document.createElement("label");
                    LabelTag.setAttribute("for", CheckBoxTag.id);
                    LabelTag.innerText = CheckBoxText;
                    CurrentElement.appendChild(LabelTag);

                    break;
                case 'l':
                    if (!CurrentElement.tagName.IsInput())
                    {
                        if (CurrentElement.hasAttribute("title"))
                        {
                            var TitleAttr = CurrentElement.getAttribute("title");
                            CurrentElement.setAttribute("title", TitleAttr + Value);
                        }
                        else
                            CurrentElement.setAttribute("title", Value);
                        break;
                    }

                    if (!CurrentElement.id)
                        CurrentElement.id = "tmp_Element" + LabelForIndexer++;

                    var LabelTag = document.querySelector('label[for="' + CurrentElement.id + '"]');

                    if (LabelTag)
                        LabelTag.innerText = LabelTag.innerText + Value;
                    else
                    {
                        LabelTag = document.createElement("label");
                        LabelTag.setAttribute("for", CurrentElement.id);
                        LabelTag.innerText = Value;
                        CurrentElement.outerHTML = CurrentElement.outerHTML + LabelTag.outerHTML;
                    }
                    break;
                case 't': CurrentElement.innerHTML = CurrentElement.innerHTML + Value.Replace("$[ln];", "\n").toDOM(); break;
                case 'a':
                    var AttrName = Value.GetTextBefore("|");
                    var AttrValue = Value.GetTextAfter("|");
                    if (CurrentElement.hasAttribute(AttrName))
                    {
                        var CurrentAttr = CurrentElement.getAttribute(AttrName);
                        if (CurrentAttr.charAt(CurrentAttr.length - 1) == ';')
                            CurrentElement.setAttribute(AttrName, CurrentAttr + AttrValue);
                        else
                            CurrentElement.setAttribute(AttrName, CurrentAttr + ';' + AttrValue);
                    }
                    else
                        CurrentElement.setAttribute(AttrName, AttrValue);
                    break;
            }
            break;

        case 's':
        case 'i':
            switch (ActionFeature)
            {
                case 'i':
                    if ((ActionOperation == 'i') && (CurrentElement.id))
                        break;

                    CurrentElement.id = Value;
                    break;
                case 'n':
                    if (CurrentElement.tagName.IsInput())
                    {
                        if ((ActionOperation == 'i') && CurrentElement.name)
                            break;

                        CurrentElement.name = Value;
                    }
                    else
                    {
                        if (ActionOperation == 'i' && CurrentElement.hasAttribute("name"))
                            break;

                        CurrentElement.setAttribute("name", Value);
                    }
                    break;
                case 'v':
                    if (CurrentElement.tagName.IsInput())
                    {
                        if ((ActionOperation == 'i') && CurrentElement.value)
                            break;

                        CurrentElement.value = Value;
                    }
                    else
                    {
                        if (ActionOperation == 'i' && CurrentElement.hasAttribute("value"))
                            break;

                        CurrentElement.setAttribute("value", Value);
                    }
                    break;
                case 'c':
                    if (CurrentElement.hasAttribute("class"))
                    {
                        var ClassAttr = CurrentElement.getAttribute("class");

                        if ((ActionOperation == 'i') && (ClassAttr.ContainsWithSpliter(Value, " ")))
                            break;

                        CurrentElement.setAttribute("class", ClassAttr + ' ' + Value);
                    }
                    else
                        CurrentElement.setAttribute("class", Value);
                    break;
                case 's':
                    if (CurrentElement.hasAttribute("style"))
                    {
                        var StyleAttr = CurrentElement.getAttribute("style");

                        if ((ActionOperation == 'i') && (StyleAttr.ContainsWithSpliter(Value, ";")))
                            break;

                        if (StyleAttr.charAt(StyleAttr.length - 1) == ';')
                            CurrentElement.setAttribute("style", StyleAttr + Value);
                        else
                            CurrentElement.setAttribute("style", StyleAttr + ';' + Value);
                    }
                    else
                        CurrentElement.setAttribute("style", Value);
                    break;
                case 'o':
                    if ((ActionOperation == 'i') && (CurrentElement.querySelectorAll('option[value="' + Value.GetTextBefore("|") + ' "]')))
                        break;

                    var OptionTag = document.createElement("option");
                    var OptionValue = Value.GetTextBefore("|");
                    var OptionText = Value.GetTextAfter("|");
                    if (OptionText.Contains("|"))
                    {
                        OptionTag.selected = (OptionText.GetTextAfter("|") == "1");
                        OptionText = OptionText.GetTextBefore("|");
                    }

                    OptionTag.value = OptionValue;
                    OptionTag.text = OptionText;

                    CurrentElement.appendChild(OptionTag);
                    break;
                case 'k':
                    if ((CurrentElement.tagName.toLowerCase() == "input") && ((CurrentElement.type.toLowerCase() == "checkbox") || (CurrentElement.type.toLowerCase() == "radio")))
                    {
                        CurrentElement.checked = (Value == "1");
                        break;
                    }

                    if ((ActionOperation == 'i') && (CurrentElement.querySelectorAll('input[type="checkbox"][value="' + Value.GetTextBefore("|") + '"]')))
                        break;

                    var CheckBoxTag = document.createElement("input");
                    CheckBoxTag.setAttribute("type", "checkbox");

                    var CheckBoxValue = Value.GetTextBefore("|");
                    var CheckBoxText = Value.GetTextAfter("|");
                    if (CheckBoxText.Contains("|"))
                    {
                        CheckBoxTag.checked = (CheckBoxText.GetTextAfter("|") == "1");
                        CheckBoxText = CheckBoxText.GetTextBefore("|");
                    }

                    CheckBoxTag.setAttribute("value", CheckBoxValue);
                    var CeckBoxIndex = CurrentElement.querySelectorAll('input[type="checkbox"]').length;

                    var CheckBoxNameAndText = "cblst_NoneSet";
                    if (CurrentElement.id)
                        CheckBoxNameAndText = CurrentElement.id;
                    else
                        if (CeckBoxIndex > 0)
                            CheckBoxNameAndText = CurrentElement.querySelectorAll('input[type="checkbox"]')[0].name.GetTextBefore("$");

                    CheckBoxTag.id = CheckBoxNameAndText + "_" + CeckBoxIndex;
                    CheckBoxTag.name = CheckBoxNameAndText + "$" + CeckBoxIndex;

                    CurrentElement.appendChild(document.createElement("br"));

                    CurrentElement.appendChild(CheckBoxTag);

                    var LabelTag = document.createElement("label");
                    LabelTag.setAttribute("for", CheckBoxTag.id);
                    LabelTag.innerText = CheckBoxText;
                    CurrentElement.appendChild(LabelTag);

                    break;
                case 'l':
                    if (!CurrentElement.tagName.IsInput())
                    {
                        if (CurrentElement.hasAttribute("title"))
                        {
                            if ((ActionOperation == 'i') && CurrentElement.getAttribute("title"))
                                break;

                            var TitleAttr = CurrentElement.getAttribute("title");
                            CurrentElement.setAttribute("title", TitleAttr + Value);
                        }
                        else
                            CurrentElement.setAttribute("title", Value);
                        break;
                    }

                    if (!CurrentElement.id)
                        CurrentElement.id = "tmp_Element" + LabelForIndexer++;

                    var LabelTag = document.querySelector('label[for="' + CurrentElement.id + '"]');

                    if (LabelTag)
                    {
                        if ((ActionOperation == 'i') && CurrentElement.innerText)
                            break;

                        LabelTag.innerText = Value;
                    }
                    else
                    {
                        LabelTag = document.createElement("label");
                        LabelTag.setAttribute("for", CurrentElement.id);
                        LabelTag.innerText = Value;
                        CurrentElement.outerHTML = CurrentElement.outerHTML + LabelTag.outerHTML;
                    }
                    break;
                case 't':
                    if ((ActionOperation == 'i') && (CurrentElement.innerHTML || CurrentElement.innerText))
                        break;

                    CurrentElement.innerHTML = Value.Replace("$[ln];", "\n").toDOM(); break;
                case 'a':
                    var AttrName = Value.GetTextBefore("|");
                    var AttrValue = Value.GetTextAfter("|");
                    if (CurrentElement.hasAttribute(AttrName))
                    {
                        var CurrentAttr = CurrentElement.getAttribute(AttrName);

                        if ((ActionOperation == 'i') && (CurrentAttr.ContainsWithSpliter(AttrValue, ";")))
                            break;

                        if (CurrentAttr.charAt(CurrentAttr.length - 1) == ';')
                            CurrentElement.setAttribute(AttrName, CurrentAttr + AttrValue);
                        else
                            CurrentElement.setAttribute(AttrName, CurrentAttr + ';' + AttrValue);
                    }
                    else
                        CurrentElement.setAttribute(AttrName, AttrValue);
                    break;
            }
            break;

        case 'd':
            switch (ActionFeature)
            {
                case 'i':
                    if (CurrentElement.id && Value == "1")
                        CurrentElement.removeAttribute("id");
                    break;
                case 'n':
                    if (CurrentElement.name && Value == "1")
                        CurrentElement.removeAttribute("name");
                    break;
                case 'v':
                    if (CurrentElement.value && Value == "1")
                        CurrentElement.value = "";
                    break;
                case 'c':
                    if (CurrentElement.className)
                        CurrentElement.className = CurrentElement.className.DeleteHtmlClass(Value);
                    break;
                case 's':
                    if (CurrentElement.hasAttribute("style"))
                    {
                        var StyleAttr = CurrentElement.getAttribute("style").DeleteHtmlStyle(Value);
                        CurrentElement.setAttribute("style", StyleAttr);
                    }
                    break;
                case 'o': CurrentElement.querySelectorAll('option[value="' + Value + '"]')[0].outerHTML = ""; break;
                case 'k':
                    var CheckBoxTag = CurrentElement.querySelectorAll('input[type="checkbox"][value="' + Value + '"]')[0];
                    if (CheckBoxTag)
                    {
                        if (CheckBoxTag.id)
                            CurrentElement.querySelectorAll('label[for="' + CheckBoxTag.id + '"]')[0].outerHTML = "";

                        CheckBoxTag.outerHTML = "";
                    }
                    break;
                case 'l':
                    if (!CurrentElement.tagName.IsInput())
                    {
                        if (CurrentElement.hasAttribute("title") && Value == "1")
                            CurrentElement.removeAttribute("title");

                        break;
                    }

                    if (CurrentElement.id)
                    {
                        var LabelTag = document.querySelector('label[for="' + CurrentElement.id + '"]');
                        if (LabelTag)
                            LabelTag.outerHTML = "";
                    }

                    break;
                case 't':
                    if (Value == "1")
                        CurrentElement.innerHTML = "";
                    break;
                case 'a':
                    if (CurrentElement.hasAttribute(Value))
                        CurrentElement.removeAttribute(Value);

                    break;
                case 'e':
                    if (Value == "1")
                        CurrentElement.outerHTML = "";

                    break;
            }
            break;
    }

    switch (ActionOperation + ActionFeature)
    {
        case "sw": CurrentElement.style.width = Value; break;
        case "sh": CurrentElement.style.height = Value; break;
        case "bc": CurrentElement.style.backgroundColor = Value; break;
        case "tc": CurrentElement.style.color = Value; break;
        case "fn": CurrentElement.style.fontFamily = Value; break;
        case "fs": CurrentElement.style.fontSize = Value; break;
        case "fb": CurrentElement.style.fontWeight = (Value == "1") ? "bold" : "unset"; break;
        case "vi": CurrentElement.style.visibility = (Value == "1") ? "visible" : "hidden"; break;
        case "ta": CurrentElement.style.textAlign = Value; break;
        case "sr": (Value == "1") ? CurrentElement.setAttribute("readonly", "") : CurrentElement.removeAttribute("readonly"); break;
        case "mn": CurrentElement.setAttribute("minlength", Value); break;
        case "mx": CurrentElement.setAttribute("maxlength", Value); break;
        case "ts": CurrentElement.value = Value; break;
        case "ti": CurrentElement.selectedIndex = Value; break;
        case "ks":
            var CheckBoxValue = Value.GetTextBefore("|");
            var CheckBoxChecked = Value.GetTextAfter("|");
            var CheckBoxTag = CurrentElement.querySelectorAll('input[type="checkbox"][value="' + CheckBoxValue + '"]')[0];
            if (CheckBoxTag)
                CheckBoxTag.checked = (CheckBoxChecked == "1");
            break;
        case "ki":
            var CheckBoxIndex = Value.GetTextBefore("|");
            var CheckBoxChecked = Value.GetTextAfter("|");
            var CheckBoxTag = CurrentElement.querySelectorAll('input[type="checkbox"]')[CheckBoxIndex];
            if (CheckBoxTag)
                CheckBoxTag.checked = (CheckBoxChecked == "1");
            break;
    }
}

function cb_GetElementByElementPlace(ElementPlace)
{
    var ElementPlaceFirstChar = ElementPlace.substring(0, 1);

    switch (ElementPlaceFirstChar)
    {
        case '<':
            var TagName = ElementPlace.substring(1).GetTextBefore(">");
            var TagIndex = (ElementPlace.length > (TagName.length + 2)) ? ElementPlace.substring(TagName.length + 2) : 0;
            return document.getElementsByTagName(TagName)[TagIndex];

        case '(':
            var TagNameAttr = ElementPlace.substring(1).GetTextBefore(")");
            var TagNameIndex = (ElementPlace.length > (TagNameAttr.length + 2)) ? ElementPlace.substring(TagNameAttr.length + 2) : 0;
            return document.getElementsByName(TagNameAttr)[TagNameIndex];

        case '{':
            var ClassName = ElementPlace.substring(1).GetTextBefore("}");
            var ClassIndex = (ElementPlace.length > (ClassName.length + 2)) ? ElementPlace.substring(ClassName.length + 2) : 0;
            return document.getElementsByClassName(ClassName)[ClassIndex];

        default: return document.getElementById(ElementPlace);
    }
}

/* End Fetch Web-Forms */

/* Start Extension Methods */

String.prototype.toDOM = function ()
{
    var DivTag = document.createElement("div");
    DivTag.innerHTML = this;

    return DivTag.innerHTML;
};

String.prototype.FullTrim = function ()
{
    return this.trim().replace(/^\s\n+|\s\n+$/g, '');
};



String.prototype.IsInput = function ()
{
    var TagName = this.toLowerCase();

    switch (TagName)
    {
        case "input":
        case "textarea":
        case "select":
        case "file":
        case "button":
            return true;
    }
    return false;
};

String.prototype.GetTextBefore = function (Text)
{
    if (!Text)
        return this;

    var index = this.indexOf(Text);
    if (index === -1)
        return "";

    return this.substring(0, index);
};

String.prototype.GetTextAfter = function (Text)
{
    if (!Text)
        return this;

    var index = this.indexOf(Text);
    if (index === -1)
        return "";

    return this.substring(index + Text.length);
};

String.prototype.DeleteHtmlClass = function(ClassName)
{
    var ClassText = this;

    if (!ClassText)
        return "";

    var ClassNameIndex = ClassText.indexOf(ClassName);

    var Space = (ClassNameIndex == 0) ? "" : " ";
        
    ClassText = ClassText.replace(Space + ClassName, "");

    if (ClassText)
        if (ClassText[0] == ' ')
            ClassText = ClassText.slice(1);

    return ClassText;
};

String.prototype.DeleteHtmlStyle = function (StyleName)
{
    var StyleText = this;
    if (!StyleText) return "";

    var StartIndex = StyleText.indexOf(StyleName);
    if (StartIndex == -1)
        return StyleText;

    var EndIndex = StartIndex + StyleName.length;
    if (StyleText[EndIndex] == ";")
        EndIndex++;

    return StyleText.substring(0, StartIndex) + StyleText.substring(EndIndex);
};

String.prototype.Contains = function (Text)
{
    return this.indexOf(Text) !== -1;
};

String.prototype.ContainsWithSpliter = function (Text, Spliter)
{
    return (Spliter + this + Spliter).indexOf(Spliter + Text + Spliter) !== -1;
};

String.prototype.Replace = function (SearchValue, ReplaceValue)
{
    var MainText = this;
    
    if (!MainText)
        return MainText;

    if (!SearchValue)
        return MainText;

    while (MainText.indexOf(SearchValue) > -1)
        MainText = MainText.replace(SearchValue, ReplaceValue);

    return MainText;
};

/* End Extension Methods */
