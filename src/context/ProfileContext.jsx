import { useAuth } from './AuthContext';

// AuthProvider owns the sole profile state. This hook never fetches a second copy.
export function useProfile() {
  const auth = useAuth();
  return {
    profile: auth.user, userId: auth.user?.id ?? null,
    fullName: auth.user?.full_name || '', email: auth.user?.email || '', phone: auth.user?.phone || '',
    avatarUrl: auth.user?.avatarDisplayUrl ?? (auth.user?.avatar_url?.startsWith('https://') ? auth.user.avatar_url : ''), avatarError: auth.user?.avatarError || '', role: auth.user?.role || '', farmId: auth.user?.farmId || null,
    loading: auth.loading, saving: auth.profileSaving, error: auth.profileError, avatarWarning: auth.user?.avatarWarning || '',
    updateProfile: auth.updateProfile, refreshProfile: auth.refreshProfile, uploadAvatar: auth.uploadAvatar,
  };
}
