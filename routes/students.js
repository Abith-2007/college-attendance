// routes/students.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// எல்லா Students-ஐயும் கொண்டு வா (course + year filter)
router.get('/', async (req, res) => {
    try {
        const { course_id, year } = req.query;
        let query = `
            SELECT s.*, c.name as course_name, c.section, d.name as dept_name
            FROM students s
            JOIN courses c ON s.course_id = c.id
            JOIN departments d ON c.department_id = d.id
            WHERE 1=1
        `;
        const params = [];
        
        if (course_id) {
            query += ' AND s.course_id = ?';
            params.push(course_id);
        }
        if (year) {
            query += ' AND s.year = ?';
            params.push(year);
        }
        query += ' ORDER BY s.roll_number';
        
        const [rows] = await db.execute(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Roll Number-ல் Student தேடு
router.get('/search/:rollNumber', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT s.*, c.name as course_name, c.section
             FROM students s
             JOIN courses c ON s.course_id = c.id
             WHERE s.roll_number LIKE ?`,
            [`%${req.params.rollNumber}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// புதிய Student சேர்
router.post('/add', async (req, res) => {
    try {
        const { name, roll_number, course_id, year, academic_year } = req.body;
        
        if (!name || !roll_number || !course_id || !year || !academic_year) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required!' 
            });
        }
        
        const [result] = await db.execute(
            'INSERT INTO students (name, roll_number, course_id, year, academic_year) VALUES (?, ?, ?, ?, ?)',
            [name, roll_number, course_id, year, academic_year]
        );
        
        res.json({ 
            success: true, 
            message: 'Student added successfully!',
            id: result.insertId 
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                success: false, 
                message: 'Roll number already exists!' 
            });
        } else {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

module.exports = router;