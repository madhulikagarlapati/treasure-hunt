import http.server
import socketserver
import os

PORT = 8000

if __name__ == '__main__':
    os.chdir('static')
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(('', PORT), handler) as httpd:
        print(f'Serving static files at http://127.0.0.1:{PORT}')
        httpd.serve_forever()
