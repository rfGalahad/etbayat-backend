// controllers/duplicateController.js
import db from '../config/database.js';

// controllers/duplicateController.js

export const checkDuplicates = async (req, res) => {
  try {
    const [rows] = await db.query(`
      WITH DuplicateNames AS (
        SELECT 
          TRIM(LOWER(firstName)) AS fName,
          TRIM(LOWER(IFNULL(middleName, ''))) AS mName,
          TRIM(LOWER(lastName)) AS lName
        FROM PersonalInformation
        GROUP BY fName, mName, lName
        HAVING COUNT(*) > 1
      ),
      NumberedGroups AS (
        SELECT 
          ROW_NUMBER() OVER () AS groupID,
          fName, mName, lName
        FROM DuplicateNames
      )
      SELECT 
        groupID,
        pi.personalInfoID,
        pi.firstName,
        pi.middleName,
        pi.lastName,
        pi.birthdate,
        pi.sex,
        s.barangay
      FROM PersonalInformation pi
      JOIN Population p ON pi.populationID = p.populationID
      JOIN Surveys s ON p.surveyID = s.surveyID
      JOIN NumberedGroups g
        ON TRIM(LOWER(pi.firstName)) = g.fName
      AND TRIM(LOWER(IFNULL(pi.middleName, ''))) = g.mName
      AND TRIM(LOWER(pi.lastName)) = g.lName
      ORDER BY groupID;
    `);

    // Group by fullName+birthdate
    const groups = {};
    rows.forEach((record) => {
      const normalize = (val) => (val || '').trim().toLowerCase();
      const key = `${normalize(record.firstName)}|${normalize(record.middleName)}|${normalize(record.lastName)}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({
        id: record.personalInfoID,
        fullName: `${record.firstName} ${record.middleName || ''} ${record.lastName}`.replace(/\s+/g, ' ').trim(),
        gender: record.sex,
        barangay: record.barangay || 'Unknown', // If barangay is stored elsewhere, join it
        similarityScore: 0.9, // You can calculate this later if needed
        ...record,
      });
    });

    const result = Object.entries(groups).map(([_, records], index) => ({
      id: index + 1,
      records,
    }));

    res.json(result);
  } catch (err) {
    console.error('Duplicate check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};