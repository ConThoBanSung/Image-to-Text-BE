const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo ứng dụng
const app = express();
const port = 5000;

// Cấu hình Multer để upload ảnh
const upload = multer({ dest: 'uploads/' });

// Thêm CORS để frontend có thể kết nối với backend
app.use(cors());

// Khởi tạo Gemini API với API key trực tiếp
const API_KEY = 'AIzaSyD9v_gVFnL51FulEPoDll_aBdZX55uUcrI'; // Thay bằng API key thật của bạn
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Hàm xử lý ảnh để đưa vào request API
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
}

// Endpoint để upload ảnh và trả lời câu hỏi trong ảnh
app.post('/answer', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;

  try {
    // Prompt yêu cầu Gemini trả lời các câu hỏi có trong ảnh
    const prompt = "Please extract all the questions from this image and provide the best answers for them.";

    // Chuẩn bị file ảnh cho Gemini API
    const imagePart = fileToGenerativePart(filePath, req.file.mimetype);

    // Gửi yêu cầu tới Gemini API
    const result = await model.generateContent([prompt, imagePart]);

    // Trích xuất văn bản từ kết quả trả về
    const responseText = result.response.text();

    // Lưu kết quả vào file .txt
    const outputFilePath = path.join(__dirname, 'answers.txt');
    fs.writeFileSync(outputFilePath, responseText);

    // Gửi file .txt về frontend cho người dùng tải xuống
    res.download(outputFilePath, 'answers.txt', (err) => {
      if (err) {
        console.error('Lỗi khi gửi file:', err);
      }

      // Xóa file .txt và ảnh sau khi gửi về frontend
      fs.unlinkSync(outputFilePath);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Lỗi khi xử lý với Gemini API:', error);
    res.status(500).json({ message: 'Lỗi khi xử lý ảnh và trả lời câu hỏi.' });
  }
});

// Endpoint hiện có để trích xuất văn bản từ ảnh (không thay đổi)
app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const prompt = "Here is the picture of Japanese Questions. Please extract all the question in the picture to text with exactly format in the picture and keep the language in the image intact";

    // Chuẩn bị file ảnh cho Gemini API
    const imagePart = fileToGenerativePart(filePath, req.file.mimetype);

    // Gửi yêu cầu tới Gemini API
    const result = await model.generateContent([prompt, imagePart]);

    // Trích xuất văn bản từ kết quả trả về
    const extractedText = result.response.text();

    // Lưu văn bản vào file .txt
    const outputFilePath = path.join(__dirname, 'text.txt');
    fs.writeFileSync(outputFilePath, extractedText);

    // Gửi file .txt về frontend cho người dùng tải xuống
    res.download(outputFilePath, 'text.txt', (err) => {
      if (err) {
        console.error('Lỗi khi gửi file:', err);
      }

      // Xóa file .txt và ảnh sau khi gửi về frontend
      fs.unlinkSync(outputFilePath);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Lỗi khi xử lý với Gemini API:', error);
    res.status(500).json({ message: 'Lỗi khi xử lý ảnh và văn bản.' });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
