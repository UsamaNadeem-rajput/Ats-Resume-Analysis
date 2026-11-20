const COOKIE_NAME = 'jwt';

const cookieOptions = {
  httpOnly: true,  
  sameSite: 'lax',  // CSRF attacks se bachao — same site requests allow, cross-site nahi
  secure: process.env.NODE_ENV === 'production', 
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

const sendTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions);
};


const clearTokenCookie = (res) => {
  res.cookie(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
};

module.exports = { sendTokenCookie, clearTokenCookie, COOKIE_NAME };