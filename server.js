const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

// Cấu hình Multer để upload ảnh (sử dụng bộ nhớ tạm thời)
const upload = multer({ storage: multer.memoryStorage() });

// Thêm CORS để frontend có thể kết nối với backend
app.use(cors());

// Khởi tạo Gemini API với API key trực tiếp
const API_KEY = 'AIzaSyD9v_gVFnL51FulEPoDll_aBdZX55uUcrI'; // Thay 'YOUR_ACTUAL_API_KEY' bằng API key thật của bạn
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Hàm xử lý ảnh để đưa vào request API
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

// Endpoint để nhận ảnh và trích xuất câu hỏi
app.post('/upload', upload.single('image'), async (req, res) => {
  const imageBuffer = req.file.buffer; // Lấy buffer từ file được upload

  try {
    const prompt = "Here is the picture of Japanese Questions. Please extract all the questions and answers in the picture to text with exactly the format in the picture and keep the language in the image intact."; // Prompt yêu cầu Gemini trích xuất văn bản

    // Chuẩn bị file ảnh cho Gemini API
    const imagePart = fileToGenerativePart(imageBuffer, req.file.mimetype);

    // Gửi yêu cầu tới Gemini API
    const result = await model.generateContent([prompt, imagePart]);

    // Trích xuất văn bản từ kết quả trả về
    const extractedText = result.response.text();

    // Tạo file text để gửi về client
    res.setHeader('Content-Disposition', 'attachment; filename="questions.txt"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(extractedText); // Gửi văn bản về client
  } catch (error) {
    console.error('Lỗi khi xử lý với Gemini API:', error);
    res.status(500).json({ message: 'Lỗi khi xử lý ảnh và văn bản.' });
  }
});

// Endpoint để nhận ảnh và trích xuất câu trả lời
app.post('/answer', upload.single('image'), async (req, res) => {
  const imageBuffer = req.file.buffer; // Lấy buffer từ file được upload

  try {
    const prompt = "Here is the picture of questions, please give me the best answer for each questions"; // Prompt yêu cầu Gemini trích xuất câu trả lời

    // Chuẩn bị file ảnh cho Gemini API
    const imagePart = fileToGenerativePart(imageBuffer, req.file.mimetype);

    // Gửi yêu cầu tới Gemini API
    const result = await model.generateContent([prompt, imagePart]);

    // Trích xuất văn bản từ kết quả trả về
    const extractedText = result.response.text();

    // Tạo file text để gửi về client
    res.setHeader('Content-Disposition', 'attachment; filename="answers.txt"');
    res.setHeader('Content-Type', 'text/plain');
    res.send(extractedText); // Gửi văn bản về client
  } catch (error) {
    console.error('Lỗi khi xử lý với Gemini API:', error);
    res.status(500).json({ message: 'Lỗi khi xử lý ảnh và văn bản.' });
  }
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
