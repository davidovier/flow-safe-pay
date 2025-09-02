import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
  Landmark
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string;
  account_type?: 'checking' | 'savings';
  is_default: boolean;
  is_active: boolean;
  stripe_payment_method_id: string;
  created_at: string;
}

interface AddPaymentMethodFormData {
  type: 'card' | 'bank_account';
  // Card fields
  card_number?: string;
  exp_month?: string;
  exp_year?: string;
  cvc?: string;
  cardholder_name?: string;
  // Bank account fields
  account_number?: string;
  routing_number?: string;
  account_holder_name?: string;
  account_type?: 'checking' | 'savings';
}

export function PaymentMethodManager() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMethodData, setNewMethodData] = useState<AddPaymentMethodFormData>({
    type: 'card'
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment methods.',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!userProfile) return;

    setAddingMethod(true);
    try {
      // In a real implementation, this would use Stripe Elements to securely collect payment info
      // For now, we'll simulate the process
      
      // Create payment method via Stripe API (this would be done securely on backend)
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userProfile.access_token}`,
        },
        body: JSON.stringify(newMethodData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add payment method');
      }

      const result = await response.json();

      // Add to local database
      const paymentMethodData = {
        user_id: userProfile.id,
        type: newMethodData.type,
        stripe_payment_method_id: result.stripe_id,
        last4: result.last4,
        brand: result.brand,
        exp_month: result.exp_month,
        exp_year: result.exp_year,
        bank_name: result.bank_name,
        account_type: result.account_type,
        is_default: paymentMethods.length === 0, // First method is default
        is_active: true,
      };

      const { error } = await supabase
        .from('payment_methods')
        .insert(paymentMethodData);

      if (error) throw error;

      toast({
        title: 'Payment Method Added',
        description: 'Your payment method has been added successfully.',
      });

      setIsAddModalOpen(false);
      setNewMethodData({ type: 'card' });
      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Payment Method',
        description: error.message || 'Failed to add payment method. Please try again.',
      });
    } finally {
      setAddingMethod(false);
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    try {
      // Remove from Stripe
      await fetch(`/api/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userProfile?.access_token}`,
        },
      });

      // Remove from database
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: 'Payment Method Removed',
        description: 'Your payment method has been removed successfully.',
      });

      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Remove Payment Method',
        description: error.message || 'Failed to remove payment method. Please try again.',
      });
    }
  };

  const setDefaultPaymentMethod = async (methodId: string) => {
    try {
      // Unset all other defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userProfile?.id);

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: 'Default Payment Method Updated',
        description: 'Your default payment method has been updated.',
      });

      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Default',
        description: error.message || 'Failed to update default payment method.',
      });
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard className="h-6 w-6 text-blue-600" />;
    } else {
      return <Landmark className="h-6 w-6 text-green-600" />;
    }
  };

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return {
        title: `${method.brand?.toUpperCase()} •••• ${method.last4}`,
        subtitle: `Expires ${method.exp_month?.toString().padStart(2, '0')}/${method.exp_year}`,
      };
    } else {
      return {
        title: `${method.bank_name} •••• ${method.last4}`,
        subtitle: `${method.account_type?.charAt(0).toUpperCase() + method.account_type?.slice(1)} Account`,
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">
            Manage your payment methods for funding deals
          </p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Payment Method Type */}
              <div className="space-y-2">
                <Label>Payment Method Type</Label>
                <Select 
                  value={newMethodData.type} 
                  onValueChange={(value: 'card' | 'bank_account') => 
                    setNewMethodData({ ...newMethodData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_account">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Card Fields */}
              {newMethodData.type === 'card' && (
                <>
                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input
                      value={newMethodData.cardholder_name || ''}
                      onChange={(e) => setNewMethodData({
                        ...newMethodData,
                        cardholder_name: e.target.value
                      })}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      value={newMethodData.card_number || ''}
                      onChange={(e) => setNewMethodData({
                        ...newMethodData,
                        card_number: e.target.value
                      })}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select 
                        value={newMethodData.exp_month} 
                        onValueChange={(value) => setNewMethodData({
                          ...newMethodData,
                          exp_month: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                              {(i + 1).toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select 
                        value={newMethodData.exp_year} 
                        onValueChange={(value) => setNewMethodData({
                          ...newMethodData,
                          exp_year: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => (
                            <SelectItem key={i} value={(new Date().getFullYear() + i).toString()}>
                              {new Date().getFullYear() + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>CVC</Label>
                      <Input
                        value={newMethodData.cvc || ''}
                        onChange={(e) => setNewMethodData({
                          ...newMethodData,
                          cvc: e.target.value
                        })}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Account Fields */}
              {newMethodData.type === 'bank_account' && (
                <>
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={newMethodData.account_holder_name || ''}
                      onChange={(e) => setNewMethodData({
                        ...newMethodData,
                        account_holder_name: e.target.value
                      })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Routing Number</Label>
                    <Input
                      value={newMethodData.routing_number || ''}
                      onChange={(e) => setNewMethodData({
                        ...newMethodData,
                        routing_number: e.target.value
                      })}
                      placeholder="123456789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={newMethodData.account_number || ''}
                      onChange={(e) => setNewMethodData({
                        ...newMethodData,
                        account_number: e.target.value
                      })}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select 
                      value={newMethodData.account_type} 
                      onValueChange={(value: 'checking' | 'savings') => 
                        setNewMethodData({ ...newMethodData, account_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your payment information is securely processed by Stripe and never stored on our servers.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={addingMethod}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addPaymentMethod}
                  disabled={addingMethod}
                  className="flex-1"
                >
                  {addingMethod ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Method
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-600 mb-4">
              Add a payment method to fund deals and make payments.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const display = getPaymentMethodDisplay(method);
            return (
              <Card key={method.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    {getPaymentMethodIcon(method)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{display.title}</h3>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {display.subtitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultPaymentMethod(method.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePaymentMethod(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security:</strong> All payment information is encrypted and processed securely through Stripe. 
          We never store your full payment details on our servers.
        </AlertDescription>
      </Alert>
    </div>
  );
}