import React from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../shared/Input";

export const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const password = watch('password', '');

    const onSubmit = async (data) => {
        if (data.password !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            // simulate API call
            await new Promise((r) => setTimeout(r, 1000));
            // normally you'd POST: { token, password: data.password }
            toast.success('Password reset successfully');
            navigate('/login');
        } catch (err) {
            toast.error('Failed to reset password');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Input
                icon={Lock}
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
            />

            <Input
                icon={Lock}
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', { required: 'Please confirm password' })}
            />

            <div className="space-y-4">
                <button
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#061446] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#061446]/20 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>

                <button type="button" onClick={() => navigate('/login')} className="w-full text-sm text-slate-500 hover:underline">
                    Back to login
                </button>
            </div>
        </form>
    );
};

export default ResetPasswordPage;