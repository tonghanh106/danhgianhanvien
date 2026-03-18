import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Đánh Giá Nhân Viên API',
      version: '1.0.0',
      description: 'Tài liệu API cho Backend hệ thống Đánh Giá Nhân Viên (Dành cho nội bộ)',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Lấy docs từ các comment có trong file routes (Dùng relative tính từ thư mục chạy npm)
  apis: ['./src/app/routes/*.ts', './dist/app/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
console.log("Swagger UI Loaded, reading API specs from routes...");
