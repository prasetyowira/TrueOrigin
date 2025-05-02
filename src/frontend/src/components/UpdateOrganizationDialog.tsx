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

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useGetOrganization, useUpdateOrganization } from '@/hooks';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Form validation schema
const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

// Form values type
type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationSchema>;

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
  // Get organization details
  const { data: organization, isLoading: isLoadingOrg } = useGetOrganization();
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: organization?.name || '',
      description: organization?.description || '',
    },
    // Update form values when organization data is loaded
    values: organization ? {
      name: organization.name,
      description: organization.description,
    } : undefined,
  });
  
  // Get update organization mutation
  const { mutate: updateOrganization, isPending } = useUpdateOrganization();
  
  // Form submission handler
  const onSubmit = (data: UpdateOrganizationFormValues) => {
    updateOrganization(data, {
      onSuccess: () => {
        onOpenChange(false); // Close dialog on success
      },
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Organization</DialogTitle>
        </DialogHeader>
        
        {isLoadingOrg ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {organization && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Organization ID</label>
                  <div className="text-sm text-gray-900 bg-gray-100 p-2 rounded break-all">
                    {organization.id.toString()}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                <Input 
                  id="name"
                  placeholder="Enter organization name" 
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Input 
                  id="description"
                  placeholder="Enter organization description" 
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
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
                disabled={isPending}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateOrganizationDialog; 