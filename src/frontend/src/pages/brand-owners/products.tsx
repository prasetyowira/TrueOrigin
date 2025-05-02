/**
 * @file Brand Owner Products Page
 * @fileoverview Allows brand owners to view, create, and manage their products
 * 
 * Functions:
 * - ProductsPage: Main page component
 * - ProductList: Displays list of products
 * - ProductCard: Displays individual product in a card
 * - CreateProductModal: Modal for creating a new product
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Fetch products for the brand owner's organization
 * 2. Display products in a responsive grid
 * 3. Allow creation of new products
 * 4. Enable management of existing products
 * 
 * Error Handling:
 * - Loading state for API calls
 * - Error display for failed API requests
 * - Validation for product creation/editing
 * 
 * @module pages/brand-owners/products
 * @requires TrustOrigin_backend - Backend canister
 * @exports {FC} ProductsPage - Products page component
 */

import { useEffect, useState } from 'react';
import { TrustOrigin_backend } from '../../../../declarations/TrustOrigin_backend';
import { Principal } from '@dfinity/principal';
import useAuth from '../../hooks/useAuth';

// Types
interface Product {
  id: Principal;
  name: string;
  description: string;
  org_id: Principal;
  category: string;
  create_time: bigint;
  update_time: bigint;
  active: boolean;
  metadata: Array<{ key: string; value: string }>;
}

interface CreateProductFormData {
  name: string;
  description: string;
  category: string;
  metadata: Array<{ key: string; value: string }>;
}

// Helper function to convert metadata array to a more usable object
const metadataToObject = (metadata: Array<{ key: string; value: string }>) => {
  return metadata.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Product Card Component
 * 
 * Displays an individual product in a card layout
 * 
 * @param {Object} product - Product data to display
 * @param {Function} onEdit - Callback when edit is clicked
 * @param {Function} onGenerateQR - Callback to generate QR codes
 * @returns {JSX.Element} Product card component
 */
const ProductCard = ({ 
  product, 
  onEdit, 
  onGenerateQR 
}: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onGenerateQR: (product: Product) => void;
}) => {
  const metadata = metadataToObject(product.metadata);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{product.name}</h3>
        
        <div className="text-sm text-gray-500 mb-4">
          <p className="mb-1">Category: {product.category}</p>
          <p className="mb-1">ID: {product.id.toString().substring(0, 10)}...</p>
          <p className="mb-3">Created: {new Date(Number(product.create_time) / 1000000).toLocaleDateString()}</p>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-3">{product.description}</p>
        
        {metadata.imageUrl && (
          <div className="relative h-40 mb-4 bg-gray-100 rounded overflow-hidden">
            <img 
              src={metadata.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
              }}
            />
          </div>
        )}
        
        <div className="flex justify-between mt-3">
          <button 
            onClick={() => onEdit(product)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded text-sm"
          >
            Edit
          </button>
          <button 
            onClick={() => onGenerateQR(product)}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded text-sm"
          >
            Generate QR
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Create Product Modal
 * 
 * Modal component for creating a new product
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onSubmit - Function to handle form submission
 * @returns {JSX.Element} Modal component
 */
const CreateProductModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: CreateProductFormData) => void;
}) => {
  const [formData, setFormData] = useState<CreateProductFormData>({
    name: '',
    description: '',
    category: '',
    metadata: []
  });
  
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const addMetadata = () => {
    if (metadataKey && metadataValue) {
      setFormData(prev => ({
        ...prev,
        metadata: [...prev.metadata, { key: metadataKey, value: metadataValue }]
      }));
      setMetadataKey('');
      setMetadataValue('');
    }
  };
  
  const removeMetadata = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Product</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">
              Product Name
            </label>
            <input
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="category">
              Category
            </label>
            <input
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="category"
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Metadata
            </label>
            
            <div className="flex mb-2">
              <input
                className="appearance-none border rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                placeholder="Key"
                value={metadataKey}
                onChange={(e) => setMetadataKey(e.target.value)}
              />
              <input
                className="appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                placeholder="Value"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
              />
              <button
                type="button"
                className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded"
                onClick={addMetadata}
              >
                Add
              </button>
            </div>
            
            {formData.metadata.length > 0 && (
              <div className="mt-2 border p-2 rounded">
                <h4 className="font-semibold mb-2">Current Metadata:</h4>
                <ul>
                  {formData.metadata.map((item, index) => (
                    <li key={index} className="flex justify-between items-center mb-1 pb-1 border-b">
                      <span>
                        <strong>{item.key}:</strong> {item.value}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => removeMetadata(index)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Generate QR Code Modal
 * 
 * Modal component for generating QR codes for a product
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function to close the modal
 * @param {Product} product - Product to generate QR codes for
 * @returns {JSX.Element} Modal component
 */
const GenerateQRModal = ({ 
  isOpen, 
  onClose, 
  product 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: Product | null;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  
  const generateSerialNumbers = async () => {
    if (!product) return;
    
    try {
      setIsLoading(true);
      // TODO: Implement actual serial number generation API call
      // const result = await TrustOrigin_backend.generate_serial_numbers(product.id, BigInt(quantity));
      
      // For now, simulating the response
      setTimeout(() => {
        const mockSerialNumbers = Array(quantity).fill(0).map((_, index) => 
          `SN${product.id.toString().substring(0, 4)}-${(index + 1).toString().padStart(6, '0')}`
        );
        setSerialNumbers(mockSerialNumbers);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating serial numbers:', error);
      setIsLoading(false);
    }
  };
  
  if (!isOpen || !product) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Generate QR Codes for {product.name}</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="quantity">
            Quantity to Generate
          </label>
          <input
            className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
            onClick={generateSerialNumbers}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Serial Numbers'}
          </button>
        </div>
        
        {serialNumbers.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">Generated Serial Numbers</h3>
            <div className="border rounded p-3 max-h-40 overflow-y-auto">
              <ul>
                {serialNumbers.map((sn, index) => (
                  <li key={index} className="mb-1 pb-1 border-b last:border-b-0">
                    {sn}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  // TODO: Implement download functionality
                  alert('Download functionality will be implemented in a future update');
                }}
              >
                Download QR Codes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock API implementation
const mockProductAPI = {
  list_products_by_organization: async (_: Principal) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock products
    return {
      products: [
        {
          id: Principal.fromText('aaaaa-aa'),
          name: 'Premium Coffee Beans',
          description: 'Ethically sourced premium coffee beans from Colombia. Perfect for a morning brew.',
          org_id: Principal.fromText('aaaaa-aa'),
          category: 'Food & Beverage',
          create_time: BigInt(Date.now() * 1000),
          update_time: BigInt(Date.now() * 1000),
          active: true,
          metadata: [
            { key: 'origin', value: 'Colombia' },
            { key: 'weight', value: '500g' },
            { key: 'imageUrl', value: 'https://images.unsplash.com/photo-1599639351204-52a974584ed8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80' }
          ]
        },
        {
          id: Principal.fromText('bbbbb-bb'),
          name: 'Organic Honey',
          description: 'Pure raw organic honey harvested from our sustainable apiaries.',
          org_id: Principal.fromText('aaaaa-aa'),
          category: 'Food & Beverage',
          create_time: BigInt(Date.now() * 1000),
          update_time: BigInt(Date.now() * 1000),
          active: true,
          metadata: [
            { key: 'origin', value: 'Local Farm' },
            { key: 'weight', value: '250g' },
            { key: 'imageUrl', value: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=686&q=80' }
          ]
        }
      ]
    };
  },
  
  create_product: async (productData: any) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock created product
    return {
      product: {
        id: Principal.fromText('ccccc-cc'),
        name: productData.name,
        description: productData.description,
        org_id: productData.org_id,
        category: productData.category,
        create_time: BigInt(Date.now() * 1000),
        update_time: BigInt(Date.now() * 1000),
        active: true,
        metadata: productData.metadata
      }
    };
  }
};

// Extend the backend with our mock methods for development
const extendedBackend = {
  ...TrustOrigin_backend,
  list_products_by_organization: mockProductAPI.list_products_by_organization,
  create_product: mockProductAPI.create_product
};

/**
 * Products Page for Brand Owners
 * 
 * Main page component for managing products
 * 
 * @returns {JSX.Element} Products page component
 */
const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!user) {
          setError('No user profile found');
          setLoading(false);
          return;
        }
        
        // Get organization ID from user context, safely handling potential type issues
        const orgId = user && (user as any).organization ? (user as any).organization.id : null;
        
        if (!orgId) {
          setError('No organization associated with your account');
          setLoading(false);
          return;
        }
        
        // Fetch products for the organization
        const response = await extendedBackend.list_products_by_organization(
          Principal.fromText(orgId)
        );
        
        if ('products' in response) {
          setProducts(response.products);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Error fetching products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [user]);
  
  const handleCreateProduct = async (formData: CreateProductFormData) => {
    try {
      if (!user) {
        setError('No user profile found');
        return;
      }
      
      const orgId = user && (user as any).organization ? (user as any).organization.id : null;
      
      if (!orgId) {
        setError('No organization associated with your account');
        return;
      }
      
      // Create product in backend
      const response = await extendedBackend.create_product({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        org_id: Principal.fromText(orgId),
        metadata: formData.metadata
      });
      
      if ('product' in response) {
        // Add the new product to the state
        setProducts(prevProducts => [...prevProducts, response.product]);
        setIsCreateModalOpen(false);
      } else {
        setError('Failed to create product');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Error creating product. Please try again.');
    }
  };
  
  const handleEditProduct = (product: Product) => {
    // TODO: Implement edit functionality
    alert(`Edit functionality for ${product.name} will be implemented in a future update`);
  };
  
  const handleGenerateQR = (product: Product) => {
    setSelectedProduct(product);
    setIsQRModalOpen(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Product
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No products found. Create your first product to get started!</p>
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id.toString()}
              product={product}
              onEdit={handleEditProduct}
              onGenerateQR={handleGenerateQR}
            />
          ))}
        </div>
      )}
      
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
      />
      
      <GenerateQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductsPage;
