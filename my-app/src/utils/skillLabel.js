const LABELS = {
    javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java', csharp: 'C#', dotnet: '.NET',
    cpp: 'C++', c: 'C', golang: 'Go', rust: 'Rust', kotlin: 'Kotlin', php: 'PHP', ruby: 'Ruby', dart: 'Dart',
    scala: 'Scala', r_language: 'R', matlab: 'MATLAB', bash: 'Bash / Shell', sql: 'SQL',
    html: 'HTML', css: 'CSS', tailwind: 'Tailwind CSS', bootstrap: 'Bootstrap', react: 'React', nextjs: 'Next.js',
    vue: 'Vue.js', angular: 'Angular', svelte: 'Svelte', redux: 'Redux', jquery: 'jQuery', ui_ux: 'UI/UX',
    nodejs: 'Node.js', express: 'Express', mern: 'MERN', mean: 'MEAN', mevn: 'MEVN', lamp: 'LAMP', nestjs: 'NestJS',
    django: 'Django', flask: 'Flask', fastapi: 'FastAPI', springboot: 'Spring Boot', laravel: 'Laravel',
    rest: 'REST APIs', graphql: 'GraphQL', grpc: 'gRPC', websockets: 'WebSockets', microservices: 'Microservices',
    serverless: 'Serverless', messaging: 'Message queues', authentication: 'Authentication',
    mysql: 'MySQL', postgresql: 'PostgreSQL', mongodb: 'MongoDB', redis: 'Redis', elasticsearch: 'Elasticsearch',
    firebase: 'Firebase', dynamodb: 'DynamoDB', cassandra: 'Cassandra', nosql: 'NoSQL',
    aws: 'AWS', azure: 'Azure', gcp: 'Google Cloud', cloud: 'Cloud computing', docker: 'Docker', kubernetes: 'Kubernetes',
    terraform: 'Terraform', ansible: 'Ansible', jenkins: 'Jenkins', cicd: 'CI/CD', linux: 'Linux', nginx: 'Nginx',
    git: 'Git', monitoring: 'Monitoring', devops: 'DevOps', testing: 'Testing', qa: 'QA',
    machine_learning: 'Machine learning', deep_learning: 'Deep learning', tensorflow: 'TensorFlow', pytorch: 'PyTorch',
    nlp: 'NLP', computer_vision: 'Computer vision', llm: 'LLMs', mlops: 'MLOps', data_analysis: 'Data analysis',
    bi_tools: 'BI tools', excel: 'Excel', data_engineering: 'Data engineering',
    cybersecurity: 'Cybersecurity', pentest: 'Penetration testing', siem_soc: 'SIEM / SOC', forensics: 'Digital forensics',
    iso27001: 'ISO 27001', compliance: 'Compliance', devsecops: 'DevSecOps', cryptography: 'Cryptography',
    owasp: 'OWASP', iam: 'IAM', networking: 'Networking',
    embedded: 'Embedded systems', iot: 'IoT', fpga_hdl: 'FPGA / HDL', robotics: 'Robotics', hardware_design: 'Hardware design',
    blockchain: 'Blockchain', smart_contracts: 'Smart contracts',
    android: 'Android', ios: 'iOS', swift: 'Swift', flutter: 'Flutter', react_native: 'React Native', mobile_dev: 'Mobile development',
    game_dev: 'Game development', graphics: 'Graphics',
    data_structures: 'Data structures', algorithms: 'Algorithms', oop: 'OOP', operating_systems: 'Operating systems',
    database_design: 'Database design', computer_architecture: 'Computer architecture', system_design: 'System design',
    compilers: 'Compilers', agile: 'Agile', pm_tools: 'Jira / Trello', uml: 'UML', sdlc: 'SDLC',
    project_management: 'Project management', code_review: 'Code review',
};

export const skillLabel = (name) => {
    if (typeof name !== 'string' || !name) return '';
    if (LABELS[name]) return LABELS[name];
    return name.split('_').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
};

export { LABELS };