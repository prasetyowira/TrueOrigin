type LandingCardProps = {
    title: string;
    description: string;
    image: string;
};

const LandingCard: React.FC<LandingCardProps> = ({ title, description, image }) => {
    return (
        <div className="bg-[#1A1A1A] rounded-[30px] flex flex-col justify-between">
            <div className="flex flex-col gap-2 pt-10 px-10">
                <p className="text-3xl font-lexend">{title}</p>
                <p>{description}</p>
            </div>
            <div>
                <img src={image} />
            </div>
        </div>
    )
}

export default LandingCard