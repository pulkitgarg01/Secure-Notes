import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import User from './models/User.js';
import Branch from './models/Branch.js';
import Semester from './models/Semester.js';
import Section from './models/Section.js';
import Subject from './models/Subject.js';
import SubjectAssignment from './models/SubjectAssignment.js';
import Module from './models/Module.js';
import Note from './models/Note.js';
import Activity from './models/Activity.js';
import Progress from './models/Progress.js';

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa", "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Emma", "Brandon", "Nicole", "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Alexander", "Debra", "Frank", "Rachel", "Patrick", "Catherine", "Raymond", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysBack = 30) {
  const d = new Date();
  d.setDate(d.getDate() - getRandomInt(0, daysBack));
  d.setHours(getRandomInt(8, 22), getRandomInt(0, 59), getRandomInt(0, 59));
  return d;
}

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/acadence';
  await mongoose.connect(uri);
  console.log('Connected to DB');

  // Clear existing
  await User.deleteMany({});
  await Branch.deleteMany({});
  await Semester.deleteMany({});
  await Section.deleteMany({});
  await Subject.deleteMany({});
  await SubjectAssignment.deleteMany({});
  await Module.deleteMany({});
  await Note.deleteMany({});
  await Activity.deleteMany({});
  await Progress.deleteMany({});
  
  console.log('Cleared existing data.');

  const password = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // 1. Branches
  const bCS = await Branch.create({ name: 'Computer Science', code: 'CS' });
  const bIS = await Branch.create({ name: 'Information Systems', code: 'IS' });
  const bEC = await Branch.create({ name: 'Electronics', code: 'EC' });
  const bEN = await Branch.create({ name: 'Engineering', code: 'EN' });
  console.log('Seeded Branches');

  // 2. Semesters (Spring 2026, Fall 2026)
  const semSpring = await Semester.create({ number: 1, name: 'Spring 2026' }); // Representing Spring
  const semFall = await Semester.create({ number: 2, name: 'Fall 2026' });
  console.log('Seeded Semesters');

  // 3. Sections
  const secCSA = await Section.create({ name: 'CS-A', branch_id: bCS._id, semester_id: semSpring._id });
  const secCSB = await Section.create({ name: 'CS-B', branch_id: bCS._id, semester_id: semSpring._id });
  const secISA = await Section.create({ name: 'IS-A', branch_id: bIS._id, semester_id: semFall._id });
  const secECA = await Section.create({ name: 'EC-A', branch_id: bEC._id, semester_id: semSpring._id });
  console.log('Seeded Sections');

  // 4. Subjects
  const subDS = await Subject.create({ name: 'Distributed Systems', code: 'CS401', description: 'Concepts of distributed architectures.', branch_id: bCS._id, semester_id: semSpring._id });
  const subCC = await Subject.create({ name: 'Cloud Computing', code: 'CS402', description: 'AWS, Azure, and Cloud Native.', branch_id: bCS._id, semester_id: semSpring._id });
  const subML = await Subject.create({ name: 'Machine Learning', code: 'CS403', description: 'Supervised and Unsupervised Learning.', branch_id: bCS._id, semester_id: semSpring._id });
  const subCyS = await Subject.create({ name: 'Cyber Security', code: 'IS301', description: 'Network security, cryptography.', branch_id: bIS._id, semester_id: semFall._id });
  const subDB = await Subject.create({ name: 'Database Systems', code: 'CS301', description: 'Relational and NoSQL Databases.', branch_id: bCS._id, semester_id: semFall._id });
  const subSE = await Subject.create({ name: 'Software Engineering', code: 'CS302', description: 'Agile, SDLC, Design Patterns.', branch_id: bCS._id, semester_id: semFall._id });
  const subOS = await Subject.create({ name: 'Operating Systems', code: 'CS303', description: 'Processes, Memory, Concurrency.', branch_id: bCS._id, semester_id: semFall._id });
  console.log('Seeded Subjects');

  // 5. Admin & Faculty
  const adminUser = await User.create({ name: 'Admin Portal', email: 'admin@acadence.edu', password, role: 'admin', last_active: new Date() });
  
  const facultyList = [
    { name: 'Dr. Sarah Chen', email: 'sarah.chen@acadence.edu', password, role: 'teacher', status: 'active', last_active: getRandomDate(5) },
    { name: 'Michael Torres', email: 'michael.torres@acadence.edu', password, role: 'teacher', status: 'active', last_active: getRandomDate(5) },
    { name: 'Priya Raman', email: 'priya.raman@acadence.edu', password, role: 'teacher', status: 'active', last_active: getRandomDate(5) },
    { name: 'David Kim', email: 'david.kim@acadence.edu', password, role: 'teacher', status: 'active', last_active: getRandomDate(5) },
    { name: 'Emily Johnson', email: 'emily.johnson@acadence.edu', password, role: 'teacher', status: 'active', last_active: getRandomDate(10) },
    { name: 'Robert Martinez', email: 'robert.martinez@acadence.edu', password, role: 'teacher', status: 'inactive', last_active: getRandomDate(25) }
  ];
  
  const facultyDocs = await User.insertMany(facultyList);
  
  // Assign subjects
  const [sarah, michael, priya, david, emily] = facultyDocs;
  await SubjectAssignment.create({ teacher_id: sarah._id, subject_id: subML._id });
  await SubjectAssignment.create({ teacher_id: sarah._id, subject_id: subDS._id });
  await SubjectAssignment.create({ teacher_id: michael._id, subject_id: subCC._id });
  await SubjectAssignment.create({ teacher_id: priya._id, subject_id: subCyS._id });
  await SubjectAssignment.create({ teacher_id: david._id, subject_id: subDB._id });
  await SubjectAssignment.create({ teacher_id: emily._id, subject_id: subSE._id });
  await SubjectAssignment.create({ teacher_id: michael._id, subject_id: subOS._id });

  // 6. Generate 175 Students
  const students = [];
  const sectionsList = [
    { branch: bCS._id, sem: semSpring._id, sec: secCSA._id },
    { branch: bCS._id, sem: semSpring._id, sec: secCSB._id },
    { branch: bIS._id, sem: semFall._id, sec: secISA._id },
    { branch: bEC._id, sem: semSpring._id, sec: secECA._id }
  ];

  for (let i = 0; i < 175; i++) {
    const fn = firstNames[getRandomInt(0, firstNames.length - 1)];
    const ln = lastNames[getRandomInt(0, lastNames.length - 1)];
    const secObj = sectionsList[getRandomInt(0, sectionsList.length - 1)];
    
    // Some random statuses
    let status = 'active';
    const rand = Math.random();
    if (rand > 0.95) status = 'suspended';
    else if (rand > 0.90) status = 'inactive';

    students.push({
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@student.acadence.edu`,
      password: studentPassword,
      role: 'student',
      status,
      branch_id: secObj.branch,
      semester_id: secObj.sem,
      section_id: secObj.sec,
      last_active: getRandomDate(14)
    });
  }
  await User.insertMany(students);
  console.log(`Seeded ${students.length} Students`);

  // 7. Generate Resources & Modules
  const subjectsObj = [
    { sub: subML, fac: sarah },
    { sub: subDS, fac: sarah },
    { sub: subCC, fac: michael },
    { sub: subCyS, fac: priya },
    { sub: subDB, fac: david },
    { sub: subSE, fac: emily },
    { sub: subOS, fac: michael }
  ];

  const resourceTypes = ['pdf', 'document', 'guide', 'assignment'];
  const resourceNames = ['Lecture Notes', 'Lab Manual', 'Assignment Pack', 'Midterm Guide', 'Course Handbook', 'Project Guidelines', 'Examination Blueprint'];
  
  const activities = [];

  for (const item of subjectsObj) {
    const mod = await Module.create({ title: 'Course Materials', subject_id: item.sub._id, created_by: item.fac._id });
    
    const subjectDirName = item.sub.name.replace(/\s+/g, '');
    let dirToCheck = subjectDirName;
    if (item.sub.name === 'Database Systems') dirToCheck = 'DBMS';
    
    const subjectDirPath = path.join(process.cwd(), 'sample-resources', dirToCheck);
    let sampleFiles = [];
    if (fs.existsSync(subjectDirPath)) {
      sampleFiles = fs.readdirSync(subjectDirPath).filter(f => f.endsWith('.pdf'));
    }

    if (sampleFiles.length === 0) {
      console.warn(`No sample PDFs found for ${item.sub.name}`);
    }

    for (let i = 0; i < sampleFiles.length; i++) {
      const filename = sampleFiles[i];
      let type = 'document';
      if (filename.includes('Concepts')) type = 'guide';
      else if (filename.includes('Lab')) type = 'document';
      else if (filename.includes('Assignment')) type = 'assignment';
      else if (filename.includes('Quiz')) type = 'assignment';
      else if (filename.includes('Project')) type = 'guide';

      let name = filename.replace('.pdf', '').replace(/_/g, ' ');

      const statusRand = Math.random();
      const status = statusRand > 0.8 ? 'archived' : (statusRand > 0.6 ? 'draft' : 'published');
      const version = `v${getRandomInt(1,2)}.${getRandomInt(0,5)}`;
      const createdAt = getRandomDate(20);

      const sourcePath = path.join(subjectDirPath, filename);
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + filename;
      const targetPath = path.join(process.cwd(), 'uploads', uniqueName);
      
      if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
        fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
      }
      fs.copyFileSync(sourcePath, targetPath);

      const stats = fs.statSync(targetPath);

      const note = await Note.create({
        teacher_id: item.fac._id,
        module_id: mod._id,
        title: name,
        description: `Official ${name} for ${item.sub.name}`,
        file_path: `uploads/${uniqueName}`,
        file_size: stats.size,
        status,
        resource_type: type,
        version,
        views: getRandomInt(0, 500),
        downloads: getRandomInt(0, 200)
      });
      // Force timestamps for realism
      await Note.updateOne({ _id: note._id }, { uploaded_at: createdAt, updated_at: createdAt });

      if (status === 'published') {
        activities.push({
          actor_id: item.fac._id,
          actor_name: item.fac.name,
          action: 'published',
          target_name: name,
          target_type: 'Resource',
          created_at: createdAt
        });
      } else if (status === 'archived') {
         activities.push({
          actor_id: item.fac._id,
          actor_name: item.fac.name,
          action: 'archived',
          target_name: name,
          target_type: 'Resource',
          created_at: createdAt
        });
      }
    }
  }
  
  // 8. Generate Extra Activity Events
  // Add some account creations and generic access logs
  for (let i=0; i<15; i++) {
    const date = getRandomDate(25);
    activities.push({
      actor_id: adminUser._id,
      actor_name: 'System Admin',
      action: 'created',
      target_name: 'Faculty Account',
      target_type: 'User',
      created_at: date
    });
  }
  
  for (let i=0; i<15; i++) {
    const date = getRandomDate(10);
    const sub = subjectsObj[getRandomInt(0, subjectsObj.length - 1)].sub;
    activities.push({
      actor_id: adminUser._id, // represent anonymous group
      actor_name: `${getRandomInt(10, 45)} students`,
      action: 'accessed',
      target_name: `${sub.name} resources`,
      target_type: 'Subject',
      created_at: date
    });
  }

  // Assign Subject activities
  activities.push({
    actor_id: adminUser._id,
    actor_name: 'Admin Portal',
    action: 'assigned',
    target_name: 'Machine Learning to Dr. Sarah Chen',
    target_type: 'Assignment',
    created_at: getRandomDate(28)
  });

  // Sort activities by date
  activities.sort((a,b) => a.created_at - b.created_at);
  
  await Activity.insertMany(activities);
  console.log(`Seeded ${activities.length} Activity logs`);

  // 9. Generate realistic Progress records
  // Get all students and all notes
  const allStudents = await User.find({ role: 'student' });
  const allNotes = await Note.find({});
  const progressRecords = [];

  for (const student of allStudents) {
    // Each student views 30-75% of available notes randomly
    const shuffled = [...allNotes].sort(() => Math.random() - 0.5);
    const viewCount = getRandomInt(Math.floor(allNotes.length * 0.3), Math.floor(allNotes.length * 0.75));
    const viewedNotes = shuffled.slice(0, viewCount);

    for (const note of viewedNotes) {
      const viewedAt = getRandomDate(20);
      const completed = Math.random() > 0.35; // 65% chance of being marked complete
      progressRecords.push({
        student_id: student._id,
        note_id: note._id,
        viewed_at: viewedAt,
        completed,
        completed_at: completed ? viewedAt : null
      });
    }
  }

  // Bulk insert progress (ignore duplicate errors)
  if (progressRecords.length > 0) {
    await Progress.insertMany(progressRecords, { ordered: false }).catch(() => {});
  }
  console.log(`Seeded ${progressRecords.length} Progress records`);

  // Update view counts on Notes based on Progress
  const noteCounts = {};
  for (const pr of progressRecords) {
    const key = pr.note_id.toString();
    noteCounts[key] = (noteCounts[key] || 0) + 1;
  }
  for (const [noteId, count] of Object.entries(noteCounts)) {
    await Note.findByIdAndUpdate(noteId, { views: count, last_accessed: getRandomDate(5) });
  }
  console.log('Updated view counts on Notes');

  console.log('Database successfully seeded with highly realistic operational SaaS data!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
