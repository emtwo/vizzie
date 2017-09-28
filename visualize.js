let visualize = {
  // Server Variables
  PORT: "8000",
  HOST: "http://localhost",

  requestTemplates() {
    this._templateTag = document.getElementById("tag").value;
    if (!this._templateTag) {
      alert("Please enter a tag to view available templates");
      return;
    }

    let json = { templateTag: this._templateTag };
    alert("Requesting templates for \"" + this._templateTag + "\"");
    this.sendData(json);
  },

  generateDashboard() {
    let dashboardRequest = {
      templateTag: this._templateTag,
      projectTitle: document.getElementById("project_title").value,
      dashboardTitle: document.getElementById("dash_title").value
    };
    let graphData = {};
    for (let graphName in this._chartInfo) {
      let chartSelected = this._chartInfo[graphName].chartSelected.checked;
      if (!chartSelected) {
        continue;
      }
      graphData[graphName] = {};
      for (let param in this._chartInfo[graphName]["chartValues"]) {
        if (!param) {
          alert("You're missing a parameter for graphName!");
          return;
        }
        graphData[graphName][param] = this._chartInfo[graphName]["chartValues"][param].value;
      }
    }
    dashboardRequest["params"] = graphData;
    this.sendData(dashboardRequest);
  },

  _addTemplateVariables(name, variables, list) {
    let allVariables = document.createElement("div");
    this._chartInfo[name]["chartValues"] = {};
    for (variable of variables) {
      // A template variable is a paragraph with text.
      let varParagraph = document.createElement("p");
      varParagraph.style.marginLeft = "50px";
      let varText = document.createTextNode(variable + ": ");

      // A template variable has input to set its value.
      let varInput = document.createElement("input");
      this._chartInfo[name]["chartValues"][variable] = varInput;
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
    this._chartInfo[text]["chartSelected"] = checkbox;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(text));
    item.appendChild(label);
    return item;
  },

  _addTemplateOptions(templates) {
    /**
     *  this._chartInfo is formatted as:
     *
     *  {
     *    <chart name>: {
     *      "chartSelected: <checkbox dom element>,
     *      "chartValues": {
     *        <chart parameter name>: <chart dom element>,
     *        ........
     *      }
     *    }
     *  }
    **/
    this._chartInfo = {};
    let list = document.getElementById("template_list");

    for (template of templates) {
      this._chartInfo[template["name"]] = {};
      let checkbox = this._createCheckbox(template["name"]);
      list.appendChild(checkbox);

      let variables = this._addTemplateVariables(
          template["name"], template["variables"], list);
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
    if (xmlHttp.responseText) {
      if (responseJSON.templates) {
        this._addTemplateOptions(responseJSON.templates);
        document.getElementById("section2").style.visibility = "visible";
      } else if (responseJSON.public_url) {
        document.getElementById("dashboard").src = responseJSON.public_url;
        document.getElementById("section3").style.visibility = "visible";
      }
    }
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