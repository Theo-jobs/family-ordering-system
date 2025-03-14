from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
import sys

# 初始化Flask应用
app = Flask(__name__, static_folder=None)  # 不使用默认的static_folder
CORS(app)  # 启用CORS，允许前端调用API

# 导入路由模块
from routes.dishes import dishes_bp
from routes.orders import orders_bp
from routes.reviews import reviews_bp

# 导入工具函数
from create_default_images import create_default_images

# 注册蓝图
app.register_blueprint(dishes_bp, url_prefix='/api/dishes')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(reviews_bp, url_prefix='/api/reviews')

# 获取项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_FOLDER = os.path.join(PROJECT_ROOT, 'frontend')

print(f"项目根目录: {PROJECT_ROOT}")
print(f"前端目录: {FRONTEND_FOLDER}")

# 提供前端根页面
@app.route('/')
def index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

# 提供前端CSS文件
@app.route('/css/<path:filename>')
def serve_css(filename):
    css_dir = os.path.join(FRONTEND_FOLDER, 'css')
    return send_from_directory(css_dir, filename)

# 提供前端JS文件
@app.route('/js/<path:filename>')
def serve_js(filename):
    js_dir = os.path.join(FRONTEND_FOLDER, 'js')
    return send_from_directory(js_dir, filename)

# 提供前端组件JS文件
@app.route('/js/components/<path:filename>')
def serve_components(filename):
    components_dir = os.path.join(FRONTEND_FOLDER, 'js', 'components')
    return send_from_directory(components_dir, filename)

# 提供后端静态资源文件
@app.route('/static/<path:path>')
def serve_static(path):
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    return send_from_directory(static_dir, path)

# 健康检查路由
@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"})

# 初始化数据并启动应用
def initialize_app():
    # 确保所需目录存在
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    os.makedirs(os.path.join(static_dir, 'images', 'dishes'), exist_ok=True)
    os.makedirs(os.path.join(static_dir, 'images', 'reviews'), exist_ok=True)
    os.makedirs(os.path.join(static_dir, 'data'), exist_ok=True)
    
    # 创建默认图片
    create_default_images()
    
    # 初始化JSON数据文件
    data_files = {
        'dishes.json': [],
        'orders.json': [],
        'reviews.json': []
    }
    
    for filename, default_data in data_files.items():
        file_path = os.path.join(static_dir, 'data', filename)
        if not os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, ensure_ascii=False)
            print(f"已创建数据文件: {filename}")
        else:
            # 验证JSON文件内容
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    json.load(f)
                print(f"已验证数据文件: {filename}")
            except json.JSONDecodeError:
                print(f"警告: {filename} 包含无效的JSON格式，正在重置...")
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, ensure_ascii=False)

if __name__ == '__main__':
    print("初始化应用...")
    initialize_app()
    
    print("启动应用服务器...")
    # 设置调试模式以显示详细错误
    app.run(debug=True, host='0.0.0.0', port=5000)