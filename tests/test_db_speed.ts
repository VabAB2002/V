// test_db_speed.ts
import { getCourseDetails, findCoursesByDepartment } from '../src/engine/loader';

console.time('Total Benchmark');

console.time('1. Single Lookup (Cold)');
const c1 = getCourseDetails('ECON 102');
console.timeEnd('1. Single Lookup (Cold)');
console.log('Result:', c1?.course_name);

console.time('2. Single Lookup (Warm)');
const c2 = getCourseDetails('STAT 414');
console.timeEnd('2. Single Lookup (Warm)');

console.time('3. 1000 Lookups');
for (let i = 0; i < 1000; i++) {
    getCourseDetails('ECON 102');
}
console.timeEnd('3. 1000 Lookups');

console.time('4. Department Search');
const courses = findCoursesByDepartment('ECON', 400, 499);
console.timeEnd('4. Department Search');
console.log(`Found ${courses.length} ECON 400-level courses`);

console.timeEnd('Total Benchmark');
