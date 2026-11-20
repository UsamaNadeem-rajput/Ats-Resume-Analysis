// src/utils/skillsDictionary.js
//
// Har skill ka format:
//   name      → canonical naam (output mein yahi dikhta hai)
//   variants  → "STRONG" naam: yeh jahan bhi poore lafz ki tarah mile, skill maan li jati hai
//   weak      → "WEAK" naam: aam angrezi lafz se takrate hain (Express, React, Swift, Unity...)
//               yeh CASE-SENSITIVE match hote hain (sirf "Express", "express" nahi)
//               aur sirf tab ginay jate hain jab `requires` mein se koi skill text mein ho
//   requires  → weak variants ke liye context: "Express" tabhi skill hai jab nodejs/javascript bhi ho
//   implies   → yeh naam likha ho to in skills ko bhi maano ("MERN stack" likha hai to MongoDB, Express, React, Node.js bhi)
//   virtual   → true ho to yeh naam khud skill nahi, sirf `implies` wali skills dene ke liye hai (resume mein "MERN" ho
//               aur JD mein "MongoDB, React..." alag alag, ya ulta: dono taraf barabar hisaab)
//
// DICTIONARY KE RULES (naya variant likhne se pehle yeh padho):
//  1. Bare aam angrezi lafz variant nahi banta (stack, go, r, rest, express, spark, excel, unity, swift)
//  2. Ek variant sirf EK skill ka hota hai (pehle git aur version_control dono "git" se bante thay)
//  3. Variants hamesha lowercase mein likho (weak ko chhor kar, woh asli case mein)
//  4. Skill ke naam ka order matter karta hai sirf weak/requires ke liye: required skill pehle aaye
//
// Limitation (README mein likhna): bare "C", "R", "Go" jaise single-lafz languages tab pakri jati hain
// jab wo qualified likhi hon ("C programming", "golang", "R language", "C/C++"), akeli nahi.

const skill = (name, variants, extra = {}) => ({ name, variants, weak: [], requires: [], implies: [], virtual: false, ...extra });

module.exports = [
  // ── Programming languages ──────────────────────────────────────────────────
  skill('javascript', ['javascript', 'ecmascript', 'es6', 'vanilla js'], { weak: ['JS'] }),
  skill('typescript', ['typescript']),
  skill('python', ['python', 'python3']),
  skill('java', ['java', 'jdk', 'jvm', 'j2ee', 'java ee']),
  skill('csharp', ['c#', 'c sharp', 'csharp']),
  skill('dotnet', ['.net', 'dotnet', 'asp.net', '.net core', 'entity framework']),
  skill('cpp', ['c++', 'cpp', 'c/c++', 'c and c++', 'c or c++', 'c, c++', 'c & c++']),
  skill('c', ['c programming', 'c language', 'embedded c', 'ansi c', 'c/c++', 'c and c++', 'c, c++', 'c & c++']),
  skill('golang', ['golang', 'go lang', 'go programming']),
  skill('rust', ['rust']),
  skill('kotlin', ['kotlin']),
  skill('php', ['php']),
  skill('ruby', ['ruby', 'ruby on rails', 'rails']),
  skill('dart', ['dart']),
  skill('scala', ['scala']),
  skill('r_language', ['r programming', 'r language', 'rstudio', 'tidyverse', 'ggplot', 'ggplot2']),
  skill('matlab', ['matlab', 'simulink']),
  skill('bash', ['bash', 'shell scripting', 'shell script', 'powershell', 'zsh']),
  skill('sql', [
    'sql', 'mysql', 'postgresql', 'postgres', 'sql server', 'mssql', 'sqlite',
    'plsql', 'pl/sql', 't-sql', 'oracle database', 'rdbms', 'relational database',
  ]),

  // ── Web frontend ───────────────────────────────────────────────────────────
  skill('html', ['html', 'html5']),
  skill('css', ['css', 'css3', 'sass', 'scss']),
  skill('tailwind', ['tailwind', 'tailwindcss']),
  skill('bootstrap', ['bootstrap']),
  // react: "React" aam lafz bhi hai ("react to feedback"), isliye bare form ke liye context chahiye
  skill('react', ['react.js', 'reactjs', 'react js'], {
    weak: ['React'], requires: ['javascript', 'typescript', 'html', 'css', 'redux', 'nextjs', 'nodejs', 'mongodb', 'express'],
  }),
  skill('nextjs', ['next.js', 'nextjs', 'next js']),
  skill('vue', ['vue', 'vue.js', 'vuejs', 'nuxt']),
  skill('angular', ['angular', 'angularjs']),
  skill('svelte', ['svelte', 'sveltekit']),
  skill('redux', ['redux']),
  skill('jquery', ['jquery']),
  skill('ui_ux', ['figma', 'ui/ux', 'ux design', 'wireframe', 'wireframing', 'user interface design']),

  // ── Backend / APIs ─────────────────────────────────────────────────────────
  // nodejs express se pehle: express ka `requires` nodejs ko dekhta hai
  skill('nodejs', ['node.js', 'nodejs', 'node js'], {
    weak: ['Node'], requires: ['javascript', 'typescript', 'react', 'nextjs'],
  }),
  skill('express', ['express.js', 'expressjs', 'express js', 'express framework'], {
    weak: ['Express'], requires: ['nodejs', 'javascript', 'typescript'],
  }),
  // Stack ke naam: ek lafz mein kai skills (resume mein "MERN" likha ho to MongoDB bhi aati hai)
  skill('mern', ['mern', 'mern stack'], { virtual: true, implies: ['mongodb', 'express', 'react', 'nodejs'] }),
  skill('mean', ['mean stack'], { virtual: true, weak: ['MEAN'], implies: ['mongodb', 'express', 'angular', 'nodejs'] }),
  skill('mevn', ['mevn', 'mevn stack'], { virtual: true, implies: ['mongodb', 'express', 'vue', 'nodejs'] }),
  skill('lamp', ['lamp stack'], { virtual: true, weak: ['LAMP'], implies: ['linux', 'php', 'mysql'] }),
  skill('nestjs', ['nestjs', 'nest.js']),
  skill('django', ['django']),
  skill('flask', ['flask']),
  skill('fastapi', ['fastapi']),
  skill('springboot', ['spring boot', 'springboot', 'spring framework', 'spring mvc']),
  skill('laravel', ['laravel']),
  skill('rest', ['restful', 'rest api', 'rest-api', 'restful api'], { weak: ['REST'] }),
  skill('graphql', ['graphql']),
  skill('grpc', ['grpc']),
  skill('websockets', ['websocket', 'socket.io', 'socketio']),
  skill('microservices', ['microservice', 'micro-services', 'micro services']),
  skill('serverless', ['serverless', 'aws lambda', 'cloud functions']),
  skill('messaging', ['rabbitmq', 'message queue', 'message broker', 'activemq', 'sqs']),
  skill('authentication', ['jwt', 'oauth', 'oauth2', 'authentication', 'authorization', 'saml', 'sso']),

  // ── Databases ──────────────────────────────────────────────────────────────
  skill('mysql', ['mysql']),
  skill('postgresql', ['postgresql', 'postgres']),
  skill('mongodb', ['mongodb', 'mongo db', 'mongoose', 'mongo']),
  skill('redis', ['redis']),
  skill('elasticsearch', ['elasticsearch', 'elastic search', 'opensearch']),
  skill('firebase', ['firebase', 'firestore']),
  skill('dynamodb', ['dynamodb']),
  skill('cassandra', ['cassandra']),
  skill('nosql', ['nosql', 'no-sql']),

  // ── Cloud / DevOps ─────────────────────────────────────────────────────────
  skill('aws', ['aws', 'amazon web services', 'ec2', 's3', 'cloudfront']),
  skill('azure', ['azure']),
  skill('gcp', ['gcp', 'google cloud']),
  skill('cloud', ['cloud computing', 'cloud infrastructure']),
  skill('docker', ['docker', 'dockerfile']),
  skill('kubernetes', ['kubernetes', 'k8s', 'kubectl', 'helm']),
  skill('terraform', ['terraform', 'infrastructure as code', 'iac']),
  skill('ansible', ['ansible']),
  skill('jenkins', ['jenkins']),
  skill('cicd', [
    'ci/cd', 'ci cd', 'cicd', 'continuous integration', 'continuous deployment',
    'continuous delivery', 'github actions', 'gitlab ci',
  ]),
  skill('linux', ['linux', 'ubuntu', 'debian', 'centos', 'red hat', 'rhel']),
  skill('nginx', ['nginx']),
  // git aur version control ek hi skill: JD "Git" likhe ya "version control", dono barabar
  skill('git', [
    'git', 'github', 'gitlab', 'bitbucket', 'version control', 'source control', 'svn', 'subversion',
  ]),
  skill('monitoring', ['prometheus', 'grafana', 'datadog', 'observability', 'new relic']),
  skill('devops', ['devops', 'sre', 'site reliability']),

  // ── Testing / QA ───────────────────────────────────────────────────────────
  skill('testing', [
    'unit testing', 'unit test', 'integration testing', 'test automation', 'automated testing',
    'tdd', 'jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress', 'playwright',
  ]),
  skill('qa', ['quality assurance', 'qa engineer', 'manual testing', 'test cases', 'test plans']),

  // ── AI / ML / Data ─────────────────────────────────────────────────────────
  skill('machine_learning', [
    'machine learning', 'scikit-learn', 'sklearn', 'supervised learning', 'unsupervised learning',
  ], { weak: ['ML'] }),
  skill('deep_learning', ['deep learning', 'neural network', 'cnn', 'rnn', 'lstm']),
  skill('tensorflow', ['tensorflow', 'keras']),
  skill('pytorch', ['pytorch']),
  skill('nlp', [
    'nlp', 'natural language processing', 'spacy', 'nltk', 'text classification', 'sentiment analysis',
  ]),
  skill('computer_vision', [
    'computer vision', 'opencv', 'image processing', 'object detection', 'image classification', 'yolo',
  ]),
  skill('llm', [
    'llm', 'large language model', 'langchain', 'prompt engineering', 'generative ai', 'genai',
    'openai', 'chatgpt', 'gpt', 'rag', 'vector database', 'fine-tuning', 'fine tuning',
    'hugging face', 'huggingface',
  ]),
  skill('mlops', ['mlops', 'mlflow', 'model deployment', 'kubeflow']),
  skill('data_analysis', [
    'pandas', 'numpy', 'data analysis', 'data analytics', 'data visualization', 'matplotlib',
    'seaborn', 'exploratory data analysis', 'eda', 'statistical analysis', 'statistics',
  ]),
  skill('bi_tools', ['power bi', 'powerbi', 'tableau', 'looker', 'qlik', 'google data studio']),
  skill('excel', ['microsoft excel', 'ms excel', 'advanced excel', 'excel spreadsheet'], {
    weak: ['Excel'], requires: ['sql', 'bi_tools', 'data_analysis'],
  }),
  skill('data_engineering', [
    'etl', 'airflow', 'data pipeline', 'data warehouse', 'data warehousing', 'kafka',
    'snowflake', 'dbt', 'databricks', 'hadoop', 'apache spark', 'pyspark', 'big data',
  ], { weak: ['Spark'], requires: ['python', 'scala', 'java', 'sql'] }),

  // ── Cybersecurity ──────────────────────────────────────────────────────────
  skill('cybersecurity', [
    'cybersecurity', 'cyber security', 'information security', 'infosec', 'network security',
    'application security', 'security analyst', 'vulnerability assessment',
    'vulnerability management', 'threat modeling', 'threat detection', 'mitre att&ck', 'mitre',
  ]),
  skill('pentest', [
    'penetration testing', 'pentest', 'pen testing', 'ethical hacking', 'kali linux',
    'metasploit', 'burp suite', 'nmap', 'red team', 'vapt',
  ]),
  skill('siem_soc', [
    'siem', 'splunk', 'soc analyst', 'security operations', 'qradar', 'wazuh', 'elk stack',
  ]),
  skill('forensics', [
    'digital forensics', 'forensics', 'forensic', 'malware analysis', 'autopsy',
    'volatility', 'incident response',
  ]),
  skill('iso27001', ['iso 27001', 'iso27001', 'iso/iec 27001', 'isms']),
  skill('compliance', ['nist', 'gdpr', 'pci dss', 'soc 2', 'hipaa', 'risk assessment', 'grc']),
  skill('devsecops', ['devsecops', 'sast', 'dast', 'sonarqube', 'snyk']),
  skill('cryptography', ['cryptography', 'encryption', 'pki', 'tls', 'ssl', 'aes', 'rsa']),
  skill('owasp', ['owasp', 'sql injection', 'xss', 'csrf']),
  skill('iam', ['identity and access management', 'active directory', 'iam', 'ldap']),

  // ── Networking ─────────────────────────────────────────────────────────────
  skill('networking', [
    'computer networks', 'computer networking', 'tcp/ip', 'tcp ip', 'osi model', 'dns', 'dhcp',
    'vlan', 'cisco', 'ccna', 'ccnp', 'lan', 'wan', 'vpn', 'firewall', 'routing and switching',
    'network protocols', 'wireshark',
  ]),

  // ── Embedded / IoT / Hardware ──────────────────────────────────────────────
  skill('embedded', [
    'embedded systems', 'embedded software', 'embedded c', 'firmware', 'microcontroller',
    'arduino', 'raspberry pi', 'stm32', 'esp32', 'rtos', 'freertos', 'uart', 'i2c', 'spi', 'can bus',
  ]),
  skill('iot', ['iot', 'internet of things', 'mqtt', 'zigbee', 'lora']),
  skill('fpga_hdl', ['fpga', 'verilog', 'vhdl', 'systemverilog']),
  skill('robotics', ['robotics', 'ros2', 'robot operating system', 'slam']),
  skill('hardware_design', ['pcb design', 'altium', 'kicad', 'circuit design']),

  // ── Blockchain ─────────────────────────────────────────────────────────────
  skill('blockchain', ['blockchain', 'block chain', 'distributed ledger', 'consensus mechanism', 'hyperledger']),
  skill('smart_contracts', [
    'smart contract', 'solidity', 'web3', 'ethereum', 'hardhat', 'truffle', 'erc-20', 'erc20', 'defi', 'nft',
  ]),

  // ── Mobile ─────────────────────────────────────────────────────────────────
  skill('android', ['android', 'android studio', 'jetpack compose', 'android sdk']),
  skill('ios', ['ios', 'xcode', 'swiftui', 'cocoa touch']),
  // swift: "Swift" aam lafz bhi hai, isliye bare form ke liye iOS ka context
  skill('swift', ['swift programming', 'swift ios'], { weak: ['Swift'], requires: ['ios'] }),
  skill('flutter', ['flutter']),
  skill('react_native', ['react native']),
  skill('mobile_dev', ['mobile development', 'mobile app', 'mobile application']),

  // ── Game dev / Graphics ────────────────────────────────────────────────────
  skill('game_dev', [
    'game development', 'game dev', 'unity3d', 'unity 3d', 'unity engine', 'unreal engine',
    'unreal', 'godot', 'game engine', 'gameplay programming',
  ], { weak: ['Unity'], requires: ['csharp', 'cpp'] }),
  skill('graphics', [
    'opengl', 'vulkan', 'directx', 'shader', 'computer graphics', '3d graphics', 'ray tracing',
  ]),

  // ── CS fundamentals ────────────────────────────────────────────────────────
  skill('data_structures', ['data structure', 'dsa']),
  skill('algorithms', [
    'algorithm', 'time complexity', 'big o', 'leetcode', 'competitive programming', 'dynamic programming',
  ]),
  skill('oop', ['oop', 'object oriented', 'object-oriented', 'design patterns', 'solid principles']),
  skill('operating_systems', [
    'operating system', 'process scheduling', 'multithreading', 'multi-threading', 'concurrency',
  ]),
  skill('database_design', ['database design', 'database management', 'dbms', 'er diagram', 'schema design']),
  skill('computer_architecture', ['computer architecture', 'assembly language', 'x86 assembly', 'instruction set']),
  skill('system_design', ['system design', 'distributed systems', 'scalability', 'load balancing', 'high availability']),
  skill('compilers', ['compiler design', 'compilers', 'compiler construction']),

  // ── Software engineering process ───────────────────────────────────────────
  skill('agile', ['agile', 'scrum', 'kanban']),
  skill('pm_tools', ['jira', 'confluence', 'trello', 'asana']),
  skill('uml', ['uml', 'use case diagram', 'class diagram', 'sequence diagram']),
  skill('sdlc', [
    'sdlc', 'software development life cycle', 'software development lifecycle',
    'requirements gathering', 'requirements analysis',
  ]),
  skill('project_management', ['project management', 'pmp', 'stakeholder management']),
  skill('code_review', ['code review', 'pair programming']),
];