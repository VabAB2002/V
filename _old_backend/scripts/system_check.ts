// scripts/system_check.ts - Professional System Health Check

import * as fs from 'fs';
import * as path from 'path';
import {
    auditMajor,
    auditMinor,
    auditGenEd,
    recommendMinors,
    getCourseDetails
} from '../src/index';
import { getAllMajorIds, getAllMinorIds } from '../src/engine/loader';

interface CheckResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: string;
}

const results: CheckResult[] = [];

function logCheck(result: CheckResult) {
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details) {
        console.log(`   ${result.details}`);
    }
}

async function runSystemCheck() {
    console.log('\n' + '='.repeat(70));
    console.log('  🔍 DEGREE AUDIT ENGINE - SYSTEM HEALTH CHECK');
    console.log('='.repeat(70) + '\n');

    // 1. Check Database Connection
    console.log('📊 DATABASE CHECKS\n');
    try {
        const testCourse = getCourseDetails('ECON 102');
        if (testCourse) {
            logCheck({
                name: 'SQLite Database Connection',
                status: 'PASS',
                message: 'Connected successfully',
                details: `Sample course loaded: ${testCourse.course_name}`
            });
        } else {
            logCheck({
                name: 'SQLite Database Connection',
                status: 'FAIL',
                message: 'Connected but no data returned'
            });
        }
    } catch (error) {
        logCheck({
            name: 'SQLite Database Connection',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    // 2. Check Data Files
    console.log('\n📁 DATA FILE CHECKS\n');
    const dataFiles = [
        'data/courses.db',
        'data/penn_state_majors.json',
        'data/penn_state_minors.json',
        'data/gen_ed_requirements.json'
    ];

    for (const file of dataFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            logCheck({
                name: path.basename(file),
                status: 'PASS',
                message: `Found (${sizeMB} MB)`
            });
        } else {
            logCheck({
                name: path.basename(file),
                status: 'FAIL',
                message: 'File not found'
            });
        }
    }

    // 3. Check Program Data Integrity
    console.log('\n🎓 PROGRAM DATA CHECKS\n');
    try {
        const majorIds = getAllMajorIds();
        logCheck({
            name: 'Major Programs Loaded',
            status: 'PASS',
            message: `${majorIds.length} majors available`,
            details: `Sample: ${majorIds.slice(0, 3).join(', ')}`
        });
    } catch (error) {
        logCheck({
            name: 'Major Programs Loaded',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    try {
        const minorIds = getAllMinorIds();
        logCheck({
            name: 'Minor Programs Loaded',
            status: 'PASS',
            message: `${minorIds.length} minors available`,
            details: `Sample: ${minorIds.slice(0, 3).join(', ')}`
        });
    } catch (error) {
        logCheck({
            name: 'Minor Programs Loaded',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    // 4. Check Core Functionality
    console.log('\n⚙️  CORE FUNCTIONALITY CHECKS\n');

    const sampleTranscript = [
        { id: 'ECON 102', grade: 'A', credits_awarded: 3 },
        { id: 'MATH 140', grade: 'B', credits_awarded: 4 }
    ];

    try {
        const majorAudit = auditMajor(sampleTranscript, 'software_engineering_bs');
        logCheck({
            name: 'auditMajor() Function',
            status: majorAudit ? 'PASS' : 'FAIL',
            message: majorAudit ? `Working (Status: ${majorAudit.status})` : 'Failed to return result'
        });
    } catch (error) {
        logCheck({
            name: 'auditMajor() Function',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    try {
        const minorAudit = auditMinor(sampleTranscript, 'business_minor');
        logCheck({
            name: 'auditMinor() Function',
            status: minorAudit ? 'PASS' : 'FAIL',
            message: minorAudit ? `Working (Status: ${minorAudit.status})` : 'Failed to return result'
        });
    } catch (error) {
        logCheck({
            name: 'auditMinor() Function',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    try {
        const genEdAudit = auditGenEd(sampleTranscript);
        logCheck({
            name: 'auditGenEd() Function',
            status: genEdAudit ? 'PASS' : 'FAIL',
            message: genEdAudit ? `Working (${genEdAudit.credits_earned}/${genEdAudit.credits_required} credits)` : 'Failed to return result'
        });
    } catch (error) {
        logCheck({
            name: 'auditGenEd() Function',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    try {
        const recommendations = recommendMinors(sampleTranscript, 'software_engineering_bs', { topN: 3 });
        logCheck({
            name: 'recommendMinors() Function',
            status: recommendations.length > 0 ? 'PASS' : 'WARN',
            message: recommendations.length > 0 ? `Working (${recommendations.length} recommendations)` : 'No recommendations returned'
        });
    } catch (error) {
        logCheck({
            name: 'recommendMinors() Function',
            status: 'FAIL',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }

    // 5. Check Directory Structure
    console.log('\n📂 DIRECTORY STRUCTURE CHECKS\n');
    const requiredDirs = ['src', 'tests', 'examples', 'scripts', 'data', 'docs'];
    for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath);
            logCheck({
                name: `${dir}/ directory`,
                status: 'PASS',
                message: `Exists (${files.length} items)`
            });
        } else {
            logCheck({
                name: `${dir}/ directory`,
                status: 'FAIL',
                message: 'Not found'
            });
        }
    }

    // 6. Check Package Configuration
    console.log('\n📦 PACKAGE CHECKS\n');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        const requiredScripts = ['test', 'test:db', 'example', 'migrate', 'build'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);

        if (missingScripts.length === 0) {
            logCheck({
                name: 'NPM Scripts',
                status: 'PASS',
                message: 'All required scripts configured',
                details: requiredScripts.join(', ')
            });
        } else {
            logCheck({
                name: 'NPM Scripts',
                status: 'WARN',
                message: `Missing scripts: ${missingScripts.join(', ')}`
            });
        }

        const requiredDeps = ['better-sqlite3'];
        const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);

        if (missingDeps.length === 0) {
            logCheck({
                name: 'Dependencies',
                status: 'PASS',
                message: 'All required dependencies installed'
            });
        } else {
            logCheck({
                name: 'Dependencies',
                status: 'FAIL',
                message: `Missing: ${missingDeps.join(', ')}`
            });
        }
    } catch (error) {
        logCheck({
            name: 'Package Configuration',
            status: 'FAIL',
            message: `Error reading package.json: ${error instanceof Error ? error.message : 'Unknown'}`
        });
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('  📊 SUMMARY');
    console.log('='.repeat(70) + '\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;
    const total = results.length;

    console.log(`Total Checks: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log();

    const successRate = ((passed / total) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL SYSTEMS GO! Ready for production.\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some checks failed. Please review issues above.\n');
        process.exit(1);
    }
}

// Run the check
runSystemCheck().catch(error => {
    console.error('❌ System check failed:', error);
    process.exit(1);
});
