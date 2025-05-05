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
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { ProductInput } from '../../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import { useAuthContext } from '@/contexts/useAuthContext';
import { useToast } from '@/hooks/use-toast';

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
  // Use selectedOrgId directly from the context
  const { selectedOrgId, isLoading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the selected organization ID
  const orgId = selectedOrgId;
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
    },
  });
  
  // Create product mutation using React Query
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AddProductFormValues) => {
      if (!orgId) {
        throw new Error("No organization found. Please create an organization first.");
      }
      
      // Create product input object
      const productInput: ProductInput = {
        name: data.name,
        category: data.category,
        description: data.description,
        org_id: orgId,
        metadata: [], // Empty metadata array
      };
      
      // Call backend to create product
      const result = await TrustOrigin_backend.create_product(productInput);
      
      // Handle the result
      if ('error' in result) {
        throw new Error(result.error.message);
      } else if ('none' in result) {
        throw new Error("Product could not be created");
      } else if ('product' in result) {
        return result.product;
      } else {
        throw new Error("Unknown error occurred");
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: "Success",
        description: "Product created successfully",
        variant: "default",
      });
      navigate('/brand-owners/products'); // Redirect to products list
    },
    onError: (error: Error) => {
      // Show error message
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
      console.error("Failed to create product:", error.message);
    },
  });
  
  // Form submission handler
  const onSubmit = (data: AddProductFormValues) => {
    mutate(data);
  };
  
  // If still loading auth, or no org ID, show appropriate message
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!orgId) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>You need to create an organization before adding products.</p>
          {/* Optionally guide user on how to select/create org if needed */}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-medium">Add Your Product</h1>
        </div>
        
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-lg font-medium">Product Name</label>
              <Input 
                id="name"
                placeholder="Enter Product Name" 
                {...form.register('name')}
                className="bg-gray-50 border-gray-300"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="text-lg font-medium">Category</label>
              <Input 
                id="category"
                placeholder="Enter Category" 
                {...form.register('category')}
                className="bg-gray-50 border-gray-300"
              />
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-lg font-medium">Description</label>
              <Textarea 
                id="description"
                placeholder="Enter Description" 
                {...form.register('description')}
                className="bg-gray-50 border-gray-300 min-h-[120px]"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Send'
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