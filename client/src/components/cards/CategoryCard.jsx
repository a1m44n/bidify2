import PropTypes from "prop-types";
import { Title } from "../common/Design";

// Import icons for each category
import { 
    FaCouch, FaGamepad, FaRunning, FaHeadphones, 
    FaCar, FaCogs, FaSprayCan, FaLaptop, FaMobileAlt,
    FaGem, FaTshirt, FaHome, FaBook, FaPaw, FaGuitar,
    FaUtensils, FaBriefcase, FaBoxOpen 
} from 'react-icons/fa';

const getCategoryIcon = (title) => {
    const normalizedTitle = title.toLowerCase();
    
    // Furniture & Home
    if (normalizedTitle.includes('furniture') || normalizedTitle.includes('home')) return FaCouch;
    
    // Games & Toys
    if (normalizedTitle.includes('hobbies') || normalizedTitle.includes('toys') || 
        normalizedTitle.includes('game')) return FaGamepad;
    
    // Sports & Fitness
    if (normalizedTitle.includes('sports') || normalizedTitle.includes('fitness') || 
        normalizedTitle.includes('exercise')) return FaRunning;
    
    // Audio & Music
    if (normalizedTitle.includes('audio') || normalizedTitle.includes('music') || 
        normalizedTitle.includes('sound')) return FaHeadphones;
    
    // Automotive
    if (normalizedTitle.includes('auto') || normalizedTitle.includes('car')) return FaCar;
    if (normalizedTitle.includes('parts') || normalizedTitle.includes('accessories')) return FaCogs;
    
    // Beauty & Care
    if (normalizedTitle.includes('beauty') || normalizedTitle.includes('care') || 
        normalizedTitle.includes('cosmetic')) return FaSprayCan;
    
    // Tech & Gadgets
    if (normalizedTitle.includes('computer') || normalizedTitle.includes('laptop') || 
        normalizedTitle.includes('tech')) return FaLaptop;
    if (normalizedTitle.includes('mobile') || normalizedTitle.includes('phone') || 
        normalizedTitle.includes('gadget')) return FaMobileAlt;
    
    // Additional Categories
    if (normalizedTitle.includes('jewelry') || normalizedTitle.includes('watches')) return FaGem;
    if (normalizedTitle.includes('clothing') || normalizedTitle.includes('fashion')) return FaTshirt;
    if (normalizedTitle.includes('estate') || normalizedTitle.includes('property')) return FaHome;
    if (normalizedTitle.includes('book') || normalizedTitle.includes('education')) return FaBook;
    if (normalizedTitle.includes('pet') || normalizedTitle.includes('animal')) return FaPaw;
    if (normalizedTitle.includes('instrument')) return FaGuitar;
    if (normalizedTitle.includes('food') || normalizedTitle.includes('kitchen')) return FaUtensils;
    if (normalizedTitle.includes('business') || normalizedTitle.includes('office')) return FaBriefcase;
    
    // Default icon for unknown categories
    return FaBoxOpen;
};

export const CategoryCard = ({ item, isSelected, onClick }) => {
    const Icon = getCategoryIcon(item.title);
    
    return (
        <div 
            className={`group cursor-pointer text-center ${isSelected ? 'scale-105' : ''}`}
            onClick={onClick}
        >
            <div className="flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover:-translate-y-1">
                <div className={`w-16 h-16 mb-2 rounded-full flex items-center justify-center ${
                    isSelected 
                        ? 'bg-primary/10' 
                        : 'bg-gray-100 group-hover:bg-primary/10'
                }`}>
                    <Icon className={`w-8 h-8 ${
                        isSelected 
                            ? 'text-primary' 
                            : 'text-gray-600 group-hover:text-primary'
                    }`} />
                </div>
                <p className={`text-sm font-medium mt-2 ${
                    isSelected 
                        ? 'text-primary' 
                        : 'text-gray-700 group-hover:text-primary'
                }`}>
                    {item.title}
                </p>
            </div>
        </div>
    );
};

CategoryCard.propTypes = {
    item: PropTypes.shape({
        title: PropTypes.string.isRequired,
    }).isRequired,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};