const AUTH_STORAGE_KEY = 'cloud-cost-auth';

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return { token: '', user: null };
    }

    const parsed = JSON.parse(raw);

    return {
      token: parsed?.token || '',
      user: parsed?.user || null,
    };
  } catch {
    return { token: '', user: null };
  }
};

export const storeAuthData = ({ token, user }) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      user,
    }),
  );
};

export const clearAuthData = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthToken = () => getStoredAuth().token;

export const getAuthUser = () => getStoredAuth().user;

export const getHomeRoute = (user) => (user?.role === 'Admin' ? '/admin' : '/cloud-usage');
