import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('CREATOR');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  // Password strength validation
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordStrength = Object.values(passwordRequirements).filter(Boolean).length;
  const isPasswordValid = passwordStrength >= 4;

  // Email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSubmit = mode === 'signin' 
    ? email && password && isEmailValid
    : email && password && firstName && lastName && isEmailValid && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          role,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {mode === 'signin' ? 'Welcome Back!' : 'Join FlowPay Today'}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {mode === 'signin' 
            ? 'Sign in to access your secure creator workspace'
            : 'Start earning with instant, secure payments'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">I am a...</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREATOR">🎨 Creator - I create content and earn</SelectItem>
                    <SelectItem value="BRAND">🏢 Brand - I hire creators for campaigns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              placeholder="Enter your email address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${mode === 'signup' && password && !isPasswordValid ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                placeholder={mode === 'signin' ? "Enter your password" : "Create a strong password"}
                required
                minLength={mode === 'signin' ? 6 : 8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            
            {/* Password strength indicator for signup */}
            {mode === 'signup' && password && (
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 rounded ${
                        level <= passwordStrength
                          ? passwordStrength <= 2 
                            ? 'bg-destructive' 
                            : passwordStrength <= 4 
                            ? 'bg-warning' 
                            : 'bg-success'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordRequirements.length ? 'text-success' : 'text-muted-foreground'}`}>
                    {passwordRequirements.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {t('passwordReq8Chars')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-success' : 'text-muted-foreground'}`}>
                    {passwordRequirements.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {t('passwordReqUppercase')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.number ? 'text-success' : 'text-muted-foreground'}`}>
                    {passwordRequirements.number ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {t('passwordReqNumber')}
                  </div>
                  <div className={`flex items-center gap-2 ${passwordRequirements.special ? 'text-success' : 'text-muted-foreground'}`}>
                    {passwordRequirements.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {t('passwordReqSpecial')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-6">
          <Button 
            type="submit" 
            className={`w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 ${
              mode === 'signin' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02]' 
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-[1.02]'
            }`}
            disabled={loading || !canSubmit}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' 
              ? '🚀 Sign In & Start Earning' 
              : '✨ Create Account & Get Started'
            }
          </Button>
          
          {mode === 'signup' && !canSubmit && (firstName || lastName || email || password) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-700 font-medium">
                📝 Complete all fields to create your account
              </p>
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onToggleMode}
            className="w-full h-12 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            {mode === 'signin' 
              ? "New to FlowPay? Create your account →"
              : "Already have an account? Sign in →"
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}