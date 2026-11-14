export const AUTH_COOKIE_NAME = 'mct_session';

const isSecure = req => process.env.NODE_ENV === 'production' || req?.secure === true;

const cookieOptions = req => ({
  httpOnly: true,
  secure: isSecure(req),
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const setAuthCookie = (res, token, req) => res.cookie(AUTH_COOKIE_NAME, token, cookieOptions(req));

export const clearAuthCookie = (res, req) => res.clearCookie(AUTH_COOKIE_NAME, {
  httpOnly: true,
  secure: isSecure(req),
  sameSite: 'lax',
  path: '/',
});

export const setAnalyticsConsentCookie = (res, accepted, req) => {
  res.cookie('mct_analytics_consent', accepted ? 'accepted' : 'rejected', {
    httpOnly: true,
    secure: isSecure(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 180 * 24 * 60 * 60 * 1000,
  });
};

export const setVisitorCookie = (res, visitorId, req) => {
  res.cookie('mct_analytics_visitor', visitorId, {
    httpOnly: true,
    secure: isSecure(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearVisitorCookie = (res, req) => res.clearCookie('mct_analytics_visitor', {
  httpOnly: true,
  secure: isSecure(req),
  sameSite: 'lax',
  path: '/',
});
