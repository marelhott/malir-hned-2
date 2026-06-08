import os, sys
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'dist'))
sys.argv = ['server']
from http.server import HTTPServer, SimpleHTTPRequestHandler
HTTPServer(('', 3000), SimpleHTTPRequestHandler).serve_forever()
