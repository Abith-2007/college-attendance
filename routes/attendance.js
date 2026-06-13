// routes/attendance.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// ஒரு நாளின் Attendance எடு
router.get('/daily', async (req, res) => {
    try {
        const { course_id, year, date } = req.query;
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        // எல்லா students-ஐயும் default present-ஆக எடு
        const [students] = await db.execute(
            `SELECT s.id, s.name, s.roll_number, s.academic_year
             FROM students s
             WHERE s.course_id = ? AND s.year = ?
             ORDER BY s.roll_number`,
            [course_id, year]
        );
        
        // இன்றைய attendance records எடு
        const [attendanceRecords] = await db.execute(
            `SELECT a.student_id, a.period, a.status
             FROM attendance a
             JOIN students s ON a.student_id = s.id
             WHERE s.course_id = ? AND s.year = ? AND a.date = ?`,
            [course_id, year, attendanceDate]
        );
        
        // Students-க்கு attendance data merge செய்
        const result = students.map(student => {
            const periods = {};
            for (let p = 1; p <= 5; p++) {
                const record = attendanceRecords.find(
                    r => r.student_id === student.id && r.period === p
                );
                periods[`period${p}`] = record ? record.status : 'present';
            }
            return { ...student, periods };
        });
        
        res.json({ success: true, data: result, date: attendanceDate });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Attendance Save செய்
router.post('/save', async (req, res) => {
    try {
        const { attendanceData, date, course_id, year } = req.body;
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        // Transaction start
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            for (const record of attendanceData) {
                for (let period = 1; period <= 5; period++) {
                    const status = record.periods[`period${period}`] || 'present';
                    
                    await connection.execute(
                        `INSERT INTO attendance (student_id, date, period, status)
                         VALUES (?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE status = ?`,
                        [record.student_id, attendanceDate, period, status, status]
                    );
                }
            }
            
            await connection.commit();
            res.json({ success: true, message: 'Attendance saved successfully!' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Single Student Attendance update (search பண்ணி absent போட)
router.post('/update-single', async (req, res) => {
    try {
        const { student_id, date, period, status } = req.body;
        
        await db.execute(
            `INSERT INTO attendance (student_id, date, period, status)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = ?`,
            [student_id, date, period, status, status]
        );
        
        res.json({ success: true, message: 'Attendance updated!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Attendance Percentage Calculate
router.get('/percentage', async (req, res) => {
    try {
        const { course_id, year } = req.query;
        
        const [students] = await db.execute(
            `SELECT s.id, s.name, s.roll_number, s.academic_year
             FROM students s
             WHERE s.course_id = ? AND s.year = ?
             ORDER BY s.roll_number`,
            [course_id, year]
        );
        
        const result = [];
        
        for (const student of students) {
            const [totalRecords] = await db.execute(
                'SELECT COUNT(*) as total FROM attendance WHERE student_id = ?',
                [student.id]
            );
            
            const [presentRecords] = await db.execute(
                `SELECT COUNT(*) as present FROM attendance 
                 WHERE student_id = ? AND status = 'present'`,
                [student.id]
            );
            
            const total = totalRecords[0].total;
            const present = presentRecords[0].present;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
            
            result.push({
                ...student,
                total_classes: total,
                present_count: present,
                absent_count: total - present,
                percentage: parseFloat(percentage)
            });
        }
        
        // Percentage-ல் Sort செய் (highest first)
        result.sort((a, b) => b.percentage - a.percentage);
        
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;