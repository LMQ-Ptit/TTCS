import sys
import torch
import json

# Kiểm tra tham số đầu vào
if len(sys.argv) < 2:
    print(json.dumps({"error": "Thiếu đường dẫn ảnh"}))
    sys.exit(1)

image_path = sys.argv[1]

try:
    # Tải mô hình YOLOv5
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
    
    # Đặt ngưỡng tin cậy
    model.conf = 0.3  # Ngưỡng tin cậy 30%
    
    # Thực hiện nhận dạng đối tượng
    results = model(image_path)
    
    # Trích xuất nhãn (không trùng lặp)
    pred = results.xyxy[0].cpu().numpy()
    labels = {}
    
    # Ghi lại nhãn với độ tin cậy cao nhất cho mỗi loại
    for *_, conf, cls_id in pred:
        class_name = results.names[int(cls_id)]
        confidence = float(conf)
        
        # Chỉ lưu nhãn với độ tin cậy cao nhất
        if class_name not in labels or confidence > labels[class_name]:
            labels[class_name] = confidence
    
    # Chuyển đổi kết quả thành danh sách để sắp xếp
    output = [{"label": label, "confidence": conf} for label, conf in labels.items()]
    
    # Sắp xếp theo độ tin cậy giảm dần
    output.sort(key=lambda x: x["confidence"], reverse=True)
    
    # In kết quả dạng JSON (để Node.js có thể đọc)
    print(json.dumps(output))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)