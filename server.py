import os
import re
import json
import BaseHTTPServer

from redash_client.client import RedashClient

HOST_NAME = 'localhost'
PORT_NUMBER = 8000

api_key = os.environ["REDASH_API_KEY"]
redash_client = RedashClient(api_key)

class JSONHandler(BaseHTTPServer.BaseHTTPRequestHandler):
   def do_POST(s):
    response_code = 200
    response = ""
    var_len = int(s.headers.get('Content-Length'))
    content = s.rfile.read(var_len);
    payload = json.loads(content);

    if payload.get('templateTag'):
      tag = payload['templateTag']
      results = redash_client.search_queries(tag)
      templates = []

      for visualization in results:
        print re.findall('\{\{(\w+)\}\}', visualization["query"])
        template = {
          "name": visualization["name"],
          "variables": re.findall('\{\{(\w+)\}\}', visualization["query"])
        }
        templates.append(template)

      response = {
        "templates": templates,
      }
    else:
        response_code = 400

    s.send_response(response_code)
    s.send_header("Content-type", "application/json")
    s.send_header("Access-Control-Allow-Origin", "*")
    s.end_headers()
    if response:
        s.wfile.write(json.dumps(response))
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
