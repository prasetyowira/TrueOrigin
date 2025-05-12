/**
 * @file Brand Owner Add Product Page
 * @fileoverview Allows brand owners to add new products to their organization
 * 
 * Functions:
 * - AddProductPage: Main page component
 * - AddProductForm: Form for adding a new product
 * 
 * Flow:
 * 1. Display a form with fields for product name, category, and description
 * 2. Validate the input
 * 3. Submit the data to create a new product
 * 4. Show success/error message
 * 
 * Error Handling:
 * - Input validation
 * - API error handling
 * - Loading state for submission
 * 
 * @module pages/brand-owners/add-product
 * @requires TrustOrigin_backend - Backend canister
 * @exports {FC} AddProductPage - Add Product page component
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import types directly from declarations
import type { ProductInput, Product, ProductResult, ApiError } from '@declarations/TrustOrigin_backend/TrustOrigin_backend.did';
// Correct import for Principal
import { Principal } from '@dfinity/principal'; 
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger'; 

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Form validation schema
const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name must be less than 100 characters"),
  category: z.string().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

// Form values type
type AddProductFormValues = z.infer<typeof addProductSchema>;

const AddProductPage: React.FC = () => {
  const { actor, brandOwnerDetails, isLoading: authLoading, isAuthenticated, user } = useAuth();
  const orgId = brandOwnerDetails?.active_organization?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
    },
  });
  
  const { mutate, isPending } = useMutation<
    Product,
    Error,
    AddProductFormValues
  >({
    mutationFn: async (data: AddProductFormValues) => {
      logger.debug('[AddProductPage] Attempting to create product with form data:', data);

      // Log the Principal ID of the authenticated user from the context
      const userPrincipalText = user?.id?.toText() ?? 'USER_OR_USER.ID_UNDEFINED';
      logger.debug('[AddProductPage] Principal ID expected for actor call (from user context):', userPrincipalText);

      // Actor validation
      if (!actor) {
        logger.error('[AddProductPage] Actor not available.');
        throw new Error("Authentication actor is not available. Please log in again.");
      }
      // Org ID validation
      if (!orgId) {
        logger.error('[AddProductPage] Organization ID not selected/available.');
        throw new Error("No active organization found. Please select an organization in your dashboard.");
      }
      // Authentication validation
      if (!isAuthenticated || !user) {
        logger.error('[AddProductPage] User not authenticated or user data missing.');
        navigate('/auth/login');
        throw new Error("User not authenticated. Redirecting to login.");
      }

      // Prepare input for backend
      const productInput: ProductInput = {
        name: data.name,
        category: data.category,
        description: data.description,
        org_id: orgId,
        metadata: [],
      };

      logger.debug('[AddProductPage] Submitting productInput to backend:', productInput);
      
      // Make the backend call using the actor from context
      const result: ProductResult = await actor.create_product(productInput);
      logger.debug('[AddProductPage] create_product response from backend:', result);

      // Handle the backend response (error or success)
      if (result && typeof result === 'object') {
        if ('error' in result && result.error) {
          const apiError = result.error;
          let errorDetailsMessage = 'Failed to create product.';
          if (typeof apiError === 'object' && apiError !== null) {
            if ('InvalidInput' in apiError && apiError.InvalidInput) {
              errorDetailsMessage = apiError.InvalidInput.details.message;
            } else if ('Unauthorized' in apiError && apiError.Unauthorized) {
              errorDetailsMessage = apiError.Unauthorized.details.message;
            } else if ('InternalError' in apiError && apiError.InternalError) {
              errorDetailsMessage = apiError.InternalError.details.message;
            } // Add more specific error checks if needed
          }
          logger.error('[AddProductPage] Backend error when creating product:', errorDetailsMessage, apiError);
          throw new Error(errorDetailsMessage);
        } else if ('none' in result && result.none === null) {
          logger.error(`[AddProductPage] Backend returned 'none' for create_product.`);
          throw new Error("Product could not be created (backend returned 'none'). Please try again.");
        } else if ('product' in result && result.product) {
          return result.product; // Success case: return the created product
        }
      }
      // Fallback if the response structure is unexpected
      logger.error('[AddProductPage] Unknown or unexpected response structure from create_product:', result);
      throw new Error("An unknown error occurred while creating the product. Please check logs.");
    },
    onSuccess: (createdProduct) => {
      logger.info('[AddProductPage] Product created successfully:', createdProduct);
      toast({
        title: "Success",
        description: `Product "${createdProduct.name}" created successfully.`,
        variant: "default", 
      });
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ['products', orgId.toText()] });
      }
      navigate('/brand-owners/products'); 
    },
    onError: (error: Error) => {
      logger.error('[AddProductPage] Mutation error creating product:', error.message);
      toast({
        title: "Error Creating Product",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AddProductFormValues) => {
    mutate(data);
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  // This should be caught by ProtectedRoute, but as a fallback / explicit check:
  if (!isAuthenticated) {
    navigate('/auth/login');
    return <LoadingSpinner />; // Show loader while redirecting
  }

  if (!orgId) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow">
          <p className="font-medium">No Active Organization</p>
          <p>Please select or create an organization before adding products.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
          <h1 className="text-2xl font-medium">Add Your Product</h1>
        </div>
        
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Product Name</label>
              <Input 
                id="name"
                placeholder="Enter Product Name" 
                {...form.register('name')}
                className="bg-gray-50 border-gray-300 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium text-gray-700">Category</label>
              <Input 
                id="category"
                placeholder="Enter Category" 
                {...form.register('category')}
                className="bg-gray-50 border-gray-300 focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.category && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
              <Textarea 
                id="description"
                placeholder="Enter Description" 
                {...form.register('description')}
                className="bg-gray-50 border-gray-300 min-h-[100px] focus:ring-primary focus:border-primary"
              />
              {form.formState.errors.description && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
                disabled={isPending || !orgId || !isAuthenticated} // Ensure orgId and isAuthenticated for button state
              >
                {isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4 border-white" />
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage; 