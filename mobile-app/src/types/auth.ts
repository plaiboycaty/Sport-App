export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  friend_code: string;
  skill_level?: SkillLevel | null;
  created_at: string;
  updated_at: string;
}

export type UpdateProfileInput = Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'skill_level'>>;

export interface SignInCredentials {
  email: string;
  password?: string;
}

export interface SignUpCredentials {
  email: string;
  password?: string;
  fullName: string;
}
