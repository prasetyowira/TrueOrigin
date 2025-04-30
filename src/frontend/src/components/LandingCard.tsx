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
            "bg-card text-card-foreground",
            "rounded-2xl",
            "flex flex-col justify-between overflow-hidden"
        )}>
            <CardHeader className="pt-10 px-10">
                <CardTitle className="text-3xl font-lexend">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <img src={image} alt={title} className="w-full h-auto object-cover" />
        </Card>
    )
}

export default LandingCard