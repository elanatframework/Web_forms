![ ](https://github.com/user-attachments/assets/e44373ab-751f-4cea-83a0-93161aaae9d2)
# WebFormsJS

WebFormsJS is a JavaScript library that provides the infrastructure for interacting with web controls in the [CodeBehind framework](https://github.com/elanatframework/Code_behind); this allows developers to easily manage HTML tags on the server-side.

WebFormsJS is a new architecture similar to Microsoft's former Web-Forms, but has none of its disadvantages. The performance of WebFormsJS is much more than the previous Web-Forms, so that it manages all HTML tags.

Using WebFormsJS allows the developers to focus on the server response and therefore there is no need to develop the front side and the developers set the controls on the server-side. WebFormsJS can also be used outside of the CodeBehind framework. In the rest of this article, we teach how to set the server response to interact with WebFormsJS.

The bandwidth consumption when using WebFormsJS is very low. WebFormsJS is like a gasoline car that absorbs carbon pollution as much as it pollutes the air.

Advantages of using WebFormsJS:

- WebFormsJS provides features like postback, progress bar and script extraction.
- WebForms is an advanced system that can be run with simple HTML pages without View or server script pages.
- WebFormsJS automatically sends form data through Ajax. WebFormsJS serializes form data as a string or a FormData object, depending on whether the form is multipart or not.
- Using WebFormsJS reduces the complexity of web development.

## Options

At the beginning of the web-forms.js file, there are WebFormsJS customization options. The following codes show the options of this file:
```javascript
var PostBackOptions = new Object();
PostBackOptions.UseProgressBar = true;
PostBackOptions.UseConnectionErrorMessage = true;
PostBackOptions.ConnectionErrorMessage = "Connection Error";
PostBackOptions.AutoSetSubmitOnClick = true;
PostBackOptions.SendDataOnlyByPostMethod = false;
PostBackOptions.ResponseLocation = document.body;
```
WebFormsJS options:

- UseProgressBar: If there is a file input in the form, the progress bar will show the amount of data sent on the screen.
- UseConnectionErrorMessage: Enabling this option causes the error text to be displayed.
- ConnectionErrorMessage: The text to display when an error occurs.
- AutoSetSubmitOnClick: Enabling this option makes submit type inputs automatically send data through WebFormsJS.
- SendDataOnlyByPostMethod: Enabling this option causes the data to be sent with the Post method; Therefore, the form method is ignored.
- ResponseLocation: When there is no action control, it specifies the location of the server's responses.

## Action Controls

Action Controls are WebFormsJS received codes that are received in INI format. WebFormsJS automatically detects whether the server response has Action Controls or not. If the server's response is based on the structure of an INI file that starts with `[web-forms]`, it will process the Action Controls, otherwise it will replace the server's response in the form of Ajax on the page.

Example of received Action Controls:
```ini
[web-forms]
as<body>=background-color:green
saCheckBoxInput=onchange|MyNewFunc()
deMyTagId=1
ta<i>2=right
aoSelectInput=OptionValue|Option Text|1
al(InputName)=My Input Title
```

- Line 1: `as<body>=background-color:green`
Here, the first two characters are `as`, which means adding a style, and then it is specified that it will be applied to the `body` tag, and after the equal character (`=`), the style attribute is specified.
- Line 2: `saCheckBoxInput=onchange|MyNewFunc()`
Here, the first two characters are `sa`, which means adding an attribute, and then it is specified that it will be applied to a tag with the id `CheckBoxInput`, and after the equal character (`=`), the name and value of the attribute is specified, which is specified by the character (`|`) are separated.
- Line 3: `deMyTagId=1`
Here, the first two characters are `de`, which means to delete the tag, and then it is determined that it will be applied to a tag with the id `MyTagId`, and after the equal character (`=`) there is a value of `1`, which means to apply deletion.
- Line 4: `ta<i>2=right`
Here, the first two characters are `ta`, which means text align, and then it is determined that it will be applied to a third tag named `li`, and after the equal character (`=`) there is a value of right which means right to left.
- Line 5: `aoSelectInput=OptionValue|Option Text|1`
Here, the first two characters are `ao`, which means adding the option tag, and then it is specified that it will be applied to a tag with the id name `SelectInput`, and after the equal character (`=`), the option value is placed, and after the character (`|`) option text is placed and at the end after the (`|`) character is the number `1`, which means that the option is active (`checked`).
- Line 6: `al(InputName)=My Input Title`
Here, the first two characters are `al`, which means adding a title, and then it is specified that it will be applied to a tag named `InputName`, and after the equal character (`=`), the title text is specified.

## Explanation of the action controls

Action controls are received in the form of an INI file format. In the first line of the response there is the word `[web-forms]` and each of the following lines is an action control.

The first two characters determine the action code. For example, things like adding styles and removing tags can be obtained from action codes. The first two letters stand for actions and indicate that an action must be performed.

After the first two letters, there are 6 status types that specify the tag. Then the equal character is placed and after that the values ​​are placed.

Below is the list of all action codes:

### Add

The following items are added to the available amount:
- ai: **Add Id** - Value: `Id`
- an: **Add Name** - Value: `Name`
- av: **Add Value** - Value: `Value`
- ac: **Add Class** - Value: `Class`
- as: **Add Style** - Value: `Style`
- ao: **Add Option Tag** - Value: `Value|Text|1 or 0`
- ak: **Add CheckBox Tag** - Value: `Value|Text|1 or 0`
- al: **Add Title** - Value: `Title`
- at: **Add Text** - Value: `Text` (string value `$[ln];` it replaces by `\n` character)
- aa: **Add Attribute** - Value: `Attribute|Value`
- nt: **Add Tag** - Value: `TagName|Id`

### Set

The following replaces the existing values:
- si: **Set Id** - Value: `Id`
- sn: **Set Name** - Value: `Name`
- sv: **Set Value** - Value: `Value`
- sc: **Set Class** - Value: `Class`
- ss: **Set Style** - Value: `Style`
- so: **Set Option Tag** - Value: `Value|Text|1 or 0`
- sk: **Set Checked** - Value: For input with checked type `1 or 0` - For any tags `Value|Text|1 or 0`
- sl: **Set Title** - Value: `Title`
- st: **Set Text** - Value: `Text` (string value `$[ln];` it replaces by `\n` character)
- sa: **Set Attribute** - Value: `Attribute|Value`
- sw: **Set Width** - Value: `Width`
- sh: **Set Height** - Value: `Height`
- bc: **Set Background Color** - Value: `Color`
- tc: **Set Text Color** - Value: `Color`
- fn: **Set Font Name** - Value: `Name`
- fs: **Set Font Size** - Value: `Size`
- fb: **Set Font Bold** - Value: `1 or 0`
- vi: **Set Visible** - Value: `1 or 0`
- ta: **Set Text Align** - Value: `Align`
- sr: **Set Read Only** - Value: `1 or 0`
- mn: **Set Min Length** - Value: `Length`
- mx: **Set Max Length** - Value: `Length`
- ts: **Set Selected Value** - Value: `Value`
- ti: **Set Selected Index** - Value: `Index`
- ks: **Set Checked Value** - Value: `Value|1 or 0`
- ki: **Set Checked Index** - Value: `Index|1 or 0`

### Insert

The following items are added only if there are no pre-existing values:
- ii: **Insert Id** - Value: `Id`
- in: **Insert Name** - Value: `Name`
- iv: **Insert Value** - Value: `Value`
- ic: **Insert Class** - Value: `Class`
- is: **Insert Style** - Value: `Style`
- io: **Insert Option Tag** - Value: `Value|Text|1 or 0`
- ik: **Insert CheckBox Tag** - Value: `Value|Text|1 or 0`
- il: **Insert Title** - Value: `Title`
- it: **Insert Text** - Value: `Text` (string value `$[ln];` it replaces by `\n` character)
- ia: **Insert Attribute** - Value: `Attribute|Value`

### Delete

The following will remove the current values:

- di: **Delete Id** - Value: `1`
- dn: **Delete Name** - Value: `1`
- dv: **Delete Value** - Value: `1`
- dc: **Delete Class** - Value: `Class`
- ds: **Delete Style** - Value: `Style` (only the style name is entered without a value)
- do: **Delete Option Tag** - Value: `Value`
- dk: **Delete CheckBox Tag** - Value: `Value`
- dl: **Delete Title** - Value: `1`
- dt: **Delete Text** - Value: `1`
- da: **Delete Attribute** - Value: `Attribute`
- de: **Delete Tag** - Value: `1`


> Note: Action controls are executed sequentially; if an action control decides to change an `id` attribute from a tag, subsequent action controls cannot perform actions with the previous `id` attribute.

## Define the tag

After the first two characters, there are 6 status types that define the tag:

- Based on `id`: Based on the name of the `id`, it recognizes the tag and the character (`=`) is placed immediately after it.
- By `name`: Identifies the tag based on the `name` attribute. It is placed in open and closed parentheses (`(Name)`), and if a number is placed after it, it specifies the index, and then the (`=`) character is placed after it.
- Based on the `tag name`: Based on the `tag name`, it recognizes the tag. It is placed inside the smaller and larger signs (`<tag name>)`), and if a number is placed after it, it specifies the index, and then the (`=`) character is placed after it.
- Based on `class name`: Identifies the tag based on the `class name`. It is placed in open and closed brackets (`{class name}`), and if a number is placed after it, it specifies the index, and then the character (`=`) is placed after it.
- Based on `query`: Identifies the tag based on the `query`. The query string is placed after the (`*`) character , and then the character (`=`) is placed after it.
- Based on `query all`: It applies to multiple tags and identifies tags based on "query". The query string is placed after the (`[`) character , and then the character (`=`) is placed after it.

> Note: By default, the indexes of the `name`, `class name`, and `tag name` are set to `0`.

Example: Action control with the value `de<li>=1` is not different from the value `de<li>0=1`.

## Responding

WebFormsJS has a different approach to responding to the first page request in the browser and AJAX requests when the page is already loaded and the user makes a request.

In the first case, if an action is added for the controls, a script is added at the bottom of the page and the actions are placed in the `cb_SetWebFormsValues` ​​method.

Example:

```html
<!DOCTYPE html>
<html>
<head>
...
</head>
<body>
...
	<input name="TextBox" id="TextBox" type="text" />
...
</body>
</html><script>cb_SetWebFormsValues(`[web-forms]$[sln];asTextBox=color:red`);</script>
```

In the second case, after the user's request, if the current View is changed, the server must place the Set Text code for the main tag (usually `body`) at the beginning of the action code.

Example:

```ini
[web-forms]
st<body>=...$[ln];	<input name="TextBox" id="TextBox" type="text" />$[ln];...
as<body>=background-color:green
```
