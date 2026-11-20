


// ---

// ### 2. Frontend (React) Side Ka Flow Aur Zaroori Cheezein

// Frontend se PDF bhejte waqt React ke andar 4 ahem kaam hote hain:

// #### A. File Input Tag (`<input type="file" />`)

// * Form ke andar file input lagate waqt attribute set karein: `accept=".pdf,application/pdf"` taake file selector dialog mein user ko sirf PDF files hi nazar aayein.


// * React ke `onChange` event listener se file object extract hota hai: `e.target.files[0]`. Yeh browser ka native `File` object hota hai jisme file ka naam, size, aur type mojud hoti hai.

// #### B. `FormData` Web API Ka Istemal

// * React state se simple object `{ resume: file, jobDescription: "..." }` seedha API ko nahi bheja ja sakta.


// * Browser ka built-in `new FormData()` object initialize karna parta hai.


// * `.append(key, value)` method ke zariye fields jori jati hain:


// * `formData.append('resume', selectedFile)` (Ahem: Yeh key name wahi hona chahiye jo backend Multer par expect karega).


// * `formData.append('jobDescription', jdText)`


// * `formData.append('jobTitle', titleText)`





// #### C. Request Headers (Axios ya Fetch)

// * **Sabse Badi Ghalti Jo Hoti Hai**: Log manually header set kar dete hain: `'Content-Type': 'multipart/form-data'`. Yeh **nahi** karna chahiye!
// * Jab aap `FormData` pass karte hain, to Axios ya Fetch ko `Content-Type` header khud set karne dena chahiye. Kyun? Kyunke browser ko har part ke darmiyan ek unique cryptographic boundary string (e.g. `boundary=----WebKitFormBoundaryXYZ`) attach karni hoti hai. Agar aap manual header denge to boundary string gayab ho jayegi aur backend parse nahi kar payega.
// * **Credentials/Auth Header**: Kyunke route protected hai, isliye request ke sath aapko authentication bhejna hoga:


// * Agar Bearer token use kar rahe hain to `Authorization: Bearer <token>` header bhejein.


// * Agar `httpOnly` cookie use kar rahe hain to Axios mein `withCredentials: true` pass karein taake cookie browser se server par chali jaye.

