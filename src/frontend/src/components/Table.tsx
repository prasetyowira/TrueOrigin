import React from 'react';
import type { Product } from '../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';


const ProductSentiment: React.FC<{ product: Product; isShowing: boolean; isLoading: boolean; doLoad: () => void; }> = ({ product, isShowing, isLoading, doLoad }) => {
    if (isLoading) {
        return <span>Loading...</span>
    };
    if (isShowing) {
        const productSentiment = product.metadata.find(m => m.key === 'sentiment');
        let productSentimentStr = 'Product sentiment is UNKNOWN'
        if (productSentiment) {
            productSentimentStr = `Product sentiment is ${productSentiment.value}`;
        }   
        return <span>{productSentimentStr}</span>
    }
    return <button type="button" onClick={doLoad}>Do Sentiment Analysis</button>
};

interface TableProps {
    products: (Product & { showSentiment?: boolean; sentimentLoading?: boolean }) [];
    onSentimentAnalysis?: (product: Product) => void;
}

const Table: React.FC<TableProps> = ({ products, onSentimentAnalysis }) => {
    return (
        <div className="rounded-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-[#FFB73B]">
                    <tr>
                        <th className="px-4 py-4 rounded-l-xl">Product Name</th>
                        <th className="px-4 py-4">Description</th>
                        <th className="px-4 py-4">Category</th>
                        <th className="px-4 py-4">Product ID</th>
                        <th className="px-4 py-4 rounded-r-xl">ECDSA Public Key</th>
                        <th className="px-4 py-4 rounded-r-xl">AI Product Sentiment</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => {
                        const { showSentiment = false, sentimentLoading = false } = product;

                        
                        return (
                            <tr key={index} className="text-gray-700">
                                <td className="px-4 py-2">{product.name}</td>
                                <td className="px-4 py-2">{product.description}</td>
                                <td className="px-4 py-2">{product.category}</td>
                                <td className="px-4 py-2">{product.id.toHex()}</td>
                                <td className="px-4 py-2">{product.public_key}</td>
                                <td className="px-4 py-2">
                                    <ProductSentiment 
                                        product={product}
                                        isShowing={showSentiment}
                                        isLoading={sentimentLoading}
                                        doLoad={() => onSentimentAnalysis && onSentimentAnalysis(product)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
