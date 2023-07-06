from flask import Flask, jsonify
from flask_cors import CORS

def create_app() -> Flask:
  app = Flask(__name__)
  CORS(app)

  @app.route('/<name>')
  def hello_world(name: str):
    return jsonify('hElLo: {}!'.format(name))

  return app

if __name__ == '__main__':
  app = create_app()
  app.run()