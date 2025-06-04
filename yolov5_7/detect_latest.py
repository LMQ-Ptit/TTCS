import os
from pathlib import Path
import torch
import sys
# Biến toàn cục để lưu trữ mô hình đã nạp
GLOBAL_MODEL = None
GLOBAL_DEVICE = None
# Thêm thư mục yolov5 vào đường dẫn
FILE = Path(__file__).resolve()
ROOT = FILE.parent
if str(ROOT / 'yolov5') not in sys.path:
    sys.path.append(str(ROOT / 'yolov5'))

# Chỉ import những thứ cần thiết
from yolov5.models.common import DetectMultiBackend
from yolov5.utils.general import non_max_suppression
from yolov5.utils.torch_utils import select_device

def find_latest_image(directory):
    """Tìm file ảnh mới nhất trong thư mục - phiên bản tối ưu"""
    # Chỉ hỗ trợ 2 định dạng phổ biến nhất
    image_extensions = ['.jpg', '.png']
    
    # Lấy tất cả các file trong thư mục gốc
    try:
        all_files = list(Path(directory).glob('*.*'))
        image_files = [f for f in all_files if f.suffix.lower() in image_extensions]
        
        if not image_files:
            return None
        
        return max(image_files, key=os.path.getmtime)
    except Exception:
        return None

def detect_latest_image(source, weights='yolov5s.pt', conf_thres=0.35, device=''):
    """Chạy phát hiện YOLOv5 tối ưu trên ảnh mới nhất"""
    # Tìm ảnh mới nhất
    latest_image = find_latest_image(source)
    if not latest_image:
        return []
    
    # Khởi tạo tối thiểu
    device = select_device(device)
    model = DetectMultiBackend(weights, device=device)
    names = model.names
    
    # Tải ảnh trực tiếp thay vì dùng LoadImages
    img = torch.from_numpy(cv_image_to_tensor(str(latest_image), size=320)).to(device)
    
    # Sử dụng torch.no_grad() để tăng tốc suy luận
    with torch.no_grad():
        pred = non_max_suppression(model(img[None]), conf_thres)
    
    # Thu thập tất cả các nhãn đã phát hiện (bao gồm cả trùng lặp)
    all_labels = []
    unique_labels = set()
    if len(pred[0]):
        for *_, _, cls in pred[0]:
            label = names[int(cls)]
            all_labels.append(label)
            unique_labels.add(label)
    
    # Trả về danh sách các nhãn độc nhất (không trùng lặp)
    return list(unique_labels)
    
def cv_image_to_tensor(image_path, size=640):  # Giảm từ 320 xuống 160
    """Chuyển đổi ảnh sang tensor nhanh hơn, với kích thước nhỏ hơn"""
    import cv2
    import numpy as np
    
    # Đọc ảnh với kích thước cố định nhỏ để tăng tốc
    img = cv2.imread(image_path)
    img = cv2.resize(img, (size, size))
    img = img[:, :, ::-1].transpose(2, 0, 1)  # BGR to RGB, to 3x160x160
    img = np.ascontiguousarray(img) / 255.0
    img = img.astype(np.float32)
    return img

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=str, required=True, help='Thư mục chứa ảnh')
    parser.add_argument('--weights', type=str, default='yolov5/yolov5s.pt', help='Đường dẫn mô hình')
    parser.add_argument('--conf-thres', type=float, default=0.35, help='Ngưỡng tin cậy')
    parser.add_argument('--device', default='', help='Thiết bị cuda (ví dụ: 0 hoặc cpu)')
    opt = parser.parse_args()
    
    labels = set(detect_latest_image(**vars(opt)))
    
    print("Các đối tượng phát hiện được:")
    for label in labels:
        print(f"- {label}")
    if not labels:
        print("Không phát hiện đối tượng nào")