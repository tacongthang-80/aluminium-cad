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

30 ca kiểm tra đã chạy thành công bằng chuyển đổi cú pháp TypeScript của Node và adapter node:assert. Xem verification.json. Đây KHÔNG phải kết quả npm test hoặc kiểm tra kiểu TypeScript.

Chưa chạy được npm install, Vitest, tsc, Vite build hoặc đo coverage vì shell của phiên làm việc bị chính sách phê duyệt chặn. Cấu hình coverage đặt ngưỡng 95% cho statements, branches, functions và lines; chưa chứng minh đã đạt. Pipeline CI sẽ kiểm tra và báo lỗi nếu chưa đạt.

Chưa push GitHub hoặc deploy: cần repository đích; phiên bản hiện tại chỉ là thư viện và trang minh họa.
