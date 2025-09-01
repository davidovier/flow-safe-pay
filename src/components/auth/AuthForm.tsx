import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  sanitizeText, 
  RateLimiter
} from '@/utils/security/inputValidation';
import { initCSRFProtection, generateCSRFToken, getCSRFToken } from '@/utils/security/csrf';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useAuditLog } from '@/hooks/useAuditLog';

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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  // Advanced rate limiting with hook
  const { state: rateLimitState, checkLimit, recordAttempt } = useRateLimit('auth', email || 'anonymous');
  
  // Audit logging
  const { logAuth, logSecurity } = useAuditLog();

  useEffect(() => {
    // Initialize CSRF protection
    initCSRFProtection();
  }, []);

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

  // Enhanced validation with comprehensive security checks
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation with enhanced security checks
    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      errors.email = emailValidation.error!;
    }

    // Password validation with comprehensive strength requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.error!;
    }

    if (mode === 'signup') {
      // First name validation with XSS protection
      const firstNameValidation = validateName(firstName.trim());
      if (!firstNameValidation.valid) {
        errors.firstName = firstNameValidation.error!;
      }

      // Last name validation with XSS protection  
      const lastNameValidation = validateName(lastName.trim());
      if (!lastNameValidation.valid) {
        errors.lastName = lastNameValidation.error!;
      }

      // Additional security: Check for suspicious patterns
      const suspiciousPatterns = [
        /<script.*?>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:text\/html/gi
      ];

      const fieldsToCheck = [firstName, lastName, email];
      for (const field of fieldsToCheck) {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(field)) {
            errors.security = 'Invalid characters detected. Please use only standard text.';
            break;
          }
        }
        if (errors.security) break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CSRF Protection - Verify token exists
    const csrfToken = getCSRFToken();
    if (!csrfToken) {
      logSecurity('SECURITY_CSRF_VIOLATION', {
        action: 'form_submit',
        form_type: mode,
        user_email: email
      });
      setValidationErrors({ security: 'Security token missing. Please refresh the page.' });
      return;
    }
    
    // Advanced rate limiting check
    if (!checkLimit()) {
      logSecurity('SECURITY_RATE_LIMIT_EXCEEDED', {
        action: 'auth_attempt',
        form_type: mode,
        user_email: email,
        reason: rateLimitState.reason,
        remaining_attempts: rateLimitState.remaining
      });
      setValidationErrors({ 
        general: rateLimitState.reason || 'Too many attempts. Please try again later.',
        retryAfter: rateLimitState.retryAfter?.toString() 
      });
      return;
    }

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      // Sanitize inputs before processing
      const sanitizedEmail = sanitizeText(email.toLowerCase().trim());
      const sanitizedFirstName = sanitizeText(firstName.trim());
      const sanitizedLastName = sanitizeText(lastName.trim());

      // Validate sanitized inputs don't contain malicious content
      const inputs = [sanitizedEmail, sanitizedFirstName, sanitizedLastName];
      for (const input of inputs) {
        if (input !== input.replace(/<[^>]*>/g, '')) {
          logSecurity('SECURITY_XSS_ATTEMPT', {
            action: 'form_submit',
            form_type: mode,
            detected_input: input.substring(0, 100), // Log first 100 chars for analysis
            user_email: email
          });
          setValidationErrors({ security: 'Invalid input detected. Please use standard characters only.' });
          return;
        }
      }

      if (mode === 'signin') {
        const result = await signIn(sanitizedEmail, password);
        if (result.error) {
          logAuth('AUTH_LOGIN_FAILURE', {
            error_message: result.error.message,
            user_email: sanitizedEmail,
            attempt_timestamp: new Date().toISOString()
          });
          setValidationErrors({ general: 'Invalid email or password' });
          recordAttempt(); // Record failed attempt
        } else {
          logAuth('AUTH_LOGIN_SUCCESS', {
            user_email: sanitizedEmail,
            login_timestamp: new Date().toISOString(),
            method: 'email_password'
          });
          recordAttempt(); // Record successful attempt
        }
      } else {
        const result = await signUp(sanitizedEmail, password, {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          role,
        });
        if (result.error) {
          logAuth('AUTH_SIGNUP', {
            error_message: result.error.message,
            user_email: sanitizedEmail,
            user_role: role,
            outcome: 'FAILURE',
            attempt_timestamp: new Date().toISOString()
          });
          setValidationErrors({ general: result.error.message });
          recordAttempt(); // Record failed attempt
        } else {
          logAuth('AUTH_SIGNUP', {
            user_email: sanitizedEmail,
            user_role: role,
            outcome: 'SUCCESS',
            signup_timestamp: new Date().toISOString(),
            method: 'email_password'
          });
          recordAttempt(); // Record successful attempt
        }
      }
    } catch (error: any) {
      // Log security-related errors for monitoring
      console.error('Auth form error:', {
        error: error.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      setValidationErrors({ general: 'An unexpected error occurred. Please try again.' });
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
          {/* Security Status Indicator */}
          <div className="flex items-center justify-center space-x-2 text-xs text-green-600 bg-green-50 rounded-lg p-2">
            <Shield className="h-3 w-3" />
            <span>🔒 Secured by bank-grade encryption</span>
          </div>

          {/* Rate Limit Warning */}
          {rateLimitState.isLimited && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {rateLimitState.reason || 'Too many attempts. Please wait before trying again.'}
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Remaining attempts: {rateLimitState.remaining}
                {rateLimitState.retryAfter && (
                  <span className="block">
                    Try again in {rateLimitState.retryAfter} seconds
                  </span>
                )}
              </p>
            </div>
          )}

          {/* General Error Display */}
          {validationErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-sm text-red-700">{validationErrors.general}</p>
            </div>
          )}

          {/* Security Error Display */}
          {validationErrors.security && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{validationErrors.security}</span>
              </div>
            </div>
          )}
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${validationErrors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter your first name"
                    required
                  />
                  {validationErrors.firstName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {validationErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${validationErrors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter your last name"
                    required
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {validationErrors.lastName}
                    </p>
                  )}
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
              className={`h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your email address"
              required
            />
            {validationErrors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {validationErrors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${(mode === 'signup' && password && !isPasswordValid) || validationErrors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                placeholder={mode === 'signin' ? "Enter your password" : "Create a strong password"}
                required
                minLength={mode === 'signin' ? 6 : 8}
              />
              {validationErrors.password && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationErrors.password}
                </p>
              )}
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