Software Design Specifications Document

Penn State Course Recommendation System
Group 9
Vishal Bidari
Sylvan Adams
Noah Blumenstock
David Leija

Software Design Specification
Document

Version: 2

Date: 11/23/2025

Page 1 of 89

11/02/18

Software Design Specifications Document

Table of Contents
1 Introduction ................................................................................................................................................ 5
1.1 Goals and Objectives ............................................................................................................................... 5
1.2 Statement of System Scope ..................................................................................................................... 6
1.3 Reference Material .................................................................................................................................. 8
1.4 Definitions and Acronyms ....................................................................................................................... 8
2 Architectural design.................................................................................................................................... 9
2.1 System Architecture ............................................................................................................................ 9
2.2 Design Rationale ................................................................................................................................ 14
3 Key Functionality design ........................................................................................................................... 17
3.1 Enter Academic Information ............................................................................................................. 18
3.1.1 Use Case Description .................................................................................................................. 18
3.1.2 Processing Sequence for Enter Academic Information .............................................................. 18
3.1.3 Structural Design for Enter Academic Information .................................................................... 20
3.1.4 Key Activities............................................................................................................................... 21
3.1.5 Software Interface to other components ................................................................................... 23
3.2 Upload PDF Transcript ....................................................................................................................... 24
3.2.1 Use Case Description .................................................................................................................. 24
3.2.2 Processing Sequence for Upload PDF Transcript........................................................................ 25
3.2.3 Structural Design for Upload PDF Transcript .............................................................................. 26
3.2.4 Key Activities............................................................................................................................... 28
3.2.5 Software Interface to other components ................................................................................... 29
3.3 Get Course Recommendations .......................................................................................................... 31
3.3.1 Use Case Description .................................................................................................................. 31
3.3.2 Processing Sequence for Get Course Recommendations........................................................... 32
3.3.3 Structural Design for Get Course Recommendations ................................................................. 33
3.3.4 Key Activities............................................................................................................................... 34
3.3.5 Software Interface to Other Components .................................................................................. 35
3.4 View Program Details ........................................................................................................................ 38
3.4.1 Use Case Description .................................................................................................................. 38
3.4.2 Processing Sequence for View Program Details ......................................................................... 38
3.4.3 Structural Design for View Program Details ............................................................................... 40
3.4.4 Key Activities............................................................................................................................... 41
3.4.5 Software Interface to Other Components .................................................................................. 42

Page 2 of 89

11/02/18

Software Design Specifications Document
3.5 View Course Prerequisites ................................................................................................................. 45
3.5.1 Use Case Description .................................................................................................................. 45
3.5.2 Processing Sequence for View Course Prerequisites .................................................................. 46
3.5.3 Structural Design for View Course Prerequisites........................................................................ 47
3.5.4 Key Activities............................................................................................................................... 48
3.5.5 Software Interface to Other Components .................................................................................. 49
4 User interface design................................................................................................................................ 53
4.1 Interface design rules ........................................................................................................................ 53
4.2 Description of the user interface....................................................................................................... 54
4.2.1 Homepage (Search Form Page) .................................................................................................. 54
4.2.1.1 Screen Images ......................................................................................................................... 55
4.2.1.2 Objects and Actions................................................................................................................. 55
4.2.2 Results Page (Recommendations Display).................................................................................. 57
4.2.2.1 Screen Images ......................................................................................................................... 58
4.2.2.2 Objects and Actions................................................................................................................. 58
4.2.3 Detail Page (Program Information)................................................................................................. 60
4.2.3.1 Screen Images ......................................................................................................................... 63
4.2.3.2 Objects and Actions................................................................................................................. 63
4.2.4 Loading and Error States ............................................................................................................ 65
4.2.4.1 Screen Images ......................................................................................................................... 66
4.2.4.2 Objects and Actions................................................................................................................. 67
5 Restrictions, Limitations, and Constraints ................................................................................................ 69
5.1 Technical Restrictions ........................................................................................................................ 69
5.2 Data Limitations................................................................................................................................. 69
5.3 Functional Limitations ....................................................................................................................... 70
5.4 Performance Constraints ................................................................................................................... 71
5.5 User Interface Constraints ................................................................................................................. 71
5.6 Data Accuracy Constraints ................................................................................................................. 72
5.7 Development Constraints .................................................................................................................. 72
5.8 Security and Privacy Constraints ....................................................................................................... 73
5.9 Summary ........................................................................................................................................... 73
6 Testing Issues ............................................................................................................................................ 73
6.1 Classes of Tests.................................................................................................................................. 73
6.2 Performance Tests ............................................................................................................................. 74

Page 3 of 89

11/02/18

Software Design Specifications Document
Test 6.2.1: Large Course History Performance .................................................................................... 74
Test 6.2.2: Deep Prerequisite Chain Performance ............................................................................... 75
Test 6.2.3: Multiple Dynamic Subset Rules Performance .................................................................... 76
6.3 Accuracy Tests ................................................................................................................................... 76
Test 6.3.1: Business Minor Gap Calculation Accuracy ......................................................................... 76
Test 6.3.2: Economics Minor Completion Accuracy ............................................................................ 77
Test 6.3.3: Group Option Selection Accuracy ...................................................................................... 78
6.4 User Interface Tests ........................................................................................................................... 79
Test 6.4.1: Form Validation and Error Display ..................................................................................... 79
Test 6.4.2: PDF Transcript Upload Functionality .................................................................................. 79
Test 6.4.3: Responsive Design and Mobile Compatibility .................................................................... 80
6.5 Security Tests .................................................................................................................................... 81
Test 6.5.1: SQL Injection Prevention.................................................................................................... 81
Test 6.5.2: File Upload Security ........................................................................................................... 81
Test 6.5.3: Input Sanitization and XSS Prevention ............................................................................... 82
6.6 Repeatability Tests ............................................................................................................................ 83
Test 6.6.2: Recommendation Ranking Consistency ............................................................................. 84
Test 6.6.3: Prerequisite Tree Display Consistency................................................................................ 84
6.7 Performance Bounds ..................................................................................................................... 85
6.8 Expected Software Response Summary ........................................................................................ 87
7 Appendices ............................................................................................................................................... 88
7.1 Packaging and installation issues....................................................................................................... 88
7.2 User Manual ...................................................................................................................................... 89
7.3 Open Issues ....................................................................................................................................... 89
7.4 Lessons Learned ................................................................................................................................ 89
7.4.1 Design Patterns........................................................................................................................... 89
7.4.3 Team Communications ............................................................................................................... 89
7.4.4 Task Allocations .......................................................................................................................... 89
7.4.5 Desirable Changes ...................................................................................................................... 89
7.4.6 Challenges Faced ........................................................................................................................ 89

Page 4 of 89

11/02/18

Software Design Specifications Document

1 Introduction
This document describes the complete design of the Penn State World Campus
Course Recommendation System. We built this system to help Penn State World Campus
students make better decisions about choosing minors, certificates, and general education courses
that fit well with their major.Instead of manually searching through hundreds of courses and
programs, students can now enter their completed courses and get personalized recommendations
in minutes. The system shows them which programs have the most overlap with
courses they've already taken, helping them graduate faster and save money.This design
document explains how our system works: the overall structure, how different parts talk to each
other, what users see on their screens, and how we store and process data.

1.1 Goals and Objectives
We created this system with five main goals in mind:
Goal 1: Save students time and money
Students shouldn't spend hours comparing course catalogs manually. Our system does this
automatically, showing which programs overlap with their completed courses. More overlap
means fewer extra courses needed, which means graduating faster and paying less tuition.
Goal 2: Give personalized recommendations
Every student's situation is different. Our system looks at each student's specific major and
completed courses, then ranks all available programs by how well they fit. A Software
Engineering student will get completely different recommendations than a Business student.
Goal 3: Be transparent about requirements
Students hate surprises. We show exactly which courses overlap, which additional courses are
needed, what prerequisites must be completed first, and when courses are typically offered. No
hidden requirements, no confusion.
Goal 4: Work anywhere, anytime
Whether students are on their phone during lunch or on their laptop at midnight, the system
works smoothly. It's just a website - no apps to download, no special software needed. It works
on phones, tablets, and computers.
Goal 5: Help academic advisors
Academic advisors spend lots of time answering basic questions like "What minor should I
pick?" or "How many more courses do I need?" Our system handles these routine questions
automatically, so advisors can focus on complex situations that really need a human touch.

Page 5 of 89

11/02/18

Software Design Specifications Document

1.2 Statement of System Scope
The Penn State World Campus Course Recommendation System helps World Campus students
discover which minors, certificates, and general education courses best match their major by
automatically calculating course overlap and providing personalized recommendations.
What the System DOES:
The system performs these specific functions:
Stores program and course data - Maintains a database of all Penn State World Campus
majors, minors, certificates, Gen Ed requirements, and course information
Accepts student input - Students can enter their major and completed courses by typing them in
or uploading their Penn State transcript PDF
Validates course codes - Checks that entered course codes are real Penn State courses
Calculates overlap - Figures out how many courses from the student's major also count toward
each available program
Ranks recommendations - Sorts all programs by overlap count (most overlap first) and gap
credits (fewest additional courses needed)
Shows top 3 recommendations - Displays the three best-matching programs with detailed
information about overlap, additional courses needed, and prerequisites
Provides detailed views - Shows complete requirements, prerequisite trees, and course lists for
each recommended program
Allows filtering - Students can filter results to see only minors, only certificates, or only majors
Finds triple dip opportunities - Identifies courses that satisfy both program requirements AND
general education requirements simultaneously
Works on any device - Delivers results through a responsive web interface that works on
desktop, tablet, and mobile devices
Responds quickly - Generates recommendations within 5 seconds

Page 6 of 89

11/02/18

Software Design Specifications Document

What the System DOES NOT DO:
The system has clear boundaries and limitations:
No integration with Penn State systems - Does not connect to LionPATH, Canvas, or the
registrar's database
No automatic transcript import - Cannot automatically pull transcripts from Penn State's
official systems
No user accounts - Does not store user data between sessions or require login
No course registration - Cannot register students for courses or check if courses are currently
available
No financial features - Does not calculate tuition costs, process financial aid, or handle any
administrative tasks
Not an official degree audit - Cannot replace academic advisors or provide official degree
audits
No notifications - Does not send emails, alerts, or track student progress over time
World Campus only - Only includes programs and courses available through Penn State World
Campus (not University Park or other campuses)

Figure 1.1: Use Case Diagram

Page 7 of 89

11/02/18

Software Design Specifications Document

1.3 Reference Material
We used the following documents and resources when designing this system:
Penn State Course Bulletin (https://bulletins.psu.edu/)
Source for official course codes, titles, credit hours, and prerequisite requirements
Penn State World Campus Academic Planning Pages
Source for major, minor, and certificate requirements specific to World Campus students
Software Requirements Specification (SRS) - Penn State Course Recommendation System
Our team's requirements document completed in September 2025
IEEE Software Design Document Template
Template structure we followed for organizing this design document
UML 2.5 Specification (Object Management Group)
Reference for creating UML diagrams including use case, sequence, class, and activity diagrams

1.4 Definitions and Acronyms
Here are the terms, acronyms, and abbreviations used throughout this document:
Academic Terms

Gen Ed: General Education requirements that all Penn State students must complete regardless
of their major. Examples include writing courses, science courses, and arts courses.
Overlap: Courses that count toward multiple programs at the same time. For example, if MATH
140 is required for both your major and a minor, that's one overlap course.
Prerequisites: Courses that must be completed before you can enroll in a higher-level course.
For example, you must complete MATH 140 before taking MATH 141.
Triple Dip: A course that satisfies three requirements simultaneously: your major requirement, a
minor/certificate requirement, AND a Gen Ed requirement. These are highly valuable for
efficient degree planning.
Gap Credits: The number of additional credits (courses) a student needs to complete a program
after accounting for overlap with their major.
Penn State Systems

LionPATH: Penn State's official student information system where students register for courses,
view grades, and manage their academic records.

Page 8 of 89

11/02/18

Software Design Specifications Document

World Campus: Penn State's online education platform for distance learners. All courses and
programs are delivered online.
Technical Terms

API (Application Programming Interface): The way different parts of software communicate
with each other. Our frontend talks to our backend through an API.
Flask: A Python web framework we use for our backend server.
Next.js: A React-based framework we use for building our frontend user interface.
JSON (JavaScript Object Notation): A format for storing and transferring data. Our system
can use JSON files as a data source.
PostgreSQL: A type of database system. We use Supabase, which runs on PostgreSQL.
Supabase: A cloud-based PostgreSQL database service where we can store our course and
program data.
REST API: A standard way for web applications to send requests and receive responses. Our
system uses REST API for communication between frontend and backend.
PDF (Portable Document Format): The file format for Penn State transcripts that students can
upload to our system.

2 Architectural design
2.1 System Architecture
Our system uses a three-tier layered architecture that separates the user interface, business logic,
and data storage into distinct layers. This is a common pattern for web applications that makes
the system easier to understand, maintain, and update.
Overview of the Three Tiers

Tier 1: Presentation Layer (Frontend)
•
•
•

Built with Next.js and React
Runs in the user's web browser
Handles everything the user sees and interacts with

Page 9 of 89

11/02/18

Software Design Specifications Document

Tier 2: Application Layer (Backend)
•
•
•

Built with Flask (Python)
Runs on our web server
Contains all the recommendation logic and calculations

Tier 3: Data Layer
•
•
•

Uses Supabase PostgreSQL database (primary option)
Falls back to JSON files if database is unavailable
Stores all course and program information

High-Level Subsystems

Our system is divided into five main subsystems:
Subsystem 1: Frontend Client
Responsibility: Display information to users and collect their input
Components:
•
•
•
•
•

Search form for entering major and completed courses
File uploader for transcript PDFs
Results display showing recommended programs
Detail pages showing complete program information
Filter buttons for narrowing down results

• What it does: Takes user input, sends it to the backend, displays the results in a nice format

Subsystem 2: Backend API Server

Responsibility: Route requests to the right functions and return responses
Components:
•
•

Flask application (app.py)
Four API endpoints: /majors, /courses, /upload_transcript, /recommend

• What it does: Receives requests from the frontend, calls the appropriate subsystem to handle
the work, sends back the results

Page 10 of 89

11/02/18

Software Design Specifications Document
Subsystem 3: Recommendation Engine

Responsibility: Calculate which programs best fit the student
Components:
•
•
•
•

Gap calculation (how many more courses needed)
Overlap calculation (how many courses already completed)
Triple dip finder (courses that count for multiple requirements)
Prerequisite checker (validates if requirements are met)
• What it does: Takes student's major and completed courses, compares against all available
programs, ranks them by best fit

Subsystem 4: Transcript Parser

Responsibility: Extract course information from PDF transcripts
Components:
•
•
•

PDF reader
Text pattern matcher
Course code extractor
• What it does: Reads Penn State transcript PDFs, finds course codes and grades, returns a list
of completed courses
Subsystem 5: Data Access Layer

Responsibility: Load and manage all course and program data
Components:
•
•
•

Supabase database connection
JSON file reader (fallback)
In-memory cache for fast access
• What it does: Loads all data at startup, keeps it in memory for quick lookups, handles both
database and file-based storage

Page 11 of 89

11/02/18

Software Design Specifications Document
How the Subsystems Work Together

Here's what happens when a student uses our system:
Step 1: User enters information
•
•

Frontend Client collects the student's major and completed courses
Sends this data to Backend API Server
Step 2: Backend processes the request
•
•
•

Backend API Server receives the request
Calls Transcript Parser if a PDF was uploaded
Passes the data to Recommendation Engine
Step 3: Recommendation Engine does the work
•
•
•
•

Gets program and course data from Data Access Layer
Calculates gaps, overlaps, and triple dips for every program
Ranks all programs by best fit
Returns top 3 recommendations
Step 4: Results go back to user
•
•
•

Backend API Server sends results to Frontend Client
Frontend Client displays the recommendations
User can click for more details, filter results, or view prerequisites

•

Data Flow
Startup (happens once when server starts):

Data Access Layer ⟶

Loads data from Supabase or JSON files
Stores in memory for fast access

User request (happens each time someone searches):
User ⟶ Frontend Client ⟶ Backend API Server ⟶ Recommendation Engine
⟶ Data Access Layer
⟵ Gets data
⟵ Calculates recommendations
⟵ Returns results
User ⟵ Displays results

Page 12 of 89

11/02/18

Software Design Specifications Document

Architecture Diagram

Figure 2.1: System Architecture

Key Architectural Decisions
Decision 1: Three-tier separation
We separated frontend, backend, and data into distinct layers. This means we can change the user
interface without touching the recommendation logic, or switch databases without changing how
recommendations work.
Decision 2: Monolithic backend
Instead of splitting the backend into many small services (microservices), we kept everything in
one Flask application. This is simpler for a team project and runs faster since everything is in one
place.

Page 13 of 89

11/02/18

Software Design Specifications Document

Decision 3: In-memory data caching
We load all course and program data into memory when the server starts. This makes
recommendations super fast (less than 1 second) because we don't query the database for every
request.
Decision 4: Hybrid data storage
We built the system to work with both a database (Supabase) and JSON files. If the database is
down or not configured, the system automatically uses JSON files. This makes development
easier and keeps the system working even if there are database problems.

2.2 Design Rationale
Why We Chose This Architecture

Reason 1: Clear separation of concerns
Each tier has one job:
•
•
•

Frontend handles user interface
Backend handles calculations
Data layer handles storage

This makes the code easier to understand. When fixing a bug in the recommendation algorithm,
we only look at the Recommendation Engine. When changing how the results page looks, we
only touch the Frontend Client.
Reason 2: Easier team collaboration
With clear subsystem boundaries, different team members can work on different parts without
interfering with each other. One person can work on the frontend design while another works on
the recommendation algorithm.

Reason 3: Flexibility and maintainability
•
•
•

Because subsystems are loosely connected through simple interfaces, we can:
Swap Next.js for a different frontend framework without changing the backend
Replace Supabase with a different database without changing the recommendation logic

Page 14 of 89

11/02/18

Software Design Specifications Document

•

Improve one subsystem without breaking others

Reason 4: Performance
The in-memory caching approach means we load data once and reuse it for every request. This is
much faster than querying a database every time someone searches. We can handle 50+ students
using the system at the same time without slowing down.
Alternatives We Considered

Alternative 1: Microservices Architecture
What it is: Split the backend into many small, independent services (Course Validator Service,
Recommendation Service, PDF Parser Service, etc.), each running separately and
communicating over the network.
Why we didn't choose it:
•
•
•
•

Too complex for our team size: Managing multiple services requires more
infrastructure and coordination
Slower: Services communicating over the network adds latency
Harder to develop: Running and testing multiple services locally is more complicated
Overkill for our scale: We don't need to handle millions of users, so the benefits don't
outweigh the complexity

Alternative 2: Direct Frontend-to-Database Connection
What it is: Let the React frontend query the database directly, skipping the backend entirely.
Why we didn't choose it:
•
•
•
•

Security risk: Database credentials would be exposed in the browser
No place for calculations: Complex recommendation logic needs to run on a server, not
in the browser
Poor performance: The browser can't efficiently process 800+ programs
Violates architecture principles: Mixing data access with user interface is bad practice

Alternative 3: All-in-One Full-Stack Framework
What it is: Use a single framework like Django (Python) or Ruby on Rails that handles both
frontend and backend together.

Page 15 of 89

11/02/18

Software Design Specifications Document

Why we didn't choose it:
• Less flexibility: These frameworks make assumptions about how you build the frontend
• Learning curve: Our team already knows React and Flask separately
• Harder to deploy: Full-stack frameworks are harder to deploy on free hosting services
• Modern practice: Separating frontend and backend is the current industry standard
Critical Trade-offs

Trade-off 1: In-memory caching vs. always querying database
What we chose: Load all data into memory at startup
Benefits:
•
•
•

Super fast responses (< 1 second)
Can work without database connection
No database query delays

Costs:
•

Server uses more memory

•

Data changes require server restart

•

Not ideal if data changes frequently

Why it's worth it: For our use case, course data doesn't change often (maybe once per semester),
and fast responses are more important than real-time updates.
Trade-off 2: Monolithic backend vs. microservices
What we chose: Keep everything in one Flask application
Benefits:
•

Simpler to develop and test

•

Faster (no network calls between services)

•

Easier to deploy

•

Works well for our team size

Costs:
•
•
•

All backend code runs in one process
Harder to scale if we needed millions of users
Can't deploy services independently

Page 16 of 89

11/02/18

Software Design Specifications Document

Why it's worth it: For a student project serving a few hundred users, simplicity and speed matter
more than massive scalability.
Trade-off 3: Supabase + JSON hybrid vs. database only
What we chose: Support both database and JSON files
Benefits:
•
•
•
•

Easy local development (just use JSON files)
System keeps working if database is down
Can switch between options without code changes
Matches how we started (JSON) and where we're going (database)

Costs:
•
•
•

Need to maintain two data loading methods
Slightly more complex code
Must keep JSON files and database in sync

Why it's worth it: The flexibility for development and the fallback reliability are worth the small
amount of extra code.
Why This Architecture Works for Our System

Our architecture balances several important factors:
•
•
•
•
•

Simple enough for a four-person team to build in one semester
Professional enough to demonstrate good software engineering practices
Fast enough to provide recommendations in under 5 seconds (actually under 1 second)
Flexible enough to work with or without a database
Maintainable enough that someone new can understand it and make changes

The three-tier, monolithic architecture with hybrid data storage gives us the best combination of
simplicity, performance, and flexibility for this project.

3 Key Functionality design
This section describes the design for our system's five major use cases. For each use case, we
provide a description of what happens, how components communicate with each other, what
classes are involved, the workflow activities, and how it connects to other parts of the system.

Page 17 of 89

11/02/18

Software Design Specifications Document

3.1 Enter Academic Information
3.1.1 Use Case Description
Purpose: Allow students to enter their academic information so the system can generate
personalized recommendations.
Students start by selecting their major from a dropdown menu that shows all available Penn State
World Campus majors. Then they enter their completed courses in a text box, typing course
codes separated by commas (for example: "CMPSC 131, MATH 140, ENGL 15"). The system
checks each course code to make sure it's a real Penn State course. If all the codes are valid, the
system stores this information and gets ready to generate recommendations. If any course codes
are wrong, the system shows error messages telling the student which codes need to be fixed.
Primary Actor: Student
Preconditions: Student has opened the system's homepage
Success Outcome: Student's major and validated completed courses are stored and ready for
recommendation generation
Failure Outcome: System displays error messages showing which course codes are invalid

3.1.2 Processing Sequence for Enter Academic Information
The following diagram shows how information flows between the user interface, backend server,
and data storage when a student enters their academic information:

Page 18 of 89

11/02/18

Software Design Specifications Document

Figure 3.1.1: Enter Academic Information - Sequence Diagram

Description: The student first sees a dropdown menu populated with majors from the database.
After selecting their major and typing their completed courses, they click the button to continue.
The system checks each course code against the course database. If everything is valid, the data
is stored and used for generating recommendations. If any course codes don't exist in the
database, the system immediately tells the student which ones need to be corrected.

Page 19 of 89

11/02/18

Software Design Specifications Document

3.1.3 Structural Design for Enter Academic Information
The following diagram shows the classes and data structures involved in entering and validating
academic information:

Figure 3.1.2: Enter Academic Information - Class Diagram

Page 20 of 89

11/02/18

Software Design Specifications Document

Description: The SearchForm component in the frontend collects user input and performs basic
validation (checking for empty fields). The APIClient handles all communication with the
backend. The FlaskApp receives requests and coordinates with the RecommendationEngine to
normalize course codes and with the Database to validate that courses exist. The StudentInput
class represents the validated data structure that gets passed between components.

3.1.4 Key Activities
The following diagram shows the step-by-step workflow when a student enters their academic
information:

Page 21 of 89

11/02/18

Software Design Specifications Document

Figure 3.1.3: Enter Academic Information - Activity Diagram

Page 22 of 89

11/02/18

Software Design Specifications Document

Description: The workflow starts when the student opens the homepage. The system loads the
list of majors and displays the search form. After the student enters their major and courses, the
system validates the input in two steps: first checking the format (making sure fields aren't
empty), then checking each course code against the database. If everything is valid, the data is
stored and the system moves forward to generate recommendations. If anything is invalid, error
messages are shown and the form keeps the student's previous input so they can easily fix the
mistakes.

3.1.5 Software Interface to other components
Input Data:
•
•

selectedMajor: String - The major selected from dropdown menu (e.g., "SOFTWARE
ENGINEERING")
courseInput: String - Raw text input of comma-separated course codes (e.g., "CMPSC
131, MATH 140, ENGL 15")

Output Data:
•

validatedMajor: String - The confirmed major that exists in the program database

•

normalizedCourses: String[] - Array of validated and normalized course codes (e.g.,
["CMPSC131", "MATH140", "ENGL15"])
validationErrors: String[] - Array of error messages if any course codes are invalid

•

Components This Use Case Interacts With:

Frontend Components:
•
•

SearchForm.tsx - Collects user input and displays validation messages
api.ts - Sends data to backend via HTTP requests

Backend Components:
•
•
•

app.py - Flask routes that receive and process the request
recommendation_engine.py - Contains normalize_code() function to clean course codes
database.py - Loads course and program data for validation

Page 23 of 89

11/02/18

Software Design Specifications Document

Data Components:
•
•

Program database - Validates that the selected major exists
Course database - Validates that each entered course code exists

Data Flow:

User Input → Frontend Validation → API Request → Backend Validation → Database Lookup
← Error Messages ← API Response ← Validation Result ← Query Result

Error Handling:
•

Empty major field: "Please select a major"

•

Empty course field: "Please enter at least one course"

•

Invalid course code format: "Invalid format: [code]"

•

Course doesn't exist in database: "Course not found: [code]"

•

Network error: "Unable to connect to server. Please try again."

Dependencies:
•
•

This use case must complete successfully before "Get Course Recommendations" can
proceed
Output from this use case becomes input for the recommendation calculation

3.2 Upload PDF Transcript
3.2.1 Use Case Description
Purpose: Allow students to automatically extract their completed courses from a Penn State
transcript PDF instead of typing them manually.
Students can upload their official Penn State transcript PDF file by either clicking the upload
button or dragging and dropping the file onto the upload area. The system reads the PDF file,
scans through all the text looking for course codes and grades, and automatically extracts the
courses that the student completed successfully. The system looks for course codes (like
"CMPSC 131" or "MATH 140") followed by passing grades (A, B, C, D, or P). It skips courses
with failing grades (F), withdrawals (W), or late drops (LD). Once the extraction is complete, the
course codes are automatically filled into the course input field, saving the student from typing
everything manually.

Page 24 of 89

11/02/18

Software Design Specifications Document

Primary Actor: Student
Preconditions: Student has a Penn State transcript PDF file saved on their device
Success Outcome: Completed courses are automatically extracted and filled into the input field
Failure Outcome: System displays error if PDF is invalid, password-protected, or not a Penn
State transcript
3.2.2 Processing Sequence for Upload PDF Transcript
The following diagram shows how the system processes an uploaded transcript PDF:

Page 25 of 89

11/02/18

Software Design Specifications Document

Figure 3.2.1: Upload PDF Transcript - Sequence Diagram

Description: When the student uploads a PDF file, the frontend first checks that it's actually a
PDF. The file is sent to the backend where it's temporarily saved to disk. The Transcript Parser
reads the PDF, extracts all text, and uses pattern matching to find lines that look like transcript
entries (course code + grade + credits). It filters out failed courses and extracts only the course
codes from passed courses. The temporary file is deleted for security, and the course list is sent
back to the frontend where it automatically fills the input field.
3.2.3 Structural Design for Upload PDF Transcript
The following diagram shows the classes involved in processing PDF transcripts:

Page 26 of 89

11/02/18

Software Design Specifications Document

Figure 3.2.2: Upload PDF Transcript - Class Diagram

Description: The FileUpload component handles the user interface for selecting and uploading
the PDF file. It validates that the file is actually a PDF before sending. The APIClient converts
the file into FormData format for HTTP upload. The FlaskApp receives the file, saves it
temporarily, and calls the TranscriptParser. The TranscriptParser uses the PdfReader library to
extract text from the PDF, then uses regular expressions to identify course entries and extract
course codes. The CourseExtraction class represents each found course entry with its validation
logic.

Page 27 of 89

11/02/18

Software Design Specifications Document

3.2.4 Key Activities
The following diagram shows the step-by-step process for uploading and parsing a transcript:

Figure 3.2.3: Upload PDF Transcript - Activity Diagram

Description: The process begins when the student clicks the upload button and selects a PDF
file. The system first checks that it's actually a PDF file. If valid, the file is uploaded to the
backend with a progress indicator. The backend saves the file temporarily and opens it with the
PDF reader library. If the PDF can be read (not password-protected or corrupted), the system
extracts all text and searches for course code patterns. For each line that matches a course
pattern, it checks if the grade is passing. Passing courses are added to the list, failed courses are

Page 28 of 89

11/02/18

Software Design Specifications Document

skipped. After removing duplicates, the temporary file is deleted for security, and the course list
is sent back to fill the input field automatically.

3.2.5 Software Interface to other components
Input Data:
•
•
•
•

file: File object - PDF file selected by the user
file.name: String - Original filename (e.g., "transcript.pdf")
file.size: Number - File size in bytes
file.type: String - MIME type (should be “application/pdf")

Output Data:
•
•
•

courses: String[] - Array of extracted course codes (e.g., ["CMPSC 131", "MATH 140",
"ENGL 15"])
status: String - "success" or "error"
message: String - Success message showing number of courses found, or error
description

Components This Use Case Interacts With:

Frontend Components:
•

FileUpload.tsx - Handles drag-and-drop and file selection interface

•

SearchForm.tsx - Receives extracted courses and fills the input field

•

api.ts - Handles multipart/form-data upload

Backend Components:
•
•
•

app.py - Flask route /upload_transcript that handles file uploads
transcript_parser.py - Contains parse_transcript_pdf() function
File system (uploads/ folder) - Temporary storage for PDF files

External Libraries:
•

pypdf (Python) - PDF reading and text extraction library

•

Browser File API (JavaScript) - Handles file selection and reading

Data Flow:

Page 29 of 89

11/02/18

Software Design Specifications Document

File Selection → Frontend Validation → Multipart Upload → Backend Save →
PDF Parsing → Text Extraction → Pattern Matching → Course Extraction →
File Deletion → Course List → Auto-fill Input Field
Parsing Logic:
The system uses regular expressions to find course entries:
Pattern: [A-Z]{2,5}\s+\d{1,4}[A-Z]?
Example matches: "CMPSC 131", "MATH 140", "ENGL 15"
Passing grades recognized:
•

Letter grades: A, A-, B+, B, B-, C+, C, D

•

Pass/Fail: P (Pass)

•

Transfer: TR (Transfer Credit)

Grades that are ignored:
•

F (Fail)

•

W (Withdrawal)

•

LD (Late Drop)

•

DF (Deferred)

Error Handling:
•

Wrong file type: "Please upload a PDF file"

•

File too large (>10MB): "File size must be under 10MB"

•

PDF encrypted/password-protected: "Cannot read password-protected PDFs"

•

Corrupted PDF: "Invalid or corrupted PDF file"

•

No courses found: "No courses found in transcript. Please check file or enter manually"

•

Network error: "Upload failed. Please check your connection and try again"

Security Considerations:
•

Files are saved with unique names to prevent overwriting

•

Temporary files are deleted immediately after parsing

•

Only PDF files are accepted (validated on both frontend and backend)

•

File size is limited to prevent server overload

•

Upload folder is not web-accessible

Page 30 of 89

11/02/18

Software Design Specifications Document

Dependencies:
•

Requires pypdf Python library to be installed

•

Requires write permissions to uploads/ folder

•

Output courses are passed to "Enter Academic Information" (Section 3.1)

•

Can work independently - if upload fails, student can still type courses manually

3.3 Get Course Recommendations
3.3.1 Use Case Description
Purpose: Automatically calculate and display the top 3 academic programs (minors, certificates,
or majors) that best match the student's completed courses and major.
After the student enters their major and completed courses, the system automatically analyzes all
available programs in the database. For each program, it calculates how many courses overlap
with what the student has already completed, how many additional courses are still needed, and
whether there are any "triple dip" opportunities (courses that count for both the program and
general education requirements). The system then ranks all programs by best fit - programs with
the most overlap and fewest additional courses needed rank highest. Finally, it displays the top 3
recommendations with detailed information showing exactly which courses overlap, which
courses are still needed, and how many credits remain.
Primary Actor: System (automated process triggered after student submits valid information)
Preconditions: Student has successfully entered their major and validated completed courses
Success Outcome: Top 3 ranked recommendations are displayed with detailed overlap analysis
and completion estimates
Failure Outcome: System displays error message if calculation fails or no programs match the
filter criteria

Page 31 of 89

11/02/18

Software Design Specifications Document

3.3.2 Processing Sequence for Get Course Recommendations
The following diagram shows how the system calculates and returns recommendations:

Figure 3.3.1: Get Course Recommendations - Sequence Diagram

Page 32 of 89

11/02/18

Software Design Specifications Document

Description: When the student clicks "Get Recommendations," the frontend sends all their
information to the backend. The backend first normalizes the course codes and gets the student's
major requirements. Then it loops through every program in the database that matches the filter
(minors, certificates, or majors). For each program, it calculates three things: how many credits
are still needed (gap), how many courses already overlap, and any triple dip opportunities. After
analyzing all programs, it sorts them by best fit and picks the top 3. These are sent back to the
frontend where they're displayed as recommendation cards.
3.3.3 Structural Design for Get Course Recommendations
The following diagram shows the classes and data structures involved in generating
recommendations:

Figure 3.3.2: Get Course Recommendations - Class Diagram

Page 33 of 89

11/02/18

Software Design Specifications Document

Description: The SearchForm creates a RecommendationRequest with all the student's
information. The FlaskApp receives this and uses the RecommendationEngine to analyze each
Program in the database. The RecommendationEngine performs three main calculations: gap
(how much is still needed), overlap (how much is already done), and triple dips (bonus
opportunities). Each analysis creates a Recommendation object that gets ranked and sorted. The
top 3 Recommendation objects are returned to the frontend for display.
3.3.4 Key Activities
The following diagram shows the step-by-step process for generating recommendations:

Page 34 of 89

11/02/18

Software Design Specifications Document

Figure 3.3.3: Get Course Recommendations - Activity Diagram

Description: The process starts when the student clicks the button. The system first normalizes
all course codes and gets the student's major requirements. Then it loops through every program
in the database. For each program, it checks every required course against the student's
completed courses. If a course matches, it counts as overlap. If not, it's added to the missing list
and its credits are added to the gap. The system also checks for prerequisites and calculates the
full cost including prerequisite chains. After analyzing all programs, it sorts them by best fit
(lowest gap, highest overlap, most optimizations) and picks the top 3 to display.
3.3.5 Software Interface to Other Components
Input Data:
•
•
•

major: String - Student's selected major (e.g., "SOFTWARE ENGINEERING")
history: String[] - Array of completed course codes (e.g., ["CMPSC 131", "MATH 140"])
gen_ed_needs: String[] - Array of GenEd attributes still needed (e.g., ["GN", "GS",
"GH"])

•

interest_filter: String - Filter type: "Minor", "Certificate", or "Major"

Output Data:
•
•
•
•
•
•
•
•
•
•
•

status: String - "success" or "error"
count: Integer - Total number of programs analyzed
recommendations: Array of Recommendation objects, each containing:
program_name: String - Name of the program
program_type: String - "Minors", "Certificates", or "Majors"
gap_credits: Float - Number of credits still needed
missing_courses: Array - List of courses still required
overlap_count: Integer - Number of courses that overlap
overlap_courses: Array - List of overlapping course codes
optimizations: Array - Triple dip opportunities
optimization_count: Integer - Number of triple dips found

•
Components This Use Case Interacts With:

Frontend Components:
•
•
•
•

SearchForm.tsx - Initiates the request and displays results
ResultsSection.tsx - Displays the recommendation cards
ProgramCard.tsx - Individual recommendation card component
api.ts - Sends POST request to /recommend endpoint

Page 35 of 89

11/02/18

Software Design Specifications Document

Backend Components:
•
•
•
•
•
•
•

app.py - Flask route /recommend that orchestrates the process
recommendation_engine.py - Contains all calculation functions:
calculate_program_gap() - Calculates missing courses and credits
calculate_overlap_count() - Counts overlapping courses
find_triple_dips() - Finds multi-purpose courses
get_prescribed_major_courses() - Gets major requirements
database.py - Provides access to programs and courses data
Data Components:
•
•
•
•

Program database - All available minors, certificates, and majors
Course database - Course information including prerequisites and GenEd attributes
Equivalency map - Course equivalency rules
Prerequisite config - Prerequisite matching rules

Data Flow:
User Input → Request Formation → Backend Processing →
Program Loop → Gap Calculation → Overlap Calculation →
Triple Dip Detection → Ranking & Sorting → Top 3 Selection →
Result Formatting → Frontend Display
Calculation Logic:

Gap Calculation:
For each required course in program:
•

If course in user history: skip (already completed)

•

If course in major requirements: mark as "covered by major"

•

Otherwise: add course credits to gap

•

Includes prerequisite costs recursively

Overlap Calculation:
•

Count courses that appear in both:

Page 36 of 89

11/02/18

Software Design Specifications Document

•

Program requirements

•

User's completed courses OR major requirements

•

Returns both count and list of overlapping courses

Triple Dip Detection:
•

For each course in program requirements:

•

Check if course has GenEd attributes

•

If course satisfies both program requirement AND student's GenEd needs: it's a triple dip

•

Returns list of triple dip opportunities

Ranking Algorithm:
•

Primary sort: gap_credits (ascending - lowest gap first)

•

Secondary sort: overlap_count (descending - most overlap first)

•

Tertiary sort: optimization_count (descending - most triple dips first)

Error Handling:
•

Invalid major: "Major not found. Please select a valid major."

•

No programs match filter: "No programs found matching your criteria."

•

Empty course history: "Please enter at least one completed course."

•

Calculation error: "Error generating recommendations. Please try again."

•

Network error: "Unable to connect to server. Please check your connection."

Performance Considerations:
•

Processes 800+ programs in under 1 second

•

Uses in-memory cache for fast data access

•

Calculations are optimized to avoid redundant database queries

•

Results are sorted efficiently using Python's built-in sort

Dependencies:
•

Requires "Enter Academic Information" (Section 3.1) to complete first

•

Output feeds into "View Program Details" (Section 3.4)

•

Can be filtered by "Filter Recommendations" (Section 3.5)

Page 37 of 89

11/02/18

Software Design Specifications Document

3.4 View Program Details
3.4.1 Use Case Description
Purpose: Show students complete information about a recommended program including all
required courses, completion status, and detailed progress tracking.
When a student clicks on any of the recommended programs, the system opens a detailed page
showing everything they need to know about that program. The detail page has three tabs. The
Overview tab shows summary statistics like total credits required, how many courses overlap,
and any triple dip opportunities found. The Courses tab displays every course required by the
program, marking which ones the student has already completed and which ones are still needed.
For courses still needed, students can click a button to see the full prerequisite tree showing what
needs to be completed first. The Progress tab shows a visual progress bar indicating what
percentage of the program is already complete and provides estimated completion information.
Students can easily go back to the recommendations list to compare with other programs.
Primary Actor: Student
Preconditions: Student has viewed recommendations and selected a program to explore
Success Outcome: Student sees complete program requirements, understands what's needed,
and can plan their academic path
Failure Outcome: System displays error if program data cannot be loaded
3.4.2 Processing Sequence for View Program Details
The following diagram shows what happens when a student views program details:

Page 38 of 89

11/02/18

Software Design Specifications Document

Figure 3.4.1: View Program Details - Sequence Diagram

Description: When the student clicks a program card, the browser navigates to the detail page
using the program ID. The detail page first loads all course data from the backend so it can check
prerequisites. Then it calculates which required courses are completed, builds prerequisite trees
for missing courses, and calculates the overall progress percentage. The Overview tab shows
summary information. The Courses tab lists all requirements with completion status. Students

Page 39 of 89

11/02/18

Software Design Specifications Document

can click any course to see its prerequisite tree in a popup modal. The Progress tab shows visual
completion metrics. A back button returns them to the recommendations list.
3.4.3 Structural Design for View Program Details
The following diagram shows the components involved in displaying program details:

Figure 3.4.2: View Program Details - Class Diagram

Description: The DetailPage component manages the overall page and tab switching. It contains
three tab components: OverviewTab shows summary statistics and triple dips, CoursesTab
displays all required courses with completion status, and ProgressTab shows visual progress
metrics. The CoursesTab can open a PrerequisiteModal that displays a PrerequisiteTree structure.

Page 40 of 89

11/02/18

Software Design Specifications Document

Each course is shown using a CourseChip component that displays different colors based on
completion status. The APIClient fetches course data needed for prerequisite checking.

3.4.4 Key Activities
The following diagram shows the process flow for viewing program details:

Figure 3.4.3: View Program Details - Activity Diagram

Page 41 of 89

11/02/18

Software Design Specifications Document

Description: The flow starts when the student clicks a program card. The system navigates to
the detail page and loads all necessary data. It calculates which courses are completed and which
are still needed by comparing the program requirements against the student's history. For missing
courses, it builds prerequisite trees by recursively looking up each course's prerequisites. The
system calculates overall progress and displays the Overview tab by default. The student can
switch between tabs to view different information, click on courses to see prerequisite trees, or
go back to the recommendations list.
3.4.5 Software Interface to Other Components
Input Data:
•

programId: String - Unique identifier for the selected program (e.g., "MATHEMATICS")

•

programData: Object - Full program information from the recommendation:

•

program_name: String

•

gap_credits: Float

•

missing_courses: Array

•

overlap_count: Integer

•

overlap_courses: Array

•

optimizations: Array (triple dips)

•

userHistory: String[] - Student's completed courses from localStorage

Output Data:
•

Displayed information (no data sent back, this is a view-only page)

•

Navigation events (back to results, etc.)

Components This Use Case Interacts With:
Frontend Components:
•

DetailPage.tsx - Main page component managing tabs

•

OverviewTab section - Displays summary information

•

CoursesTab section - Lists all required courses

•

ProgressTab section - Shows visual progress metrics

•

PrerequisiteModal.tsx - Popup showing prerequisite trees

•

PrerequisiteTree.tsx - Recursive tree component

•

CourseChip.tsx - Individual course display component

•

api.ts - Fetches course data for prerequisites

Page 42 of 89

11/02/18

Software Design Specifications Document

Backend Components:
•

app.py - Flask route /courses provides all course data

•

database.py - Returns cached course information including prerequisites

Browser APIs:
•

React Router - Handles navigation to/from detail page

•

localStorage - Stores user history for client-side calculations

•

URL parameters - Passes program ID in the URL

Data Flow:
Program Selection → Navigation → Load Course Data →
Calculate Completion → Build Prerequisites → Display Overview →
Tab Navigation → Show Details → Back to Results
Tab Contents:
Overview Tab:
•

Total credits required: Float

•

Credits already completed: Float

•

Gap credits remaining: Float

•

Overlap count: Integer with course list

•

Triple dip opportunities: Array with GenEd matches

Courses Tab:
All required courses grouped by rule type:
•

Required courses (must take all)

•

Elective courses (choose X credits from list)

•

Each course shows:

Page 43 of 89

11/02/18

Software Design Specifications Document

•

Course code and title

•

Credit hours

•
•

Status icon (
completed or ○ needed)
Prerequisites button (for incomplete courses)

•

Progress Tab:
•

Visual progress bar (percentage complete)

•

Course completion fraction (e.g., "8 of 12 courses completed")

•

Credits completion fraction (e.g., "24 of 36 credits")

•

Estimated completion time based on remaining courses

Prerequisite Tree Modal:
•

Hierarchical tree structure showing:

•

Target course at the top

•

Immediate prerequisites as child nodes

•

Recursive prerequisites as deeper nodes
Status indicators:
•
•

Green: Completed (in user history)
○ Blue: Available to take (prerequisites met)

•

Red: Blocked (prerequisites not met)

Expand/collapse arrows for nodes with children
Completion Status Logic:
Course is marked "Completed" if:
•

Exact match in user history (e.g., "CMPSC 131")

•

OR course is in major requirements (covered by major)

Course is marked "Available" if:
•

Not completed

•

AND all prerequisites are satisfied

Course is marked "Blocked" if:
•

Not completed

•

AND has prerequisites that are not satisfied

Page 44 of 89

11/02/18

Software Design Specifications Document

Error Handling:
•

Program ID not found: Redirect to homepage with error message

•

Course data loading fails: Display error with retry button

•

Invalid program data: Show error, allow return to results

•

Network error loading courses: "Unable to load course data. Please check connection."

Performance Considerations:
•

Course data loaded once and cached for entire session

•

Prerequisite trees built on-demand (only when modal opens)

•

Progress calculations done client-side (no server calls)

•

Tab switching is instant (all data pre-loaded)

Navigation:
•

URL format: /program/[programId] (e.g., /program/MATHEMATICS)

•

Browser back button works correctly

•

Page can be refreshed (program data retrieved from localStorage)

•

"Back to Results" button returns to recommendations list

Dependencies:
•

Requires "Get Course Recommendations" (Section 3.3) to complete first

•

Program data passed from recommendations or retrieved from localStorage

•

Course data fetched from backend /courses endpoint

•

Can trigger "View Course Prerequisites" as a sub-action

3.5 View Course Prerequisites
3.5.1 Use Case Description
Purpose: Show students the complete prerequisite chain for any course they need to take,
helping them understand what courses must be completed first and in what order.
When viewing program details, students can click the "Prerequisites" button next to any course
they haven't completed yet. This opens a popup window showing a visual tree of all
prerequisites. The tree shows the target course at the top, then branches down to show what
courses are required before it, and those courses' prerequisites, and so on. Each course in the tree
is color-coded: green checkmarks for courses already completed, blue circles for courses that are
available to take (all their prerequisites are met), and red X marks for courses that are blocked
(missing prerequisites). Students can expand or collapse different branches of the tree to explore

Page 45 of 89

11/02/18

Software Design Specifications Document

the full prerequisite chain. This helps them understand exactly what sequence of courses they
need to follow and plan their academic pathway accordingly.
Primary Actor: Student
Preconditions: Student is viewing program details and has clicked on a course that is not yet
completed
Success Outcome: Student sees complete prerequisite tree with status indicators and
understands course sequencing requirements
Failure Outcome: System displays error if prerequisite data cannot be loaded or course has no
prerequisites
3.5.2 Processing Sequence for View Course Prerequisites
The following diagram shows how the prerequisite tree is built and displayed:

Page 46 of 89

11/02/18

Software Design Specifications Document
Figure 3.5.1: View Course Prerequisites - Sequence Diagram

Description: When the student clicks the Prerequisites button, the modal opens and retrieves the
course data from the cached course information. It parses the prerequisite text to extract course
codes and understand the logic (AND/OR groups). For each prerequisite found, it checks the
student's history to determine if it's completed, available, or blocked. If a prerequisite has its own
prerequisites, the system recursively builds those as child nodes. The tree component renders
everything visually with color-coded status indicators. Students can expand or collapse branches
to explore the full prerequisite chain.
3.5.3 Structural Design for View Course Prerequisites
The following diagram shows the components involved in displaying prerequisite trees:

Figure 3.5.2: View Course Prerequisites - Class Diagram

Page 47 of 89

11/02/18

Software Design Specifications Document

Description: The PrerequisiteModal manages the popup window and coordinates building the
tree. It uses PrerequisiteParser to extract course codes from the prerequisite text and
PrerequisiteChecker to determine if each prerequisite is satisfied. The PrerequisiteTree
component renders the visual tree structure using TreeNode objects that can recursively contain
child nodes. Each TreeNode displays a StatusIndicator showing whether it's completed,
available, or blocked. The CourseData class provides the prerequisite information needed for
building the tree.
3.5.4 Key Activities
The following diagram shows the step-by-step process for building and displaying prerequisite
trees:

Page 48 of 89

11/02/18

Software Design Specifications Document

Figure 3.5.3: View Course Prerequisites - Activity Diagram

Description: The process starts when the student clicks the Prerequisites button. The modal
opens and retrieves the course's prerequisite information. If the course has prerequisites, the
system parses the prerequisite text to extract course codes and understand the logic. For each
prerequisite, it checks three things in order: exact match in user history, equivalency matches,
and hierarchy rules (higher-level courses in the same department). Based on these checks, it
marks each prerequisite as completed, available, or blocked. If a prerequisite has its own
prerequisites, the system recursively builds those as child nodes. The tree is displayed with colorcoded status indicators, and students can expand or collapse branches to explore the full chain.
3.5.5 Software Interface to Other Components
Input Data:
•

courseCode: String - The course code to show prerequisites for (e.g., "CMPSC 311")

•

userHistory: String[] - Student's completed courses from localStorage

•

coursesData: Object - All course data cached from /courses endpoint

•

equivalencyMap: Object - Course equivalency mappings (from backend)

•

prereqConfig: Object - Prerequisite matching configuration (hierarchy rules)

Output Data:
•

Visual tree display (no data sent back, this is a view-only feature)

•

Node expansion state (stored locally in component state)

Components This Use Case Interacts With:
Frontend Components:
•

PrerequisiteModal.tsx - Popup window container

•

PrerequisiteTree.tsx - Recursive tree rendering component

•

CoursesTab section - Triggers modal opening

•

CourseChip.tsx - Displays individual course nodes in tree

•

Browser localStorage - Stores user history for status checking

Backend Components:
•

app.py - Flask route /courses provides all course data

•

recommendation_engine.py - Contains prerequisite parsing and checking functions:

•

parse_prerequisites_to_tree() - Parses prerequisite text

•

course_satisfies_prerequisite() - Checks if prerequisite is met

Page 49 of 89

11/02/18

Software Design Specifications Document

•

normalize_code() - Normalizes course codes for matching

•

database.py - Provides course data including prerequisites

Data Components:
•

Course database - Contains prerequisites_raw text for each course

•

Equivalency map - Course equivalency rules

•

Prerequisite config - Hierarchy matching rules

Data Flow:
Course Selection → Modal Open → Parse Prerequisites →
Check Each Prerequisite → Recursive Tree Building →
Status Calculation → Visual Rendering → User Interaction

Prerequisite Parsing Logic:
The system parses prerequisite text using regular expressions:
Pattern: [A-Z]{2,5}\s+\d{1,4}[A-Z]?
Example: "CMPSC 131" or "MATH 140”
AND/OR Logic Handling:
• AND groups: All courses in group must be completed
• OR groups: At least one course in group must be completed
• Example: "CMPSC 131 AND (MATH 140 OR MATH 141)" means:
• Must have CMPSC 131
•

AND must have either MATH 140 OR MATH 141

Prerequisite Status Checking (Three-Tier System):
Tier 1: Exact Match
•

Checks if exact course code is in user history

•

Example: Required "MATH 140", user has "MATH 140" →
Tier 2: Equivalency Match
•

Completed

Checks if user has an equivalent course
Page 50 of 89

11/02/18

Software Design Specifications Document

•

Example: Required "CMPSC 121", user has "CMPSC 131" (equivalent) →
Completed

Tier 3: Hierarchy Match
•

Checks if user has a higher-level course in same department

•

Example: Required "MATH 140" (100-level), user has "MATH 230" (200-level) →
Completed

•

Only applies if hierarchy rules are enabled in config

Status Determination:
Completed (Green

):

• Course code found in user history (exact, equivalent, or hierarchy match)
Available (Blue ○):
•

Not completed

•

All of its prerequisites are completed

•

Can be taken next semester

Blocked (Red

):

•

Not completed

•

Has prerequisites that are not completed

•

Cannot be taken until prerequisites are met

Tree Structure:
Target Course (Root)
├── Prerequisite 1 (Child)
│ ├── Prereq of Prereq 1 (Grandchild)
│ └── Prereq of Prereq 2 (Grandchild)
├── Prerequisite 2 (Child)
└── Prerequisite 3 (Child)
└── Prereq of Prereq 3 (Grandchild)
User Interactions:

Page 51 of 89

11/02/18

Software Design Specifications Document

•

Expand Node: Click arrow to show child prerequisites

•

Collapse Node: Click arrow to hide child prerequisites

•

Close Modal: Click X button or outside modal to close

•

Scroll: Tree can scroll if it's very deep

Error Handling:
•

Course not found: "Course data not available"

•

Prerequisite parsing error: "Unable to parse prerequisites"

•

No prerequisites: "No prerequisites listed for this course"

•

Data loading error: "Unable to load prerequisite data. Please try again.”

Performance Considerations:
•

Course data pre-loaded (no server calls when opening modal)

•

Tree built on-demand (only when modal opens)

•

Status checking done client-side (fast, no network delay)

•

Recursive depth limited to prevent infinite loops

•

Expand/collapse is instant (all data already in memory)

Visual Design:
•

Tree uses indentation to show hierarchy

•

Color-coded status icons for quick recognition

•

Expand/collapse arrows clearly visible

•

Course codes and titles displayed together

•

Smooth animations when expanding/collapsing

Dependencies:
•

Requires "View Program Details" (Section 3.4) - modal opened from Courses tab

•

Uses course data from /courses endpoint

•

Depends on prerequisite parsing logic in recommendation_engine.py

•

Can be used independently for any course in the system

Page 52 of 89

11/02/18

Software Design Specifications Document

4 User interface design
4.1 Interface design rules
Keep it simple - Students should understand how to use the system without reading instructions.
Everything should be clear and obvious.
Mobile first - Many students will use this on their phones, so we design for mobile screens first,
then adjust for desktop.
Consistent colors - We use Penn State's blue and white colors to make it feel familiar. Blue
buttons for main actions, white backgrounds, and gray text for less important information.
Clear feedback - When students click something or enter data, the system always shows what
happened. Loading spinners when processing, error messages in red, success messages in green.
Minimal clicks - Students should get to recommendations in 3 clicks or less from the homepage.
Readable text - All text should be at least 16px font size so it's easy to read on any device.
Accessible - Buttons are large enough to tap easily on mobile, colors have enough contrast to
read, and keyboard navigation works for all features.

Page 53 of 89

11/02/18

Software Design Specifications Document

4.2 Description of the user interface
Our system has three main pages that students will see. Each page has a specific purpose and
clear layout.
4.2.1 Homepage (Search Form Page)
This is the first page students see when they open the system. The main purpose is to collect the
student's major and completed courses so the system can generate personalized
recommendations.
Figure 4.1: Homepage - Search Form

Figure 4.1: Homepage showing major selection dropdown, course input field, upload button, and search button

Page 54 of 89

11/02/18

Software Design Specifications Document

4.2.1.1 Screen Images
• The homepage displays:
•

Header with system title and Penn State branding

•

Main search form in the center of the page

•

Major selection dropdown menu

•

Text input field for entering completed courses

•

"Upload Transcript" button next to the course input

•

"Get Recommendations" button to submit the form

•

"Clear" button to reset all fields

•

Footer with system information

4.2.1.2 Objects and Actions
Primary Objects:
1. Header Component
•

System title: "Penn State Course Recommendation System"

•

Penn State logo or branding colors

•

Navigation (if needed)

2. Major Dropdown Menu
•

Label: "Select Your Major"

•

Dropdown list showing all available Penn State World Campus majors

•

Alphabetically sorted for easy finding

•

Placeholder text: "Choose a major..."

3. Course Input Text Box
•

Label: "Enter Completed Courses"

•

Large text area for typing course codes

•

Placeholder text: "Example: CMPSC 131, MATH 140, ENGL 15"

•

Helper text below: "Separate courses with commas"

4. Upload Transcript Button
•

Icon: Upload/file icon

•

Text: "Upload PDF Transcript"

•

Located next to course input field

•

Supports drag-and-drop

Page 55 of 89

11/02/18

Software Design Specifications Document

5. Get Recommendations Button
•

Primary action button (blue/Penn State color)

•

Text: "Get Recommendations"

•

Large, easy to click

•

Disabled state when form is empty

6. Clear Button
•

Secondary button (gray)

•

Text: "Clear"

•

Resets all form fields

User Actions:
•

Select major from dropdown → System validates selection

•

Type course codes manually → System shows format hints

•

Click "Upload Transcript" → File picker opens, or drag-and-drop file

•

Click "Get Recommendations" → System validates input and processes request

•

Click "Clear" → All fields reset to empty

System Responses:
•

Valid input → Form submits, loading spinner appears, navigates to results

•

Invalid course codes → Error messages appear below input field showing which codes
are wrong

•

Empty fields → "Please fill in all required fields" message

•

File upload success → Course codes automatically fill the input field

•

File upload error → Error message: "Please upload a valid PDF file”

Page 56 of 89

11/02/18

Software Design Specifications Document

4.2.2 Results Page (Recommendations Display)
After the student submits their information, they see this page with their top 3 program
recommendations ranked by best fit.
Figure 4.2: Results Page - Recommendations Display

Figure 4.2: Results page showing filter buttons, three recommendation cards with overlap counts and gap credits

Page 57 of 89

11/02/18

Software Design Specifications Document

4.2.2.1 Screen Images
• The results page displays:
•

Header (same as homepage)

•

Filter buttons at the top (All Programs, Minors, Certificates, Majors)

•

Three recommendation cards in a grid layout

•

Each card showing program name, overlap count, gap credits, and "View Details" button

•

"Back" button to return to homepage

•

Loading spinner while processing (if needed)

4.2.2.2 Objects and Actions
Primary Objects:
1. Filter Buttons
•

Four buttons: "All Programs", "Minors", "Certificates", "Majors"

•

Active filter highlighted in blue

•

Shows count of programs in each category

•

Located at top of results section

2. Recommendation Cards (3 displayed)

Each card contains:
•

Program name (large, bold)

•

Program type badge (Minor/Certificate/Major)

•

Overlap count: "X courses overlap"

•

Gap credits: "X credits remaining"

•

Optimization count: "X triple dip opportunities" (if any)

•

"View Details" button

•

Cards arranged in responsive grid (1 column on mobile, 3 columns on desktop)

•

Cards are clickable (entire card navigates to details)

3. View Details Button
•

Located on each recommendation card

•

Text: "View Details"

•

Navigates to program detail page

4. Back Button

Page 58 of 89

11/02/18

Software Design Specifications Document

•

Located at top or bottom of page

•

Text: "Back to Search" or "← Back"

•

Returns to homepage

5. Loading Spinner
•

Animated spinner icon

•

Text: "Generating recommendations..."

•

Shown while system processes request

User Actions:
•

Click filter button → Results instantly filter to show only that category

•

Click recommendation card → Navigates to detail page for that program

•

Click "View Details" button → Same as clicking card (navigates to details)

•

Click "Back" button → Returns to homepage to modify search

•

Scroll down → View all three recommendations

System Responses:
•

Filter selected → Cards instantly update to show only filtered programs

•

Card clicked → Navigation to detail page with smooth transition

•

Loading → Spinner shows, then cards appear when ready

•

No results → Message: "No programs found matching your criteria"

Page 59 of 89

11/02/18

Software Design Specifications Document

4.2.3 Detail Page (Program Information)
When a student clicks on any recommendation, they see this detailed page with complete
information about that program.
Figure 4.3: Detail Page - Program Overview Tab

Figure 4.3: Detail page showing Overview tab with summary statistics, overlap courses, and triple dip opportunities

Page 60 of 89

11/02/18

Software Design Specifications Document

Figure 4.4: Detail Page - Courses Tab

Figure 4.4: Detail page showing Courses tab with all required courses, completion status, and prerequisite buttons

Page 61 of 89

11/02/18

Software Design Specifications Document

Figure 4.5: Detail Page - Progress Tab

Figure 4.5: Detail page showing Progress tab with visual progress bar and completion metrics

Page 62 of 89

11/02/18

Software Design Specifications Document

4.2.3.1 Screen Images
The detail page displays:
•

Header with program name

•

Tab navigation (Overview, Courses, Progress)

•

Active tab content area

•

"Back to Results" button

•

Content varies by selected tab

4.2.3.2 Objects and Actions
Primary Objects:
1. Tab Navigation
• Three tabs: "Overview", "Courses", "Progress"
• Active tab highlighted in blue
• Inactive tabs in gray
• Smooth transition when switching tabs
2. Overview Tab Content
• Program name (large heading)
• Summary statistics box:
• Total credits required
•

Credits completed

•

Credits remaining (gap)

•

Overlap count

• Overlap courses list (showing which courses count)
• Triple dip opportunities section (if any exist)
• Program URL link (if available)

3. Courses Tab Content
• Section header: "Required Courses"
• Course list grouped by requirement type:
• Required courses (must take all)
•

Elective courses (choose X from list)

Page 63 of 89

11/02/18

Software Design Specifications Document

• Each course shows:
• Course code and title
•

Credit hours

•
•

Status icon (
completed or ○ needed)
"Prerequisites" button (for incomplete courses)

• Course chips with color coding
4. Progress Tab Content
• Visual progress bar (percentage complete)
• Completion statistics:
• "X of Y courses completed"
•

"X of Y credits completed"

• Estimated completion time
• Progress percentage number
5. Prerequisites Modal
• Popup window that opens when clicking "Prerequisites" button
• Shows recursive prerequisite tree
• Status indicators (
completed, ○ available,
• Expand/collapse arrows for tree nodes

blocked)

• "Close" button (X icon)
6. Back to Results Button
• Located at top of page
• Text: "← Back to Results"
• Returns to recommendations list
User Actions:
• Click tab (Overview/Courses/Progress) → Content switches to selected tab
• Click course chip → Highlights course (if interactive)
• Click "Prerequisites" button → Opens prerequisite modal with tree
• Click expand arrow in tree → Shows child prerequisites
• Click collapse arrow in tree → Hides child prerequisites
• Click "Close" in modal → Closes prerequisite modal
• Click "Back to Results" → Returns to recommendations list
• Scroll through course list → View all required courses

Page 64 of 89

11/02/18

Software Design Specifications Document

System Responses:
• Tab switch → Smooth transition, content updates instantly
• Prerequisites button clicked → Modal opens with tree visualization
• Tree node expanded → Child nodes appear with animation
• Tree node collapsed → Child nodes hide smoothly
• Back button clicked → Returns to results page, maintains scroll position
4.2.4 Loading and Error States
The system shows clear feedback during processing and when errors occur.
Figure 4.6: Loading State

Figure 4.6: Loading spinner displayed while generating recommendations

Page 65 of 89

11/02/18

Software Design Specifications Document

Figure 4.7: Error State

Caption

Figure 4.7: Error message displayed when course codes are invalid

4.2.4.1 Screen Images
Loading State:
• Animated spinner (rotating circle or dots)
• Status message: "Processing..." or "Generating recommendations..."
• Progress indicator (if operation takes longer)
• Form fields disabled during loading
Error States:
• Error icon (red X or warning triangle)
• Error message box with red border

Page 66 of 89

11/02/18

Software Design Specifications Document

• Invalid course codes highlighted in red
• Suggestion text showing similar valid codes
• Retry button to resubmit
4.2.4.2 Objects and Actions
Loading State Objects:
1. Loading Spinner
• Animated icon (rotating circle)
• Centered on page or in button
• Text: "Loading..." or "Processing..."
2. Progress Message
Text explaining what's happening
• Examples:
• "Processing transcript..."
•

"Generating recommendations..."

•

"Loading course data..."

3. Disabled Form
•

Form fields grayed out

•

Buttons disabled

•

Prevents multiple submissions

Error State Objects:
1. Error Message Box
•

Red border and background

•

Error icon (X or warning)

•

Clear error description

•

Located near the problematic field

2. Invalid Course Highlighting
•

Red underline on invalid course codes

•

Error text next to each invalid code

•

Example: "CMPSC 999 - Course not found"

3. Suggestion Text

Page 67 of 89

11/02/18

Software Design Specifications Document

•

Shows similar valid course codes

•

Example: "Did you mean: CMPSC 131?"

•

Clickable to auto-fill

4. Retry Button
•

Allows student to correct and resubmit

•

Text: "Try Again" or "Retry"

5. Clear Button
•

Resets form to start over

•

Text: "Clear All"

User Actions in Error States:
•

Read error message → Understand what went wrong

•

View highlighted invalid codes → See which specific courses are problematic

•

Click suggested correction → Auto-fills with valid course code

•

Edit invalid codes → Correct mistakes manually

•

Click "Retry" → Revalidates with corrections

•

Click "Clear" → Resets entire form to start fresh

System Responses:
•

Error fixed → Error message disappears, form becomes valid

•

Retry clicked → System revalidates and processes if valid

•

Clear clicked → All fields reset, error messages cleared

Page 68 of 89

11/02/18

Software Design Specifications Document

5 Restrictions, Limitations, and Constraints
This section describes the boundaries and rules for our system. These are the things our system
cannot do, the limits we must work within, and the constraints that affect how we built it.

5.1 Technical Restrictions
No Authentication Required
Students do not need to create accounts or log in to use the system. The system is completely
open access for simplicity. This means we cannot save student data between sessions or track
their progress over time. Every time a student uses the system, they start fresh.
Read-Only System
The system does not modify any Penn State official records or databases. It only reads data and
provides recommendations. Students cannot register for courses through our system, and we
cannot update their academic records.
No Integration with LionPATH
We cannot connect to Penn State's official systems like LionPATH, Canvas, or the registrar's
database. This means students must manually enter their completed courses or upload their
transcript PDF. We cannot automatically pull their academic history from Penn State's systems.
Free Hosting Only
We must use free tier hosting services (like Vercel for frontend and Railway or Render for
backend), which limits our performance and storage capacity. We cannot use expensive cloud
services or dedicated servers.
No Machine Learning
Due to time constraints and team skill level, we use rule-based algorithms instead of artificial
intelligence or machine learning for recommendations. Our system uses simple calculations like
counting overlaps and gaps, not complex AI predictions.

5.2 Data Limitations
World Campus Only
The system only includes programs and courses available through Penn State World Campus. It
does not include programs from University Park, other campuses, or programs that are only
available in-person. Students from other campuses may not find accurate recommendations.
Static Data

Page 69 of 89

11/02/18

Software Design Specifications Document

Our course and program data is loaded from files or a database at startup and cached in memory.
If Penn State updates their course catalog or program requirements, we must manually update
our data files and restart the server. The system does not automatically sync with Penn State's
current course offerings.
Limited Course Information
We only store basic course information: course code, title, credits, prerequisites, and GenEd
attributes. We do not store information about when courses are offered (fall/spring/summer),
course availability, instructor names, or course descriptions beyond titles.
No Real-Time Availability
The system cannot check if courses are currently available or if there are open seats. It only
shows what courses are required, not whether students can actually enroll in them right now.

5.3 Functional Limitations
Top 3 Recommendations Only
The system displays only the top 3 best-matching programs. It calculates rankings for all
programs but only shows the top 3 to keep the interface simple. Students cannot see programs
ranked 4th, 5th, or lower without modifying their search criteria.
No Saved Searches
Students cannot save their search results or come back later to view the same recommendations.
Each session is independent. If they close the browser, they must start over.
No Comparison Tool
Students cannot directly compare two programs side-by-side. They must view each program's
details separately and remember the differences themselves.
No Course Scheduling
The system does not help students plan which courses to take in which semesters. It only shows
what courses are needed, not when to take them or in what order (beyond prerequisites).
No Prerequisite Path Planning
While the system shows prerequisite trees, it does not create a semester-by-semester plan
showing the optimal sequence of courses to take. Students must figure out the scheduling
themselves.

Page 70 of 89

11/02/18

Software Design Specifications Document

5.4 Performance Constraints
In-Memory Data Loading
All course and program data is loaded into server memory at startup. This limits how much data
we can store. If we had millions of courses, the server would run out of memory. Currently, we
can handle about 800 programs and 10,000 courses comfortably.
Single Server Processing
All recommendation calculations happen on one server. If hundreds of students use the system at
the same time, the server might slow down. We designed it to handle about 50 concurrent users,
but performance may degrade with more users.
No Caching of Results
Each time a student requests recommendations, the system recalculates everything from scratch.
We do not cache previous results, even if the same student searches again with the same data.
PDF Parsing Limitations
The transcript parser only works with official Penn State transcript PDFs. It may not work
correctly with:
•

Scanned PDFs (images, not text)

•

Password-protected PDFs

•

Transcripts from other universities

•

Unofficial transcripts or grade reports

5.5 User Interface Constraints
Browser Compatibility
The system works best on modern browsers (Chrome, Firefox, Safari, Edge). It may not work
correctly on very old browsers like Internet Explorer. We use modern web technologies that older
browsers do not support.
Mobile Screen Size
While the system is responsive and works on mobile devices, some features are easier to use on
larger screens. The prerequisite tree visualization, for example, is better viewed on a tablet or
desktop than on a small phone screen.

Page 71 of 89

11/02/18

Software Design Specifications Document

No Offline Mode
The system requires an internet connection to work. Students cannot download the system or use
it offline. All data and calculations happen on the server.
No Print Functionality
Students cannot print their recommendations directly from the system. They must use their
browser's print function, which may not format nicely.

5.6 Data Accuracy Constraints
Unofficial Recommendations
The recommendations are suggestions only, not official degree audits. Students must verify all
information with their academic advisor and official Penn State systems. We cannot guarantee
that our data matches Penn State's current requirements exactly.
No Guarantee of Course Availability
Just because a course is listed as required does not mean it will be available when the student
wants to take it. Course availability changes each semester, and we do not track this.
Equivalency Rules May Be Incomplete
Our course equivalency mappings may not include all possible equivalencies. Some courses that
should be considered equivalent might not be recognized by our system.
Prerequisite Rules Are Simplified
Our prerequisite checking uses three tiers (exact match, equivalency, hierarchy), but Penn State's
actual prerequisite system may be more complex. Some edge cases might not be handled
correctly.

5.7 Development Constraints
Team Size and Time
This is a student project built by a small team in one semester. We had limited time and
resources, so we prioritized core features over advanced functionality. Some nice-to-have
features were left out due to time constraints.
Free Tools Only
We used only free development tools, hosting services, and libraries. We could not use expensive
enterprise tools or services that might have made development easier or faster.
Learning Curve

Page 72 of 89

11/02/18

Software Design Specifications Document

Some team members were learning new technologies (Next.js, Flask, Supabase) while building
the project. This meant we sometimes chose simpler solutions over more sophisticated ones
because we needed to understand and maintain the code.

5.8 Security and Privacy Constraints
No Data Encryption
Student input (major, completed courses) is sent over the internet but not encrypted beyond
standard HTTPS. We do not store this data, but it is transmitted in plain text within the request.
No Privacy Policy
Since we do not store user data, we do not have a formal privacy policy. However, students
should be aware that their input is processed on our server.
No Data Backup
We do not have automated backups of our database or data files. If data is lost, we would need to
restore it manually.

5.9 Summary
These restrictions and limitations are important to understand because they define what our
system can and cannot do. Students should use our system as a helpful planning tool, but they
must verify all information with their academic advisor and use Penn State's official systems
(like LionPATH) for actual course registration and degree planning.
Our system is designed to be a starting point for exploration, not a final authority on academic
requirements. It helps students discover options and understand what's needed, but the final
decisions should always be made in consultation with academic advisors and official Penn State
resources.

6 Testing Issues
This section describes our testing strategy and the test cases we use to make sure the system
works correctly. We test for performance, accuracy, user interface behavior, security, and
repeatability.

6.1 Classes of Tests
We test the system in five ways:
Performance Test - Ensures the system responds quickly, even with large amounts of data or
complex calculations.

Page 73 of 89

11/02/18

Software Design Specifications Document

Accuracy Test - Verifies that the system calculates gaps, overlaps, and recommendations
correctly and matches expected results.
User Interface Test - Confirms the interface is clear, easy to use, and works correctly on
different devices and browsers.
Security Test - Ensures the system handles invalid input safely and doesn't expose sensitive
information.
Repeatability Test - Verifies the system returns the same results when given the same input
multiple times.

6.2 Performance Tests
We test how fast the system responds under different conditions.
Test 6.2.1: Large Course History Performance
Purpose: Verify the system can handle students with many completed courses without slowing
down.
Test Setup:
•

Input: Student history with 200 completed courses

•

Major: SOFTWARE ENGINEERING

•

Filter: Minors

Test Steps:
•

Enter 200 course codes in the system

•

Select a major

•

Click "Get Recommendations"

•

Measure time from click to results display

Expected Software Response:
•

Recommendations generated in less than 5 seconds

•

System remains responsive during processing

•

All 200 courses are processed correctly

•

Results are accurate despite large input

Actual Results:
•

Execution time: < 0.01 seconds

•

Status: Exceeds target (100x faster than required)

Page 74 of 89

11/02/18

Software Design Specifications Document

Test 6.2.2: Deep Prerequisite Chain Performance
Purpose: Verify the system can handle programs with many levels of prerequisites without
timing out.
Test Setup:
•

Input: Program requiring a course with 5 levels of prerequisites

•

Example: CMPSC 465 requires CMPSC 221, which requires CMPSC 131, which
requires MATH 140, etc.

Test Steps:
•

Select a program with deep prerequisite chains

•

Enter minimal course history (only base prerequisites)

•

Request recommendations

•

Measure time to calculate recursive prerequisite costs

Expected Software Response:
•

Prerequisite chain calculated in less than 2 seconds

•

No infinite loops or crashes

•

All prerequisite levels are correctly identified

•

Cost calculation includes all prerequisite levels

Actual Results:
•

Execution time: < 0.01 seconds

•

Status: Exceeds target (200x faster than required)

Page 75 of 89

11/02/18

Software Design Specifications Document

Test 6.2.3: Multiple Dynamic Subset Rules Performance
Purpose: Verify the system can handle programs with many complex rules efficiently.
Test Setup:
•

Input: Program with 10 dynamic subset rules

•

Each rule has primary pool and secondary pool constraints

•

Student history includes courses from various departments

Test Steps:
•

Select a program with many dynamic subset rules

•

Enter course history matching various rule constraints

•

Request recommendations

•

Measure time to process all rules

Expected Software Response:
•

All rules processed in less than 1 second

•

Gap calculation is accurate for all rules

•

Overlap count includes matches from all rule types

•

System doesn't slow down with many rules

Actual Results:
•

Execution time: < 0.01 seconds

•

Status: Exceeds target (100x faster than required)

6.3 Accuracy Tests
We test that the system calculates everything correctly and matches expected results.
Test 6.3.1: Business Minor Gap Calculation Accuracy
Purpose: Verify the system correctly calculates gap credits for a real-world program.
Test Setup:
•

Program: Business Minor

•

Student history: ECON 102, ECON 104, ECON 442, ECON 471, MGMT 301

Page 76 of 89

11/02/18

Software Design Specifications Document

•

Expected gap: 7 credits (ACCTG 211 + MKTG 301W)

Test Steps:
•

Enter the student history above

•

Select Business Minor

•

Request recommendations

•

Check gap credits displayed

Expected Software Response:
•

Gap credits = 7 credits

•

Overlap count includes ECON 102, ECON 104, MGMT 301

•

ECON 442 and ECON 471 are recognized as supporting courses

•

Missing courses list shows ACCTG 211 and MKTG 301W

Actual Results:
•

Gap calculated correctly

•

Overlap count accurate

•

Status: PASSED

Test 6.3.2: Economics Minor Completion Accuracy
Purpose: Verify the system correctly identifies when a program is fully completed.
Test Setup:
•

Program: Economics Minor

•

Student history: ECON 102, ECON 104, ECON 302, ECON 304, ECON 442, ECON
471

•

Expected result: Gap = 0 (program completed)

Test Steps:
1. Enter the student history above

Page 77 of 89

11/02/18

Software Design Specifications Document

2. Select Economics Minor
3. Request recommendations
4. Check gap credits and overlap count
Expected Software Response:
•

Gap credits = 0

•

Overlap count = 6 (all required courses)

•

Status shows "Completed" or "0 credits remaining"

•

All 6 courses appear in overlap courses list

Actual Results:
•

Gap = 0

•

Overlap count = 6

•

Status: PASSED

Test 6.3.3: Group Option Selection Accuracy
Purpose: Verify the system correctly identifies the best option when programs have group
choices.
Test Setup:
Program with group option:
Option A: ACCTG 211 (4 credits)
Option B: ACCTG 201 + ACCTG 202 (3 + 3 = 6 credits)
Student history: ACCTG 201, ACCTG 202
Test Steps:
•

Enter student history with ACCTG 201 and 202

•

Select program with group option

•

Request recommendations

•

Check which option is selected

Expected Software Response:
•

System selects Option B (student has both courses)

•

Gap credits = 0 (Option B completed)

•

Missing courses list shows "Completed" or empty

•

Best option correctly identified

Page 78 of 89

11/02/18

Software Design Specifications Document

Actual Results:
•

Option B correctly identified

•

Gap calculation accurate

•

Status: PASSED

6.4 User Interface Tests
We test that the interface works correctly and is easy to use.
Test 6.4.1: Form Validation and Error Display
Purpose: Verify the system shows clear error messages when users enter invalid data.
Test Setup:
•

Invalid course codes: "CMPSC 999", "INVALID 123", "ABC XYZ"

•

Valid course codes: "CMPSC 131", "MATH 140”

Test Steps:
•

Enter invalid course codes in the course input field

•

Select a valid major

•

Click "Get Recommendations"

•

Observe error messages displayed

Expected Software Response:
•

Error message appears clearly

•

Invalid course codes are highlighted in red

•

Error message lists which codes are invalid

•

Form remains filled (student can fix errors without retyping)

•

Suggestion text shows similar valid codes if available

• Validation: Error messages are clear, specific, and help users fix mistakes.
Test 6.4.2: PDF Transcript Upload Functionality
Purpose: Verify the transcript upload feature works correctly and extracts courses properly.
Test Setup:
•

Valid Penn State transcript PDF file
Page 79 of 89

11/02/18

Software Design Specifications Document

•

PDF contains courses: CMPSC 131, MATH 140, ENGL 15

Test Steps:
•

Click "Upload Transcript" button

•

Select valid PDF file

•

Wait for processing

•

Check that courses are automatically filled in the input field

Expected Software Response:
• File upload dialog opens
•

PDF is accepted (no error for valid file)

•

Loading spinner appears during processing

•

Success message: "Found X courses"

•

Course input field is automatically filled with extracted courses

•

Courses are in correct format (e.g., "CMPSC 131, MATH 140, ENGL 15")

• Validation: Upload works smoothly, courses are extracted correctly, and user doesn't need to
type manually.

Test 6.4.3: Responsive Design and Mobile Compatibility
Purpose: Verify the system works correctly on different screen sizes and devices.
Test Setup:
• Desktop browser (1920x1080)
•

Tablet browser (768x1024)

•

Mobile browser (375x667)

Test Steps:
•

Open system on desktop browser

•

Test all features (search, results, details)

•

Open system on tablet browser

•

Test all features again

•

Open system on mobile browser

•

Test all features again

Expected Software Response:
• All pages display correctly on all screen sizes
•

Text is readable (at least 16px font size)

Page 80 of 89

11/02/18

Software Design Specifications Document

•

Buttons are large enough to tap easily on mobile

•

Forms are usable without horizontal scrolling

•

Recommendation cards stack properly on small screens

•

Navigation works correctly on all devices

• Validation: System is fully functional and usable on desktop, tablet, and mobile devices.

6.5 Security Tests
We test that the system handles invalid or malicious input safely.
Test 6.5.1: SQL Injection Prevention
Purpose: Verify the system doesn't allow SQL injection attacks through user input.
Test Setup:
• Malicious input: "'; DROP TABLE courses; --"
•

Input in course code field: "CMPSC 131'; DROP TABLE courses; --"

Test Steps:
• Enter malicious SQL code in course input field
•

Submit the form

•

Check system response

•

Verify database is not affected

Expected Software Response:
• System treats input as plain text (not SQL code)
•

Input is validated and rejected as invalid course code

•

Error message: "Invalid course code" or similar

•

Database remains intact (no tables dropped)

•

No SQL errors in server logs

• Validation: System safely handles SQL-like input without executing it.
Test 6.5.2: File Upload Security
Purpose: Verify the system only accepts PDF files and rejects dangerous file types.
Test Setup:
• Test files: script.js, malicious.exe, large_file.pdf (over 10MB), password_protected.pdf
•

Test Steps:

•

Try uploading a JavaScript file (.js)

•

Try uploading an executable file (.exe)

•

Try uploading a very large PDF (over 10MB)

Page 81 of 89

11/02/18

Software Design Specifications Document

•

Try uploading a password-protected PDF

•

Check system response for each

Expected Software Response:
•

JavaScript files rejected: "Please upload a PDF file"

•

Executable files rejected: "Please upload a PDF file"

•

Large files rejected: "File size must be under 10MB"

•

Password-protected PDFs rejected: "Cannot read password-protected PDFs"

•

Only valid PDFs under 10MB are accepted

•

Uploaded files are deleted after processing

• Validation: System only accepts safe, valid PDF files and rejects all dangerous file types.
Test 6.5.3: Input Sanitization and XSS Prevention
Purpose: Verify the system doesn't execute malicious scripts embedded in user input.
Test Setup:
• Malicious input: "<script>alert('XSS')</script>"
•

Input in course code field: "CMPSC 131<script>alert('XSS')</script>"

Test Steps:
• Enter malicious script code in course input field
•

Submit the form

•

Check if script executes in browser

•

Check displayed output

Expected Software Response:
• Script tags are treated as plain text
•

No JavaScript alerts appear

•

Input is sanitized before display

•

Malicious code is escaped in HTML output

•

System displays input safely without executing scripts

• Validation: System prevents cross-site scripting (XSS) attacks by sanitizing all user input.

Page 82 of 89

11/02/18

Software Design Specifications Document

6.6 Repeatability Tests
We test that the system returns consistent results when given the same input multiple times.
Test 6.6.1: Same Input Multiple Times
Purpose: Verify the system returns identical results when the same data is submitted multiple
times.
Test Setup:
1. Student history: CMPSC 131, MATH 140, ENGL 15
2. Major: SOFTWARE ENGINEERING
3. Filter: Minors
4. Test Steps:
5. Enter the same student history and major
6. Click "Get Recommendations"
7. Record the top 3 recommendations
8. Clear the form
9. Enter the exact same data again
10. Click "Get Recommendations" again
11. Compare results

Expected Software Response:
• First request returns 3 recommendations: Program A, Program B, Program C
•

Second request returns the same 3 recommendations in the same order

•

Gap credits are identical for each program

•

Overlap counts are identical

•

Triple dip opportunities are identical

•

Results are 100% consistent

• Validation: System produces identical results for identical input every time.

Page 83 of 89

11/02/18

Software Design Specifications Document

Test 6.6.2: Recommendation Ranking Consistency
Purpose: Verify programs are ranked in the same order when calculations are repeated.
Test Setup:
• Student history: ECON 102, ECON 104, MGMT 301
•

Major: BUSINESS ADMINISTRATION

•

Filter: Minors

Test Steps:
• Submit request and record program rankings
•

Submit the same request 5 more times

•

Compare rankings across all 6 requests

•

Expected Software Response:

•

Program rankings are identical across all 6 requests

•

Top program is always the same

•

Second program is always the same

•

Third program is always the same

•

Gap credits for each program are identical

•

Overlap counts are identical

• Validation: Ranking algorithm produces consistent results with no random variation.

Test 6.6.3: Prerequisite Tree Display Consistency
Purpose: Verify prerequisite trees are displayed the same way when viewed multiple times.
Test Setup:
• Course: CMPSC 311
•

Student history: CMPSC 131, MATH 140

Test Steps:
• View program details for a program requiring CMPSC 311

Page 84 of 89

11/02/18

Software Design Specifications Document

•

Click "Prerequisites" button for CMPSC 311

•

Record the prerequisite tree structure and status indicators

•

Close the modal

•

Click "Prerequisites" button again

•

Compare the tree structure

Expected Software Response:
• First view shows prerequisite tree with specific structure
•

Second view shows identical tree structure

•

Status indicators (completed/available/blocked) are identical

•

Expand/collapse state doesn't affect tree structure

•

Tree is built the same way every time

• Validation: Prerequisite trees are consistently generated and displayed.
6.7 Performance Bounds
These are the minimum performance requirements the system must meet.
Performance Bound 1: Recommendation Generation Time
Requirement: The system must generate recommendations within 5 seconds from when the user
clicks "Get Recommendations" to when results are displayed.
Target: < 5 seconds
Actual Performance: < 0.01 seconds
Status: Exceeds requirement (500x faster)
Performance Bound 2: Course Overlap Calculation Time
Requirement: Calculating overlap count for a program with 100 courses must complete in less
than 1 second.
Target: < 1 second
Actual Performance: < 0.01 seconds
Status: Exceeds requirement (100x faster)
Performance Bound 3: Prerequisite Chain Calculation Time
Requirement: Calculating recursive prerequisite costs for a 5-level deep chain must complete in
less than 2 seconds.
Target: < 2 seconds
Actual Performance: < 0.01 seconds

Page 85 of 89

11/02/18

Software Design Specifications Document

Status: Exceeds requirement (200x faster)
Performance Bound 4: PDF Transcript Parsing Time
Requirement: Parsing a standard Penn State transcript PDF (typically 2-3 pages) must complete
in less than 10 seconds.
Target: < 10 seconds
Expected Performance: < 3 seconds for typical transcripts
Status: Meets requirement
Performance Bound 5: Page Load Time
Requirement: All pages (homepage, results, details) must load and become interactive within 3
seconds on a standard broadband connection.
Target: < 3 seconds
Expected Performance: < 1 second for cached resources
Status: Meets requirement
Performance Bound 6: Concurrent User Support
Requirement: The system must handle at least 50 concurrent users without significant
performance degradation.
Target: 50 concurrent users
Expected Performance: System can handle 50+ concurrent users with in-memory caching
Status: Meets requirement
Performance Bound 7: Data Loading Time
Requirement: System startup (loading all programs and courses into memory) must complete
within 30 seconds.
Target: < 30 seconds
Expected Performance: < 10 seconds for JSON files, < 15 seconds for Supabase
Status: Meets requirement

Page 86 of 89

11/02/18

Software Design Specifications Document

6.8 Expected Software Response Summary
Performance Tests:
• All operations complete in less than 5 seconds (actual: < 0.01 seconds)
•

System remains responsive with large datasets

•

No timeouts or crashes under load

Accuracy Tests:
• Gap calculations match expected results
•

Overlap counts are correct

•

Program completion status is accurate

•

Group options are correctly identified

User Interface Tests:
• Error messages are clear and helpful
•

File upload works correctly

•

System is usable on all device sizes

•

All buttons and forms work as expected

Security Tests:
• SQL injection attempts are blocked
•

Only safe file types are accepted

•

XSS attacks are prevented

•

User input is sanitized

Repeatability Tests:
• Identical input produces identical output
•

Rankings are consistent

•

Calculations are deterministic

•

No random variation in results

Page 87 of 89

11/02/18

Software Design Specifications Document

7 Appendices
7.1 Packaging and installation issues
How to install and prepare the system to run
For example, many teams use a database for your system. Some teams use
FireBase, some use Google services, others use customized servers (located in dorm).
Whatever techniques you are using, you need to describe how you set up the DB and how
to create DB connections (showing some code snippet would help).
This part will be used by the instructor to evaluate your self-learning ability. When
you describe a technique (even it is a small tool like Postman), provide sufficient
information such that it can be used as a tutorial for a novice to quick get it up and
running.

Page 88 of 89

11/02/18

Software Design Specifications Document

7.2 User Manual
Give step-by-step description of using the key features of the system.

7.3 Open Issues
Features considered but not finished

7.4 Lessons Learned
7.4.1 Design Patterns
What are the design patterns used and why?

7.4.3 Team Communications
How team communications were conducted and where could you improve in the future?

7.4.4 Task Allocations
How your team allocate tasks and responsibilities and where could you improve in the future?

7.4.5 Desirable Changes
Assume that you have another month to work on the project, what aspects of the system you would like to
improve? What are the additional features you want to add to the system? [Each student should use a
separate paragraph to respond to the questions]

7.4.6 Challenges Faced
Among requirements specification, system design, and system implementation, which one you think is
the hardest task? Why? [Each student should use a separate paragraph to respond to the questions]

Page 89 of 89

11/02/18

