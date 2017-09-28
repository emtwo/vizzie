import os
import re
import json
import BaseHTTPServer

from redash_client.client import RedashClient
from redash_client.constants import VizWidth
from redash_client.dashboards.ActivityStreamExperimentDashboard import (
    ActivityStreamExperimentDashboard)

HOST_NAME = 'localhost'
PORT_NUMBER = 8000

api_key = os.environ["REDASH_API_KEY"]
redash_client = RedashClient(api_key)

class JSONHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def generate_dashboard(self, payload):
    current_templates = redash_client.search_queries(payload["templateTag"])

    dash = ActivityStreamExperimentDashboard(
        redash_client,
        payload["projectTitle"],
        payload["dashboardTitle"],
        "meep",
        start_date='2017-08-29'
    )
    chart_data = dash.get_query_ids_and_names()

    for template in current_templates:
      dash_title = template["name"]
      if dash_title not in payload["params"]:
        continue

      params_object = payload["params"][dash_title]
      for param in params_object:
        dash._params[param] = params_object[param]

      adjusted_title = dash_title.split(": ")[1]
      dash._add_template_to_dashboard(
          template, chart_data, adjusted_title, VizWidth.WIDE, "")

    return {"public_url": dash.public_url,}

  def handle_template_tag(self, tag):
    current_templates = redash_client.search_queries(tag)
    templates = []

    for visualization in current_templates:
      print re.findall('\{\{(\w+)\}\}', visualization["query"])
      template = {
        "name": visualization["name"],
        "variables": re.findall('\{\{(\w+)\}\}', visualization["query"])
      }
      templates.append(template)

    response = {
      "templates": templates,
    }
    return response

  def do_POST(self):
    response_code = 200
    response = ""
    var_len = int(self.headers.get('Content-Length'))
    content = self.rfile.read(var_len);
    payload = json.loads(content);

    if payload.get('dashboardTitle'):
      response = self.generate_dashboard(payload)
    elif payload.get('templateTag'):
      response = self.handle_template_tag(payload['templateTag'])
    else:
      response_code = 400

    self.send_response(response_code)
    self.send_header("Content-type", "application/json")
    self.send_header("Access-Control-Allow-Origin", "*")
    self.end_headers()
    if response:
        self.wfile.write(json.dumps(response))
    return

if __name__ == '__main__':
  server_class = BaseHTTPServer.HTTPServer;
  httpd = server_class((HOST_NAME, PORT_NUMBER), JSONHandler)

  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  else:
    print "Unexpected server exception occurred."
  finally:
    httpd.server_close()
