import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from 'react';
import { getProfile, upsertProfile } from '@/lib/supabase/profiles';
import { authCallback, supabase, supabaseConfigured } from '@/utils/supabase';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        async function boot() {
            if (authCallback.tokenHash && authCallback.type) {
                await supabase.auth.verifyOtp({
                    token_hash: authCallback.tokenHash,
                    type: authCallback.type,
                });
            }
            const { data } = await supabase.auth.getSession();
            if (!active)
                return;
            setSession(data.session);
            setLoading(false);
        }
        void boot();
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
            setSession(next);
            setLoading(false);
        });
        return () => {
            active = false;
            subscription.subscription.unsubscribe();
        };
    }, []);
    useEffect(() => {
        const userId = session?.user.id;
        if (!userId) {
            setProfile(null);
            return;
        }
        let active = true;
        void getProfile(userId)
            .then((row) => {
            if (active)
                setProfile(row);
        })
            .catch(() => {
            if (active)
                setProfile(null);
        });
        return () => {
            active = false;
        };
    }, [session?.user.id]);
    const value = useMemo(() => {
        return {
            configured: supabaseConfigured,
            loading,
            session,
            user: session?.user ?? null,
            profile,
            isAnonymous: Boolean(session?.user.is_anonymous),
            async signIn(email, password) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error)
                    throw error;
            },
            async signUp(email, password, displayName) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: displayName.trim() },
                    },
                });
                if (error)
                    throw error;
                return data.session ? 'signed-in' : 'confirm-email';
            },
            async signOut() {
                const { error } = await supabase.auth.signOut();
                if (error)
                    throw error;
            },
            async sendPasswordReset(email) {
                const redirectTo = `${window.location.origin}/reset-password`;
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
                if (error)
                    throw error;
            },
            async updatePassword(password) {
                const { error } = await supabase.auth.updateUser({ password });
                if (error)
                    throw error;
            },
            async updateDisplayName(displayName) {
                const userId = session?.user.id;
                if (!userId)
                    throw new Error('Sign in required.');
                const next = await upsertProfile(userId, displayName);
                setProfile(next);
            },
        };
    }, [loading, profile, session]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const value = useContext(AuthContext);
    if (!value)
        throw new Error('useAuth must be used within AuthProvider');
    return value;
}
