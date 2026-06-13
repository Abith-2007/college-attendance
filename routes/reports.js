// routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper: Date Range கணக்கிடு
function getDateRange(type) {
    const today = new Date();
    let startDate, endDate;
    
    endDate = today.toISOString().split('T')[0];
    
    if (type === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
    } else if (type === 'monthly') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
    } else if (type === 'semester') {
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startDate = sixMonthsAgo.toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
}

// Report எடு (weekly/monthly/semester)
router.get('/', async (req, res) => {
    try {
        const { course_id, year, type } = req.query;
        const { startDate, endDate } = getDateRange(type);
        
        const [students] = await db.execute(
            `SELECT s.id, s.name, s.roll_number, s.academic_year
             FROM students s
             WHERE s.course_id = ? AND s.year = ?
             ORDER BY s.roll_number`,
            [course_id, year]
        );
        
        const result = [];
        
        for (const student of students) {
            const [records] = await db.execute(
                `SELECT COUNT(*) as total,
                        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
                 FROM attendance
                 WHERE student_id = ? AND date BETWEEN ? AND ?`,
                [student.id, startDate, endDate]
            );
            
            const total = records[0].total || 0;
            const present = records[0].present || 0;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
            
            result.push({
                ...student,
                total_classes: total,
                present_count: present,
                absent_count: total - present,
                percentage: parseFloat(percentage),
                period: `${startDate} to ${endDate}`
            });
        }
        
        result.sort((a, b) => b.percentage - a.percentage);
        
        res.json({ 
            success: true, 
            data: result,
            report_type: type,
            start_date: startDate,
            end_date: endDate
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;