import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils";

/**
 * Props for the LandingCard component.
 */
type LandingCardProps = {
    /** The main title displayed on the card. */
    title: string;
    /** The descriptive text content of the card. */
    description: string;
    /** URL for the image displayed at the bottom of the card. */
    image: string;
};

/**
 * Renders a card component specifically designed for the landing page,
 * displaying a title, description, and an image.
 *
 * @param title - The card title.
 * @param description - The card description.
 * @param image - URL for the card image.
 */
const LandingCard: React.FC<LandingCardProps> = ({ title, description, image }) => {
    return (
        <Card className={cn(
            "bg-white text-card-foreground",
            "rounded-2xl shadow-lg",
            "flex flex-col justify-between h-full overflow-hidden",
            "transition-transform duration-300 hover:shadow-xl hover:-translate-y-1"
        )}>
            <CardHeader className="pt-8 px-8">
                <CardTitle className="text-2xl md:text-3xl font-lexend font-bold mb-3">{title}</CardTitle>
                <CardDescription className="text-base text-gray-600">{description}</CardDescription>
            </CardHeader>
            <div className="mt-auto">
                <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-auto object-cover" 
                />
            </div>
        </Card>
    )
}

export default LandingCard