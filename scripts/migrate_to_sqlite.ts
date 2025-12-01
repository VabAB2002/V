// scripts/migrate_to_sqlite.ts
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Handle both ts-node execution and compiled dist/ execution
const isRunningFromDist = __dirname.includes(path.sep + 'dist' + path.sep) || __dirname.endsWith(path.sep + 'dist');
const DATA_DIR = isRunningFromDist 
    ? path.join(__dirname, '..', '..', 'data')
    : path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'courses.db');
const JSON_PATH = path.join(DATA_DIR, 'penn_state_courses.json');

console.log(`Creating database at ${DB_PATH}...`);

// Delete existing DB if it exists to ensure fresh start
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);

// Create tables
// Storing complex objects like 'credits' (which can be number or object) and 'attributes' as JSON strings
// But extracting key fields for indexing
db.exec(`
  CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    name TEXT,
    credits_min REAL,
    credits_max REAL,
    department TEXT,
    level INTEGER,
    gen_ed_json TEXT,
    raw_json TEXT
  );
  
  CREATE INDEX idx_department ON courses(department);
  CREATE INDEX idx_level ON courses(level);
`);

console.log('Reading JSON file...');
const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
const data = JSON.parse(rawData);

console.log(`Found ${Object.keys(data.courses).length} courses. Inserting into DB...`);

const insert = db.prepare(`
  INSERT INTO courses (id, name, credits_min, credits_max, department, level, gen_ed_json, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((courses) => {
  let count = 0;
  for (const [id, course] of Object.entries(courses) as [string, any][]) {
    // Handle credits which can be number or object {min, max}
    let minCredits = 0;
    let maxCredits = 0;

    if (typeof course.credits === 'number') {
      minCredits = course.credits;
      maxCredits = course.credits;
    } else if (course.credits && typeof course.credits === 'object') {
      minCredits = course.credits.min || 0;
      maxCredits = course.credits.max || minCredits;
    }

    // Extract GenEd attributes for easier querying if needed, though we store full JSON too
    const genEd = course.attributes?.gen_ed || [];

    insert.run(
      id,
      course.course_name,
      minCredits,
      maxCredits,
      course.department,
      course.level,
      JSON.stringify(genEd),
      JSON.stringify(course)
    );

    count++;
    if (count % 1000 === 0) process.stdout.write('.');
  }
  console.log('\n');
});

insertMany(data.courses);

console.log('✅ Migration complete!');
db.close();
