/**
 * @file UpdateOrganizationDialog component
 * @fileoverview Dialog for updating organization details
 * 
 * Functions:
 * - UpdateOrganizationDialog: Main dialog component
 * 
 * Flow:
 * 1. Display organization details in a form
 * 2. Allow user to edit name and description
 * 3. Submit changes to update organization
 * 
 * Error Handling:
 * - Form validation
 * - API error handling
 * 
 * @module components/UpdateOrganizationDialog
 * @requires hooks/useMutations/useUpdateOrganization - Mutation hook
 * @requires hooks/useQueries/useGetOrganization - Query hook
 * @exports {FC} UpdateOrganizationDialog - Update organization dialog component
 */

import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/contexts/AuthContext';
import { useUpdateOrganization, FEUpdateOrganizationRequest } from '@/hooks/useMutations/organizationMutations';
import type { OrganizationPublic as DidOrganizationPublic, Metadata as DidMetadata } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Form validation schema
const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

// Form values type
type UpdateOrganizationFormValues = Pick<FEUpdateOrganizationRequest, 'name' | 'description'>;

interface UpdateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for updating organization details
 * 
 * @param open - Whether the dialog is open
 * @param onOpenChange - Function to call when the dialog open state changes
 * @returns Dialog component
 */
const UpdateOrganizationDialog: React.FC<UpdateOrganizationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { brandOwnerDetails, isLoading: authLoading } = useAuth();
  const activeOrganization = brandOwnerDetails?.active_organization;
  const { toast } = useToast();

  const form = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (activeOrganization) {
      form.reset({
        name: activeOrganization.name,
        description: activeOrganization.description,
      });
    }
  }, [activeOrganization, form.reset]);

  const { mutate: updateOrganization, isPending } = useUpdateOrganization();
  
  const onSubmit = (data: UpdateOrganizationFormValues) => {
    if (!activeOrganization) {
      logger.error("[UpdateOrgDialog] No active organization to update.");
      toast({ title: "Error", description: "No active organization selected.", variant: "destructive" });
      return;
    }
    logger.debug("[UpdateOrgDialog] Submitting organization update:", data);

    const requestPayload: FEUpdateOrganizationRequest = {
      id: activeOrganization.id,
      name: data.name,
      description: data.description,
      metadata: activeOrganization.metadata || [],
    };

    updateOrganization(requestPayload, {
      onSuccess: (updatedOrg) => {
        toast({ title: "Success", description: `Organization "${updatedOrg.name}" updated.` });
        onOpenChange(false); 
      },
      onError: (error) => {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      }
    });
  };
  
  const isLoading = authLoading || !activeOrganization;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Organization</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-6 h-40">
            <LoadingSpinner />
          </div>
        ) : activeOrganization ? (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Organization ID</label>
                <div className="text-sm text-gray-900 bg-gray-100 p-2 rounded break-all font-mono">
                  {activeOrganization.id.toText()}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                <Input 
                  id="name"
                  placeholder="Enter organization name" 
                  {...form.register('name')}
                  className="bg-gray-50"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Enter organization description" 
                  {...form.register('description')}
                  className="bg-gray-50 min-h-[80px]"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-6 text-center text-gray-600">
            <p>No active organization selected to update.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateOrganizationDialog; 