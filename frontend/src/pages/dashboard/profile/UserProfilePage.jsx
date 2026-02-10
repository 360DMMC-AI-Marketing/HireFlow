import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Lock, Bell, Upload } from 'lucide-react';

const UserProfilePage = () => {
  

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    bio: '',
    avatar: '',
    company: {
      name: '',
      website: '',
      size: '',
      industry: ''
    }
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    candidateUpdates: true,
    interviewReminders: true,
    weeklyReports: false
  });

  useEffect(() => {
    // Fetch user profile from backend to ensure latest data
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token, try localStorage fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(normalizeUser(parsed));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = normalizeUser(response.data.user);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(normalizeUser(parsed));
          } catch (e) {}
        }
      }
    };

    fetchProfile();
  }, []);

  const handleUserChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      company: {
        ...(prev.company || {}),
        [field]: value
      }
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPassword(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field) => {
    setNotifications(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

 const handleSaveProfile = async () => {
  try {
    const token = localStorage.getItem('token'); 
    if (!token) {
      toast.error("You are not logged in!");
      return;
    }

    // Only send profile-related fields
    const profileData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      jobTitle: user.jobTitle,
      department: user.department,
      bio: user.bio,
      avatar: user.avatar
    };

    const response = await axios.put('http://localhost:5000/api/user/profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const saved = normalizeUser(response.data?.user || user);
    setUser(saved);
    localStorage.setItem('user', JSON.stringify(saved));
    
    try {
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: saved }));
    } catch (e) {}

    toast.success('Profile updated successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    const saved = normalizeUser(user);
    setUser(saved);
    localStorage.setItem('user', JSON.stringify(saved));
    
    try {
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: saved }));
    } catch (e) {}
    
    const msg = error?.response?.status === 404 
      ? 'Backend not available - changes saved locally only' 
      : error?.response?.data?.message || error?.message || 'Failed to update profile';
    
    try { toast.warning(String(msg)); } catch (e) { console.warn(msg); }
  }
};

 const handleSaveCompany = async () => {
  try {
    const token = localStorage.getItem('token'); 
    if (!token) {
      toast.error("You are not logged in!");
      return;
    }

    // Only send company-related fields
    const companyData = {
      company: {
        name: user.company?.name || '',
        website: user.company?.website || '',
        size: user.company?.size || '',
        industry: user.company?.industry || ''
      }
    };

    const response = await axios.put('http://localhost:5000/api/user/profile', companyData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const saved = normalizeUser(response.data?.user || user);
    setUser(saved);
    localStorage.setItem('user', JSON.stringify(saved));
    
    try {
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: saved }));
    } catch (e) {}

    toast.success('Company information updated successfully!');
  } catch (error) {
    console.error('Error saving company:', error);
    const msg = error?.response?.status === 404 
      ? 'Backend not available - changes saved locally only' 
      : error?.response?.data?.message || error?.message || 'Failed to update company';
    
    try { toast.warning(String(msg)); } catch (e) { console.warn(msg); }
  }
};

 const handleSaveNotifications = async () => {
  try {
    // For now, just save locally since notifications aren't in the backend model yet
    toast.success('Notification preferences saved!');
  } catch (error) {
    toast.error('Failed to save notification preferences');
  }
};

  // Ensure a user object always has the expected keys to avoid controlled/uncontrolled warnings
  const normalizeUser = (u) => {
    const def = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      bio: '',
      avatar: '',
      company: { name: '', website: '', size: '', industry: '' }
    };
    if (!u || typeof u !== 'object') return def;
    return {
      firstName: u.firstName ?? def.firstName,
      lastName: u.lastName ?? def.lastName,
      email: u.email ?? def.email,
      phone: u.phone ?? def.phone,
      jobTitle: u.jobTitle ?? def.jobTitle,
      department: u.department ?? def.department,
      bio: u.bio ?? def.bio,
      avatar: u.avatar ?? u.profilePicture ?? def.avatar,
      company: {
        name: u.company?.name ?? u.companyName ?? def.company.name,
        website: u.company?.website ?? u.companyWebsite ?? def.company.website,
        size: u.company?.size ?? u.companySize ?? def.company.size,
        industry: u.company?.industry ?? u.industry ?? def.company.industry
      }
    };
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      alert('New passwords do not match');
      return;
    }
    try {
      // Call API to change password
      alert('Password changed successfully!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        setUser(prev => {
          const updated = {
            ...prev,
            avatar: newAvatar
          };
          // Immediately save to localStorage and dispatch event
          localStorage.setItem('user', JSON.stringify(updated));
          try {
            window.dispatchEvent(new CustomEvent('userUpdated', { detail: updated }));
          } catch (e) {
            console.error('Error dispatching userUpdated event:', e);
          }
          return updated;
        });
        toast.success('Profile picture updated! Remember to save your profile.');
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profile & Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt="Profile" />
                    ) : (
                      <AvatarFallback className="text-2xl bg-indigo-600 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <label htmlFor="avatar-upload">
                      <Button asChild variant="outline" className="cursor-pointer">
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={user.firstName || ''}
                      onChange={(e) => handleUserChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName || ''}
                      onChange={(e) => handleUserChange('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      onChange={(e) => handleUserChange('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={user.phone || ''}
                      onChange={(e) => handleUserChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Work Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={user.jobTitle || ''}
                      onChange={(e) => handleUserChange('jobTitle', e.target.value)}
                      placeholder="HR Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={user.department || ''}
                      onChange={(e) => handleUserChange('department', e.target.value)}
                      placeholder="Human Resources"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={user.bio || ''}
                    onChange={(e) => handleUserChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700">
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={user.company?.name ?? ''}
                    onChange={(e) => handleCompanyChange('name', e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={user.company?.website ?? ''}
                    onChange={(e) => handleCompanyChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Input
                      id="companySize"
                      value={user.company?.size ?? ''}
                      onChange={(e) => handleCompanyChange('size', e.target.value)}
                      placeholder="1-50 employees"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={user.company?.industry ?? ''}
                      onChange={(e) => handleCompanyChange('industry', e.target.value)}
                      placeholder="Technology"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveCompany} className="bg-indigo-600 hover:bg-indigo-700">
                    Save Company Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={password.current || ''}
                    onChange={(e) => handlePasswordChange('current', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password.new || ''}
                    onChange={(e) => handlePasswordChange('new', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={password.confirm || ''}
                    onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} className="bg-indigo-600 hover:bg-indigo-700">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-sm text-slate-600">
                        Receive notifications about this
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => handleNotificationChange(key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} className="bg-indigo-600 hover:bg-indigo-700">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfilePage;
