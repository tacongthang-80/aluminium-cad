# Aluminium CAD — Giai đoạn 1

Bộ hình học vector bất biến bằng TypeScript thuần. Core không phụ thuộc DOM, canvas hoặc thư viện toán bên ngoài. Trang Vite chỉ minh họa diện tích và trọng tâm; chưa phải trình vẽ cửa.

## Chạy dự án

Yêu cầu Node.js >=22.12.0 và npm.

```sh
npm install
npm test
npm run test:coverage
npm run build
npm run dev
```

Chưa tạo package-lock.json vì môi trường bàn giao chưa chạy được npm. Sau lần cài đặt đầu tiên, lưu lockfile vào Git để cố định dependency.

## Quy ước

- Tọa độ mm; X sang phải, Y hướng lên; góc radian.
- EPSILON = 0.0001 mm. Ngưỡng song song và khả nghịch ma trận dùng độ chính xác máy vì không cùng đơn vị với khoảng cách.
- Vector gần zero normalize thành ZERO; angleTo với vector gần zero báo lỗi. angleTo trả góc không dấu [0, PI].
- Các đối tượng và mảng được freeze; đầu vào mảng được sao chép.
- Đoạn gần zero được xem như điểm. projectPoint trả t=0 cho trường hợp này. Với đoạn thông thường, isInside dùng khoảng [-EPSILON,1+EPSILON] theo yêu cầu; kiểm tra giao điểm dùng khoảng cách mm.
- Giao tại một điểm trả POINT; phần trùng có độ dài đáng kể trả COLINEAR_OVERLAP; thẳng hàng nhưng rời nhau trả NONE; đường chứa song song khác nhau trả PARALLEL.
- Polygon nhận một vòng đỉnh không lặp đỉnh cuối, không lỗ, không tự giao, không suy biến. Chấp nhận hai chiều winding.
- offset dương mở rộng, âm thu nhỏ, nối góc kiểu miter. Hỗ trợ kết quả giữ cấu trúc một vòng; báo lỗi khi phát hiện sụp cạnh, tự giao hoặc vượt khoảng trống. Chưa có xử lý boolean tổng quát để tách/gộp đa giác hay xử lý lỗ; đây không phải offset CAD tổng quát.
- Ma trận row-major áp dụng lên vector cột. A.multiply(B) áp dụng B trước rồi A. Chỉ nhận affine với hàng cuối [0,0,1].

## Cấu trúc

- src/core/geom: Constants, Vector2D, Segment2D, Polygon2D, BoundingBox2D, Matrix3x3 và barrel export.
- tests/geom: năm file Vitest.
- .github/workflows/ci.yml: test, coverage và build khi push/PR.

## Trạng thái xác minh

GitHub Actions đã xác minh commit 9be879b745869e1c7e856d68f67a8433bd5e7a50:

- npm test: 5 file, 30/30 test đạt.
- npm run test:coverage: statements 100%, lines 100%, functions 100%, branches 97.36% trên toàn bộ core; vượt ngưỡng tổng 95%.
- Riêng Polygon2D có branch coverage 92.15%; ngưỡng hiện áp dụng tổng thể, không phải từng file.
- npm run build: tsc và Vite production build thành công.
- npm install báo 3 lỗ hổng mức moderate trong dependency; chưa xử lý trong đợt này.

[Kết quả CI](https://github.com/tacongthang-80/aluminium-cad/actions/runs/35308864214).

verification.json ghi lại lượt kiểm tra Node trực tiếp trước đó, không thay thế báo cáo Vitest trên CI.

Mã nguồn đã có trên GitHub. Chưa deploy website; phiên bản hiện tại là thư viện hình học và trang minh họa, chưa có trình vẽ cửa tương tác.
