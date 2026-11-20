// tests/fixtures.js
// Alag alag CS fields ke FAKE resumes aur JDs. Maqsad: koi bhi rule kisi ek resume/JD par
// overfit na ho. Har change ke baad poora set chalta hai (tests/run.js).
// Resume mein "\n" jaan boojh kar hai: pdfService ki lines yahi hoti hain.

const resumes = {
  web: {
    pageCount: 1,
    text: `Ali Khan
ali.khan@email.com | +1 (555) 123-4567 | github.com/alikhan | linkedin.com/in/alikhan
SUMMARY
Fresher full stack developer who enjoys building responsive web applications.
EDUCATION
BS Computer Science, FAST University, 2020 - 2024
SKILLS
JavaScript, React, Node.js, Express, MongoDB, HTML, CSS, Git, REST APIs
PROJECTS
Expense Tracker - Built a MERN app used by 300+ users and reduced manual data entry by 40% with receipt parsing.
Chat App - Developed real time chat with Socket.io and JWT authentication, deployed on AWS EC2.
Portfolio Site - Designed a responsive site with Tailwind CSS that loads in under 2 seconds.
EXPERIENCE
Web Development Intern, Techify - Implemented 12 REST endpoints and wrote unit tests with Jest.`,
  },
  ml: {
    pageCount: 1,
    text: `Sara Ahmed
sara.ahmed@mail.com | +44 7911 123456 | github.com/saraml | linkedin.com/in/saraml
EDUCATION
MS Artificial Intelligence, University of Leeds, 2022 - 2024
SKILLS
Python, PyTorch, TensorFlow, scikit-learn, pandas, NumPy, SQL, Git, Docker, OpenCV
PROJECTS
Sentiment Classifier - Trained a BERT based NLP model that reached 92% accuracy on 50k reviews.
Defect Detection - Built a computer vision pipeline with OpenCV and deep learning, reducing manual inspection by 60%.
RESEARCH
Research Assistant - Evaluated 5 neural network architectures and published results in a workshop paper.
EXPERIENCE
ML Intern, DataWorks - Deployed 3 models with Docker and monitored them in production.`,
  },
  security: {
    pageCount: 1,
    text: `Omar Siddiqui
omar.s@mail.com | 0300-1234567 | linkedin.com/in/omarsec
SUMMARY
Security analyst with hands-on SOC lab experience.
EDUCATION
BS Cyber Security, SZABIST, 2020 - 2024
TECHNICAL SKILLS
Splunk, SIEM, Wireshark, Nmap, Kali Linux, Linux, Python scripting, TCP/IP, OWASP, ISO 27001, NIST
EXPERIENCE
SOC Intern, SecureNet - Monitored 200+ alerts per day, investigated incidents and wrote 15 incident response reports.
Detected and mitigated 8 phishing campaigns using Splunk dashboards.
PROJECTS
Home Lab - Configured a vulnerability management lab and patched 40 vulnerabilities.
Web App Pentest - Performed penetration testing with Burp Suite and documented SQL injection findings.`,
  },
  embedded: {
    pageCount: 1,
    text: `Hamza Raza
hamza.r@mail.com | +92 300 1234567 | github.com/hamzaraza
EDUCATION
BE Electrical Engineering, NED University, 2019 - 2023
SKILLS
Embedded C, C/C++, STM32, FreeRTOS, UART, I2C, SPI, Arduino, MQTT, Altium, Linux, Git
PROJECTS
Smart Meter - Designed firmware on STM32 with FreeRTOS that cut power logging errors by 35%.
IoT Gateway - Built an MQTT gateway on Raspberry Pi connecting 25 sensors.
EXPERIENCE
Firmware Intern, EmbedTech - Debugged I2C and SPI drivers and tested 10 PCB revisions.`,
  },
  game: {
    pageCount: 1,
    text: `Lina Park
lina.park@mail.com | (212) 555-0142 | github.com/linapark | lina.dev
EDUCATION
BS Game Development, DigiPen, 2020 - 2024
SKILLS
Unity, C#, Unreal Engine, game development, shaders, OpenGL, Blender, Git, Agile
PROJECTS
Dungeon Rush - Built a 3D game in Unity with C# and custom shaders, reaching 10k downloads.
Physics Sandbox - Implemented gameplay programming systems and optimized frame rate by 30%.
EXPERIENCE
Gameplay Programmer Intern, PixelForge - Collaborated with 6 designers in a Scrum team.`,
  },
  senior: {
    pageCount: 2,
    text: `Daniel Weber
daniel.weber@mail.com | +49 151 23456789 | github.com/dweber | linkedin.com/in/dweber
SUMMARY
Backend engineer with 8 years of experience building distributed systems.
EXPERIENCE
Senior Backend Engineer, CloudPay - Led a team of 5 engineers and migrated a monolith to 14 microservices on AWS.
Designed Kafka event pipelines that handled 2M events per day and reduced latency by 45%.
Mentored 6 junior engineers and introduced code review standards.
Backend Engineer, ShopStream - Built Java Spring Boot services backed by PostgreSQL and Redis.
Automated CI/CD with Jenkins and Docker, cutting deployment time from 2 hours to 15 minutes.
Deployed workloads on Kubernetes and managed infrastructure with Terraform.
Software Engineer, FinTechCo - Developed REST APIs, improved database queries by 3x and wrote integration tests.
SKILLS
Java, Spring Boot, Kafka, PostgreSQL, Redis, AWS, Kubernetes, Docker, Terraform, CI/CD, system design
EDUCATION
MSc Computer Science, TU Munich, 2014 - 2016`,
  },
  data: {
    pageCount: 1,
    text: `Nadia Hussain
nadia.h@mail.com | +1 415-555-0198 | linkedin.com/in/nadiah | github.com/nadiah
SUMMARY
Data analyst who turns messy data into clear dashboards.
EDUCATION
BBA Business Analytics, IBA Karachi, 2019 - 2023
SKILLS
SQL, Excel, Power BI, Tableau, Python, pandas, data visualization, statistics
EXPERIENCE
Data Analyst, RetailCo - Built 8 Power BI dashboards used by 40 managers and cut reporting time by 50%.
Analyzed 2M sales records with SQL and pandas to identify 3 new revenue segments.
PROJECTS
Churn Analysis - Cleaned and modeled customer data in Python, predicting churn with 85% accuracy.`,
  },
};

const jds = {
  web: `We are hiring a Full Stack Developer to build modern web applications. Requirements: strong JavaScript and React experience, Node.js with Express, MongoDB or PostgreSQL, REST API design, Git and Docker. Nice to have: TypeScript and AWS. You will work in an agile team, write clean tested code and collaborate with designers and product managers on new features.`,
  ml: `Looking for a Machine Learning Engineer to train and deploy deep learning models. Requirements: Python, PyTorch or TensorFlow, NLP, computer vision, MLOps practices, Docker, Kubernetes, AWS and SQL. Experience with large language models and prompt engineering is a plus. You will research new approaches, evaluate model accuracy and work closely with data engineers.`,
  security: `We need a SOC Analyst to monitor and respond to security incidents. Requirements: SIEM tools such as Splunk, incident response, threat detection, network security and TCP/IP knowledge, Linux, Python scripting, MITRE ATT&CK, vulnerability management and familiarity with ISO 27001. You will triage alerts, investigate incidents and write clear reports for the security team.`,
  embedded: `Embedded Firmware Engineer wanted to develop software for connected devices. Requirements: C and C++, RTOS experience, microcontrollers such as STM32, I2C, SPI and UART protocols, debugging with an oscilloscope, Git and Linux. Experience with MQTT and IoT products is a plus. You will write firmware, test hardware revisions and work with PCB designers.`,
  game: `Gameplay Programmer needed for an upcoming 3D title. Requirements: Unity with C#, game development experience, gameplay programming, shaders, Git and Agile or Scrum workflow. Unreal Engine knowledge is a plus. You will prototype mechanics, optimize performance and collaborate with artists and designers in a small studio.`,
  senior: `Senior Backend Engineer to design scalable services. Requirements: Java with Spring Boot, microservices, Kafka, AWS, Kubernetes, PostgreSQL, system design and CI/CD. You will lead technical decisions, mentor junior engineers, run code reviews and own the reliability of our payment platform.`,
  data: `Data Analyst to turn data into decisions. Requirements: strong SQL, Power BI or Tableau, Excel, Python with pandas, data visualization and statistics. You will build dashboards, analyze large datasets, present insights to managers and automate recurring reports.`,
};

// Pairs: expected range PEHLE se likhi hain (outputs dekh kar nahi badli).
// match pair: 50 se 95. mismatch pair: 35 se kam
const pairs = [
  { name: 'web ↔ web JD',            resume: 'web',      jd: 'web',      min: 50, max: 95 },
  { name: 'ml ↔ ml JD',              resume: 'ml',       jd: 'ml',       min: 50, max: 95 },
  { name: 'security ↔ SOC JD',       resume: 'security', jd: 'security', min: 50, max: 95 },
  { name: 'embedded ↔ firmware JD',  resume: 'embedded', jd: 'embedded', min: 50, max: 95 },
  { name: 'game ↔ gameplay JD',      resume: 'game',     jd: 'game',     min: 50, max: 95 },
  { name: 'senior (2pg) ↔ senior JD', resume: 'senior',  jd: 'senior',   min: 50, max: 95 },
  { name: 'data ↔ data JD',          resume: 'data',     jd: 'data',     min: 50, max: 95 },
  { name: 'MISMATCH web ↔ embedded', resume: 'web',      jd: 'embedded', min: 0,  max: 35 },
  { name: 'MISMATCH ml ↔ game',      resume: 'ml',       jd: 'game',     min: 0,  max: 35 },
  { name: 'MISMATCH security ↔ web', resume: 'security', jd: 'web',      min: 0,  max: 35 },
  { name: 'MISMATCH data ↔ senior',  resume: 'data',     jd: 'senior',   min: 0,  max: 35 },
];

// Har resume mein yeh skills HONI chahiye (jo resume mein sach mein likhi hain)
// aur yeh NAHI honi chahiye (jo likhi hi nahi, yaani false positive)
const skillExpectations = {
  web:      { has: ['javascript', 'react', 'nodejs', 'express', 'mongodb', 'git', 'aws'], hasNot: ['typescript', 'docker', 'python', 'golang', 'data_structures', 'operating_systems'] },
  ml:       { has: ['python', 'pytorch', 'tensorflow', 'machine_learning', 'nlp', 'computer_vision', 'docker'], hasNot: ['javascript', 'typescript', 'react', 'aws', 'kubernetes'] },
  security: { has: ['siem_soc', 'pentest', 'networking', 'linux', 'iso27001', 'owasp', 'python'], hasNot: ['javascript', 'react', 'docker', 'aws'] },
  embedded: { has: ['embedded', 'iot', 'linux', 'git', 'hardware_design'], hasNot: ['javascript', 'python', 'react', 'sql'] },
  game:     { has: ['game_dev', 'csharp', 'graphics', 'git', 'agile'], hasNot: ['javascript', 'python', 'react', 'sql'] },
  senior:   { has: ['java', 'springboot', 'kubernetes', 'aws', 'cicd', 'terraform', 'system_design'], hasNot: ['javascript', 'react', 'python'] },
  data:     { has: ['sql', 'bi_tools', 'excel', 'python', 'data_analysis'], hasNot: ['javascript', 'react', 'docker'] },
};

module.exports = { resumes, jds, pairs, skillExpectations };