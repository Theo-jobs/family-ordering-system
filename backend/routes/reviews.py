from flask import Blueprint, jsonify, request
import json
import os
import uuid
import base64
from datetime import datetime

reviews_bp = Blueprint('reviews', __name__)

# 读取JSON文件辅助函数
def read_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"警告: {file_path} 无法读取或为空，返回空列表")
        return []

# 写入JSON文件辅助函数
def write_json_file(file_path, data):
    # 确保目录存在
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# 获取所有评价
@reviews_bp.route('/', methods=['GET'])
def get_all_reviews():
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        # 确保文件存在
        if not os.path.exists(reviews_path):
            os.makedirs(os.path.dirname(reviews_path), exist_ok=True)
            with open(reviews_path, 'w', encoding='utf-8') as f:
                json.dump([], f)
            print(f"创建新的评价文件: {reviews_path}")
            return jsonify([])
            
        reviews = read_json_file(reviews_path)
        return jsonify(reviews)
    except Exception as e:
        print(f"获取评价错误: {str(e)}")
        return jsonify({"error": f"获取评价错误: {str(e)}"}), 500

# 按菜品ID获取评价
@reviews_bp.route('/dish/<dish_id>', methods=['GET'])
def get_reviews_by_dish(dish_id):
    try:
        # 使用绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        reviews = read_json_file(reviews_path)
        dish_reviews = [r for r in reviews if r.get('dish_id') == dish_id]
        return jsonify(dish_reviews)
    except Exception as e:
        print(f"获取菜品评价错误: {str(e)}")
        return jsonify({"error": f"获取菜品评价错误: {str(e)}"}), 500

# 添加新评价
@reviews_bp.route('/', methods=['POST'])
def add_review():
    try:
        data = request.json
        
        # 验证必填字段
        required_fields = ['dish_id', 'rating', 'comment']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"缺少必填字段: {field}"}), 400
        
        # 验证评分在有效范围内
        if not (1 <= data['rating'] <= 5):
            return jsonify({"error": "评分必须在1-5之间"}), 400
        
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        # 处理评价图片
        image_paths = []
        if 'images' in data and data['images']:
            reviews_img_dir = os.path.join(root_dir, 'static', 'images', 'reviews')
            os.makedirs(reviews_img_dir, exist_ok=True)
            
            for img_data in data['images']:
                try:
                    # 解码base64图片
                    if ',' in img_data:
                        img_data = img_data.split(',')[1]
                    
                    image_binary = base64.b64decode(img_data)
                    
                    # 生成唯一文件名
                    filename = f"{uuid.uuid4()}.jpg"
                    file_path = os.path.join(reviews_img_dir, filename)
                    
                    # 保存图片
                    with open(file_path, 'wb') as f:
                        f.write(image_binary)
                    
                    image_paths.append(f"/static/images/reviews/{filename}")
                except Exception as e:
                    print(f"图片处理错误: {str(e)}")
                    return jsonify({"error": f"图片处理错误: {str(e)}"}), 400
        
        # 创建新评价对象
        new_review = {
            "id": str(uuid.uuid4()),
            "dish_id": data['dish_id'],
            "rating": data['rating'],
            "comment": data['comment'],
            "image_paths": image_paths,
            "timestamp": datetime.now().isoformat(),
            "user_name": data.get('user_name', '匿名用户')  # 如果未提供用户名，则使用"匿名用户"
        }
        
        # 读取现有评价
        reviews = read_json_file(reviews_path)
        
        # 添加新评价
        reviews.append(new_review)
        
        # 写入更新的评价列表
        write_json_file(reviews_path, reviews)
        
        return jsonify(new_review), 201
    except Exception as e:
        print(f"添加评价错误: {str(e)}")
        return jsonify({"error": f"添加评价错误: {str(e)}"}), 500

# 删除评价
@reviews_bp.route('/<review_id>', methods=['DELETE'])
def delete_review(review_id):
    try:
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        # 读取现有评价
        reviews = read_json_file(reviews_path)
        
        # 查找要删除的评价
        review = next((r for r in reviews if r.get('id') == review_id), None)
        if not review:
            return jsonify({"error": "评价未找到"}), 404
        
        # 删除评价关联的图片
        for img_path in review.get('image_paths', []):
            try:
                full_path = os.path.join(root_dir, img_path.lstrip('/'))
                if os.path.exists(full_path):
                    os.remove(full_path)
            except Exception as e:
                print(f"删除图片时出错: {str(e)}")
        
        # 移除评价
        reviews = [r for r in reviews if r.get('id') != review_id]
        
        # 写入更新的评价列表
        write_json_file(reviews_path, reviews)
        
        return jsonify({"message": "评价删除成功"})
    except Exception as e:
        print(f"删除评价错误: {str(e)}")
        return jsonify({"error": f"删除评价错误: {str(e)}"}), 500

# 更新评价
@reviews_bp.route('/<review_id>', methods=['PUT'])
def update_review(review_id):
    try:
        data = request.json
        
        # 获取绝对路径
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        reviews_path = os.path.join(root_dir, 'static', 'data', 'reviews.json')
        
        # 读取现有评价
        reviews = read_json_file(reviews_path)
        
        # 查找要更新的评价
        review_index = next((i for i, r in enumerate(reviews) if r.get('id') == review_id), None)
        if review_index is None:
            return jsonify({"error": "评价未找到"}), 404
        
        # 验证评分在有效范围内
        if 'rating' in data and not (1 <= data['rating'] <= 5):
            return jsonify({"error": "评分必须在1-5之间"}), 400
        
        # 更新评价字段
        for key in data:
            if key != 'id' and key != 'dish_id' and key != 'images':  # 不允许更改ID和菜品ID
                reviews[review_index][key] = data[key]
        
        # 处理新添加的评价图片
        if 'images' in data and data['images']:
            # 获取现有图片路径
            image_paths = reviews[review_index].get('image_paths', [])
            
            # 处理每个新图片
            reviews_img_dir = os.path.join(root_dir, 'static', 'images', 'reviews')
            os.makedirs(reviews_img_dir, exist_ok=True)
            
            for img_data in data['images']:
                try:
                    # 解码base64图片
                    if ',' in img_data:
                        img_data = img_data.split(',')[1]
                    
                    image_binary = base64.b64decode(img_data)
                    
                    # 生成唯一文件名
                    filename = f"{uuid.uuid4()}.jpg"
                    file_path = os.path.join(reviews_img_dir, filename)
                    
                    # 保存图片
                    with open(file_path, 'wb') as f:
                        f.write(image_binary)
                    
                    image_paths.append(f"/static/images/reviews/{filename}")
                except Exception as e:
                    print(f"图片处理错误: {str(e)}")
                    return jsonify({"error": f"图片处理错误: {str(e)}"}), 400
            
            reviews[review_index]['image_paths'] = image_paths
        
        # 更新时间戳
        reviews[review_index]['updated_at'] = datetime.now().isoformat()
        
        # 写入更新的评价列表
        write_json_file(reviews_path, reviews)
        
        return jsonify(reviews[review_index])
    except Exception as e:
        print(f"更新评价错误: {str(e)}")
        return jsonify({"error": f"更新评价错误: {str(e)}"}), 500