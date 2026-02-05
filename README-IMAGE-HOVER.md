# 🆕 Image Occlusion Quick Access - Tính năng mới

## Tổng quan

Extension đã được nâng cấp với tính năng **Image Occlusion Quick Access** cho phép bạn nhanh chóng tạo Image Occlusion flashcard từ bất kỳ ảnh nào trên trang web.

## 3 Tính năng mới

### 1. 🎯 Hover Icon trên ảnh
- Khi di chuột qua bất kỳ ảnh nào trên trang web (lớn hơn 50x50px)
- Một icon màu xanh dương sẽ xuất hiện ở góc phải trên của ảnh
- Click vào icon để gửi ảnh vào luồng tạo Image Occlusion
- Icon tự động ẩn khi di chuột ra khỏi ảnh

**Đặc điểm:**
- Chỉ hiện với ảnh đủ lớn (≥ 50x50px) để tránh icon nhỏ
- Bỏ qua ảnh SVG và các icon nhỏ
- Hỗ trợ cả thẻ `<img>` và background-image trong `<div>`

### 2. ⌨️ Alt+Click trên ảnh
- Giữ phím **Alt** và click vào bất kỳ ảnh nào
- Ảnh sẽ được gửi ngay vào Image Occlusion Editor
- Hoạt động nhanh hơn hover icon cho power users

### 3. ⚙️ Cài đặt bật/tắt tính năng

Trong popup của extension (click icon extension trên toolbar):
1. Click nút **⚙️ Settings**
2. Tìm phần **🖼️ Image Occlusion Quick Access**
3. Bật/tắt các tính năng:
   - ☑️ Show icon when hovering over images
   - ☑️ Alt+Click on image to create occlusion

## Cách sử dụng

### Phương pháp 1: Hover Icon
```
1. Mở bất kỳ trang web nào có ảnh
2. Di chuột lên ảnh bạn muốn tạo flashcard
3. Click vào icon xanh dương ở góc trên phải
4. Image Occlusion Editor sẽ mở với ảnh đã sẵn sàng
5. Vẽ các vùng che (rectangles) và tạo flashcard
```

### Phương pháp 2: Alt+Click
```
1. Mở bất kỳ trang web nào có ảnh
2. Giữ phím Alt
3. Click vào ảnh
4. Image Occlusion Editor sẽ mở ngay lập tức
```

### Phương pháp 3: Context Menu (vẫn hoạt động như cũ)
```
1. Click phải vào bất kỳ đâu trên trang
2. Chọn "AddFlashcard - Image Occlusion" > "Chụp một vùng" hoặc "Chụp toàn bộ trang"
```

## Kỹ thuật

### Files mới được thêm:
- `image-hover-handler.js` - Script xử lý hover icon và Alt+Click

### Files được chỉnh sửa:
- `manifest.json` - Thêm image-hover-handler.js vào content_scripts
- `background.js` - Thêm xử lý message `createImageOcclusion`
- `popup.js` - Thêm UI settings cho tính năng mới
- `popup.html` - (không thay đổi, settings được inject động)

### Storage keys mới:
- `afc_image_hover_icon` (boolean, default: true)
- `afc_image_alt_click` (boolean, default: true)

## Tương thích

✅ Hoạt động trên tất cả các trang web
✅ Hỗ trợ cả ảnh `<img>` và background-image
✅ Tự động bỏ qua ảnh quá nhỏ (icons)
✅ Không ảnh hưởng đến các tính năng khác của extension

## Lưu ý

- Icon chỉ xuất hiện với ảnh ≥ 50x50px
- Ảnh SVG được bỏ qua để tránh lỗi
- Nếu ảnh từ domain khác có CORS restriction, extension sẽ cố gắng fetch và convert
- Settings được lưu và áp dụng cho tất cả các tab

## Troubleshooting

**Icon không hiện?**
- Kiểm tra Settings > Image Occlusion Quick Access > đảm bảo "Show icon when hovering over images" đã bật
- Ảnh có thể quá nhỏ (< 50x50px)
- Thử refresh lại trang

**Alt+Click không hoạt động?**
- Kiểm tra Settings > đảm bảo "Alt+Click on image to create occlusion" đã bật
- Đảm bảo bạn đang giữ phím Alt (không phải Ctrl hay Command)
- Refresh lại trang

**Ảnh không load vào editor?**
- Có thể ảnh bị CORS restriction
- Thử phương pháp "Chụp một vùng" từ context menu thay thế

## Version
- Tính năng được thêm vào version 2.7.0+

---

Enjoy the new features! 🎉
