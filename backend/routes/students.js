const express = require("express");

const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

async function getStudentForOwner(studentId, ownerId) {
  const { rows } = await pool.query(
    "SELECT id FROM students WHERE id = $1 AND owner_user_id = $2",
    [studentId, ownerId]
  );

  return rows[0] || null;
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          s.id,
          s.full_name AS "fullName",
          s.email,
          s.class_name AS "className",
          s.roll_number AS "rollNumber",
          s.created_at AS "createdAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', m.id,
                'subject', m.subject,
                'examName', m.exam_name,
                'score', m.score,
                'createdAt', m.created_at
              )
              ORDER BY m.subject, m.exam_name
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'::json
          ) AS marks
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.id
        WHERE s.owner_user_id = $1
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `,
      [req.user.userId]
    );

    return res.json({ students: rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const className = String(req.body.className || "").trim();
    const rollNumber = String(req.body.rollNumber || "").trim();

    if (!fullName || !className || !rollNumber) {
      return res.status(400).json({ message: "Full name, class, and roll number are required." });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO students (full_name, email, class_name, roll_number, owner_user_id)
        VALUES ($1, NULLIF($2, ''), $3, $4, $5)
        RETURNING
          id,
          full_name AS "fullName",
          email,
          class_name AS "className",
          roll_number AS "rollNumber",
          created_at AS "createdAt"
      `,
      [fullName, email, className, rollNumber, req.user.userId]
    );

    return res.status(201).json({
      message: "Student added successfully.",
      student: {
        ...rows[0],
        marks: []
      }
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "This student email or roll number already exists." });
    }

    return next(error);
  }
});

router.put("/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const className = String(req.body.className || "").trim();
    const rollNumber = String(req.body.rollNumber || "").trim();

    const student = await getStudentForOwner(studentId, req.user.userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (!fullName || !className || !rollNumber) {
      return res.status(400).json({ message: "Full name, class, and roll number are required." });
    }

    const { rows } = await pool.query(
      `
        UPDATE students
        SET
          full_name = $1,
          email = NULLIF($2, ''),
          class_name = $3,
          roll_number = $4
        WHERE id = $5
        RETURNING
          id,
          full_name AS "fullName",
          email,
          class_name AS "className",
          roll_number AS "rollNumber",
          created_at AS "createdAt"
      `,
      [fullName, email, className, rollNumber, studentId]
    );

    return res.json({
      message: "Student updated successfully.",
      student: rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "This student email or roll number already exists." });
    }

    return next(error);
  }
});

router.delete("/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await getStudentForOwner(studentId, req.user.userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    await pool.query("DELETE FROM students WHERE id = $1", [studentId]);

    return res.json({ message: "Student deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

router.post("/:studentId/marks", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await getStudentForOwner(studentId, req.user.userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const subject = String(req.body.subject || "").trim();
    const examName = String(req.body.examName || "").trim();
    const score = Number(req.body.score);

    if (!subject || !examName || Number.isNaN(score)) {
      return res.status(400).json({ message: "Subject, exam name, and score are required." });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be between 0 and 100." });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO marks (student_id, subject, exam_name, score)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (student_id, subject, exam_name)
        DO UPDATE SET
          score = EXCLUDED.score,
          updated_at = NOW()
        RETURNING
          id,
          subject,
          exam_name AS "examName",
          score,
          created_at AS "createdAt"
      `,
      [studentId, subject, examName, score]
    );

    return res.status(201).json({
      message: "Marks saved successfully.",
      mark: rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:studentId/marks/:markId", async (req, res, next) => {
  try {
    const { studentId, markId } = req.params;
    const student = await getStudentForOwner(studentId, req.user.userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const result = await pool.query(
      "DELETE FROM marks WHERE id = $1 AND student_id = $2",
      [markId, studentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mark record not found." });
    }

    return res.json({ message: "Mark deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
