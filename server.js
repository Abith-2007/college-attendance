// server.js
require('dotenv').config(); // ← இதை first line-ல் போடு
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static Files serve செய் (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Routes Import
const studentsRoute = require('./routes/students');
const attendanceRoute = require('./routes/attendance');
const reportsRoute = require('./routes/reports');

// API Routes
app.use('/api/students', studentsRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/reports', reportsRoute);

// Courses எடு
const db = require('./database');
app.get('/api/courses', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT c.*, d.name as dept_name 
             FROM courses c 
             JOIN departments d ON c.department_id = d.id`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Server Start
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});