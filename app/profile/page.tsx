'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Define form schema with Zod
const profileFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Current password is required to change password',
    path: ['currentPassword'],
  }
).refine(
  (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = form;

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      
      // Prepare the update data
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
      };

      // Only include password fields if they're provided
      if (data.currentPassword && data.newPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      // Call the update user function
      await updateUser(updateData);
      
      // Reset the form with new values
      reset({
        ...data,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and update your personal information.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    {...register('firstName')} 
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    {...register('lastName')} 
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  {...register('email')} 
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to change your email address.
                </p>
              </div>

              <div className="border-t pt-6 space-y-6">
                <h3 className="text-lg font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Leave these fields empty if you don't want to change your password.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      {...register('currentPassword')} 
                      disabled={isLoading}
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        {...register('newPassword')} 
                        disabled={isLoading}
                      />
                      {errors.newPassword && (
                        <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        {...register('confirmPassword')} 
                        disabled={isLoading}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
