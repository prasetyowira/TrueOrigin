/**
 * @file Placeholder Page Component
 * @fileoverview Generic placeholder component for pages that are not yet implemented
 * 
 * Functions:
 * - PlaceholderPage: Renders a placeholder UI for unimplemented pages
 * 
 * Constants:
 * - None
 * 
 * Flow:
 * 1. Render a simple card with the provided title
 * 2. Show a message indicating the page is in development
 * 
 * Error Handling:
 * - None
 * 
 * @module pages/placeholder
 * @requires components/ui/card - For card UI component
 * @exports {FC} PlaceholderPage - Placeholder page component
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

/**
 * Props for the PlaceholderPage component
 */
type PlaceholderPageProps = {
  /** The title to display in the placeholder */
  title: string;
  /** Optional description to display */
  description?: string;
};

/**
 * A generic placeholder component for pages that are not yet implemented
 * 
 * @param title - The title to display in the placeholder
 * @param description - Optional description to display
 * @returns Placeholder UI element
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title,
  description = "This feature is currently in development and will be available soon."
}) => {
  return (
    <div className="container py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-full flex justify-center mb-4">
            <Construction size={48} className="text-amber-500" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600">
            Our team is working hard to bring you this feature. 
            Please check back later for updates.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage; 