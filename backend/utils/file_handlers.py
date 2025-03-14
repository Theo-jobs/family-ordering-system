import os
import json
import base64
import uuid
from datetime import datetime

# 确保目录存在
def ensure_dir(directory):
    """确保指定的目录存在，如果不存在则创建"""
    if not os.path.exists(directory):
        os.makedirs(directory)

# 读取JSON文件
def read_json_file(file_path):
    """从指定路径读取JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # 如果文件不存在，返回空列表
        return []
    except json.JSONDecodeError:
        # 如果JSON格式错误，也返回空列表
        print(f"警告: {file_path} 包含无效的JSON，返回空列表")
        return []

# 写入JSON文件
def write_json_file(file_path, data):
    """将数据写入指定路径的JSON文件"""
    # 确保目录存在
    ensure_dir(os.path.dirname(file_path))
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 保存Base64编码的图片
def save_base64_image(base64_data, directory, filename=None):
    """保存Base64编码的图片到指定目录"""
    # 确保目录存在
    ensure_dir(directory)
    
    # 如果未提供文件名，生成一个唯一的文件名
    if not filename:
        filename = f"{uuid.uuid4()}.jpg"
    
    # 提取Base64数据部分
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    
    # 解码Base64数据
    image_data = base64.b64decode(base64_data)
    
    # 保存图片
    file_path = os.path.join(directory, filename)
    with open(file_path, 'wb') as f:
        f.write(image_data)
    
    return file_path

# 删除文件
def delete_file(file_path):
    """删除指定路径的文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"删除文件时出错: {str(e)}")
        return False

# 初始化数据文件
def init_data_files(base_path='static/data'):
    """初始化必要的数据文件"""
    # 确保数据目录存在
    ensure_dir(base_path)
    
    # 需要初始化的数据文件
    data_files = {
        'dishes.json': [],
        'orders.json': [],
        'reviews.json': []
    }
    
    # 检查并初始化每个文件
    for filename, default_data in data_files.items():
        file_path = os.path.join(base_path, filename)
        if not os.path.exists(file_path):
            write_json_file(file_path, default_data)