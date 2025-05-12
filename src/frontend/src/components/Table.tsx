import React from 'react';
import type { Product } from '../../../declarations/TrustOrigin_backend/TrustOrigin_backend.did';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Internal component to display product sentiment or a button to trigger analysis.
 */
const ProductSentiment: React.FC<{ product: Product; isShowing: boolean; isLoading: boolean; doLoad: () => void; }> = ({ product, isShowing, isLoading, doLoad }) => {
    if (isLoading) {
        return <span className="text-sm text-muted-foreground">Loading...</span>
    };
    if (isShowing) {
        const productSentiment = product.metadata.find(m => m.key === 'sentiment');
        let productSentimentStr = 'UNKNOWN'
        if (productSentiment) {
            productSentimentStr = productSentiment.value;
        }
        let sentimentColor = "text-muted-foreground";
        if (productSentimentStr.toLowerCase().includes('positive')) sentimentColor = "text-green-600";
        if (productSentimentStr.toLowerCase().includes('negative')) sentimentColor = "text-red-600";
        return <span className={cn("text-sm font-medium", sentimentColor)}>{productSentimentStr}</span>
    }
    return <Button type="button" variant="outline" size="sm" onClick={doLoad}>Analyze Sentiment</Button>
};

/**
 * Props for the Table component.
 */
interface TableProps {
    /** An array of Product objects, potentially augmented with UI state for sentiment display. */
    products: (Product & { showSentiment?: boolean; sentimentLoading?: boolean }) [];
    /** Callback function invoked when the 'Do Sentiment Analysis' button is clicked for a product. */
    onSentimentAnalysis?: (product: Product) => void;
    /** Optional className for the table container */
    className?: string;
    /** Optional caption for the table */
    caption?: string;
}

/**
 * Renders a table displaying a list of products using shadcn/ui components.
 *
 * @param products - The array of product data to display.
 * @param onSentimentAnalysis - Callback for triggering sentiment analysis.
 * @param className - Optional additional classes for the container.
 * @param caption - Optional table caption.
 */
const ProductTable: React.FC<TableProps> = ({ products, onSentimentAnalysis, className, caption }) => {
    return (
        <div className={cn("rounded-md border", className)}>
            <Table>
                {caption && <TableCaption>{caption}</TableCaption>}
                <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                        <TableHead>Product Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Product ID</TableHead>
                        <TableHead>ECDSA Public Key</TableHead>
                        <TableHead>AI Product Sentiment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No products found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        products.map((product) => {
                            const { showSentiment = false, sentimentLoading = false } = product;
                            return (
                                <TableRow key={product.id.toHex()}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-xs">{product.id.toHex()}</TableCell>
                                    <TableCell className="text-xs">{product.public_key}</TableCell>
                                    <TableCell>
                                        <ProductSentiment
                                            product={product}
                                            isShowing={showSentiment}
                                            isLoading={sentimentLoading}
                                            doLoad={() => onSentimentAnalysis && onSentimentAnalysis(product)}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export { ProductTable };
