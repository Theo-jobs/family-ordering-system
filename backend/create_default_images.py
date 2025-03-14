import os
import base64
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO

# 创建存储目录
def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

# 创建带有文字的彩色图片
def create_dish_image(category, color, size=(400, 300)):
    # 创建新图像
    image = Image.new('RGB', size, color=color)
    draw = ImageDraw.Draw(image)
    
    # 绘制边框
    border_width = 10
    draw.rectangle(
        [(border_width, border_width), (size[0]-border_width, size[1]-border_width)],
        outline='white',
        width=2
    )
    
    # 尝试加载字体
    font_size = 36
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        try:
            # 备选方案：使用PIL内置字体
            font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        except IOError:
            # 如果上述都失败，使用默认字体
            font = ImageFont.load_default()
    
    # 获取分类显示名
    category_display = {
        'hot': '热菜',
        'cold': '凉菜',
        'staple': '主食',
        'drink': '饮料',
        'coffee': '咖啡',
        'dessert': '甜点',
        'review': '评价图片'
    }.get(category, category)
    
    # 在图像上添加文字
    text = f"{category_display} (Placeholder)"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    draw.text(position, text, fill='white', font=font)
    
    return image

# 尝试下载开源图片
def download_image(url, timeout=5):
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
        return None
    except Exception as e:
        print(f"下载图片失败: {str(e)}")
        return None

# 创建默认图片
def create_default_images():
    # 确保图片目录存在
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dishes_dir = os.path.join(current_dir, 'static', 'images', 'dishes')
    reviews_dir = os.path.join(current_dir, 'static', 'images', 'reviews')
    ensure_dir(dishes_dir)
    ensure_dir(reviews_dir)
    
    # 图片类别与颜色映射
    categories = {
        'hot': (220, 60, 60),      # 红色 - 热菜
        'cold': (60, 180, 220),    # 蓝色 - 凉菜
        'staple': (220, 180, 60),  # 黄色 - 主食
        'drink': (60, 220, 180),   # 青色 - 饮料
        'coffee': (150, 100, 50),  # 棕色 - 咖啡
        'dessert': (220, 120, 200) # 粉色 - 甜点
    }
    
    # 开源图片URL示例
    placeholder_urls = {
        'hot': 'https://source.unsplash.com/random/400x300/?hot,food,dish',
        'cold': 'https://source.unsplash.com/random/400x300/?cold,food',
        'staple': 'https://source.unsplash.com/random/400x300/?rice,noodle',
        'drink': 'https://source.unsplash.com/random/400x300/?drink,beverage',
        'coffee': 'https://source.unsplash.com/random/400x300/?coffee',
        'dessert': 'https://source.unsplash.com/random/400x300/?dessert,cake'
    }
    
    # 为每个类别创建和保存默认图片
    for category, color in categories.items():
        file_path = os.path.join(dishes_dir, f'default-{category}.jpg')
        
        # 如果文件已存在，跳过
        if os.path.exists(file_path):
            print(f"图片已存在: {file_path}")
            continue
        
        # 首先尝试下载开源图片
        downloaded_image = None
        if category in placeholder_urls:
            downloaded_image = download_image(placeholder_urls[category])
        
        if downloaded_image:
            # 调整图像大小
            downloaded_image = downloaded_image.resize((400, 300), Image.LANCZOS)
            downloaded_image.save(file_path, 'JPEG')
            print(f"下载并保存了开源图片: {file_path}")
        else:
            # 如果下载失败，创建本地占位图片
            image = create_dish_image(category, color)
            image.save(file_path, 'JPEG')
            print(f"创建了本地占位图片: {file_path}")
    
    # 创建评价默认图片
    review_default_path = os.path.join(reviews_dir, 'default-review.jpg')
    if not os.path.exists(review_default_path):
        review_img = create_dish_image('review', (100, 100, 100), (400, 300))
        review_img.save(review_default_path, 'JPEG')
        print(f"创建了评价默认图片: {review_default_path}")

if __name__ == '__main__':
    create_default_images()