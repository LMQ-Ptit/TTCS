# Tạo file detect_server.py
from flask import Flask, jsonify, request
import detect_latest

app = Flask(__name__)

@app.route('/detect', methods=['POST'])
def detect():
    data = request.get_json()
    folder = data.get('folder')
    weights = data.get('weights')
    conf_thres = float(data.get('conf_thres', 0.35))
    
    labels = detect_latest.detect_latest_image(folder, weights, conf_thres)
    return jsonify({"labels": labels})

if __name__ == '__main__':
    app.run(port=5000)