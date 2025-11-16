'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserRole } from '@/lib/auth/roles'

// Define form schema with Zod
const profileFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
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
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
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
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any; // Type assertion for extended properties
      setUserProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || '',
        phone: user.phone || '',
        bio: user.bio || '',
        createdAt: user.createdAt || new Date().toISOString(),
      });
    }
  }, [session]);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      bio: userProfile?.bio || '',
    },
  });

  // Update form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        phone: userProfile.phone,
        bio: userProfile.bio,
      });
    }
  }, [userProfile, form]);

  const { register, handleSubmit, formState: { errors }, reset } = form;

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      
      // Prepare the update data
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        bio: data.bio,
      };

      // Only include password fields if they're provided
      if (data.currentPassword && data.newPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      // Update profile via API
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        // Update the session
        await update({
          ...session,
          user: {
            ...session?.user,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            bio: data.bio,
          } as any, // Type assertion for extended properties
        });
        
        // Reset the password fields
        reset({
          ...data,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !userProfile) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'destructive';
      case UserRole.ADMIN: return 'default';
      case UserRole.MANAGER: return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            User Profile
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and personal information
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Overview Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={`/api/avatar/${session.user.email}`} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(userProfile.firstName, userProfile.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {userProfile.firstName} {userProfile.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{userProfile.email}</p>
                  <Badge variant={getRoleBadgeColor(userProfile.role)}>
                    {userProfile.role}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600 w-full">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{userProfile.email}</span>
                  </div>
                  {userProfile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information and account settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      {...register('email')} 
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Contact your administrator to change your email address.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+234 xxx xxx xxxx"
                      {...register('phone')} 
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      {...register('bio')}
                      disabled={isLoading}
                    />
                    {errors.bio && (
                      <p className="text-sm text-red-500">{errors.bio.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-600">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
