/**
  * This module creates a 200x200 pixel canvas for a user to draw
  * digits. The digits can either be used to train the neural network
  * or to test the network's current prediction for that digit.
  *
  * To simplify computation, the 200x200px canvas is translated as a 20x20px
  * canvas to be processed as an input array of 1s (white) and 0s (black) on
  * on the server side. Each new translated pixel's size is 10x10px
  *
  * When training the network, traffic to the server can be reduced by batching
  * requests to train based on BATCH_SIZE.
  */
var visualize = {
  // Server Variables
  PORT: "8000",
  HOST: "http://localhost",

  requestTemplates() {
    let templateTag = document.getElementById("tag").value;
    if (!templateTag) {
      alert("Please enter a tag to view available templates");
      return;
    }

    let json = { templateTag };
    alert("Requesting templates for \"" + templateTag + "\"");
    this.sendData(json);
  },

  _addTemplateVariables(variables, list) {
    let allVariables = document.createElement("div");
    for (variable of variables) {
      // A template variable is a paragraph with text.
      let varParagraph = document.createElement("p");
      varParagraph.style.marginLeft = "50px";
      let varText = document.createTextNode(variable + ": ");

      // A template variable has input to set its value.
      let varInput = document.createElement("input");
      varInput.type = "text";

      varParagraph.appendChild(varText);
      varParagraph.appendChild(varInput);
      allVariables.appendChild(varParagraph);
    }
    return allVariables;
  },

  _createCheckbox(text) {
    let item = document.createElement("li");
    item.style.listStyle = 'none';

    let label = document.createElement("label");
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text));
    item.appendChild(label);
    return item;
  },

  _addTemplateOptions(templates) {
    let list = document.getElementById("template_list")

    for (template of templates){
      let checkbox = this._createCheckbox(template["name"]);
      list.appendChild(checkbox);

      let variables = this._addTemplateVariables(template["variables"], list);
      variables.style.visibility = "hidden";
      variables.style.display = "none";
      list.appendChild(variables);

      checkbox.addEventListener("change", (boo) => {
        if (variables.style.visibility == "hidden") {
          variables.style.visibility = "visible";
          variables.style.display = "block";
        } else {
          variables.style.visibility = "hidden";
          variables.style.display = "none";
        }
      });
    }
  },

  _receiveResponse(xmlHttp) {
    if (xmlHttp.status != 200) {
      alert("Server returned status " + xmlHttp.status);
      return;
    }
    let responseJSON = JSON.parse(xmlHttp.responseText);
    if (xmlHttp.responseText && responseJSON.templates) {
      this._addTemplateOptions(responseJSON.templates);
    }
    document.getElementById("section2").style.visibility = "visible";
  },

  _onError(e) {
    alert("Error occurred while connecting to server: " + e.target.statusText);
  },

  sendData(json) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('POST', this.HOST + ":" + this.PORT, false);
    xmlHttp.onload = function() { this._receiveResponse(xmlHttp); }.bind(this);
    xmlHttp.onerror = function() { this._onError(xmlHttp) }.bind(this);
    var msg = JSON.stringify(json);
    xmlHttp.setRequestHeader('Content-length', msg.length);
    xmlHttp.setRequestHeader("Connection", "close");
    xmlHttp.send(msg);
  }
}